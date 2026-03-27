import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

/**
 * GET /api/reportes/caja-diaria?fecha=YYYY-MM-DD
 * Resumen de ventas del día: efectivo / tarjeta / transferencia, movimientos, anuladas.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const fechaStr = searchParams.get("fecha") ?? new Date().toISOString().slice(0, 10);

  const desde = new Date(fechaStr);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(fechaStr);
  hasta.setHours(23, 59, 59, 999);

  // Determinar cajas de la sucursal
  const cajaWhere = rol !== "ADMIN_GENERAL" && sucursalId
    ? { sucursalId }
    : {};

  const cajas = await prisma.caja.findMany({
    where: cajaWhere,
    select: { id: true, nombre: true },
  });
  const cajaIds = cajas.map((c) => c.id);

  const ventaWhere = {
    creadoEn: { gte: desde, lte: hasta },
    ...(cajaIds.length > 0 ? { cajaId: { in: cajaIds } } : {}),
  };

  const [desglosePagada, anuladas, movimientos, ventasPagadas] = await Promise.all([
    // Ventas pagadas por método de pago
    prisma.venta.groupBy({
      by: ["metodoPago"],
      _sum: { total: true },
      _count: { id: true },
      where: { ...ventaWhere, estado: "PAGADA" },
    }),
    // Ventas anuladas
    prisma.venta.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { ...ventaWhere, estado: "ANULADA" },
    }),
    // Movimientos de caja
    prisma.movimientoCaja.findMany({
      where: {
        creadoEn: { gte: desde, lte: hasta },
        ...(cajaIds.length > 0 ? { cajaId: { in: cajaIds } } : {}),
      },
      select: {
        tipo:     true,
        monto:    true,
        motivo:   true,
        creadoEn: true,
        usuario:  { select: { nombre: true } },
        caja:     { select: { nombre: true } },
      },
      orderBy: { creadoEn: "asc" },
    }),
    // Total efectivo real (desde PagoVenta para incluir pagos MIXTO)
    prisma.pagoVenta.groupBy({
      by: ["metodoPago"],
      _sum: { monto: true },
      where: {
        venta: { ...ventaWhere, estado: "PAGADA" },
      },
    }),
  ]);

  // Construir desglose por método
  const metodosLabel: Record<string, string> = {
    EFECTIVO:      "Efectivo",
    TARJETA:       "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    CREDITO:       "Crédito",
    MIXTO:         "Mixto",
  };

  const breakdown: Record<string, { label: string; transacciones: number; monto: number }> = {
    EFECTIVO:      { label: "Efectivo",      transacciones: 0, monto: 0 },
    TARJETA:       { label: "Tarjeta",       transacciones: 0, monto: 0 },
    TRANSFERENCIA: { label: "Transferencia", transacciones: 0, monto: 0 },
    CREDITO:       { label: "Crédito",       transacciones: 0, monto: 0 },
    MIXTO:         { label: "Mixto",         transacciones: 0, monto: 0 },
  };

  let totalVentas = 0;
  let totalTransacciones = 0;
  for (const b of desglosePagada) {
    const monto = Number(b._sum.total ?? 0);
    if (breakdown[b.metodoPago]) {
      breakdown[b.metodoPago].transacciones = b._count.id;
      breakdown[b.metodoPago].monto = monto;
    }
    totalVentas += monto;
    totalTransacciones += b._count.id;
  }

  // Reemplazar efectivo con PagoVenta (incluye componente efectivo de pagos MIXTO)
  const efectivoPago = ventasPagadas.find((p) => p.metodoPago === "EFECTIVO");
  if (efectivoPago) {
    breakdown.EFECTIVO.monto = Number(efectivoPago._sum.monto ?? 0);
  }

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "INGRESO")
    .reduce((a, m) => a + Number(m.monto), 0);
  const totalRetiros = movimientos
    .filter((m) => m.tipo === "RETIRO")
    .reduce((a, m) => a + Number(m.monto), 0);

  const efectivoEsperado =
    breakdown.EFECTIVO.monto + totalIngresos - totalRetiros;

  return NextResponse.json({
    fecha:       fechaStr,
    totalVentas,
    totalTransacciones,
    anuladas: {
      cantidad: anuladas._count.id,
      monto:    Number(anuladas._sum.total ?? 0),
    },
    breakdown:        Object.values(breakdown).filter((b) => b.transacciones > 0 || b.monto > 0),
    breakdownCompleto: breakdown,
    movimientos: {
      ingresos: totalIngresos,
      retiros:  totalRetiros,
      detalle:  movimientos.map((m) => ({ ...m, monto: Number(m.monto) })),
    },
    efectivoEsperado,
    metodos: metodosLabel,
  });
}
