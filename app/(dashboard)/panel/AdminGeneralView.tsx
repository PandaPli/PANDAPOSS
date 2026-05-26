import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Building2, TrendingUp, Users, Wallet,
  Star, Gift, CheckCircle2, Clock, AlertTriangle,
  ShoppingBag, Store, ArrowUpRight,
  Activity, CreditCard,
} from "lucide-react";
import { SucursalRow } from "./SucursalRow";
import { SucursalList } from "./SucursalList";
import { HomeEditorModule } from "./HomeEditorModule";
import { AdminConfigPanel } from "./AdminConfigPanel";
import { AdminPanelTabs } from "./AdminPanelTabs";
import { AdminAnalitica } from "./AdminAnalitica";
import { AdminUsuarios } from "./AdminUsuarios";
import { AdminLogs } from "./AdminLogs";

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

  // Idempotent cleanup: mark stale sessions as inactive.
  // Runs on every render (including auto-refresh) but is safe under concurrency —
  // updateMany with the same WHERE/SET is a no-op if already applied.
  // Must await: the sesionesActivas count below depends on this being done first.
  const umbralInactivo = new Date(ahora.getTime() - 2 * 60 * 1000);
  await prisma.sesionActividad.updateMany({
    where: { activa: true, ultimoPing: { lt: umbralInactivo } },
    data: { activa: false },
  });

  // Optimized: 4 GROUP BY queries instead of 6×N individual queries
  const [ventasHoyRows, ventasMesRows, cajasAbiertasRows, sesionRows] = await Promise.all([
    // Ventas hoy por sucursal (1 query)
    prisma.$queryRaw<{ sucursalId: number; total: number; cnt: number }[]>`
      SELECT c.sucursalId, COALESCE(SUM(v.total), 0) AS total, COUNT(v.id) AS cnt
      FROM ventas v JOIN cajas c ON v.cajaId = c.id
      WHERE v.creadoEn >= ${hoy} AND v.creadoEn <= ${hoyFin} AND v.estado = 'PAGADA'
      GROUP BY c.sucursalId
    `,
    // Ventas mes por sucursal (1 query)
    prisma.$queryRaw<{ sucursalId: number; total: number }[]>`
      SELECT c.sucursalId, COALESCE(SUM(v.total), 0) AS total
      FROM ventas v JOIN cajas c ON v.cajaId = c.id
      WHERE v.creadoEn >= ${mesInicio} AND v.creadoEn <= ${hoyFin} AND v.estado = 'PAGADA'
      GROUP BY c.sucursalId
    `,
    // Cajas abiertas por sucursal (1 query)
    prisma.$queryRaw<{ sucursalId: number; cnt: number }[]>`
      SELECT sucursalId, COUNT(*) AS cnt FROM cajas WHERE estado = 'ABIERTA' GROUP BY sucursalId
    `,
    // Sesiones: última conexión + tiempo total por sucursal (1 query)
    prisma.$queryRaw<{ sucursalId: number; ultimoPing: Date | null; totalSeg: number }[]>`
      SELECT sucursalId, MAX(ultimoPing) AS ultimoPing, COALESCE(SUM(duracionSeg), 0) AS totalSeg
      FROM sesiones_actividad GROUP BY sucursalId
    `,
  ]);

  // Pedidos activos sigue con Prisma ORM por la complejidad del OR multi-tabla
  const pedidosActivosArr = await Promise.all(sucursales.map(s =>
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
  ));

  const ventasHoyMap: Record<number, { total: number; count: number }> = {};
  for (const r of ventasHoyRows) ventasHoyMap[r.sucursalId] = { total: Number(r.total), count: Number(r.cnt) };

  const ventasMesMap: Record<number, number> = {};
  for (const r of ventasMesRows) ventasMesMap[r.sucursalId] = Number(r.total);

  const pedidosActivosMap = Object.fromEntries(pedidosActivosArr.map(v => [v.id, v.count]));

  const cajasAbiertasMap: Record<number, number> = {};
  for (const r of cajasAbiertasRows) cajasAbiertasMap[r.sucursalId] = Number(r.cnt);

  const ultimaConexionMap: Record<number, Date | null> = {};
  const tiempoTotalMap: Record<number, number> = {};
  for (const r of sesionRows) {
    ultimaConexionMap[r.sucursalId] = r.ultimoPing;
    tiempoTotalMap[r.sucursalId] = Number(r.totalSeg);
  }

  const ventasHoyGlobal        = Object.values(ventasHoyMap).reduce((s, v) => s + v.total, 0);
  const ventasMesGlobal        = Object.values(ventasMesMap).reduce((s, v) => s + v, 0);
  const totalPedidosActivos    = pedidosActivosArr.reduce((s, v) => s + v.count, 0);
  const totalSucursalesConCaja = Object.values(cajasAbiertasMap).filter(n => n > 0).length;
  const totalClientes          = sucursales.reduce((s, suc) => s + suc._count.clientes, 0);
  const totalTxHoy             = Object.values(ventasHoyMap).reduce((s, v) => s + v.count, 0);
  const sesionesActivas        = await prisma.sesionActividad.count({ where: { activa: true } });

  const pagoCount: Partial<Record<EstadoPago, number>> = {};
  for (const s of sucursales) {
    const ep = s.estadoPago as EstadoPago;
    pagoCount[ep] = (pagoCount[ep] ?? 0) + 1;
  }

  // Chart: single raw query instead of N×7 individual aggregates
  const dias = Array.from({ length: 7 }, (_, i) => subDays(ahora, 6 - i));
  const chartStart = startOfDay(dias[0]);
  const chartEnd   = endOfDay(dias[6]);

  const chartRows = await prisma.$queryRaw<
    { sucursalId: number; fecha: string; total: number }[]
  >`
    SELECT c.sucursalId,
           DATE_FORMAT(v.creadoEn, '%d/%m') AS fecha,
           COALESCE(SUM(v.total), 0)        AS total
    FROM   ventas v
    JOIN   cajas  c ON v.cajaId = c.id
    WHERE  v.creadoEn >= ${chartStart}
      AND  v.creadoEn <= ${chartEnd}
      AND  v.estado   = 'PAGADA'
    GROUP BY c.sucursalId, DATE_FORMAT(v.creadoEn, '%d/%m')
    ORDER BY MIN(v.creadoEn)
  `;

  const sucIdToName = Object.fromEntries(sucursales.map(s => [s.id, s.nombre]));
  const chartData: Record<string, number | string>[] = dias.map(day => {
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
  const series = sucursales.map(s => s.nombre);

  return {
    sucursales, ventasHoyGlobal, ventasMesGlobal, totalPedidosActivos,
    totalSucursalesConCaja, totalClientes, totalTxHoy, pagoCount, sesionesActivas,
    ventasHoyMap, ventasMesMap, pedidosActivosMap, cajasAbiertasMap,
    ultimaConexionMap, tiempoTotalMap,
    chartData, series, ahora,
  };
}

// ── Pago config ───────────────────────────────────────────────────────────
const PAGO_DISPLAY: Record<EstadoPago, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  SOCIO:     { label: "Socio",     color: "text-violet-700",  bg: "bg-violet-500/10", border: "border-violet-300/30", icon: <Star size={11} /> },
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-500/10", border: "border-emerald-300/30", icon: <CheckCircle2 size={11} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-500/10", border: "border-blue-300/30", icon: <Gift size={11} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-500/10", border: "border-amber-300/30", icon: <Clock size={11} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-500/10", border: "border-red-300/30", icon: <AlertTriangle size={11} /> },
};

