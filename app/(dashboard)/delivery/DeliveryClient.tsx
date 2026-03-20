"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bike, CheckCircle2, ChevronDown, ChevronUp, Clock3, MapPin, Package2,
  Phone, Plus, RefreshCw, Route, ShoppingBag, UserRound, Wallet, Bell, X,
  Flame, ChefHat, Truck, LayoutList,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import type { EstadoPedido } from "@/types";
import { IngresoManualForm } from "@/components/delivery/IngresoManualForm";

interface PedidoDetalle { id: number; cantidad: number; nombre: string; }

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

interface Props {
  pedidos: PedidoDelivery[];
  repartidores: Repartidor[];
  rol: string;
  productos: Producto[];
  sucursalId: number | null;
  simbolo: string;
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

const statusStyles: Record<string, string> = {
  PENDIENTE:   "border-amber-200  bg-amber-50  text-amber-700",
  EN_PROCESO:  "border-blue-200   bg-blue-50   text-blue-700",
  LISTO:       "border-violet-200 bg-violet-50 text-violet-700",
  ENTREGADO:   "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELADO:   "border-rose-200   bg-rose-50   text-rose-700",
};

export function DeliveryClient({ pedidos: initialPedidos, repartidores, rol, productos, sucursalId, simbolo, stats }: Props) {
  const [pedidos, setPedidos]                     = useState(initialPedidos);
  const [activeFilter, setActiveFilter]           = useState<FilterKey>("todos");
  const [showIngreso, setShowIngreso]             = useState(false);
  const [showFinalizados, setShowFinalizados]     = useState(false);
  const [showRepartidores, setShowRepartidores]   = useState(false);
  const [loadingPedidoId, setLoadingPedidoId]     = useState<number | null>(null);
  const [newOrderAlert, setNewOrderAlert]         = useState<PedidoDelivery | null>(null);
  const knownIdsRef = useRef(new Set(initialPedidos.map((p) => p.id)));

  const isAdmin = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol);

