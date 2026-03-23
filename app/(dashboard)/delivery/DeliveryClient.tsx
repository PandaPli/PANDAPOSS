"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bike, CheckCircle2, ChevronDown, ChevronUp, Clock3, MapPin, Package2,
  Phone, Plus, RefreshCw, Route, ShoppingBag, UserRound, Wallet, Bell, X,
  Flame, ChefHat, Truck, LayoutList, TrendingUp, Timer, Star, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import type { EstadoPedido } from "@/types";
import { IngresoManualForm } from "@/components/delivery/IngresoManualForm";

interface PedidoDetalle { id: number; cantidad: number; nombre: string; precio: number; }

interface PedidoDelivery {
  id: number;
  estado: EstadoPedido;
  trackingStage: "CONFIRMADO" | "PREPARANDO" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";
  clienteNombre: string;
  telefonoCliente: string | null;
  direccionEntrega: string | null;
  referencia: string | null;
  departamento: string | null;
  metodoPago: string;
  cargoEnvio: number;
  subtotal: number;
  total: number;
  repartidorId: number | null;
  creadoEn: string;
  repartidor: { nombre: string } | null;
  detalles: PedidoDetalle[];
}

interface Repartidor {
  id: number;
  nombre: string;
  usuario: string;
  sucursalNombre: string;
  activos: number;
  estado: "DISPONIBLE" | "EN_REPARTO";
  pedidos: { id: number; estado: string; direccionEntrega: string | null }[];
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string | null;
  codigo?: string | null;
  categoria?: { nombre: string };
}

interface ZonaDelivery { id: number; nombre: string; precio: number }

interface Props {
  pedidos: PedidoDelivery[];
  repartidores: Repartidor[];
  rol: string;
  productos: Producto[];
  sucursalId: number | null;
  simbolo: string;
  zonasDelivery: ZonaDelivery[];
  logoUrl: string | null;
  sucursalNombre: string;
  stats: {
    pedidosHoy: number;
    enCamino: number;
    tiempoPromedio: number;
    ventasDelivery: number;
    activos: number;
    entregados: number;
  };
}

type FilterKey = "todos" | "pendiente" | "en_proceso" | "listo";