// ── Componente ────────────────────────────────────────────────────────────
export async function AdminGeneralView() {
  const [adminData, configData] = await Promise.all([
    getAdminData(),
    prisma.configuracion.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        nombreEmpresa: true,
        rut: true,
        direccion: true,
        telefono: true,
        email: true,
        moneda: true,
        simbolo: true,
        ivaPorc: true,
        logoUrl: true,
        homePreviewUrl: true,
      },
    }),
  ]);

  const {
    sucursales, ventasHoyGlobal, ventasMesGlobal, totalPedidosActivos,
    totalSucursalesConCaja, totalClientes, totalTxHoy, pagoCount, sesionesActivas,
    ventasHoyMap, ventasMesMap, pedidosActivosMap, cajasAbiertasMap,
    ultimaConexionMap, tiempoTotalMap,
    chartData, series, ahora,
  } = adminData;

  const mesLabel = new Intl.DateTimeFormat("es-CL", { month: "long" }).format(ahora);

  // ── TAB: General ──────────────────────────────────────────────────────
  const generalTab = (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Ventas Hoy - hero card */}
        <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl border border-brand-200/40 bg-gradient-to-br from-brand-500/10 via-white/80 to-violet-500/5 backdrop-blur-xl p-5 shadow-[0_8px_30px_rgba(79,70,229,0.08)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-brand-600/15 flex items-center justify-center">
                <TrendingUp size={16} className="text-brand-600" />
              </div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">Ventas Hoy</span>
            </div>
            <p className="text-3xl font-black text-brand-700 tabular-nums leading-none">
              {formatCurrency(ventasHoyGlobal, "$")}
            </p>
            <p className="text-xs text-brand-500/80 mt-2 font-medium">{totalTxHoy} transacciones</p>
          </div>
        </div>

        {/* Ventas Mes */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-200/40 bg-gradient-to-br from-violet-500/8 via-white/80 to-fuchsia-500/5 backdrop-blur-xl p-5 shadow-[0_4px_20px_rgba(124,58,237,0.06)]">
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400/10 rounded-full blur-2xl translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/15 flex items-center justify-center">
                <Wallet size={16} className="text-violet-600" />
              </div>
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Ventas {mesLabel}</span>
            </div>
            <p className="text-2xl font-black text-violet-700 tabular-nums leading-none">
              {formatCurrency(ventasMesGlobal, "$")}
            </p>
            <p className="text-xs text-violet-500/80 mt-2 font-medium">mes en curso</p>
          </div>
        </div>

        {/* Pedidos activos */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 ${
          totalPedidosActivos > 0
            ? "border-amber-200/40 bg-gradient-to-br from-amber-500/10 via-white/80 to-orange-500/5 shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
            : "border-white/40 bg-white/60"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${totalPedidosActivos > 0 ? "bg-amber-600/15" : "bg-slate-100"}`}>
              <ShoppingBag size={16} className={totalPedidosActivos > 0 ? "text-amber-600" : "text-slate-400"} />
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${totalPedidosActivos > 0 ? "text-amber-600" : "text-slate-400"}`}>
              Pedidos Activos
            </span>
          </div>
          <p className={`text-2xl font-black tabular-nums leading-none ${totalPedidosActivos > 0 ? "text-amber-700" : "text-slate-300"}`}>
            {totalPedidosActivos}
          </p>
          <p className={`text-xs mt-2 font-medium ${totalPedidosActivos > 0 ? "text-amber-500/80" : "text-slate-400"}`}>
            {totalPedidosActivos > 0 ? "en cocina / barra" : "sin pedidos"}
          </p>
        </div>
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {/* Sucursales */}
        <div className={`rounded-2xl border backdrop-blur-xl p-4 ${
          totalSucursalesConCaja > 0
            ? "border-emerald-200/40 bg-gradient-to-br from-emerald-500/8 via-white/80 to-teal-500/5"
            : "border-white/40 bg-white/60"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${totalSucursalesConCaja > 0 ? "bg-emerald-600/15" : "bg-slate-100"}`}>
              <Store size={14} className={totalSucursalesConCaja > 0 ? "text-emerald-600" : "text-slate-400"} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${totalSucursalesConCaja > 0 ? "text-emerald-600" : "text-slate-400"}`}>
              Sucursales
            </span>
          </div>
          <p className={`text-xl font-black leading-none ${totalSucursalesConCaja > 0 ? "text-emerald-700" : "text-slate-300"}`}>
            <span className="tabular-nums">{totalSucursalesConCaja}</span>
            <span className="text-sm font-medium opacity-50">/{sucursales.length}</span>
          </p>
          <p className={`text-[10px] mt-1.5 font-medium ${totalSucursalesConCaja > 0 ? "text-emerald-500/70" : "text-slate-400"}`}>
            con caja abierta
          </p>
        </div>

        {/* Clientes */}
        <div className="rounded-2xl border border-slate-200/40 bg-gradient-to-br from-slate-500/5 via-white/80 to-slate-500/3 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-600/10 flex items-center justify-center">
              <Users size={14} className="text-slate-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clientes</span>
          </div>
          <p className="text-xl font-black text-slate-700 tabular-nums leading-none">
            {totalClientes.toLocaleString("es-CL")}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">registrados</p>
        </div>

        {/* Sesiones activas */}
        <div className={`rounded-2xl border backdrop-blur-xl p-4 ${
          sesionesActivas > 0
            ? "border-cyan-200/40 bg-gradient-to-br from-cyan-500/8 via-white/80 to-blue-500/5"
            : "border-white/40 bg-white/60"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sesionesActivas > 0 ? "bg-cyan-600/15" : "bg-slate-100"}`}>
              <Activity size={14} className={sesionesActivas > 0 ? "text-cyan-600" : "text-slate-400"} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${sesionesActivas > 0 ? "text-cyan-600" : "text-slate-400"}`}>
              En línea
            </span>
          </div>
          <p className={`text-xl font-black tabular-nums leading-none ${sesionesActivas > 0 ? "text-cyan-700" : "text-slate-300"}`}>
            {sesionesActivas}
          </p>
          <p className={`text-[10px] mt-1.5 font-medium ${sesionesActivas > 0 ? "text-cyan-500/70" : "text-slate-400"}`}>
            {sesionesActivas === 1 ? "usuario activo" : "usuarios activos"}
          </p>
        </div>
      </div>

      {/* Estado de pagos - glass bar */}
      <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-surface-muted" />
            <span className="text-[11px] font-bold text-surface-muted uppercase tracking-widest">Estado de Pagos</span>
          </div>
          <Link href="/pagos" className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors">
            Administrar <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["SOCIO", "AL_DIA", "GRATIS", "PENDIENTE", "ATRASADO"] as EstadoPago[]).map(key => {
            const n = pagoCount[key] ?? 0;
            if (n === 0) return null;
            const cfg = PAGO_DISPLAY[key];
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border backdrop-blur-sm ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                {cfg.icon} {cfg.label} <span className="opacity-50">·</span> {n}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── TAB: Sucursales ───────────────────────────────────────────────────
  const sucursalRows = sucursales.map(s => (
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
      ultimaConexion={ultimaConexionMap[s.id]?.toISOString() ?? null}
      tiempoTotalSeg={tiempoTotalMap[s.id] ?? 0}
    />
  ));

  const sucursalesTab = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600/10 backdrop-blur-sm flex items-center justify-center">
            <Store size={15} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-surface-text leading-none">Sucursales</h2>
            <p className="text-[10px] text-surface-muted mt-0.5">{sucursales.length} registradas · {totalSucursalesConCaja} activas</p>
          </div>
        </div>
        <Link href="/sucursales" className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors bg-brand-50/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-brand-100/40">
          Gestionar <ArrowUpRight size={11} />
        </Link>
      </div>
      {sucursales.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-12 text-center text-surface-muted text-sm">
          No hay sucursales registradas.
        </div>
      ) : (
        <SucursalList
          sucursales={sucursales.map(s => ({
            id: s.id,
            nombre: s.nombre,
            plan: s.plan,
            estadoPago: s.estadoPago as EstadoPago,
          }))}
        >
          {sucursalRows}
        </SucursalList>
      )}
    </div>
  );

  // ── TAB: Analítica ────────────────────────────────────────────────────
  const analiticaTab = (
    <AdminAnalitica
      initialChartData={chartData}
      initialSeries={series}
      initialVentasMes={ventasMesMap}
      initialTiempoTotal={tiempoTotalMap}
      sucursales={sucursales.map(s => ({ id: s.id, nombre: s.nombre }))}
    />
  );

  // ── TAB: Usuarios ────────────────────────────────────────────────────
  const usuariosTab = (
    <AdminUsuarios
      sucursales={sucursales.map(s => ({ id: s.id, nombre: s.nombre }))}
    />
  );

  // ── TAB: Logs ────────────────────────────────────────────────────────
  const logsTab = <AdminLogs />;

  // ── TAB: Configuración ────────────────────────────────────────────────
  const configTab = configData ? (
    <AdminConfigPanel
      config={{
        id: configData.id,
        nombreEmpresa: configData.nombreEmpresa,
        rut: configData.rut,
        direccion: configData.direccion,
        telefono: configData.telefono,
        email: configData.email,
        moneda: configData.moneda,
        simbolo: configData.simbolo,
        ivaPorc: Number(configData.ivaPorc),
        logoUrl: configData.logoUrl,
      }}
      homePreviewUrl={configData.homePreviewUrl}
    />
  ) : (
    <HomeEditorModule currentUrl={null} />
  );

  return (
    <div className="space-y-5">
      {/* ── HEADER CRISTAL ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-r from-brand-600/8 via-white/70 to-violet-600/5 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(79,70,229,0.06)]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-400/8 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400/8 rounded-full blur-3xl translate-y-10 -translate-x-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-surface-text tracking-tight leading-none">PANDAADMIN</h1>
              <p className="text-xs text-surface-muted capitalize mt-1">
                {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(ahora)}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {sesionesActivas > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-300/30 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {sesionesActivas} en línea
              </span>
            )}
            <span className="text-[11px] bg-brand-600/10 text-brand-700 backdrop-blur-sm px-4 py-1.5 rounded-xl font-bold uppercase tracking-wider border border-brand-200/30">
              Control General
            </span>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────── */}
      <Suspense fallback={<div className="h-20 rounded-2xl bg-white/30 animate-pulse" />}>
        <AdminPanelTabs
          general={generalTab}
          sucursales={sucursalesTab}
          analitica={analiticaTab}
          usuarios={usuariosTab}
          logs={logsTab}
          config={configTab}
        />
      </Suspense>
    </div>
  );
}
