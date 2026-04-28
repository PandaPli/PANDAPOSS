import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const clienteId = Number(id);
  if (isNaN(clienteId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Datos del cliente
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      puntos: true,
      creadoEn: true,
    },
  });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  // Estadísticas de ventas (últimas 50 ventas)
  const ventas = await prisma.venta.findMany({
    where: { clienteId, estado: { not: "ANULADA" } },
    select: {
      id: true,
      total: true,
      creadoEn: true,
      detalles: {
        select: {
          productoId: true,
          cantidad: true,
          producto: { select: { nombre: true } },
        },
      },
    },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  const totalCompras = ventas.length;
  const totalGastado = ventas.reduce((acc, v) => acc + Number(v.total), 0);
  const promedioTicket = totalCompras > 0 ? totalGastado / totalCompras : 0;
  const ultimaCompra = ventas[0]
    ? { fecha: ventas[0].creadoEn.toISOString(), monto: Number(ventas[0].total) }
    : null;

  // Productos frecuentes: contar ocurrencias por productoId
  const conteo: Record<number, { nombre: string; veces: number; cantidad: number }> = {};
  for (const v of ventas) {
    for (const d of v.detalles) {
      if (!d.productoId || !d.producto) continue;
      if (!conteo[d.productoId]) {
        conteo[d.productoId] = { nombre: d.producto.nombre, veces: 0, cantidad: 0 };
      }
      conteo[d.productoId].veces += 1;
      conteo[d.productoId].cantidad += d.cantidad;
    }
  }

  const productosFrecuentes = Object.entries(conteo)
    .map(([productoId, data]) => ({
      productoId: Number(productoId),
      nombre: data.nombre,
      veces: data.veces,
      cantidadTotal: data.cantidad,
    }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 5);

  return NextResponse.json({
    cliente: {
      ...cliente,
      creadoEn: cliente.creadoEn.toISOString(),
    },
    stats: {
      totalCompras,
      totalGastado,
      promedioTicket,
      ultimaCompra,
    },
    productosFrecuentes,
  });
}