const STAGE_STYLE = {
  PENDIENTE:  { border: "border-l-amber-400",   dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-800",   headerBg: "bg-amber-50/60"  },
  EN_PROCESO: { border: "border-l-blue-400",    dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-800",     headerBg: "bg-blue-50/60"   },
  LISTO:      { border: "border-l-violet-500",  dot: "bg-violet-500",  badge: "bg-violet-100 text-violet-800", headerBg: "bg-violet-50/60" },
  ENTREGADO:  { border: "border-l-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800", headerBg: "bg-emerald-50/60" },
  CANCELADO:  { border: "border-l-rose-400",    dot: "bg-rose-400",    badge: "bg-rose-100 text-rose-800",     headerBg: "bg-rose-50/60"   },
} as const;

export function DeliveryClient({ pedidos: initialPedidos, repartidores, rol, productos, sucursalId, simbolo, zonasDelivery, logoUrl, sucursalNombre, stats }: Props) {
  const [pedidos, setPedidos]                   = useState(initialPedidos);
  const [activeFilter, setActiveFilter]         = useState<FilterKey>("todos");
  const [showIngreso, setShowIngreso]           = useState(false);
  const [showFinalizados, setShowFinalizados]   = useState(false);
  const [showRepartidores, setShowRepartidores] = useState(false);
  const [loadingPedidoId, setLoadingPedidoId]   = useState<number | null>(null);
  const [newOrderAlert, setNewOrderAlert]       = useState<PedidoDelivery | null>(null);
  const knownIdsRef = useRef(new Set(initialPedidos.map((p) => p.id)));

  const isAdmin = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol);

  const activos    = pedidos.filter((p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO");
  const entregados = pedidos.filter((p) => p.estado === "ENTREGADO");

  const counts: Record<FilterKey, number> = {
    todos:      activos.length,
    pendiente:  activos.filter((p) => p.estado === "PENDIENTE").length,
    en_proceso: activos.filter((p) => p.estado === "EN_PROCESO").length,
    listo:      activos.filter((p) => p.estado === "LISTO").length,
  };

  const filteredActivos =
    activeFilter === "todos"      ? activos :
    activeFilter === "pendiente"  ? activos.filter((p) => p.estado === "PENDIENTE") :
    activeFilter === "en_proceso" ? activos.filter((p) => p.estado === "EN_PROCESO") :
                                    activos.filter((p) => p.estado === "LISTO");

  /* ── Polling ── */
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/orders");
      if (!res.ok) return;
      const data = await res.json();
      const fresh: PedidoDelivery[] = data.pedidos ?? data;
      const incoming = fresh.filter((p) => !knownIdsRef.current.has(p.id) && p.estado !== "ENTREGADO" && p.estado !== "CANCELADO");
      if (incoming.length > 0) {
        setNewOrderAlert(incoming[0]);
        incoming.forEach((p) => knownIdsRef.current.add(p.id));
        setPedidos(fresh);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, 20_000);
    return () => clearInterval(id);
  }, [poll]);

  async function assignDriver(pedidoId: number, repartidorId: string) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/assign", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, repartidorId: repartidorId ? Number(repartidorId) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos((cur) => cur.map((p) => p.id === pedidoId ? {
        ...p,
        repartidorId: data.repartidorId,
        repartidor: data.repartidor,
        trackingStage: data.repartidorId && p.estado === "LISTO" ? "EN_CAMINO" : p.trackingStage,
      } : p));
    } finally { setLoadingPedidoId(null); }
  }

  async function updateStatus(pedidoId: number, estado: EstadoPedido) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos((cur) => cur.map((p) => {
        if (p.id !== pedidoId) return p;
        const trackingStage =
          data.estado === "ENTREGADO" ? "ENTREGADO" :
          data.estado === "LISTO" && p.repartidorId ? "EN_CAMINO" :
          data.estado === "LISTO" || data.estado === "EN_PROCESO" ? "PREPARANDO" :
          data.estado === "CANCELADO" ? "CANCELADO" : "CONFIRMADO";
        return { ...p, estado: data.estado, trackingStage };
      }));
    } finally { setLoadingPedidoId(null); }
  }

  function renderPedidoCard(pedido: PedidoDelivery) {
    const loading = loadingPedidoId === pedido.id;
    const style = STAGE_STYLE[pedido.estado as keyof typeof STAGE_STYLE] ?? STAGE_STYLE.PENDIENTE;
    const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    return (
      <article key={pedido.id} className={cn(
        "relative overflow-hidden rounded-2xl border border-surface-border/80 bg-white shadow-sm border-l-[5px] flex flex-col",
        style.border
      )}>

        {/* ── Header ── */}
        <div className={cn("flex items-center justify-between gap-3 px-5 py-3.5 border-b border-surface-border/50", style.headerBg)}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", style.dot)} />
            <span className="font-mono text-sm font-black text-surface-muted shrink-0">#{pedido.id}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shrink-0", style.badge)}>
              {pedido.estado.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs text-surface-muted">{hora}</span>
            <span className="text-lg font-black text-surface-text">{formatCurrency(pedido.total)}</span>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex flex-col flex-1 p-5 gap-4">

          {/* Cliente + stage */}
          <div>
            <p className="text-xl font-black text-surface-text leading-tight">{pedido.clienteNombre}</p>
            <p className="text-sm text-surface-muted mt-0.5">{getDeliveryStageLabel(pedido.trackingStage)}</p>
          </div>

          {/* Dirección */}
          <div className="flex items-start gap-2.5 rounded-xl bg-surface-bg px-4 py-3">
            <MapPin size={15} className="mt-0.5 shrink-0 text-brand-400" />
            <p className="text-sm text-surface-muted leading-snug">
              {pedido.direccionEntrega ?? "Sin dirección"}
              {pedido.referencia ? <span className="text-surface-muted/60"> · {pedido.referencia}</span> : null}
            </p>
          </div>

          {/* Pago + repartidor */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface-bg px-4 py-3">
              <Wallet size={14} className="shrink-0 text-brand-400" />
              <span className="text-sm font-semibold text-surface-text truncate">{pedido.metodoPago}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-bg px-4 py-3">
              <Bike size={14} className="shrink-0 text-brand-400" />
              <span className={cn("text-sm truncate", pedido.repartidor ? "font-semibold text-surface-text" : "italic text-surface-muted/60")}>
                {pedido.repartidor?.nombre ?? "Sin repartidor"}
              </span>
            </div>
          </div>

          {/* Productos */}
          {pedido.detalles.length > 0 && (
            <div className="rounded-xl border border-surface-border/60 divide-y divide-surface-border/40">
              {pedido.detalles.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-7 shrink-0 text-center text-sm font-black text-surface-text tabular-nums">{d.cantidad}×</span>
                  <span className="text-sm text-surface-muted flex-1">{d.nombre}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Acciones touch-friendly ── */}
          {(isAdmin || rol === "DELIVERY") && pedido.estado !== "ENTREGADO" && (
            <div className="flex flex-col gap-3 pt-1">

              {/* Selector de repartidor — grande y táctil */}
              {isAdmin && (
                <select
                  value={pedido.repartidorId ?? ""}
                  onChange={(e) => void assignDriver(pedido.id, e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-surface-border bg-surface-bg px-4 text-sm font-semibold text-surface-text h-12 appearance-none cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="">Sin repartidor asignado</option>
                  {repartidores.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} · {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                    </option>
                  ))}
                </select>
              )}

              {/* Botón de acción — full width, alto, táctil */}
              {pedido.estado === "PENDIENTE" && (
                <button
                  onClick={() => void updateStatus(pedido.id, "EN_PROCESO")}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <ChefHat size={18} />}
                  Pasar a cocina
                  {!loading && <ArrowRight size={16} className="ml-auto opacity-60" />}
                </button>
              )}
              {pedido.estado === "EN_PROCESO" && (
                <button
                  onClick={() => void updateStatus(pedido.id, "LISTO")}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Marcar listo
                  {!loading && <ArrowRight size={16} className="ml-auto opacity-60" />}
                </button>
              )}
              {pedido.estado === "LISTO" && pedido.repartidorId && (
                <button
                  onClick={() => void updateStatus(pedido.id, "ENTREGADO")}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Route size={18} />}
                  Confirmar entrega
                  {!loading && <ArrowRight size={16} className="ml-auto opacity-60" />}
                </button>
              )}
              {pedido.estado === "LISTO" && !pedido.repartidorId && (
                <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5">
                  <Bike size={16} className="shrink-0 text-violet-500" />
                  <p className="text-sm font-semibold text-violet-700">Asigna un repartidor para despachar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Alerta nuevo pedido ── */}
      {newOrderAlert && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-4 rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-2xl max-w-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white animate-pulse">
            <Bell size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-surface-text">🔔 Nuevo pedido #{newOrderAlert.id}</p>
            <p className="text-sm text-surface-muted truncate">{newOrderAlert.clienteNombre} · {formatCurrency(newOrderAlert.total)}</p>
          </div>
          <button onClick={() => setNewOrderAlert(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-surface-muted hover:bg-surface-bg transition">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        {[
          { label: "Hoy",         value: stats.pedidosHoy,                    icon: Star,        color: "text-brand-500",   bg: "bg-brand-50"   },
          { label: "Activos",     value: stats.activos,                        icon: Flame,       color: "text-amber-500",   bg: "bg-amber-50"   },
          { label: "En camino",   value: stats.enCamino,                       icon: Truck,       color: "text-violet-500",  bg: "bg-violet-50"  },
          { label: "Tiempo prom", value: `${stats.tiempoPromedio} min`,        icon: Timer,       color: "text-blue-500",    bg: "bg-blue-50"    },
          { label: "Entregados",  value: stats.entregados,                     icon: CheckCircle2,color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Ventas",      value: formatCurrency(stats.ventasDelivery), icon: TrendingUp,  color: "text-rose-500",    bg: "bg-rose-50"    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-white px-4 py-3.5 shadow-sm">
            <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-xl", bg)}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-2xl font-black text-surface-text leading-none">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-surface-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar: filtros + ingreso manual ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtros — grandes para touch */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: "todos",      label: "Todos",     icon: LayoutList, activeClass: "bg-slate-800 text-white shadow-md",       inactiveClass: "bg-white border border-surface-border text-surface-muted hover:bg-surface-bg" },
            { key: "pendiente",  label: "Entrando",  icon: Flame,      activeClass: "bg-amber-500 text-white shadow-md",       inactiveClass: "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"  },
            { key: "en_proceso", label: "En Cocina", icon: ChefHat,    activeClass: "bg-blue-600 text-white shadow-md",        inactiveClass: "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"   },
            { key: "listo",      label: "En Ruta",   icon: Truck,      activeClass: "bg-violet-600 text-white shadow-md",      inactiveClass: "bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100" },
          ] as const).map(({ key, label, icon: Icon, activeClass, inactiveClass }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 h-11 text-sm font-bold transition-all active:scale-95",
                activeFilter === key ? activeClass : inactiveClass
              )}
            >
              <Icon size={15} />
              {label}
              <span className={cn(
                "min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-black tabular-nums",
                activeFilter === key ? "bg-white/25 text-current" : "bg-black/8"
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Ingreso manual — grande y visible */}
        <button
          onClick={() => setShowIngreso((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl h-11 px-5 text-sm font-bold text-white transition-all active:scale-95 shadow",
            showIngreso ? "bg-brand-800" : "bg-brand-600 hover:bg-brand-700"
          )}
        >
          <Plus size={18} />
          Ingreso Manual
        </button>
      </div>

      {/* ── Ingreso Manual ── */}
      {showIngreso && (
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold text-surface-text">Nuevo pedido manual</p>
            <button onClick={() => setShowIngreso(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-surface-muted hover:bg-surface-bg transition">
              <X size={18} />
            </button>
          </div>
          <IngresoManualForm
            productos={productos}
            sucursalId={sucursalId}
            simbolo={simbolo}
            zonasDelivery={zonasDelivery}
            onOrderCreated={(pedido) => {
              const nuevo: PedidoDelivery = {
                id: pedido.id, estado: "PENDIENTE", trackingStage: "CONFIRMADO",
                clienteNombre: pedido.clienteNombre, telefonoCliente: null,
                direccionEntrega: null, referencia: null, departamento: null,
                metodoPago: "EFECTIVO", cargoEnvio: 0, subtotal: 0, total: 0,
                repartidorId: null, creadoEn: new Date().toISOString(), repartidor: null, detalles: [],
              };
              knownIdsRef.current.add(pedido.id);
              setPedidos((prev) => [nuevo, ...prev]);
              setShowIngreso(false);
            }}
          />
        </div>
      )}

      {/* ── Pedidos activos ── */}
      {filteredActivos.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredActivos.map((pedido) => renderPedidoCard(pedido))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white p-14 text-center">
          <Bike size={32} className="mx-auto mb-3 text-surface-muted/40" />
          <p className="text-sm font-semibold text-surface-muted">No hay pedidos {activeFilter !== "todos" ? "en este estado" : "activos"} en este momento.</p>
        </div>
      )}

      {/* ── Repartidores (colapsible) ── */}
      {repartidores.length > 0 && (
        <div>
          <button
            onClick={() => setShowRepartidores((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-surface-border bg-white px-5 py-4 text-sm font-bold text-surface-text shadow-sm hover:bg-surface-bg transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5">
              <Bike size={16} className="text-brand-500" />
              Repartidores
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-black text-brand-700">{repartidores.length}</span>
            </span>
            {showRepartidores ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showRepartidores && (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {repartidores.map((r) => (
                <article key={r.id} className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-surface-text">{r.nombre}</p>
                      <p className="text-xs text-surface-muted mt-0.5">@{r.usuario}</p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
                      r.estado === "EN_REPARTO" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    )}>
                      {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-surface-muted">
                    <span className="flex items-center gap-1.5"><UserRound size={12} className="text-brand-400" />{r.sucursalNombre}</span>
                    <span className="flex items-center gap-1.5"><ShoppingBag size={12} className="text-brand-400" />{r.activos} activos</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Finalizados ── */}
      <div>
        <button
          onClick={() => setShowFinalizados((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-sm font-bold transition active:scale-[0.99]",
            showFinalizados
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-surface-border bg-white text-surface-text shadow-sm hover:bg-surface-bg"
          )}
        >
          <span className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Delivery Finalizados
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">{entregados.length}</span>
          </span>
          {showFinalizados ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFinalizados && (
          <div className="mt-3 space-y-2">
            {entregados.length > 0 ? entregados.map((pedido) => (
              <article key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="font-bold text-surface-text">#{pedido.id} · {pedido.clienteNombre}</p>
                  <p className="mt-0.5 text-xs text-surface-muted">
                    {pedido.direccionEntrega ?? "Sin dirección"}
                    {pedido.repartidor?.nombre ? ` · ${pedido.repartidor.nombre}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700">Entregado</span>
                  <span className="text-base font-black text-surface-text">{formatCurrency(pedido.total)}</span>
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center text-sm text-surface-muted">
                Todavía no hay pedidos entregados.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
