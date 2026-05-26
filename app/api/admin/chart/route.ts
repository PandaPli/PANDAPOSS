import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import type { Rol } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const range = req.nextUrl.searchParams.get("range") ?? "7d";
  const ahora = new Date();

  let daysBack: number;
  switch (range) {
    case "30d": daysBack = 30; break;
    case "90d": daysBack = 90; break;
    default:    daysBack = 7;  break;
  }

  const dias = Array.from({ length: daysBack }, (_, i) => subDays(ahora, daysBack - 1 - i));
  const chartStart = startOfDay(dias[0]);
  const chartEnd   = endOfDay(dias[dias.length - 1]);

  const sucursales = await prisma.sucursal.findMany({
    select: { id: true, nombre: true },
    orderBy: { orden: "asc" },
  });

  const dateFormat = daysBack <= 7 ? "%d/%m" : daysBack <= 31 ? "%d/%m" : "%d/%m";

  const chartRows = await prisma.$queryRaw<
    { sucursalId: number; fecha: string; total: number }[]
  >`
    SELECT c.sucursalId,
           DATE_FORMAT(v.creadoEn, ${dateFormat}) AS fecha,
           COALESCE(SUM(v.total), 0) AS total
    FROM   ventas v
    JOIN   cajas  c ON v.cajaId = c.id
    WHERE  v.creadoEn >= ${chartStart}
      AND  v.creadoEn <= ${chartEnd}
      AND  v.estado   = 'PAGADA'
    GROUP BY c.sucursalId, DATE(v.creadoEn)
    ORDER BY DATE(v.creadoEn)
  `;

  const sucIdToName = Object.fromEntries(sucursales.map(s => [s.id, s.nombre]));
  const chartData = dias.map(day => {
    const label = format(day, "dd/MM");
    const entry: Record<string, number | string> = { fecha: label };
    for (const s of sucursales) entry[s.nombre] = 0;
    return entry;
  });

  for (const row of chartRows) {
    const name = sucIdToName[row.sucursalId];
    const slot = chartData.find(d => d.fecha === row.fecha);
    if (slot && name) slot[name] = Number(row.total);
  }

  // Ventas por sucursal en el rango (for CSV export)
  const ventasRango = await Promise.all(
    sucursales.map(async (s) => {
      const r = await prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          caja: { sucursalId: s.id },
          creadoEn: { gte: chartStart, lte: chartEnd },
          estado: "PAGADA",
        },
      });
      return {
        id: s.id,
        nombre: s.nombre,
        total: Number(r._sum.total ?? 0),
        transacciones: r._count.id,
      };
    })
  );

  return NextResponse.json({
    chartData,
    series: sucursales.map(s => s.nombre),
    ventasRango,
    range,
    desde: format(chartStart, "dd/MM/yyyy"),
    hasta: format(chartEnd, "dd/MM/yyyy"),
  });
}
