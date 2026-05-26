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

  const rawRange = req.nextUrl.searchParams.get("range") ?? "7d";
  const range = (["7d", "30d", "90d"] as const).includes(rawRange as "7d" | "30d" | "90d") ? rawRange : "7d";
  const ahora = new Date();

  const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const daysBack = RANGE_DAYS[range] ?? 7;

  const dias = Array.from({ length: daysBack }, (_, i) => subDays(ahora, daysBack - 1 - i));
  const chartStart = startOfDay(dias[0]);
  const chartEnd   = endOfDay(dias[dias.length - 1]);

  const sucursales = await prisma.sucursal.findMany({
    select: { id: true, nombre: true },
    orderBy: { orden: "asc" },
  });

  const dateFormat = "%d/%m";

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
    GROUP BY c.sucursalId, DATE_FORMAT(v.creadoEn, ${dateFormat})
    ORDER BY MIN(v.creadoEn)
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

  // Ventas por sucursal en el rango — single GROUP BY instead of N queries
  const ventasRangoRows = await prisma.$queryRaw<
    { sucursalId: number; total: number; cnt: number }[]
  >`
    SELECT c.sucursalId,
           COALESCE(SUM(v.total), 0) AS total,
           COUNT(v.id) AS cnt
    FROM   ventas v
    JOIN   cajas  c ON v.cajaId = c.id
    WHERE  v.creadoEn >= ${chartStart}
      AND  v.creadoEn <= ${chartEnd}
      AND  v.estado   = 'PAGADA'
    GROUP BY c.sucursalId
  `;

  const ventasRangoMap: Record<number, { total: number; cnt: number }> = {};
  for (const r of ventasRangoRows) ventasRangoMap[r.sucursalId] = { total: Number(r.total), cnt: Number(r.cnt) };

  const ventasRango = sucursales.map(s => ({
    id: s.id,
    nombre: s.nombre,
    total: ventasRangoMap[s.id]?.total ?? 0,
    transacciones: ventasRangoMap[s.id]?.cnt ?? 0,
  }));

  return NextResponse.json({
    chartData,
    series: sucursales.map(s => s.nombre),
    ventasRango,
    range,
    desde: format(chartStart, "dd/MM/yyyy"),
    hasta: format(chartEnd, "dd/MM/yyyy"),
  });
}
