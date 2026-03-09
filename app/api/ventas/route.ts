import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol, MetodoPago } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const page = Number(searchParams.get("page") ?? 1);
  const skip = (page - 1) * limit;

  const where =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { caja: { sucursalId } }
      : {};

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      where,
      take: limit,
      skip,
      orderBy: { creadoEn: "desc" },
      include: {
        cliente: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
        _count: { select: { detalles: true } },
      },
    }),
    prisma.venta.count({ where }),
  ]);

  return NextResponse.json({ ventas, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const {
    cajaId, clienteId, usuarioId, items, subtotal, descuento,
    impuesto, total, metodoPago, mesaId, pedidoId, pagos
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "El carrito esta vacio" }, { status: 400 });
  }

  // Generar numero de venta
  const count = await prisma.venta.count();
  const numero = `VTA-${String(count + 1).padStart(6, "0")}`;

  try {
    const venta = await prisma.$transaction(async (tx) => {
      // Crear venta
      const v = await tx.venta.create({
        data: {
          numero,
          cajaId: cajaId ? Number(cajaId) : null,
          clienteId: clienteId ? Number(clienteId) : null,
          usuarioId: Number(usuarioId),
          pedidoId: pedidoId ? Number(pedidoId) : null,
          subtotal: Number(subtotal),
          descuento: Number(descuento || 0),
          impuesto: Number(impuesto || 0),
          total: Number(total),
          metodoPago,
          estado: "PAGADA",
          detalles: {
            create: items.map((item: {
              productoId?: number | null;
              comboId?: number | null;
              cantidad: number;
              precio: number;
              subtotal: number;
            }) => ({
              productoId: item.productoId ? Number(item.productoId) : null,
              comboId: item.comboId ? Number(item.comboId) : null,
              cantidad: Number(item.cantidad),
              precio: Number(item.precio),
              descuento: 0,
              subtotal: Number(item.subtotal),
            })),
          },
        },
      });

      // Crear registros de pago
      if (pagos && Array.isArray(pagos) && pagos.length > 0) {
        await Promise.all(
          pagos.map((pago: { metodoPago: MetodoPago; monto: number; referencia?: string }) =>
            tx.pagoVenta.create({
              data: {
                ventaId: v.id,
                metodoPago: pago.metodoPago,
                monto: Number(pago.monto),
                referencia: pago.referencia || null,
              },
            })
          )
        );
      } else {
        // Retrocompatible: crear 1 pago con el total
        await tx.pagoVenta.create({
          data: {
            ventaId: v.id,
            metodoPago: metodoPago,
            monto: Number(total),
          },
        });
      }

      // Actualizar stock y kardex en paralelo por producto
      const productItems = items.filter((item: { productoId?: number | null }) => item.productoId);
      await Promise.all(
        productItems.map((item: { productoId: number; cantidad: number }) =>
          Promise.all([
            tx.producto.update({
              where: { id: Number(item.productoId) },
              data: { stock: { decrement: Number(item.cantidad) } },
            }),
            tx.kardex.create({
              data: {
                productoId: Number(item.productoId),
                tipo: "SALIDA",
                cantidad: Number(item.cantidad),
                motivo: "Venta",
                ventaId: v.id,
              },
            }),
          ])
        )
      );

      // Liberar mesa si aplica
      if (mesaId) {
        await tx.mesa.update({
          where: { id: Number(mesaId) },
          data: { estado: "LIBRE" },
        });
      }

      return v;
    }, { timeout: 15000 });

    // Serializar Decimals a numeros antes de enviar
    return NextResponse.json({
      id: venta.id,
      numero: venta.numero,
      total: Number(venta.total),
      estado: venta.estado,
      creadoEn: venta.creadoEn,
    }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/ventas] Error:", error);
    const message = error instanceof Error ? error.message : "Error interno al registrar la venta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