  const activos    = pedidos.filter((p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO");
  const entregados = pedidos.filter((p) => p.estado === "ENTREGADO");

  const counts = {
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

  /* ── Polling para detectar nuevos pedidos ── */
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

  /* ── Asignar repartidor ── */
  async function assignDriver(pedidoId: number, repartidorId: string) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, repartidorId: repartidorId ? Number(repartidorId) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos((cur) => cur.map((p) => p.id === pedidoId ? { ...p, repartidorId: data.repartidorId, repartidor: data.repartidor, trackingStage: data.repartidorId && p.estado === "LISTO" ? "EN_CAMINO" : p.trackingStage } : p));
    } finally { setLoadingPedidoId(null); }
  }

  /* ── Actualizar estado ── */
  async function updateStatus(pedidoId: number, estado: EstadoPedido) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  /* ── Card de pedido ── */
  function renderPedidoCard(pedido: PedidoDelivery) {
    const loading = loadingPedidoId === pedido.id;
    const stageLabel = getDeliveryStageLabel(pedido.trackingStage);

    return (
      <article key={pedido.id} className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-sm transition hover:shadow-md">
        {/* Cabecera coloreada por estado */}
        <div className={cn("px-4 py-3 flex items-center justify-between gap-3", {
          "bg-amber-50 border-b border-amber-100":  pedido.estado === "PENDIENTE",
          "bg-blue-50  border-b border-blue-100":   pedido.estado === "EN_PROCESO",
          "bg-violet-50 border-b border-violet-100": pedido.estado === "LISTO",
        })}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-surface-muted">#{pedido.id}</span>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest", statusStyles[pedido.estado])}>
              {pedido.estado.replace("_", " ")}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-surface-muted">Total</p>
            <p className="text-base font-black text-surface-text">{formatCurrency(pedido.total)}</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Cliente + stage */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-surface-text leading-tight">{pedido.clienteNombre}</p>
              <p className="text-xs text-surface-muted mt-0.5">{stageLabel}</p>
            </div>
            <span className="shrink-0 text-xs text-surface-muted">{new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-surface-muted">
            <div className="flex items-start gap-1.5 rounded-xl bg-surface-bg px-3 py-2">
              <MapPin size={12} className="mt-0.5 shrink-0 text-brand-500" />
              <span className="line-clamp-2">{pedido.direccionEntrega ?? "Sin dirección"}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-surface-bg px-3 py-2">
              <span className="flex items-center gap-1.5"><Wallet size={12} className="text-brand-500" />{pedido.metodoPago}</span>
              <span className="flex items-center gap-1.5"><Bike size={12} className="text-brand-500" />{pedido.repartidor?.nombre ?? "Sin repartidor"}</span>
            </div>
          </div>

          {/* Detalle productos */}
          {pedido.detalles.length > 0 && (
            <div className="rounded-xl border border-surface-border px-3 py-2 text-xs text-surface-muted space-y-1">
              {pedido.detalles.map((d) => (
                <div key={d.id} className="flex gap-1.5">
                  <span className="font-bold text-surface-text">{d.cantidad}×</span>
                  <span>{d.nombre}</span>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          {(isAdmin || rol === "DELIVERY") && pedido.estado !== "ENTREGADO" && (
            <div className="space-y-2 pt-1">
              {isAdmin && (
                <select
                  value={pedido.repartidorId ?? ""}
                  onChange={(e) => void assignDriver(pedido.id, e.target.value)}
                  disabled={loading}
                  className="input w-full text-xs"
                >
                  <option value="">Sin repartidor asignado</option>
                  {repartidores.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre} · {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}</option>
                  ))}
                </select>
              )}

              <div className="flex flex-wrap gap-2">
                {pedido.estado === "PENDIENTE" && (
                  <button onClick={() => void updateStatus(pedido.id, "EN_PROCESO")} disabled={loading} className="btn-primary text-xs py-2 px-3 rounded-xl">
                    {loading ? <RefreshCw size={13} className="animate-spin" /> : <ChefHat size={13} />}
                    Pasar a cocina
                  </button>
                )}
                {pedido.estado === "EN_PROCESO" && (
                  <button onClick={() => void updateStatus(pedido.id, "LISTO")} disabled={loading} className="btn-primary text-xs py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700">
                    {loading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Marcar listo
                  </button>
                )}
                {pedido.estado === "LISTO" && pedido.repartidorId && (
                  <button onClick={() => void updateStatus(pedido.id, "ENTREGADO")} disabled={loading} className="btn-primary text-xs py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    {loading ? <RefreshCw size={13} className="animate-spin" /> : <Route size={13} />}
                    Confirmar entrega
                  </button>
                )}
                {pedido.estado === "LISTO" && !pedido.repartidorId && (
                  <p className="text-xs text-violet-600 font-medium">Asigna un repartidor para despachar.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Alerta nuevo pedido ── */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white">
            <Bell size={18} />
          </div>
          <div>
            <p className="font-bold text-surface-text text-sm">🔔 Nuevo pedido #{newOrderAlert.id}</p>
            <p className="text-xs text-surface-muted">{newOrderAlert.clienteNombre} · {formatCurrency(newOrderAlert.total)}</p>
          </div>
          <button onClick={() => setNewOrderAlert(null)} className="ml-2 rounded-xl p-1.5 text-surface-muted hover:bg-surface-bg">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-surface-text">Delivery</h1>
          <p className="text-sm text-surface-muted">Canal público, despacho y seguimiento integrados.</p>
        </div>
        <button
          onClick={() => setShowIngreso((v) => !v)}
          className={cn("btn-primary gap-2 text-sm", showIngreso && "bg-brand-700")}
        >
          <Plus size={16} />
          Ingreso Manual
        </button>
      </div>

      {/* ── Ingreso Manual (colapsible) ── */}
      {showIngreso && (
        <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
          <IngresoManualForm
            productos={productos}
            sucursalId={sucursalId}
            simbolo={simbolo}
            onOrderCreated={(pedido) => {
              const nuevo: PedidoDelivery = {
                id: pedido.id,
                estado: "PENDIENTE",
                trackingStage: "CONFIRMADO",
                clienteNombre: pedido.clienteNombre,
                telefonoCliente: null,
                direccionEntrega: null,
                referencia: null,
                departamento: null,
                metodoPago: "EFECTIVO",
                cargoEnvio: 0,
                subtotal: 0,
                total: 0,
                repartidorId: null,
                creadoEn: new Date().toISOString(),
                repartidor: null,
                detalles: [],
              };
              knownIdsRef.current.add(pedido.id);
              setPedidos((prev) => [nuevo, ...prev]);
              setShowIngreso(false);
            }}
          />
        </div>
      )}

      {/* ── DELIVERY ACTIVOS ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-surface-muted">Delivery Activos</h2>
          {/* Filtros por etapa */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: "todos",      label: "Todos",     icon: LayoutList, color: "bg-surface-text text-white", inactive: "bg-surface-bg text-surface-muted hover:bg-surface-border" },
              { key: "pendiente",  label: "Entrando",  icon: Flame,      color: "bg-amber-500 text-white",    inactive: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
              { key: "en_proceso", label: "En Cocina", icon: ChefHat,    color: "bg-blue-600 text-white",     inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { key: "listo",      label: "En Ruta",   icon: Truck,      color: "bg-violet-600 text-white",   inactive: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
            ] as const).map(({ key, label, icon: Icon, color, inactive }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                  activeFilter === key ? color : inactive
                )}
              >
                <Icon size={12} />
                {label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none", activeFilter === key ? "bg-white/20" : "bg-black/8")}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredActivos.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredActivos.map((pedido) => renderPedidoCard(pedido))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center text-sm text-surface-muted">
            No hay pedidos {activeFilter !== "todos" ? `en este estado` : "activos"} en este momento.
          </div>
        )}
      </div>

      {/* ── Repartidores (colapsible) ── */}
      {repartidores.length > 0 && (
        <div>
          <button
            onClick={() => setShowRepartidores((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm font-semibold text-surface-text shadow-sm hover:bg-surface-bg transition"
          >
            <span className="flex items-center gap-2"><Bike size={15} className="text-brand-500" /> Repartidores ({repartidores.length})</span>
            {showRepartidores ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showRepartidores && (
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {repartidores.map((r) => (
                <article key={r.id} className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-surface-text">{r.nombre}</p>
                      <p className="text-xs text-surface-muted">@{r.usuario}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest", r.estado === "EN_REPARTO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                      {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl bg-surface-bg px-3 py-2 text-xs text-surface-muted space-y-1">
                    <span className="flex items-center gap-1.5"><UserRound size={12} className="text-brand-500" />{r.sucursalNombre}</span>
                    <span className="flex items-center gap-1.5"><ShoppingBag size={12} className="text-brand-500" />{r.activos} pedidos activos</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Pedidos hoy",     value: stats.pedidosHoy },
          { label: "Activos",         value: stats.activos },
          { label: "En camino",       value: stats.enCamino },
          { label: "Tiempo prom.",    value: `${stats.tiempoPromedio} min` },
          { label: "Entregados",      value: stats.entregados },
          { label: "Ventas delivery", value: formatCurrency(stats.ventasDelivery) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-surface-muted">{label}</p>
            <p className="mt-2 text-2xl font-black text-surface-text">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Delivery Finalizados ── */}
      <div>
        <button
          onClick={() => setShowFinalizados((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition",
            showFinalizados
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-surface-border bg-white text-surface-text shadow-sm hover:bg-surface-bg"
          )}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Delivery Finalizados
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">{entregados.length}</span>
          </span>
          {showFinalizados ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFinalizados && (
          <div className="mt-3 space-y-2">
            {entregados.length > 0 ? entregados.map((pedido) => (
              <article key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm shadow-sm">
                <div>
                  <p className="font-bold text-surface-text">Pedido #{pedido.id} · {pedido.clienteNombre}</p>
                  <p className="mt-0.5 text-xs text-surface-muted">{pedido.direccionEntrega ?? "Sin dirección"} · {pedido.repartidor?.nombre ?? "—"}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Entregado</span>
                  <p className="mt-1 font-semibold text-surface-text">{formatCurrency(pedido.total)}</p>
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-surface-border bg-white p-8 text-center text-sm text-surface-muted">
                Todavía no hay pedidos entregados.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
