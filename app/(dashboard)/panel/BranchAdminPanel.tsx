import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  ClipboardList, UtensilsCrossed, TrendingUp, ShoppingCart,
  Monitor, ArrowRight, Users, Cake, QrCode, Package,
  Bike, ShoppingBag, Receipt, ChefHat, PartyPopper,
  AlertTriangle, Clock, Star, Wallet, BarChart2, Zap,
  Camera, CheckCircle2, Box,
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function elapsedMin(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}
function fmtElapsed(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}
function elapsedColor(min: number, redAt = 60, amberAt = 30) {
  if (min >= redAt) return "text-red-600 bg-red-50";
  if (min >= amberAt) return "text-amber-600 bg-amber-50";
  return "text-emerald-600 bg-emerald-50";
}

// ── Shortcuts config ──────────────────────────────────────────────────────────
const SHORTCUTS = [
  { href: "/mesas",      icon: UtensilsCrossed, label: "Mesas",     cls: "text-red-600    bg-red-50    border-red-200    hover:bg-red-100"    },
  { href: "/ventas/caja",icon: ShoppingCart,    label: "Caja",      cls: "text-brand-600  bg-brand-50  border-brand-200  hover:bg-brand-100"  },
  { href: "/pedidos",    icon: Monitor,         label: "KDS",       cls: "text-amber-600  bg-amber-50  border-amber-200  hover:bg-amber-100"  },
  { href: "/delivery",   icon: Bike,            label: "Delivery",  cls: "text-blue-600   bg-blue-50   border-blue-200   hover:bg-blue-100"   },
  { href: "/productos",  icon: Package,         label: "Productos", cls: "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100" },
  { href: "/ventas",     icon: BarChart2,       label: "Ventas",    cls: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  { href: "/clientes",   icon: Users,           label: "Clientes",  cls: "text-pink-600   bg-pink-50   border-pink-200   hover:bg-pink-100"   },
] as const;

export async function BranchAdminPanel({ sucursalId, simbolo, nombre }: Props) {
  const hoy       = new Date();
  const hoyInicio = startOfDay(hoy);
  const hoyFin    = endOfDay(hoy);
  const mesInicio = startOfDay(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const atrasoLimite = new Date(Date.now() - 15 * 60 * 1000);

  const ventaWhere  = { caja: { sucursalId } };
  const pedidoWhere = {
    OR: [
      { caja: { sucursalId } },
      { mesa: { sala: { sucursalId } } },
      { usuario: { sucursalId } },
    ] as object[],
  };
  const mesaWhere = { sala: { sucursalId } };

  // ── Queries ────────────────────────────────────────────────────────────────
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
    mesasActivas,
    pedidosAtrasados,
    pedidosDelivery,
    productosStockBajo,
    ingredientesStockBajo,
    topCompradores,
  ] = await Promise.all([
    // 1. Sucursal info
    prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { nombre: true, logoUrl: true, delivery: true, menuQR: true },
    }),
    // 2. Ventas hoy
    prisma.venta.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { ...ventaWhere, creadoEn: { gte: hoyInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    // 3. Pedidos activos count
    prisma.pedido.count({
      where: { ...pedidoWhere, estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
    }),
    // 4. Mesas ocupadas count
    prisma.mesa.count({ where: { ...mesaWhere, estado: "OCUPADA" } }),
    // 5. Total mesas
    prisma.mesa.count({ where: mesaWhere }),
    // 6. Total clientes
    prisma.cliente.count({ where: { sucursalId, activo: true } }),
    // 7. Ventas mes
    prisma.venta.aggregate({
      _sum: { total: true },
      where: { ...ventaWhere, creadoEn: { gte: mesInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    // 8. Últimas ventas
    prisma.venta.findMany({
      where: ventaWhere,
      take: 6,
      orderBy: { creadoEn: "desc" },
      include: { cliente: { select: { nombre: true } } },
    }),
    // 9. Cumpleañeros
    prisma.cliente.findMany({
      where: { sucursalId, activo: true, fechaNacimiento: { not: null } },
      select: { id: true, nombre: true, telefono: true, fechaNacimiento: true },
    }),
    // 10. Mesas activas (OCUPADA + CUENTA) con detalles
    prisma.mesa.findMany({
      where: { sala: { sucursalId }, estado: { in: ["OCUPADA", "CUENTA"] } },
      select: {
        id: true,
        nombre: true,
        estado: true,
        pedidos: {
          where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
          select: {
            id: true,
            creadoEn: true,
            detalles: {
              where: { cancelado: false },
              select: { cantidad: true, precio: true },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    // 11. Pedidos atrasados (PENDIENTE > 15min, no delivery)
    prisma.pedido.findMany({
      where: {
        ...pedidoWhere,
        estado: "PENDIENTE",
        tipo: { not: "DELIVERY" },
        creadoEn: { lte: atrasoLimite },
      },
      select: {
        id: true,
        numero: true,
        creadoEn: true,
        tipo: true,
        mesa: { select: { nombre: true } },
        detalles: { where: { cancelado: false }, select: { cantidad: true } },
      },
      orderBy: { creadoEn: "asc" },
      take: 8,
    }),
    // 12. Pedidos delivery activos
    prisma.pedido.findMany({
      where: {
        tipo: "DELIVERY",
        estado: { in: ["PENDIENTE", "EN_PROCESO"] },
        OR: [{ caja: { sucursalId } }, { usuario: { sucursalId } }] as object[],
      },
      select: {
        id: true,
        numero: true,
        creadoEn: true,
        detalles: { where: { cancelado: false }, select: { cantidad: true, precio: true } },
        delivery: {
          select: {
            zonaDelivery: true,
            estado: true,
            cliente: { select: { nombre: true } },
            repartidor: { select: { usuario: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { creadoEn: "asc" },
      take: 8,
    }),
    // 13. Productos con stock bajo
    prisma.producto.findMany({
      where: { sucursalId, inventariable: true, activo: true, stockMinimo: { gt: 0 } },
      select: { id: true, nombre: true, stock: true, stockMinimo: true },
      orderBy: { nombre: "asc" },
    }).then(prods => prods.filter(p => Number(p.stock) <= Number(p.stockMinimo))),
    // 14. Ingredientes con stock bajo
    prisma.ingrediente.findMany({
      where: { sucursalId, activo: true, stockMinimo: { gt: 0 } },
      select: { id: true, nombre: true, stock: true, stockMinimo: true, unidad: true },
      orderBy: { nombre: "asc" },
    }).then(ings => ings.filter(i => Number(i.stock) <= Number(i.stockMinimo))),
    // 15. Top compradores del mes
    // OR: ventas con caja de la sucursal ó ventas del usuario de la sucursal (sin caja abierta)
    prisma.venta.groupBy({
      by: ["clienteId"],
      where: {
        OR: [
          { caja: { sucursalId } },
          { usuario: { sucursalId } },
        ],
        estado: "PAGADA",
        clienteId: { not: null },
        creadoEn: { gte: mesInicio, lte: hoyFin },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 6,
    }).then(async raw => {
      const ids = raw.map(v => v.clienteId!).filter(Boolean);
      const clientes = await prisma.cliente.findMany({
        where: { id: { in: ids } },
        select: { id: true, nombre: true },
      });
      const map = Object.fromEntries(clientes.map(c => [c.id, c.nombre]));
      return raw.map(v => ({
        clienteId: v.clienteId!,
        nombre: map[v.clienteId!] ?? "Consumidor Final",
        total: Number(v._sum.total ?? 0),
        count: v._count.id,
      }));
    }),
  ]);

  // ── Chart 7 días ───────────────────────────────────────────────────────────
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

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalHoy   = Number(ventasHoy._sum.total ?? 0);
  const totalMes   = Number(ventasMes._sum.total ?? 0);
  const txHoy      = ventasHoy._count.id;
  const ticketProm = txHoy > 0 ? totalHoy / txHoy : 0;
  const slug       = sucursal ? createSlug(sucursal.nombre) : "";
  const fechaLabel = new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  }).format(hoy);

  // Cumpleañeros hoy
  const mm = hoy.getMonth() + 1;
  const dd = hoy.getDate();
  const cumpleHoy = clientesConCumple.filter(c => {
    if (!c.fechaNacimiento) return false;
    const d = new Date(c.fechaNacimiento);
    return d.getMonth() + 1 === mm && d.getDate() === dd;
  });

  // Mesas con stats calculados
  const mesasConStats = mesasActivas.map(mesa => {
    const detalles = mesa.pedidos.flatMap(p => p.detalles);
    const total    = detalles.reduce((s, d) => s + (Number(d.precio ?? 0) * d.cantidad), 0);
    const items    = detalles.reduce((s, d) => s + d.cantidad, 0);
    const primera  = mesa.pedidos.length > 0
      ? mesa.pedidos.reduce((min, p) => p.creadoEn < min ? p.creadoEn : min, mesa.pedidos[0].creadoEn)
      : null;
    const elapsed  = primera ? elapsedMin(primera) : 0;
    return { ...mesa, total, items, elapsed };
  });

  const mesasCuenta   = mesasConStats.filter(m => m.estado === "CUENTA");
  const totalStockBajo = productosStockBajo.length + ingredientesStockBajo.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5">
          <div className="shrink-0">
            {sucursal?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sucursal.logoUrl} alt={sucursal.nombre} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand-500/30 border-2 border-brand-400/40 flex items-center justify-center">
                <ChefHat size={26} className="text-brand-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Panel de Administración</p>
            <h1 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">{sucursal?.nombre ?? "Mi Restaurante"}</h1>
            <p className="text-slate-300 text-xs mt-0.5 capitalize">Hola, {nombre} — {fechaLabel}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {sucursal?.menuQR && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <QrCode size={11} /> Carta QR
              </span>
            )}
            {sucursal?.delivery && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Bike size={11} /> Delivery
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ACCESOS RÁPIDOS ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        <span className="text-[10px] font-bold text-surface-muted uppercase tracking-widest shrink-0">Ir a:</span>
        {SHORTCUTS.map(({ href, icon: Icon, label, cls }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 transition-colors ${cls}`}
          >
            <Icon size={12} />
            {label}
          </Link>
        ))}
      </div>

      {/* ── CUMPLEAÑOS ────────────────────────────────────────────────────── */}
      {cumpleHoy.length > 0 && (
        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <PartyPopper size={18} className="text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-pink-800 text-sm">
              🎂 {cumpleHoy.length === 1 ? "1 cliente cumple años hoy" : `${cumpleHoy.length} clientes cumplen años hoy`}
            </p>
            <p className="text-xs text-pink-600 truncate">
              {cumpleHoy.slice(0, 3).map(c => c.nombre).join(", ")}
              {cumpleHoy.length > 3 ? ` y ${cumpleHoy.length - 3} más` : ""}
            </p>
          </div>
          <Link href="/clientes" className="shrink-0 text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1">
            Ver <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Ventas hoy */}
        <div className="card p-4 bg-gradient-to-br from-brand-500 to-brand-600 border-0 text-white">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-brand-100 uppercase tracking-wide">Ventas Hoy</p>
              <p className="text-lg font-black mt-0.5 truncate">{formatCurrency(totalHoy, simbolo)}</p>
              <p className="text-[10px] text-brand-100 mt-0.5">{txHoy} transacciones</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Pedidos activos */}
        <div className={`card p-4 ${pedidosActivos > 0 ? "border-amber-200 bg-amber-50/70" : ""}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wide">Pedidos Activos</p>
              <p className={`text-lg font-black mt-0.5 ${pedidosActivos > 0 ? "text-amber-600" : "text-surface-text"}`}>
                {pedidosActivos}
              </p>
              <p className="text-[10px] text-surface-muted mt-0.5">En cocina / bar</p>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pedidosActivos > 0 ? "bg-amber-100 text-amber-600" : "bg-surface-bg text-surface-muted"}`}>
              <ClipboardList size={18} />
            </div>
          </div>
          {pedidosActivos > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> En progreso
              </span>
            </div>
          )}
        </div>

        {/* Mesas */}
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wide">Mesas</p>
              <p className="text-lg font-black mt-0.5 text-surface-text">
                {mesasOcupadas}
                <span className="text-base font-medium text-surface-muted"> / {totalMesas}</span>
              </p>
              <p className="text-[10px] text-surface-muted mt-0.5">Ocupadas ahora</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <UtensilsCrossed size={18} />
            </div>
          </div>
          {totalMesas > 0 && (
            <div className="mt-2 h-1 bg-surface-bg rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, (mesasOcupadas / totalMesas) * 100)}%` }} />
            </div>
          )}
        </div>

        {/* Clientes */}
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wide">Clientes</p>
              <p className="text-lg font-black mt-0.5 text-surface-text">{totalClientes.toLocaleString("es-CL")}</p>
              <p className="text-[10px] text-surface-muted mt-0.5">Registrados</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ── MÉTRICAS SECUNDARIAS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-surface-muted">Ventas del mes</p>
            <p className="font-black text-surface-text text-sm truncate">{formatCurrency(totalMes, simbolo)}</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-surface-muted">Ticket promedio hoy</p>
            <p className="font-black text-surface-text text-sm truncate">{formatCurrency(ticketProm, simbolo)}</p>
          </div>
        </div>
      </div>

      {/* ── WIDGETS OPERACIONALES ─────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5 mb-2">Operación en tiempo real</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

          {/* Widget: Mesas Activas */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed size={13} className="text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Mesas Activas</span>
              </div>
              <Link href="/mesas" className="text-[10px] text-brand-600 hover:underline font-semibold">Ver salón →</Link>
            </div>
            {mesasConStats.length === 0 ? (
              <p className="text-[11px] text-surface-muted py-3 text-center">Sin mesas ocupadas</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {mesasConStats.map(mesa => {
                  const ecls = elapsedColor(mesa.elapsed, 90, 45);
                  return (
                    <div key={mesa.id} className="flex items-center gap-2 py-1 border-b border-surface-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-surface-text truncate">{mesa.nombre}</span>
                          {mesa.estado === "CUENTA" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">CUENTA</span>
                          )}
                        </div>
                        <p className="text-[10px] text-surface-muted">{mesa.items} ítems</p>
                      </div>
                      <span className="text-xs font-black text-surface-text tabular-nums shrink-0">
                        {formatCurrency(mesa.total, simbolo)}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${ecls}`}>
                        {fmtElapsed(mesa.elapsed)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget: Cuentas Pedidas */}
          <div className={`card p-3 ${mesasCuenta.length > 0 ? "border-red-200 bg-red-50/50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Receipt size={13} className={mesasCuenta.length > 0 ? "text-red-600" : "text-surface-muted"} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${mesasCuenta.length > 0 ? "text-red-700" : "text-surface-muted"}`}>
                  Cuentas Pedidas
                </span>
                {mesasCuenta.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <Link href="/mesas" className="text-[10px] text-brand-600 hover:underline font-semibold">Ir →</Link>
            </div>
            {mesasCuenta.length === 0 ? (
              <div className="flex items-center gap-2 py-3 justify-center">
                <CheckCircle2 size={16} className="text-surface-muted/40" />
                <p className="text-[11px] text-surface-muted">Sin cuentas pendientes</p>
              </div>
            ) : (
              <div className="space-y-1">
                {mesasCuenta.map(mesa => (
                  <div key={mesa.id} className="flex items-center gap-2 py-1 border-b border-red-100 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Receipt size={12} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-800 truncate">{mesa.nombre}</p>
                      <p className="text-[10px] text-red-600">{mesa.items} ítems · {fmtElapsed(mesa.elapsed)}</p>
                    </div>
                    <span className="text-sm font-black text-red-700 tabular-nums shrink-0">
                      {formatCurrency(mesa.total, simbolo)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget: Monitor de Atrasos */}
          <div className={`card p-3 ${pedidosAtrasados.length > 0 ? "border-amber-200 bg-amber-50/50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className={pedidosAtrasados.length > 0 ? "text-amber-600" : "text-surface-muted"} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${pedidosAtrasados.length > 0 ? "text-amber-700" : "text-surface-muted"}`}>
                  Atrasos &gt;15min
                </span>
                {pedidosAtrasados.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <Link href="/pedidos" className="text-[10px] text-brand-600 hover:underline font-semibold">KDS →</Link>
            </div>
            {pedidosAtrasados.length === 0 ? (
              <div className="flex items-center gap-2 py-3 justify-center">
                <CheckCircle2 size={16} className="text-surface-muted/40" />
                <p className="text-[11px] text-surface-muted">Sin atrasos</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {pedidosAtrasados.map(p => {
                  const min  = elapsedMin(p.creadoEn);
                  const isRed = min >= 30;
                  return (
                    <div key={p.id} className={`flex items-center gap-2 py-1 border-b last:border-0 ${isRed ? "border-red-100" : "border-amber-100"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-surface-text truncate">
                          #{p.numero} {p.mesa ? `· ${p.mesa.nombre}` : `· ${p.tipo}`}
                        </p>
                        <p className="text-[10px] text-surface-muted">
                          {p.detalles.reduce((s, d) => s + d.cantidad, 0)} ítems
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isRed ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {fmtElapsed(min)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget: Delivery en Ruta */}
          <div className={`card p-3 ${pedidosDelivery.length > 0 ? "border-blue-200 bg-blue-50/50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Bike size={13} className={pedidosDelivery.length > 0 ? "text-blue-600" : "text-surface-muted"} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${pedidosDelivery.length > 0 ? "text-blue-700" : "text-surface-muted"}`}>
                  Delivery Activo
                </span>
                {pedidosDelivery.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <Link href="/delivery" className="text-[10px] text-brand-600 hover:underline font-semibold">Ver →</Link>
            </div>
            {pedidosDelivery.length === 0 ? (
              <div className="flex items-center gap-2 py-3 justify-center">
                <Bike size={16} className="text-surface-muted/40" />
                <p className="text-[11px] text-surface-muted">Sin pedidos en ruta</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {pedidosDelivery.map(p => {
                  const min    = elapsedMin(p.creadoEn);
                  const valor  = p.detalles.reduce((s, d) => s + (Number(d.precio ?? 0) * d.cantidad), 0);
                  const isRed  = min >= 45;
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-1 border-b border-blue-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-surface-text truncate">
                          #{p.numero} · {p.delivery?.cliente.nombre ?? "Cliente"}
                        </p>
                        <p className="text-[10px] text-surface-muted truncate">
                          {p.delivery?.repartidor?.usuario.nombre ?? "Sin repartidor"}
                          {p.delivery?.zonaDelivery ? ` · ${p.delivery.zonaDelivery}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-surface-text tabular-nums">{formatCurrency(valor, simbolo)}</p>
                        <span className={`text-[10px] font-bold ${isRed ? "text-red-600" : "text-blue-600"}`}>
                          {fmtElapsed(min)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget: Stock Bajo */}
          <div className={`card p-3 ${totalStockBajo > 0 ? "border-orange-200 bg-orange-50/50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={13} className={totalStockBajo > 0 ? "text-orange-600" : "text-surface-muted"} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${totalStockBajo > 0 ? "text-orange-700" : "text-surface-muted"}`}>
                  Stock Bajo
                </span>
                {totalStockBajo > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-800">
                    {totalStockBajo}
                  </span>
                )}
              </div>
              <Link href="/productos" className="text-[10px] text-brand-600 hover:underline font-semibold">Productos →</Link>
            </div>
            {totalStockBajo === 0 ? (
              <div className="flex items-center gap-2 py-3 justify-center">
                <CheckCircle2 size={16} className="text-surface-muted/40" />
                <p className="text-[11px] text-surface-muted">Stock normal</p>
              </div>
            ) : (
              <div className="space-y-0.5 max-h-44 overflow-y-auto">
                {productosStockBajo.slice(0, 5).map(p => (
                  <div key={`p-${p.id}`} className="flex items-center gap-2 py-1 border-b border-orange-100 last:border-0">
                    <Box size={11} className="text-orange-500 shrink-0" />
                    <span className="flex-1 text-xs text-surface-text truncate">{p.nombre}</span>
                    <span className="text-[10px] font-bold text-orange-700 tabular-nums shrink-0">
                      {Number(p.stock)} / {Number(p.stockMinimo)}
                    </span>
                  </div>
                ))}
                {ingredientesStockBajo.slice(0, 4).map(i => (
                  <div key={`i-${i.id}`} className="flex items-center gap-2 py-1 border-b border-orange-100 last:border-0">
                    <Box size={11} className="text-amber-500 shrink-0" />
                    <span className="flex-1 text-xs text-surface-text truncate">{i.nombre}</span>
                    <span className="text-[10px] font-bold text-amber-700 tabular-nums shrink-0">
                      {Number(i.stock)}{i.unidad} / {Number(i.stockMinimo)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget: Top Compradores del Mes */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Star size={13} className="text-violet-600" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-violet-700">Top Compradores</span>
              </div>
              <Link href="/clientes?orden=puntos" className="text-[10px] text-brand-600 hover:underline font-semibold">Ver todos →</Link>
            </div>
            {topCompradores.length === 0 ? (
              <p className="text-[11px] text-surface-muted py-3 text-center">Sin datos este mes</p>
            ) : (
              <div className="space-y-1">
                {topCompradores.map((c, i) => (
                  <div key={c.clienteId} className="flex items-center gap-2 py-1 border-b border-surface-border/50 last:border-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" : "bg-surface-bg text-surface-muted"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-xs font-semibold text-surface-text truncate">{c.nombre}</span>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-surface-text tabular-nums">{formatCurrency(c.total, simbolo)}</p>
                      <p className="text-[9px] text-surface-muted">{c.count} compras</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── GRÁFICO + ÚLTIMAS VENTAS ──────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5 mb-2">Actividad Reciente</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Gráfico */}
          <div className="card p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-surface-text text-sm">Ventas — Últimos 7 días</h2>
                <p className="text-xs text-surface-muted mt-0.5">Ingresos totales por día</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl font-semibold border border-brand-100">
                <TrendingUp size={12} /> Esta semana
              </span>
            </div>
            <SalesChart data={ventasChart} simbolo={simbolo} />
          </div>

          {/* Últimas ventas */}
          <div className="card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-surface-text text-sm">Últimas Ventas</h2>
              <Link href="/ventas" className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1">
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
              <div className="space-y-0.5 flex-1">
                {ultimasVentas.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-surface-border/60 last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-surface-text truncate">
                        {v.cliente?.nombre ?? "Consumidor Final"}
                      </p>
                      <p className="text-[10px] text-surface-muted">{formatDateTime(v.creadoEn)}</p>
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

      {/* ── MÓDULOS (compactos) ───────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5 mb-2">Módulos del Sistema</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {[
            { href: "/mesas",          icon: UtensilsCrossed, label: "Mesas",     bg: "bg-red-500"     },
            { href: "/ventas/caja",    icon: ShoppingCart,    label: "Caja",      bg: "bg-brand-600"   },
            { href: "/pedidos",        icon: Monitor,         label: "KDS",       bg: "bg-amber-500"   },
            { href: "/productos",      icon: Package,         label: "Productos", bg: "bg-blue-500"    },
            { href: "/fotos",          icon: Camera,          label: "Fotos",     bg: "bg-violet-500"  },
            { href: `/registro/${slug}`, icon: Cake,          label: "Cumpleaños",bg: "bg-pink-500"    },
          ].map(({ href, icon: Icon, label, bg }) => (
            <Link
              key={href}
              href={href}
              className="card p-2.5 flex flex-col items-center gap-1.5 hover:shadow-md transition group"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${bg} group-hover:scale-105 transition-transform`}>
                <Icon size={16} />
              </div>
              <p className="text-[10px] font-bold text-surface-text text-center leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
