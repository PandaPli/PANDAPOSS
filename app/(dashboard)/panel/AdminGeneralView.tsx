import { prisma } from "@/lib/db";
import { subDays, subMinutes, startOfDay, endOfDay, format } from "date-fns";
import { MultiSalesChart } from "@/components/dashboard/MultiSalesChart";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Building2, TrendingUp, Users, Wallet,
  Star, Gift, CheckCircle2, Clock, AlertTriangle,
  ShoppingBag, Store, UtensilsCrossed, Bike,
  Package, Trophy, AlertCircle,
} from "lucide-react";
import { SucursalRow } from "./SucursalRow";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS" | "SOCIO";

// ── Helpers ────────────────────────────────────────────────────────────────
function elapsedMin(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / 60_000);
}
function fmtElapsed(min: number) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

// ── Data ───────────────────────────────────────────────────────────────────
async function getAdminData() {
  const ahora     = new Date();
  const hoy       = startOfDay(ahora);
  const hoyFin    = endOfDay(ahora);
  const mesInicio = startOfDay(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
  const hace15min = subMinutes(ahora, 15);

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

  // Todas las queries en paralelo ─────────────────────────────────────────
  const [
    ventasHoyArr, ventasMesArr, pedidosActivosArr, cajasAbiertasArr,
    mesasActivas, pedidosAtrasos, deliveryActivo,
    productosInv, ingredientesInv,
    topVentasRaw,
  ] = await Promise.all([

    // Ventas hoy por sucursal
    Promise.all(sucursales.map(s =>
      prisma.venta.aggregate({
        _sum: { total: true }, _count: { id: true },
        where: { caja: { sucursalId: s.id }, creadoEn: { gte: hoy, lte: hoyFin }, estado: "PAGADA" },
      }).then(r => ({ id: s.id, total: Number(r._sum.total ?? 0), count: r._count.id }))
    )),

    // Ventas mes por sucursal
    Promise.all(sucursales.map(s =>
      prisma.venta.aggregate({
        _sum: { total: true },
        where: { caja: { sucursalId: s.id }, creadoEn: { gte: mesInicio, lte: hoyFin }, estado: "PAGADA" },
      }).then(r => ({ id: s.id, total: Number(r._sum.total ?? 0) }))
    )),

    // Pedidos activos por sucursal
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

    // Cajas abiertas por sucursal
    Promise.all(sucursales.map(s =>
      prisma.caja.count({ where: { sucursalId: s.id, estado: "ABIERTA" } })
        .then(count => ({ id: s.id, open: count }))
    )),

    // Mesas OCUPADA / CUENTA con sus pedidos activos
    prisma.mesa.findMany({
      where: { estado: { in: ["OCUPADA", "CUENTA"] } },
      select: {
        id: true, nombre: true, estado: true,
        sala: {
          select: {
            nombre: true,
            sucursal: { select: { nombre: true, logoUrl: true } },
          },
        },
        pedidos: {
          where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
          select: {
            id: true, creadoEn: true,
            detalles: {
              where: { cancelado: false },
              select: { cantidad: true, precio: true },
            },
          },
          orderBy: { creadoEn: "asc" },
        },
      },
    }),

    // Pedidos no-delivery con atraso > 15 min
    prisma.pedido.findMany({
      where: {
        estado: "PENDIENTE",
        tipo: { not: "DELIVERY" },
        creadoEn: { lt: hace15min },
      },
      select: {
        id: true, tipo: true, creadoEn: true,
        mesa: { select: { nombre: true } },
        usuario: {
          select: { nombre: true, sucursal: { select: { nombre: true } } },
        },
        detalles: { where: { cancelado: false }, select: { cantidad: true } },
      },
      orderBy: { creadoEn: "asc" },
      take: 8,
    }),

    // Delivery activos
    prisma.pedido.findMany({
      where: {
        tipo: "DELIVERY",
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      },
      select: {
        id: true, estado: true, creadoEn: true, repartidorId: true,
        repartidor: { select: { nombre: true } },
        delivery: {
          select: {
            zonaDelivery: true,
            cliente: { select: { nombre: true } },
          },
        },
        usuario: { select: { sucursal: { select: { nombre: true } } } },
      },
      orderBy: { creadoEn: "asc" },
      take: 8,
    }),

    // Productos inventariables con stock crítico
    prisma.producto.findMany({
      where: { inventariable: true, activo: true, stockMinimo: { gt: 0 } },
      select: {
        nombre: true, stock: true, stockMinimo: true,
        sucursal: { select: { nombre: true } },
      },
    }),

    // Ingredientes con stock crítico
    prisma.ingrediente.findMany({
      where: { activo: true, stockMinimo: { gt: 0 } },
      select: {
        nombre: true, stock: true, stockMinimo: true, unidad: true,
        sucursal: { select: { nombre: true } },
      },
    }),

    // Top compradores (groupBy total ventas por cliente)
    prisma.venta.groupBy({
      by: ["clienteId"],
      where: { estado: "PAGADA", clienteId: { not: null } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 6,
    }),
  ]);

  // Maps por sucursal
  const ventasHoyMap      = Object.fromEntries(ventasHoyArr.map(v => [v.id, { total: v.total, count: v.count }]));
  const ventasMesMap      = Object.fromEntries(ventasMesArr.map(v => [v.id, v.total]));
  const pedidosActivosMap = Object.fromEntries(pedidosActivosArr.map(v => [v.id, v.count]));
  const cajasAbiertasMap  = Object.fromEntries(cajasAbiertasArr.map(v => [v.id, v.open]));

  // Totales globales
  const ventasHoyGlobal        = ventasHoyArr.reduce((s, v) => s + v.total, 0);
  const ventasMesGlobal        = ventasMesArr.reduce((s, v) => s + v.total, 0);
  const totalPedidosActivos    = pedidosActivosArr.reduce((s, v) => s + v.count, 0);
  const totalSucursalesConCaja = cajasAbiertasArr.filter(v => v.open > 0).length;
  const totalClientes          = sucursales.reduce((s, suc) => s + suc._count.clientes, 0);
  const totalTxHoy             = ventasHoyArr.reduce((s, v) => s + v.count, 0);

  // Stock bajo (filtro en JS: stock <= stockMinimo)
  const stockBajo = [
    ...productosInv
      .filter(p => Number(p.stock) <= Number(p.stockMinimo))
      .map(p => ({ nombre: p.nombre, stock: Number(p.stock), min: Number(p.stockMinimo), unidad: "und", suc: p.sucursal?.nombre ?? "—" })),
    ...ingredientesInv
      .filter(i => Number(i.stock) <= Number(i.stockMinimo))
      .map(i => ({ nombre: i.nombre, stock: Number(i.stock), min: Number(i.stockMinimo), unidad: i.unidad, suc: i.sucursal?.nombre ?? "—" })),
  ].sort((a, b) => a.stock - b.stock).slice(0, 8);

  // Cuentas pedidas = mesas con estado CUENTA
  const cuentasPedidas = mesasActivas.filter(m => m.estado === "CUENTA");

  // Distribución de pagos
  const pagoCount: Partial<Record<EstadoPago, number>> = {};
  for (const s of sucursales) {
    const ep = s.estadoPago as EstadoPago;
    pagoCount[ep] = (pagoCount[ep] ?? 0) + 1;
  }

  // Top clientes — buscar detalles
  const clienteIds = topVentasRaw.filter(v => v.clienteId != null).map(v => v.clienteId!);
  const clientesRaw = await prisma.cliente.findMany({
    where: { id: { in: clienteIds } },
    select: { id: true, nombre: true, puntos: true, sucursal: { select: { nombre: true } } },
  });
  const clientesMap = Object.fromEntries(clientesRaw.map(c => [c.id, c]));
  const topClientes = topVentasRaw
    .filter(v => v.clienteId && clientesMap[v.clienteId])
    .map(v => ({
      cliente: clientesMap[v.clienteId!],
      total:   Number(v._sum.total ?? 0),
      txCount: v._count.id,
    }));

  // Gráfico 7 días multi-sucursal
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
    sucursales, mesasActivas, cuentasPedidas, pedidosAtrasos, deliveryActivo,
    stockBajo, topClientes, ventasHoyGlobal, ventasMesGlobal, totalPedidosActivos,
    totalSucursalesConCaja, totalClientes, totalTxHoy, pagoCount,
    ventasHoyMap, ventasMesMap, pedidosActivosMap, cajasAbiertasMap,
    chartData, series, ahora,
  };
}

// ── Widget wrapper ─────────────────────────────────────────────────────────
function Widget({
  title, icon: Icon, iconColor = "text-surface-muted", count, badge, href, empty, children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  count?: number;
  badge?: string;
  href?: string;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 flex flex-col gap-0 min-h-[160px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={iconColor} />
          <h3 className="text-[10px] font-bold text-surface-muted uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5 leading-none">
              {count}
            </span>
          )}
          {badge && <span className="text-[10px] text-surface-muted">{badge}</span>}
          {href && (
            <Link href={href} className="text-[10px] text-brand-600 hover:underline font-semibold">
              Ver →
            </Link>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-full py-4 text-xs text-surface-muted">
      {msg}
    </div>
  );
}

// ── Configuración de pago ──────────────────────────────────────────────────
const PAGO_DISPLAY: Record<EstadoPago, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SOCIO:     { label: "Socio",     color: "text-violet-700",  bg: "bg-violet-100",  icon: <Star size={10} /> },
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle2 size={10} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-100",    icon: <Gift size={10} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-100",   icon: <Clock size={10} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-100",     icon: <AlertTriangle size={10} /> },
};

// ── Componente principal ───────────────────────────────────────────────────
export async function AdminGeneralView() {
  const data = await getAdminData();
  const {
    sucursales, mesasActivas, cuentasPedidas, pedidosAtrasos, deliveryActivo,
    stockBajo, topClientes, ventasHoyGlobal, ventasMesGlobal, totalPedidosActivos,
    totalSucursalesConCaja, totalClientes, totalTxHoy, pagoCount,
    ventasHoyMap, ventasMesMap, pedidosActivosMap, cajasAbiertasMap,
    chartData, series, ahora,
  } = data;

  const mesLabel = new Intl.DateTimeFormat("es-CL", { month: "long" }).format(ahora);
  const ahoraStr = format(ahora, "HH:mm");

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
              {" · "}Actualizado a las {ahoraStr}
            </p>
          </div>
        </div>
        <span className="hidden sm:block text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          Control General
        </span>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Ventas hoy */}
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

        {/* Ventas mes */}
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

        {/* Pedidos activos */}
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

        {/* Sucursales activas */}
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

        {/* Total clientes */}
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

      {/* ── WIDGETS OPERACIONALES ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Widget 1 — Mesas activas */}
        <Widget
          title="Mesas Activas"
          icon={UtensilsCrossed}
          iconColor="text-emerald-600"
          count={mesasActivas.length}
          href="/mesas"
        >
          {mesasActivas.length === 0 ? (
            <EmptyState msg="Sin mesas ocupadas" />
          ) : (
            <div className="space-y-0 divide-y divide-surface-border/60">
              {mesasActivas.map(m => {
                const totalItems = m.pedidos.reduce((s, p) =>
                  s + p.detalles.reduce((ss, d) => ss + d.cantidad, 0), 0);
                const totalValor = m.pedidos.reduce((s, p) =>
                  s + p.detalles.reduce((ss, d) => ss + Number(d.precio ?? 0) * d.cantidad, 0), 0);
                const oldest = m.pedidos[0];
                const min = oldest ? elapsedMin(new Date(oldest.creadoEn)) : 0;
                const isCuenta = m.estado === "CUENTA";

                return (
                  <div key={m.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isCuenta ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className={`font-bold ${isCuenta ? "text-amber-700" : "text-surface-text"} min-w-[56px]`}>
                      {m.nombre}
                    </span>
                    <span className="text-surface-muted truncate flex-1">{m.sala.sucursal.nombre}</span>
                    <span className="text-surface-muted tabular-nums">{totalItems} items</span>
                    <span className="font-black text-surface-text tabular-nums min-w-[60px] text-right">
                      {formatCurrency(totalValor, "$")}
                    </span>
                    <span className={`font-bold tabular-nums min-w-[32px] text-right ${
                      min > 60 ? "text-red-600" : min > 30 ? "text-amber-600" : "text-surface-muted"
                    }`}>
                      {fmtElapsed(min)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Widget 2 — Cuentas pedidas */}
        <Widget
          title="Cuentas Pedidas"
          icon={AlertCircle}
          iconColor={cuentasPedidas.length > 0 ? "text-amber-500" : "text-surface-muted"}
          count={cuentasPedidas.length}
          href="/mesas"
        >
          {cuentasPedidas.length === 0 ? (
            <EmptyState msg="Sin cuentas pendientes ✓" />
          ) : (
            <div className="space-y-0 divide-y divide-surface-border/60">
              {cuentasPedidas.map(m => {
                const totalValor = m.pedidos.reduce((s, p) =>
                  s + p.detalles.reduce((ss, d) => ss + Number(d.precio ?? 0) * d.cantidad, 0), 0);
                const oldest = m.pedidos[0];
                const min = oldest ? elapsedMin(new Date(oldest.creadoEn)) : 0;

                return (
                  <div key={m.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="font-bold text-amber-700">{m.nombre}</span>
                    <span className="text-surface-muted truncate flex-1">{m.sala.sucursal.nombre}</span>
                    <span className="font-black text-surface-text tabular-nums">
                      {formatCurrency(totalValor, "$")}
                    </span>
                    <span className="text-amber-600 font-bold tabular-nums">
                      {fmtElapsed(min)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Widget 3 — Delivery en ruta */}
        <Widget
          title="Delivery en Ruta"
          icon={Bike}
          iconColor="text-blue-600"
          count={deliveryActivo.length}
          href="/delivery"
        >
          {deliveryActivo.length === 0 ? (
            <EmptyState msg="Sin delivery activo" />
          ) : (
            <div className="space-y-0 divide-y divide-surface-border/60">
              {deliveryActivo.map(p => {
                const min = elapsedMin(new Date(p.creadoEn));
                const estadoBadge: Record<string, string> = {
                  PENDIENTE:  "bg-amber-100 text-amber-700",
                  EN_PROCESO: "bg-blue-100 text-blue-700",
                  LISTO:      "bg-emerald-100 text-emerald-700",
                };
                return (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shrink-0 ${estadoBadge[p.estado] ?? "bg-surface-bg text-surface-muted"}`}>
                      #{p.id}
                    </span>
                    <span className="font-semibold text-surface-text truncate flex-1 min-w-0">
                      {p.delivery?.cliente?.nombre ?? "Cliente"}
                    </span>
                    <span className="text-surface-muted truncate hidden sm:block max-w-[80px]">
                      {p.delivery?.zonaDelivery ?? "Sin zona"}
                    </span>
                    {p.repartidor ? (
                      <span className="text-emerald-600 font-bold shrink-0">
                        {p.repartidor.nombre.split(" ")[0]}
                      </span>
                    ) : (
                      <span className="text-amber-500 font-semibold shrink-0 text-[10px]">Sin repartidor</span>
                    )}
                    <span className={`tabular-nums font-bold shrink-0 ${min > 45 ? "text-red-600" : "text-surface-muted"}`}>
                      {fmtElapsed(min)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Widget 4 — Monitor de atrasos */}
        <Widget
          title={`Atrasos · ${ahoraStr}`}
          icon={Clock}
          iconColor={pedidosAtrasos.length > 0 ? "text-red-500" : "text-surface-muted"}
          count={pedidosAtrasos.length}
          badge="> 15 min"
          href="/pedidos"
        >
          {pedidosAtrasos.length === 0 ? (
            <EmptyState msg="Todos al día ✓" />
          ) : (
            <div className="space-y-0 divide-y divide-surface-border/60">
              {pedidosAtrasos.map(p => {
                const min = elapsedMin(new Date(p.creadoEn));
                const totalItems = p.detalles.reduce((s, d) => s + d.cantidad, 0);
                return (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <Clock size={11} className="text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-surface-text">
                        {p.mesa ? p.mesa.nombre : p.tipo}
                      </span>
                      <span className="text-surface-muted ml-1">
                        · {p.usuario?.sucursal?.nombre ?? "—"} · {totalItems} items
                      </span>
                    </div>
                    <span className={`font-black tabular-nums shrink-0 ${min > 30 ? "text-red-600" : "text-amber-600"}`}>
                      {fmtElapsed(min)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Widget 5 — Stock bajo */}
        <Widget
          title="Stock Bajo"
          icon={Package}
          iconColor={stockBajo.length > 0 ? "text-orange-500" : "text-surface-muted"}
          count={stockBajo.length}
          href="/productos"
        >
          {stockBajo.length === 0 ? (
            <EmptyState msg="Stock en orden ✓" />
          ) : (
            <div className="space-y-0 divide-y divide-surface-border/60">
              {stockBajo.map((item, i) => {
                const agotado = item.stock === 0;
                return (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${agotado ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-surface-text truncate block">{item.nombre}</span>
                      <span className="text-surface-muted text-[10px]">{item.suc}</span>
                    </div>
                    <span className={`font-black tabular-nums shrink-0 ${agotado ? "text-red-600" : "text-amber-600"}`}>
                      {item.stock}
                      <span className="font-normal text-surface-muted">/{item.min} {item.unidad}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Widget 6 — Top compradores */}
        <Widget
          title="Top Compradores"
          icon={Trophy}
          iconColor="text-amber-500"
          href="/clientes"
        >
          {topClientes.length === 0 ? (
            <EmptyState msg="Sin datos de compras" />
          ) : (
            <div className="space-y-0 divide-y divide-surface-border/60">
              {topClientes.map((tc, i) => (
                <div key={tc.cliente.id} className="flex items-center gap-2 py-1.5 text-xs">
                  <span className={`w-5 text-center font-black text-sm shrink-0 ${
                    i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700/70" : "text-surface-muted"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-surface-text truncate block">
                      {tc.cliente.nombre}
                    </span>
                    <span className="text-surface-muted text-[10px]">
                      {tc.cliente.sucursal?.nombre ?? "—"} · {tc.txCount} compras
                    </span>
                  </div>
                  <span className="font-black text-brand-600 tabular-nums shrink-0">
                    {formatCurrency(tc.total, "$")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Widget>

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
              <span
                key={key}
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
              >
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
