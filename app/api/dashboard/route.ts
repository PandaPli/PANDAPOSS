import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hoyInicio = startOfDay(new Date());
  const hoyFin = endOfDay(new Date());

  const [ventasHoy, pedidosActivos, mesasOcupadas, alertasStock] = await Promise.all([
    prisma.venta.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { creadoEn: { gte: hoyInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    prisma.pedido.count({
      where: { estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
    }),
    prisma.mesa.count({ where: { estado: "OCUPADA" } }),
    prisma.producto.count({ where: { stock: { lte: prisma.producto.fields.stockMinimo } } }),
  ]);

  // Ventas últimos 7 días
  const ventasChart = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      return prisma.venta
        .aggregate({
          _sum: { total: true },
          where: {
            creadoEn: { gte: startOfDay(day), lte: endOfDay(day) },
            estado: "PAGADA",
          },
        })
        .then((r) => ({
          fecha: format(day, "dd/MM"),
          total: Number(r._sum.total ?? 0),
        }));
    })
  );

  return NextResponse.json({
    ventasHoy: ventasHoy._count.id,
    totalHoy: Number(ventasHoy._sum.total ?? 0),
    pedidosActivos,
    mesasOcupadas,
    alertasStock,
    ventasChart,
  });
}
