import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ShoppingBag, Users, Trophy, Star, BarChart3, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { VentasCharts } from "@/components/ventas/VentasCharts";
import type { DayData, MetodoData } from "@/components/ventas/VentasCharts";
import { VentasTable } from "./VentasTable";
import { PedidosDirectosPanel } from "@/components/ventas/PedidosDirectosPanel";

export const metadata: Metadata = { title: "PP — Ventas" };

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
    prisma.venta.findMany({
      where: {
        ...where,
        estado: "PAGADA",
        creadoEn: { gte: new Date(Date.now() - 29 * 86_400_000) },
      },
      select: { creadoEn: true, total: true },
    }),
    prisma.venta.groupBy({
      by: ["metodoPago"],
      where: { ...where, estado: "PAGADA", creadoEn: { gte: mesInicio } },
      _sum: { total: true },
      _count: { id: true },
    }),
  ]);

  const totalHoy     = Number(kpiHoy._sum.total ?? 0);
  const totalMes     = Number(kpiMes._sum.total ?? 0);
  const totalMesAnt  = Number(kpiMesAnterior._sum.total ?? 0);
  const txMes        = kpiMes._count.id;
  const txHoy        = kpiHoy._count.id;
  const ticketProm   = txMes > 0 ? totalMes / txMes : 0;
  const varMes       = totalMesAnt > 0
    ? ((totalMes - totalMesAnt) / totalMesAnt) * 100
    : null;

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

  const rows = await prisma.venta.findMany({
    where,
    take: 50,
    orderBy: { creadoEn: "desc" },
    select: {
      id:            true,
      numero:        true,
      creadoEn:      true,
      estado:        true,
      metodoPago:    true,
      total:         true,
      boletaEmitida: true,
      cliente:       { select: { nombre: true } },
      usuario:       { select: { nombre: true } },
      _count:        { select: { detalles: true } },
    },
  });

  // Convert Decimal → number so plain objects flow to Client Components
  return rows.map((v) => ({
    id:            v.id,
    numero:        v.numero,
    creadoEn:      v.creadoEn.toISOString(),
    estado:        v.estado,
    metodoPago:    v.metodoPago,
    total:         Number(v.total),
    boletaEmitida: v.boletaEmitida,
    cliente:       v.cliente,
    usuario:       v.usuario,
    _count:        v._count,
  }));
}

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

  const fechaHoy = new Date().toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  });

  const kpis = [
    {
      label:       "Ventas hoy",
      value:       formatCurrency(totalHoy, simbolo),
      sub:         `${txHoy} transacción${txHoy !== 1 ? "es" : ""}`,
      icon:        ShoppingBag,
      iconColor:   "text-brand-600 bg-brand-50",
      accent:      "border-l-brand-500",
      subColor:    "text-surface-muted",
    },
    {
      label:       "Ventas este mes",
      value:       formatCurrency(totalMes, simbolo),
      sub:         varMes !== null
        ? `${varMes >= 0 ? "▲" : "▼"} ${Math.abs(varMes).toFixed(1)}% vs mes anterior`
        : "Sin comparativo anterior",
      icon:        varMes !== null && varMes >= 0 ? TrendingUp : TrendingDown,
      iconColor:   varMes !== null && varMes >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50",
      accent:      varMes !== null && varMes >= 0 ? "border-l-emerald-500" : "border-l-red-400",
      subColor:    varMes !== null
        ? varMes >= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"
        : "text-surface-muted",
      trend:       varMes,
    },
    {
      label:       "Transacciones",
      value:       String(txMes),
      sub:         "ventas pagadas este mes",
      icon:        Users,
      iconColor:   "text-sky-600 bg-sky-50",
      accent:      "border-l-sky-500",
      subColor:    "text-surface-muted",
    },
    {
      label:       "Ticket promedio",
      value:       formatCurrency(ticketProm, simbolo),
      sub:         "por venta este mes",
      icon:        TrendingUp,
      iconColor:   "text-amber-600 bg-amber-50",
      accent:      "border-l-amber-500",
      subColor:    "text-surface-muted",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Ventas</h1>
          <p className="text-surface-muted text-sm mt-1 flex items-center gap-1.5">
            <CalendarDays size={13} className="shrink-0" />
            <span className="capitalize">{fechaHoy}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/ventas/analisis" className="btn-secondary flex items-center gap-1.5">
            <BarChart3 size={15} />
            <span className="hidden sm:inline">Análisis</span>
          </Link>
          <Link href="/ventas/nueva" className="btn-primary flex items-center gap-1.5">
            <Plus size={16} />
            <span>Nueva Venta</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`card border-l-4 ${k.accent} flex items-start gap-4 p-5`}>
            <div className={`p-3 rounded-xl shrink-0 ${k.iconColor}`}>
              <k.icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-muted mb-1">
                {k.label}
              </p>
              <p className="text-2xl font-bold text-surface-text leading-tight truncate">
                {k.value}
              </p>
              <p className={`text-xs mt-1 ${k.subColor}`}>
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
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Star size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Clientes frecuentes</h3>
              <p className="text-xs text-surface-muted">Últimos 90 días</p>
            </div>
          </div>
          {frecuentes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <div className="p-3 rounded-full bg-surface-bg">
                <Users size={20} className="text-surface-muted" />
              </div>
              <p className="text-sm text-surface-muted text-center leading-snug">
                Sin clientes identificados<br />en los últimos 90 días
              </p>
            </div>
          ) : (
            <ol className="space-y-1">
              {frecuentes.map((c, i) => (
                <li key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-bg transition-colors">
                  <span className="text-base w-7 text-center shrink-0">
                    {i < 3 ? MEDAL[i] : <span className="text-xs font-bold text-surface-muted">{i + 1}</span>}
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
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Trophy size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Mayores gastadores</h3>
              <p className="text-xs text-surface-muted">Este mes</p>
            </div>
          </div>
          {gastadores.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <div className="p-3 rounded-full bg-surface-bg">
                <Trophy size={20} className="text-surface-muted" />
              </div>
              <p className="text-sm text-surface-muted text-center leading-snug">
                Sin clientes identificados<br />este mes
              </p>
            </div>
          ) : (
            <ol className="space-y-1">
              {gastadores.map((c, i) => (
                <li key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-bg transition-colors">
                  <span className="text-base w-7 text-center shrink-0">
                    {i < 3 ? MEDAL[i] : <span className="text-xs font-bold text-surface-muted">{i + 1}</span>}
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

      {/* ── Pedidos directos (Kiosko / Delivery / Retiro) ── */}
      <PedidosDirectosPanel simbolo={simbolo} />

      {/* ── Tabla de ventas ── */}
      <VentasTable ventas={ventas} simbolo={simbolo} />
    </div>
  );
}
