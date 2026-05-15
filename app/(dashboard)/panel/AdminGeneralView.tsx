import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { MultiSalesChart } from "@/components/dashboard/MultiSalesChart";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Building2, TrendingUp, Users, Wallet,
  Star, Gift, CheckCircle2, Clock, AlertTriangle,
  ShoppingBag, Store,
} from "lucide-react";
import { SucursalRow } from "./SucursalRow";
import { HomeEditorModule } from "./HomeEditorModule";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS" | "SOCIO";

// ── Data ───────────────────────────────────────────────────────────────────
async function getAdminData() {
  const ahora     = new Date();
  const hoy       = startOfDay(ahora);
  const hoyFin    = endOfDay(ahora);
  const mesInicio = startOfDay(new Date(ahora.getFullYear(), ahora.getMonth(), 1));

  const sucursales = await prisma.sucursal.findMany({
    include: {
      _count: {
        select: {
          usuarios: { where: { status: "ACTIVO" } },
          clientes: { where: { activo: true } },
        },
      },
    },
    orderBy: { orden: "asc" },
  });

  const [ventasHoyArr, ventasMesArr, pedidosActivosArr, cajasAbiertasArr] = await Promise.all([
    Promise.all(sucursales.map(s =>
      prisma.venta.aggregate({
        _sum: { total: true }, _count: { id: true },
        where: { caja: { sucursalId: s.id }, creadoEn: { gte: hoy, lte: hoyFin }, estado: "PAGADA" },
      }).then(r => ({ id: s.id, total: Number(r._sum.total ?? 0), count: r._count.id }))
    )),
    Promise.all(sucursales.map(s =>
      prisma.venta.aggregate({
        _sum: { total: true },
        where: { caja: { sucursalId: s.id }, creadoEn: { gte: mesInicio, lte: hoyFin }, estado: "PAGADA" },
      }).then(r => ({ id: s.id, total: Number(r._sum.total ?? 0) }))
    )),
    Promise.all(sucursales.map(s =>
      prisma.pedido.count({
        where: {
          estado: { in: ["PENDIENTE", "EN_PROCESO"] },
          OR: [
            { caja: { sucursalId: s.id } },
            { mesa: { sala: { sucursalId: s.id } } },
            { usuario: { sucursalId: s.id } },
          ],
        },
      }).then(count => ({ id: s.id, count }))
    )),
    Promise.all(sucursales.map(s =>
      prisma.caja.count({ where: { sucursalId: s.id, estado: "ABIERTA" } })
        .then(count => ({ id: s.id, open: count }))
    )),
  ]);

  const ventasHoyMap      = Object.fromEntries(ventasHoyArr.map(v => [v.id, { total: v.total, count: v.count }]));
  const ventasMesMap      = Object.fromEntries(ventasMesArr.map(v => [v.id, v.total]));
  const pedidosActivosMap = Object.fromEntries(pedidosActivosArr.map(v => [v.id, v.count]));
  const cajasAbiertasMap  = Object.fromEntries(cajasAbiertasArr.map(v => [v.id, v.open]));

  const ventasHoyGlobal        = ventasHoyArr.reduce((s, v) => s + v.total, 0);
  const ventasMesGlobal        = ventasMesArr.reduce((s, v) => s + v.total, 0);
  const totalPedidosActivos    = pedidosActivosArr.reduce((s, v) => s + v.count, 0);
  const totalSucursalesConCaja = cajasAbiertasArr.filter(v => v.open > 0).length;
  const totalClientes          = sucursales.reduce((s, suc) => s + suc._count.clientes, 0);
  const totalTxHoy             = ventasHoyArr.reduce((s, v) => s + v.count, 0);

  const pagoCount: Partial<Record<EstadoPago, number>> = {};
  for (const s of sucursales) {
    const ep = s.estadoPago as EstadoPago;
    pagoCount[ep] = (pagoCount[ep] ?? 0) + 1;
  }

  // Gráfico 7 días
  const dias = Array.from({ length: 7 }, (_, i) => subDays(ahora, 6 - i));
  const chartData: Record<string, number | string>[] = await Promise.all(
    dias.map(async (day) => {
      const entry: Record<string, number | string> = { fecha: format(day, "dd/MM") };
      await Promise.all(
        sucursales.map(async (s) => {
          const r = await prisma.venta.aggregate({
            _sum: { total: true },
            where: { caja: { sucursalId: s.id }, creadoEn: { gte: startOfDay(day), lte: endOfDay(day) }, estado: "PAGADA" },
          });
          entry[s.nombre] = Number(r._sum.total ?? 0);
        })
      );
      return entry;
    })
  );
  const series = sucursales.map(s => s.nombre);

  return {
    sucursales, ventasHoyGlobal, ventasMesGlobal, totalPedidosActivos,
    totalSucursalesConCaja, totalClientes, totalTxHoy, pagoCount,
    ventasHoyMap, ventasMesMap, pedidosActivosMap, cajasAbiertasMap,
    chartData, series, ahora,
  };
}

