import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ShoppingBag, Users, Trophy, Star, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { VentasCharts } from "@/components/ventas/VentasCharts";
import type { DayData, MetodoData } from "@/components/ventas/VentasCharts";
import { VentasTable } from "./VentasTable";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d = new Date()) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfPrevMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function fmt2d(n: number) { return String(n).padStart(2, "0"); }

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(rol: Rol, sucursalId: number | null) {
  const where =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { caja: { sucursalId } }
      : {};

  const hoy        = startOfDay();
  const mesInicio  = startOfMonth();
  const mesAnteriorInicio = startOfPrevMonth();

  const [kpiHoy, kpiMes, kpiMesAnterior, ventasUlt30Raw, metodosRaw] = await Promise.all([
    prisma.venta.aggregate({
      where: { ...where, estado: "PAGADA", creadoEn: { gte: hoy } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.venta.aggregate({
      where: { ...where, estado: "PAGADA", creadoEn: { gte: mesInicio } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.venta.aggregate({
      where: {
        ...where,
        estado: "PAGADA",
        creadoEn: { gte: mesAnteriorInicio, lt: mesInicio },
      },
      _sum: { total: true },
    }),
    // Raw daily data for chart
    prisma.venta.findMany({
      where: {
        ...where,
        estado: "PAGADA",
        creadoEn: { gte: new Date(Date.now() - 29 * 86_400_000) },
      },
      select: { creadoEn: true, total: true },
    }),
    // Payment methods this month
    prisma.venta.groupBy({
      by: ["metodoPago"],
      where: { ...where, estado: "PAGADA", creadoEn: { gte: mesInicio } },
      _sum: { total: true },
      _count: { id: true },
    }),
  ]);

  // ── KPIs ──
  const totalHoy     = Number(kpiHoy._sum.total ?? 0);
  const totalMes     = Number(kpiMes._sum.total ?? 0);
  const totalMesAnt  = Number(kpiMesAnterior._sum.total ?? 0);
  const txMes        = kpiMes._count.id;
  const txHoy        = kpiHoy._count.id;
  const ticketProm   = txMes > 0 ? totalMes / txMes : 0;
  const varMes       = totalMesAnt > 0
    ? ((totalMes - totalMesAnt) / totalMesAnt) * 100
    : null;

  // ── Ventas por día (últimos 30 días) ──
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    dayMap.set(`${fmt2d(d.getDate())}/${fmt2d(d.getMonth() + 1)}`, 0);
  }
  for (const v of ventasUlt30Raw) {
    const k = `${fmt2d(v.creadoEn.getDate())}/${fmt2d(v.creadoEn.getMonth() + 1)}`;
    dayMap.set(k, (dayMap.get(k) ?? 0) + Number(v.total));
  }
  const ventasDiarias: DayData[] = Array.from(dayMap, ([fecha, total]) => ({ fecha, total }));

  // ── Métodos de pago ──
  const METODO_LABEL: Record<string, string> = {
    EFECTIVO: "Efectivo", TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia", CREDITO: "Crédito", MIXTO: "Mixto",
  };
  const metodos: MetodoData[] = metodosRaw
    .map((m) => ({
      clave:  m.metodoPago,
      metodo: METODO_LABEL[m.metodoPago] ?? m.metodoPago,
      total:  Number(m._sum.total ?? 0),
      count:  m._count.id,
    }))
    .sort((a, b) => b.total - a.total);

  return { totalHoy, totalMes, txMes, txHoy, ticketProm, varMes, ventasDiarias, metodos };
}

async function getRankings(rol: Rol, sucursalId: number | null) {
  const where =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { caja: { sucursalId } }
      : {};

  const mesInicio = startOfMonth();
  const hace90    = new Date(Date.now() - 90 * 86_400_000);

  // Top clientes frecuentes (últimos 90 días)
  const [frecuentesRaw, gastadoresRaw] = await Promise.all([
    prisma.venta.groupBy({
      by: ["clienteId"],
      where: { ...where, estado: "PAGADA", clienteId: { not: null }, creadoEn: { gte: hace90 } },
      _count: { id: true },
      _sum:   { total: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.venta.groupBy({
      by: ["clienteId"],
      where: { ...where, estado: "PAGADA", clienteId: { not: null }, creadoEn: { gte: mesInicio } },
      _sum:   { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    }),
  ]);

  // Resolve client names
  const allIds = [
    ...frecuentesRaw.map((r) => r.clienteId!),
    ...gastadoresRaw.map((r) => r.clienteId!),
  ].filter(Boolean);
  const uniqueIds = [...new Set(allIds)];

  const clientes = await prisma.cliente.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, nombre: true },
  });
  const cMap = Object.fromEntries(clientes.map((c) => [c.id, c.nombre]));

  const frecuentes = frecuentesRaw.map((r) => ({
    nombre:  cMap[r.clienteId!] ?? "Desconocido",
    compras: r._count.id,
    total:   Number(r._sum.total ?? 0),
  }));

  const gastadores = gastadoresRaw.map((r) => ({
    nombre:  cMap[r.clienteId!] ?? "Desconocido",
    total:   Number(r._sum.total ?? 0),
    compras: r._count.id,
  }));

  return { frecuentes, gastadores };
}

async function getVentas(rol: Rol, sucursalId: number | null) {
  const where =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { caja: { sucursalId } }
      : {};

  return prisma.venta.findMany({
    where,
    take: 50,
    orderBy: { creadoEn: "desc" },
    include: {
      cliente: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      _count:  { select: { detalles: true } },
    },
  });
}

// ─── Static maps ──────────────────────────────────────────────────────────────

const MEDAL = ["🥇", "🥈", "🥉"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VentasPage() {
  const session    = await getServerSession(authOptions);
  const simbolo    = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const rol        = (session?.user as { rol?: Rol })?.rol ?? "CASHIER";
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const [dash, { frecuentes, gastadores }, ventas] = await Promise.all([
    getDashboardData(rol, sucursalId),
    getRankings(rol, sucursalId),
    getVentas(rol, sucursalId),
  ]);

  const { totalHoy, totalMes, txMes, txHoy, ticketProm, varMes, ventasDiarias, metodos } = dash;

  const kpis = [
    {
      label:   "Ventas hoy",
      value:   formatCurrency(totalHoy, simbolo),
      sub:     `${txHoy} transacción${txHoy !== 1 ? "es" : ""}`,
      icon:    ShoppingBag,
      color:   "text-brand-600 bg-brand-50",
    },
    {
      label:   "Ventas este mes",
      value:   formatCurrency(totalMes, simbolo),
      sub:     varMes !== null
        ? `${varMes >= 0 ? "+" : ""}${varMes.toFixed(1)}% vs mes anterior`
        : "Sin datos comparativos",
      icon:    varMes !== null && varMes >= 0 ? TrendingUp : TrendingDown,
      color:   varMes !== null && varMes >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50",
      trend:   varMes,
    },
    {
      label:   "Transacciones",
      value:   String(txMes),
      sub:     "ventas pagadas este mes",
      icon:    Users,
      color:   "text-sky-600 bg-sky-50",
    },
    {
      label:   "Ticket promedio",
      value:   formatCurrency(ticketProm, simbolo),
      sub:     "por venta este mes",
      icon:    TrendingUp,
      color:   "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Ventas</h1>
          <p className="text-surface-muted text-sm mt-1">Historial de transacciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ventas/analisis" className="btn-secondary flex items-center gap-1.5">
            <BarChart3 size={15} />
            Análisis
          </Link>
          <Link href="/ventas/nueva" className="btn-primary">
            <Plus size={16} />
            Nueva Venta
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${k.color}`}>
              <k.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-muted mb-0.5">{k.label}</p>
              <p className="text-xl font-bold text-surface-text leading-tight truncate">{k.value}</p>
              <p className={`text-xs mt-0.5 ${
                k.trend !== undefined
                  ? k.trend !== null && k.trend >= 0 ? "text-emerald-600" : "text-red-500"
                  : "text-surface-muted"
              }`}>
                {k.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <VentasCharts diario={ventasDiarias} metodos={metodos} simbolo={simbolo} />

      {/* ── Rankings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clientes frecuentes */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Star size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Clientes frecuentes</h3>
              <p className="text-xs text-surface-muted">Últimos 90 días</p>
            </div>
          </div>
          {frecuentes.length === 0 ? (
            <p className="text-center text-surface-muted text-sm py-8">
              Sin clientes registrados
            </p>
          ) : (
            <ol className="space-y-2">
              {frecuentes.map((c, i) => (
                <li key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-bg transition-colors">
                  <span className="text-base w-7 text-center shrink-0">
                    {MEDAL[i] ?? <span className="text-xs font-bold text-surface-muted">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-text truncate">{c.nombre}</p>
                    <p className="text-xs text-surface-muted">
                      {c.compras} compra{c.compras !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-600 shrink-0">
                    {formatCurrency(c.total, simbolo)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Mayores gastadores del mes */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Trophy size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Mayores gastadores</h3>
              <p className="text-xs text-surface-muted">Este mes</p>
            </div>
          </div>
          {gastadores.length === 0 ? (
            <p className="text-center text-surface-muted text-sm py-8">
              Sin clientes registrados
            </p>
          ) : (
            <ol className="space-y-2">
              {gastadores.map((c, i) => (
                <li key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-bg transition-colors">
                  <span className="text-base w-7 text-center shrink-0">
                    {MEDAL[i] ?? <span className="text-xs font-bold text-surface-muted">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-text truncate">{c.nombre}</p>
                    <p className="text-xs text-surface-muted">
                      {c.compras} compra{c.compras !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-amber-600 shrink-0">
                    {formatCurrency(c.total, simbolo)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* ── Tabla de ventas ── */}
      <VentasTable
        ventas={ventas.map((v) => ({
          ...v,
          creadoEn: v.creadoEn.toISOString(),
          total:    Number(v.total),
        }))}
        simbolo={simbolo}
      />
    </div>
  );
}
