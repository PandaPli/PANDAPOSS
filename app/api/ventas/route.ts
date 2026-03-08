import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const page = Number(searchParams.get("page") ?? 1);
  const skip = (page - 1) * limit;

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      take: limit,
      skip,
      orderBy: { creadoEn: "desc" },
      include: {
        cliente: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
        _count: { select: { detalles: true } },
      },
    }),
    prisma.venta.count(),
  ]);

  return NextResponse.json({ ventas, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { cajaId, clienteId, usuarioId, items, subtotal, descuento, impuesto, total, metodoPago, mesaId } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  // Generar número de venta
  const count = await prisma.venta.count();
  const numero = `VTA-${String(count + 1).padStart(6, "0")}`;

  const venta = await prisma.$transaction(async (tx) => {
    // Crear venta
    const v = await tx.venta.create({
      data: {
        numero,
        cajaId: cajaId || null,
        clienteId: clienteId || null,
        usuarioId,
        subtotal,
        descuento: descuento || 0,
        impuesto: impuesto || 0,
        total,
        metodoPago,
        estado: "PAGADA",
        detalles: {
          create: items.map((item: {
            productoId?: number;
            comboId?: number;
            cantidad: number;
            precio: number;
            subtotal: number;
          }) => ({
            productoId: item.productoId || null,
            comboId: item.comboId || null,
            cantidad: item.cantidad,
            precio: item.precio,
            descuento: 0,
            subtotal: item.subtotal,
          })),
        },
      },
    });

    // Actualizar stock y kardex por cada producto
    for (const item of items) {
      if (item.productoId) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        });
        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: "SALIDA",
            cantidad: item.cantidad,
            motivo: "Venta",
            ventaId: v.id,
          },
        });
      }
    }

    // Liberar mesa si aplica
    if (mesaId) {
      await tx.mesa.update({
        where: { id: mesaId },
        data: { estado: "LIBRE" },
      });
    }

    return v;
  });

  return NextResponse.json(venta, { status: 201 });
}