// ── Configuración pago ─────────────────────────────────────────────────────
const PAGO_DISPLAY: Record<EstadoPago, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SOCIO:     { label: "Socio",     color: "text-violet-700",  bg: "bg-violet-100",  icon: <Star size={10} /> },
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle2 size={10} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-100",    icon: <Gift size={10} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-100",   icon: <Clock size={10} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-100",     icon: <AlertTriangle size={10} /> },
};

// ── Componente ─────────────────────────────────────────────────────────────
export async function AdminGeneralView() {
  const [adminData, configData] = await Promise.all([
    getAdminData(),
    prisma.configuracion.findUnique({ where: { id: 1 }, select: { homePreviewUrl: true } }),
  ]);

  const {
    sucursales, ventasHoyGlobal, ventasMesGlobal, totalPedidosActivos,
    totalSucursalesConCaja, totalClientes, totalTxHoy, pagoCount,
    ventasHoyMap, ventasMesMap, pedidosActivosMap, cajasAbiertasMap,
    chartData, series, ahora,
  } = adminData;

  const mesLabel = new Intl.DateTimeFormat("es-CL", { month: "long" }).format(ahora);

  return (
    <div className="space-y-4">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-surface-text tracking-tight leading-none">PANDAADMIN</h1>
            <p className="text-xs text-surface-muted capitalize mt-0.5">
              {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(ahora)}
            </p>
          </div>
        </div>
        <span className="hidden sm:block text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          Control General
        </span>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={12} className="text-brand-600" />
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">Ventas Hoy</span>
          </div>
          <p className="text-xl font-black text-brand-700 tabular-nums leading-none">
            {formatCurrency(ventasHoyGlobal, "$")}
          </p>
          <p className="text-[10px] text-brand-500 mt-1">{totalTxHoy} transacciones</p>
        </div>

        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <div className="flex items-center gap-1 mb-1">
            <Wallet size={12} className="text-violet-600" />
            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">Ventas {mesLabel}</span>
          </div>
          <p className="text-xl font-black text-violet-700 tabular-nums leading-none">
            {formatCurrency(ventasMesGlobal, "$")}
          </p>
          <p className="text-[10px] text-violet-500 mt-1">mes en curso</p>
        </div>

        <div className={`rounded-xl border p-3 ${totalPedidosActivos > 0 ? "border-amber-100 bg-amber-50" : "border-surface-border bg-surface-bg"}`}>
          <div className="flex items-center gap-1 mb-1">
            <ShoppingBag size={12} className={totalPedidosActivos > 0 ? "text-amber-600" : "text-surface-muted"} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${totalPedidosActivos > 0 ? "text-amber-600" : "text-surface-muted"}`}>
              Pedidos Activos
            </span>
          </div>
          <p className={`text-xl font-black tabular-nums leading-none ${totalPedidosActivos > 0 ? "text-amber-700" : "text-surface-muted"}`}>
            {totalPedidosActivos}
          </p>
          <p className={`text-[10px] mt-1 ${totalPedidosActivos > 0 ? "text-amber-500" : "text-surface-muted"}`}>
            {totalPedidosActivos > 0 ? "en cocina / barra" : "sin pedidos"}
          </p>
        </div>

        <div className={`rounded-xl border p-3 ${totalSucursalesConCaja > 0 ? "border-emerald-100 bg-emerald-50" : "border-surface-border bg-surface-bg"}`}>
          <div className="flex items-center gap-1 mb-1">
            <Store size={12} className={totalSucursalesConCaja > 0 ? "text-emerald-600" : "text-surface-muted"} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${totalSucursalesConCaja > 0 ? "text-emerald-600" : "text-surface-muted"}`}>
              Sucursales
            </span>
          </div>
          <p className={`text-xl font-black leading-none ${totalSucursalesConCaja > 0 ? "text-emerald-700" : "text-surface-muted"}`}>
            <span className="tabular-nums">{totalSucursalesConCaja}</span>
            <span className="text-base font-medium opacity-60">/{sucursales.length}</span>
          </p>
          <p className={`text-[10px] mt-1 ${totalSucursalesConCaja > 0 ? "text-emerald-500" : "text-surface-muted"}`}>
            con caja abierta
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-1 mb-1">
            <Users size={12} className="text-slate-600" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Clientes</span>
          </div>
          <p className="text-xl font-black text-slate-700 tabular-nums leading-none">
            {totalClientes.toLocaleString("es-CL")}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">registrados</p>
        </div>
      </div>

      {/* ── ESTADO DE PAGOS ───────────────────────────────────────────── */}
      <div className="card px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold text-surface-muted uppercase tracking-widest shrink-0">
          Estado de pagos
        </span>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {(["SOCIO", "AL_DIA", "GRATIS", "PENDIENTE", "ATRASADO"] as EstadoPago[]).map(key => {
            const n = pagoCount[key] ?? 0;
            if (n === 0) return null;
            const cfg = PAGO_DISPLAY[key];
            return (
              <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.icon} {cfg.label} · {n}
              </span>
            );
          })}
        </div>
        <Link href="/pagos" className="shrink-0 text-xs text-brand-600 hover:underline font-semibold">
          Administrar pagos →
        </Link>
      </div>

      {/* ── SUCURSALES ────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[10px] font-bold text-surface-muted uppercase tracking-widest">
            Sucursales · {sucursales.length}
          </h2>
          <Link href="/sucursales" className="text-xs text-brand-600 hover:underline font-semibold">
            Gestionar →
          </Link>
        </div>
        {sucursales.length === 0 ? (
          <div className="card p-8 text-center text-surface-muted text-sm">No hay sucursales.</div>
        ) : (
          <div className="space-y-1">
            {sucursales.map(s => (
              <SucursalRow
                key={s.id}
                id={s.id}
                nombre={s.nombre}
                logoUrl={s.logoUrl}
                creadoEn={s.creadoEn.toISOString()}
                plan={s.plan}
                estadoPago={s.estadoPago as EstadoPago}
                mesesGratis={s.mesesGratis}
                ventasHoy={ventasHoyMap[s.id] ?? { total: 0, count: 0 }}
                ventasMes={ventasMesMap[s.id] ?? 0}
                pedidosActivos={pedidosActivosMap[s.id] ?? 0}
                cajasAbiertas={cajasAbiertasMap[s.id] ?? 0}
                totalClientes={s._count.clientes}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── EDITOR HOME ──────────────────────────────────────────────── */}
      <HomeEditorModule currentUrl={configData?.homePreviewUrl} />

      {/* ── GRÁFICO 7 DÍAS ────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-surface-text text-sm">Ventas por Sucursal</h2>
            <p className="text-xs text-surface-muted mt-0.5">Últimos 7 días — comparativa</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl font-semibold border border-brand-100">
            <TrendingUp size={12} /> Esta semana
          </span>
        </div>
        {sucursales.length > 0 ? (
          <MultiSalesChart data={chartData} series={series} simbolo="$" />
        ) : (
          <div className="h-32 flex items-center justify-center text-surface-muted text-sm">Sin datos</div>
        )}
      </div>

    </div>
  );
}
