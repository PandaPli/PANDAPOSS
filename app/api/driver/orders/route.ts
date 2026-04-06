import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDeliveryObservation } from "@/lib/delivery";
import type { Rol } from "@/types";

// GET /api/driver/orders — pedidos asignados al rider autenticado
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "DELIVERY") return NextResponse.json({ error: "Solo para repartidores" }, { status: 403 });

  const userId = (session.user as { id: number }).id;
  const { searchParams } = new URL(req.url);
  const history = searchParams.get("history") === "true";

  const pedidos = await prisma.pedido.findMany({
    where: {
      tipo: "DELIVERY",
      repartidorId: userId,
      ...(history ? {} : { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } }),
    },
    include: {
      detalles: {
        include: {
          producto: { select: { nombre: true, precio: true } },
          combo: { select: { nombre: true, precio: true } },
        },
      },
      delivery: {
        select: {
          costoEnvio: true,
          pagoRider: true,
          zonaDelivery: true,
          codigoEntrega: true,
          estado: true,
        },
      },
      usuario: { select: { sucursalId: true, sucursal: { select: { nombre: true } } } },
    },
    orderBy: { creadoEn: "desc" },
    take: history ? 100 : 50,
  });

  const result = pedidos.map((p) => {
    const meta = parseDeliveryObservation(p.observacion);
    const subtotal = p.detalles.reduce((acc, d) => {
      const precio = Number(d.producto?.precio ?? d.combo?.precio ?? 0);
      return acc + precio * d.cantidad;
    }, 0);

    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      clienteNombre: meta.clienteNombre ?? p.telefonoCliente,
      telefonoCliente: p.telefonoCliente,
      direccionEntrega: p.direccionEntrega,
      referencia: meta.referencia,
      departamento: meta.departamento,
      metodoPago: meta.metodoPago,
      subtotal,
      cargoEnvio: Number(p.delivery?.costoEnvio ?? 0),
      total: subtotal + Number(p.delivery?.costoEnvio ?? 0),
      pagoRider: Number(p.delivery?.pagoRider ?? 0),
      zonaDelivery: p.delivery?.zonaDelivery ?? null,
      codigoEntrega: p.delivery?.codigoEntrega ?? null,
      estadoDelivery: p.delivery?.estado ?? null,
      sucursalNombre: p.usuario.sucursal?.nombre ?? null,
      creadoEn: p.creadoEn.toISOString(),
      detalles: p.detalles.map((d) => ({
        cantidad: d.cantidad,
        nombre: d.producto?.nombre ?? d.combo?.nombre ?? "Item",
      })),
    };
  });

  return NextResponse.json(result);
}
