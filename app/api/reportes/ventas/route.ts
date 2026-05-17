import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

/**
 * GET /api/reportes/ventas?rango=diario|semanal|mensual&fecha=YYYY-MM-DD
 *
 * Reporte de ventas con desglose por método de pago y por día.
 * - diario:  un solo día (default)
 * - semanal: 7 días hacia atrás desde `fecha`
 * - mensual: mes completo de `fecha`
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (!["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rango = searchParams.get("rango") ?? "diario";
  const fechaStr = searchParams.get("fecha") ?? new Date().toISOString().slice(0, 10);

  const fechaBase = new Date(fechaStr);

  let desde: Date;
  let hasta: Date;

  if (rango === "semanal") {
    hasta = new Date(fechaBase);
    hasta.setHours(23, 59, 59, 999);
    desde = new Date(fechaBase);
    desde.setDate(desde.getDate() - 6);
    desde.setHours(0, 0, 0, 0);
  } else if (rango === "mensual") {
    desde = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
    desde.setHours(0, 0, 0, 0);
    hasta = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
    hasta.setHours(23, 59, 59, 999);
  } else {
    desde = new Date(fechaBase);
    desde.setHours(0, 0, 0, 0);
    hasta = new Date(fechaBase);
    hasta.setHours(23, 59, 59, 999);
  }

  // Filtrar por sucursal (ADMIN_GENERAL ve todas)
  const sucursalFilter = rol !== "ADMIN_GENERAL" && sucursalId
    ? { sucursalId }
    : {};

  const ventaWhere = {
    creadoEn: { gte: desde, lte: hasta },
    estado: "PAGADA" as const,
    ...sucursalFilter,
  };

  const [
    desglosePorMetodo,
    totalGeneral,
    ventasPorDia,
    anuladas,
    porTipo,
    pagosReales,
  ] = await Promise.all([
    // Desglose por método de pago
    prisma.venta.groupBy({
      by: ["metodoPago"],
      _sum: { total: true },
      _count: { id: true },
      where: ventaWhere,
    }),
    // Total general
    prisma.venta.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: ventaWhere,
    }),
    // Ventas agrupadas por día (para gráfico)
    prisma.$queryRawUnsafe<{ fecha: string; total: number; cantidad: number }[]>(
      `SELECT DATE("creadoEn") as fecha, SUM(total) as total, COUNT(id) as cantidad
       FROM "Venta"
       WHERE "creadoEn" >= $1 AND "creadoEn" <= $2 AND estado = 'PAGADA'
       ${sucursalId && rol !== "ADMIN_GENERAL" ? `AND "sucursalId" = ${sucursalId}` : ""}
       GROUP BY DATE("creadoEn")
       ORDER BY fecha ASC`,
      desde,
      hasta,
    ),
    // Anuladas del período
    prisma.venta.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { creadoEn: { gte: desde, lte: hasta }, estado: "ANULADA", ...sucursalFilter },
    }),
    // Desglose por tipo de pedido (MOSTRADOR, DELIVERY, COCINA, BAR)
    prisma.$queryRawUnsafe<{ tipo: string; total: number; cantidad: number }[]>(
      `SELECT p.tipo, SUM(v.total) as total, COUNT(v.id) as cantidad
       FROM "Venta" v
       LEFT JOIN "Pedido" p ON v."pedidoId" = p.id
       WHERE v."creadoEn" >= $1 AND v."creadoEn" <= $2 AND v.estado = 'PAGADA'
       ${sucursalId && rol !== "ADMIN_GENERAL" ? `AND v."sucursalId" = ${sucursalId}` : ""}
       GROUP BY p.tipo
       ORDER BY total DESC`,
      desde,
      hasta,
    ),
    // Pagos reales (PagoVenta) para desglose correcto de MIXTO
    prisma.pagoVenta.groupBy({
      by: ["metodoPago"],
      _sum: { monto: true },
      _count: { id: true },
      where: { venta: ventaWhere },
    }),
  ]);

  // Construir breakdown por método de pago (usando PagoVenta para precisión)
  const breakdown: Record<string, { transacciones: number; monto: number }> = {
    EFECTIVO: { transacciones: 0, monto: 0 },
    TARJETA: { transacciones: 0, monto: 0 },
    TRANSFERENCIA: { transacciones: 0, monto: 0 },
    CREDITO: { transacciones: 0, monto: 0 },
    MIXTO: { transacciones: 0, monto: 0 },
  };

  for (const p of pagosReales) {
    if (breakdown[p.metodoPago]) {
      breakdown[p.metodoPago].monto = Number(p._sum.monto ?? 0);
      breakdown[p.metodoPago].transacciones = p._count.id;
    }
  }

  // Transacciones por método (de Venta, no PagoVenta) para el conteo real
  for (const d of desglosePorMetodo) {
    if (breakdown[d.metodoPago]) {
      breakdown[d.metodoPago].transacciones = d._count.id;
    }
  }

  // Mapear tipo de pedido a labels legibles
  const tipoLabels: Record<string, string> = {
    MOSTRADOR: "Llevar / Retiro",
    DELIVERY: "Delivery",
    COCINA: "Mesas (Cocina)",
    BAR: "Mesas (Bar)",
  };

  return NextResponse.json({
    rango,
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
    totalVentas: Number(totalGeneral._sum.total ?? 0),
    totalTransacciones: totalGeneral._count.id,
    anuladas: {
      monto: Number(anuladas._sum.total ?? 0),
      cantidad: anuladas._count.id,
    },
    breakdown,
    porDia: ventasPorDia.map((d) => ({
      fecha: String(d.fecha).slice(0, 10),
      total: Number(d.total),
      cantidad: Number(d.cantidad),
    })),
    porTipo: porTipo.map((t) => ({
      tipo: t.tipo ?? "SIN_PEDIDO",
      label: tipoLabels[t.tipo] ?? t.tipo ?? "Venta directa",
      total: Number(t.total),
      cantidad: Number(t.cantidad),
    })),
  });
}
