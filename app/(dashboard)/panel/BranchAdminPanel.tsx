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

  const totalHoy   = Number(ventasHoy._sum.total ?? 0);
  const totalMes   = Number(ventasMes._sum.total ?? 0);
  const txHoy      = ventasHoy._count.id;
  const ticketProm = txHoy > 0 ? totalHoy / txHoy : 0;
  const slug       = sucursal ? createSlug(sucursal.nombre) : "";
  const fechaLabel = new Intl.DateTimeFormat("es-CL", {
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
    <div className="space-y-6">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
          <div className="shrink-0">
            {sucursal?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sucursal.logoUrl} alt={sucursal.nombre} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-500/30 border-2 border-brand-400/40 flex items-center justify-center">
                <ChefHat size={28} className="text-brand-300" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Panel de Administración</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{sucursal?.nombre ?? "Mi Restaurante"}</h1>
            <p className="text-slate-300 text-sm mt-0.5 capitalize">Hola, {nombre} — {fechaLabel}</p>
          </div>

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

      {/* ── CUMPLEAÑOS ────────────────────────────────────────────────────── */}
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
          <Link href="/clientes" className="shrink-0 text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1">
            Ver <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── SECCIÓN: RESUMEN DEL DÍA ──────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5">Resumen del Día</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Ventas Hoy */}
          <div className="card p-5 bg-gradient-to-br from-brand-500 to-brand-600 border-0 text-white">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-100 uppercase tracking-wide">Ventas Hoy</p>
                <p className="text-lg sm:text-2xl font-black mt-1 truncate">{formatCurrency(totalHoy, simbolo)}</p>
                <p className="text-xs text-brand-100 mt-0.5">{txHoy} {txHoy === 1 ? "transacción" : "transacciones"}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          {/* Pedidos Activos */}
          <div className={`card p-5 ${pedidosActivos > 0 ? "border-amber-200 bg-amber-50/60" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Pedidos Activos</p>
                <p className={`text-lg sm:text-2xl font-black mt-1 ${pedidosActivos > 0 ? "text-amber-600" : "text-surface-text"}`}>
                  {pedidosActivos}
                </p>
                <p className="text-xs text-surface-muted mt-0.5">En cocina / bar</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pedidosActivos > 0 ? "bg-amber-100 text-amber-600" : "bg-surface-bg text-surface-muted"}`}>
                <ClipboardList size={20} />
              </div>
            </div>
            {pedidosActivos > 0 && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  En progreso
                </span>
              </div>
            )}
          </div>

          {/* Mesas */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Mesas</p>
                <p className="text-lg sm:text-2xl font-black mt-1 text-surface-text">
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
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, (mesasOcupadas / totalMesas) * 100)}%` }} />
              </div>
            )}
          </div>

          {/* Clientes */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Clientes</p>
                <p className="text-lg sm:text-2xl font-black mt-1 text-surface-text">{totalClientes.toLocaleString("es-CL")}</p>
                <p className="text-xs text-surface-muted mt-0.5">Registrados</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Métricas secundarias */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Receipt size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-muted">Ventas del mes</p>
              <p className="font-black text-surface-text truncate">{formatCurrency(totalMes, simbolo)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <ShoppingBag size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-muted">Ticket promedio hoy</p>
              <p className="font-black text-surface-text truncate">{formatCurrency(ticketProm, simbolo)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN: MÓDULOS ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5">Módulos del Sistema</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              href: "/mesas",
              icon: UtensilsCrossed,
              label: "Mesas",
              description: "Gestiona el salón, abre cuentas y cobra en mesa",
              iconBg: "bg-red-500",
              hoverBorder: "hover:border-red-200",
            },
            {
              href: "/ventas/caja",
              icon: ShoppingCart,
              label: "Caja",
              description: "Punto de venta rápido para cobros directos",
              iconBg: "bg-brand-600",
              hoverBorder: "hover:border-brand-200",
            },
            {
              href: "/pedidos",
              icon: Monitor,
              label: "KDS",
              description: "Pantalla de cocina y barra con pedidos en tiempo real",
              iconBg: "bg-amber-500",
              hoverBorder: "hover:border-amber-200",
            },
            {
              href: "/productos",
              icon: Package,
              label: "Productos",
              description: "Administra el menú, precios y categorías",
              iconBg: "bg-blue-500",
              hoverBorder: "hover:border-blue-200",
            },
            {
              href: "/fotos",
              icon: Camera,
              label: "Fotos",
              description: "Sube y organiza las imágenes de tu carta digital",
              iconBg: "bg-violet-500",
              hoverBorder: "hover:border-violet-200",
            },
            {
              href: `/registro/${slug}`,
              icon: Cake,
              label: "Cumpleaños",
              description: "Registro de clientes para fidelización y cumpleaños",
              iconBg: "bg-pink-500",
              hoverBorder: "hover:border-pink-200",
            },
          ].map(({ href, icon: Icon, label, description, iconBg, hoverBorder }) => (
            <Link
              key={href}
              href={href}
              className={`card p-4 flex flex-col gap-3 group transition-all duration-200 ${hoverBorder} hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${iconBg} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon size={19} />
                </div>
                <ArrowRight size={15} className="text-surface-muted/40 group-hover:text-surface-muted group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
              <div>
                <p className="font-bold text-surface-text text-sm leading-tight">{label}</p>
                <p className="text-xs text-surface-muted mt-0.5 leading-snug line-clamp-2">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN: ACTIVIDAD RECIENTE ───────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5">Actividad Reciente</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Gráfico */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-surface-text text-sm">Ventas — Últimos 7 días</h2>
                <p className="text-xs text-surface-muted mt-0.5">Ingresos totales por día</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl font-semibold border border-brand-100">
                <TrendingUp size={13} /> Esta semana
              </span>
            </div>
            <SalesChart data={ventasChart} simbolo={simbolo} />
          </div>

          {/* Últimas ventas */}
          <div className="card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-surface-text text-sm">Últimas Ventas</h2>
              <Link href="/ventas" className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {ultimasVentas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="PandaPoss" className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-surface-muted text-sm">Sin ventas hoy</p>
              </div>
            ) : (
              <div className="space-y-1 flex-1">
                {ultimasVentas.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-surface-border/60 last:border-0 gap-2">
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

    </div>
  );
}
