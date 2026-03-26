import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  ClipboardList, UtensilsCrossed, TrendingUp, ShoppingCart,
  Monitor, ArrowRight, Users, Camera, Cake, QrCode, Package,
  Bike, ShoppingBag, Receipt, ChefHat, PartyPopper,
} from "lucide-react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { createSlug } from "@/lib/slug";
import Link from "next/link";

interface Props {
  sucursalId: number;
  simbolo: string;
  nombre: string;
}

export async function BranchAdminPanel({ sucursalId, simbolo, nombre }: Props) {
  const hoy = new Date();
  const hoyInicio = startOfDay(hoy);
  const hoyFin   = endOfDay(hoy);
  const mesInicio = startOfDay(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const ventaWhere  = { caja: { sucursalId } };
  const pedidoWhere = { OR: [{ caja: { sucursalId } }, { mesa: { sala: { sucursalId } } }] as object[] };
  const mesaWhere   = { sala: { sucursalId } };

  const [
    sucursal,
    ventasHoy,
    pedidosActivos,
    mesasOcupadas,
    totalMesas,
    totalClientes,
    ventasMes,
    ultimasVentas,
    clientesConCumple,
  ] = await Promise.all([
    prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { nombre: true, logoUrl: true, delivery: true, menuQR: true },
    }),
    prisma.venta.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { ...ventaWhere, creadoEn: { gte: hoyInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    prisma.pedido.count({
      where: { ...pedidoWhere, estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
    }),
    prisma.mesa.count({ where: { ...mesaWhere, estado: "OCUPADA" } }),
    prisma.mesa.count({ where: mesaWhere }),
    prisma.cliente.count({ where: { sucursalId, activo: true } }),
    prisma.venta.aggregate({
      _sum: { total: true },
      where: { ...ventaWhere, creadoEn: { gte: mesInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    prisma.venta.findMany({
      where: ventaWhere,
      take: 6,
      orderBy: { creadoEn: "desc" },
      include: { cliente: { select: { nombre: true } } },
    }),
    prisma.cliente.findMany({
      where: { sucursalId, activo: true, fechaNacimiento: { not: null } },
      select: { id: true, nombre: true, telefono: true, fechaNacimiento: true },
    }),
  ]);

  const ventasChart = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = subDays(hoy, 6 - i);
      const r = await prisma.venta.aggregate({
        _sum: { total: true },
        where: { ...ventaWhere, creadoEn: { gte: startOfDay(day), lte: endOfDay(day) }, estado: "PAGADA" },
      });
      return { fecha: format(day, "dd/MM"), total: Number(r._sum.total ?? 0) };
    })
  );

  const totalHoy     = Number(ventasHoy._sum.total ?? 0);
  const totalMes     = Number(ventasMes._sum.total ?? 0);
  const txHoy        = ventasHoy._count.id;
  const ticketProm   = txHoy > 0 ? totalHoy / txHoy : 0;
  const slug         = sucursal ? createSlug(sucursal.nombre) : "";
  const fechaLabel   = new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  }).format(hoy);

  // Cumpleañeros de hoy
  const mm = hoy.getMonth() + 1;
  const dd = hoy.getDate();
  const cumpleHoy = clientesConCumple.filter((c) => {
    if (!c.fechaNacimiento) return false;
    const d = new Date(c.fechaNacimiento);
    return d.getMonth() + 1 === mm && d.getDate() === dd;
  });

  return (
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        {/* Glow decorativo */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
          {/* Logo del restaurante */}
          <div className="shrink-0">
            {sucursal?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sucursal.logoUrl}
                alt={sucursal.nombre}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-500/30 border-2 border-brand-400/40 flex items-center justify-center">
                <ChefHat size={28} className="text-brand-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              Panel de Administración
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
              {sucursal?.nombre ?? "Mi Restaurante"}
            </h1>
            <p className="text-slate-300 text-sm mt-0.5 capitalize">
              Hola, {nombre} — {fechaLabel}
            </p>
          </div>

          {/* Badges estado */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {sucursal?.menuQR && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <QrCode size={12} /> Carta QR activa
              </span>
            )}
            {sucursal?.delivery && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Bike size={12} /> Delivery activo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ALERTA CUMPLEAÑOS ─────────────────────────────────────────── */}
      {cumpleHoy.length > 0 && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <PartyPopper size={20} className="text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-pink-800 text-sm">
              🎂 {cumpleHoy.length === 1 ? "1 cliente cumple años hoy" : `${cumpleHoy.length} clientes cumplen años hoy`}
            </p>
            <p className="text-xs text-pink-600 mt-0.5 truncate">
              {cumpleHoy.slice(0, 3).map(c => c.nombre).join(", ")}
              {cumpleHoy.length > 3 ? ` y ${cumpleHoy.length - 3} más` : ""}
            </p>
          </div>
          <Link
            href="/clientes"
            className="shrink-0 text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1"
          >
            Ver <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── KPIs FILA 1 ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ventas Hoy */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-white shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-100 uppercase tracking-wide">Ventas Hoy</p>
              <p className="text-2xl font-black mt-1 truncate">{formatCurrency(totalHoy, simbolo)}</p>
              <p className="text-xs text-brand-100 mt-0.5">{txHoy} {txHoy === 1 ? "transacción" : "transacciones"}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Pedidos Activos */}
        <div className={`rounded-2xl p-5 shadow-sm border ${pedidosActivos > 0 ? "bg-amber-50 border-amber-200" : "bg-surface-card border-surface-border"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Pedidos Activos</p>
              <p className={`text-2xl font-black mt-1 ${pedidosActivos > 0 ? "text-amber-600" : "text-surface-text"}`}>
                {pedidosActivos}
              </p>
              <p className="text-xs text-surface-muted mt-0.5">En cocina / bar</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pedidosActivos > 0 ? "bg-amber-100 text-amber-600" : "bg-surface-bg text-surface-muted"}`}>
              <ClipboardList size={20} />
            </div>
          </div>
          {pedidosActivos > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                En progreso
              </span>
            </div>
          )}
        </div>

        {/* Mesas */}
        <div className="rounded-2xl bg-surface-card border border-surface-border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Mesas</p>
              <p className="text-2xl font-black mt-1 text-surface-text">
                {mesasOcupadas}
                <span className="text-base font-medium text-surface-muted"> / {totalMesas}</span>
              </p>
              <p className="text-xs text-surface-muted mt-0.5">Ocupadas ahora</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <UtensilsCrossed size={20} />
            </div>
          </div>
          {totalMesas > 0 && (
            <div className="mt-3 h-1.5 bg-surface-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (mesasOcupadas / totalMesas) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Clientes Registrados */}
        <div className="rounded-2xl bg-surface-card border border-surface-border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Clientes</p>
              <p className="text-2xl font-black mt-1 text-surface-text">{totalClientes.toLocaleString("es-CL")}</p>
              <p className="text-xs text-surface-muted mt-0.5">Registrados</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs FILA 2 ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-surface-muted">Ventas del mes</p>
            <p className="font-black text-surface-text truncate">{formatCurrency(totalMes, simbolo)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-surface-muted">Ticket promedio hoy</p>
            <p className="font-black text-surface-text truncate">{formatCurrency(ticketProm, simbolo)}</p>
          </div>
        </div>
      </div>

      {/* ── ACCESOS RÁPIDOS ───────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-surface-muted uppercase tracking-wide mb-3">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { href: "/mesas",       icon: UtensilsCrossed, label: "Mesas",      sub: "Salón",          color: "text-red-500",    bg: "bg-red-50 hover:bg-red-100 border-red-100" },
            { href: "/ventas/caja", icon: ShoppingCart,   label: "Caja",       sub: "Punto de venta", color: "text-brand-500",  bg: "bg-brand-50 hover:bg-brand-100 border-brand-100" },
            { href: "/pedidos",     icon: Monitor,        label: "KDS",        sub: "Cocina / bar",   color: "text-amber-500",  bg: "bg-amber-50 hover:bg-amber-100 border-amber-100" },
            { href: "/productos",   icon: Package,        label: "Productos",  sub: "Menú y precios", color: "text-blue-500",   bg: "bg-blue-50 hover:bg-blue-100 border-blue-100" },
            { href: "/fotos",       icon: Camera,         label: "Fotos",      sub: "Galería",        color: "text-violet-500", bg: "bg-violet-50 hover:bg-violet-100 border-violet-100" },
            { href: `/registro/${slug}`, icon: Cake,      label: "Cumpleaños", sub: "Registro",       color: "text-pink-500",   bg: "bg-pink-50 hover:bg-pink-100 border-pink-100" },
          ].map(({ href, icon: Icon, label, sub, color, bg }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group ${bg}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}>
                <Icon size={20} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-surface-text leading-tight">{label}</p>
                <p className="text-[10px] text-surface-muted leading-tight">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── GRÁFICO + ÚLTIMAS VENTAS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-surface-text">Ventas — Últimos 7 días</h2>
              <p className="text-xs text-surface-muted mt-0.5">Ingresos totales por día</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl font-semibold">
              <TrendingUp size={13} />
              Esta semana
            </div>
          </div>
          <SalesChart data={ventasChart} simbolo={simbolo} />
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-surface-text mb-4">Últimas Ventas</h2>
          {ultimasVentas.length === 0 ? (
            <div className="text-center py-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="PandaPoss" className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-surface-muted text-sm">Sin ventas hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimasVentas.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between py-2 border-b border-surface-border last:border-0 gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-text truncate">
                      {v.cliente?.nombre ?? "Consumidor Final"}
                    </p>
                    <p className="text-[11px] text-surface-muted">{formatDateTime(v.creadoEn)}</p>
                  </div>
                  <span className="text-sm font-black text-brand-500 shrink-0 tabular-nums">
                    {formatCurrency(Number(v.total), simbolo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
