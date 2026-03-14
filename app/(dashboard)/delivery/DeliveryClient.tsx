"use client";

import { useState } from "react";
import { Bike, CheckCircle2, Clock3, MapPin, Package2, Phone, RefreshCw, Route, ShoppingBag, UserRound, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import type { EstadoPedido } from "@/types";

interface PedidoDetalle {
  id: number;
  cantidad: number;
  nombre: string;
}

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

interface Props {
  pedidos: PedidoDelivery[];
  repartidores: Repartidor[];
  rol: string;
  stats: {
    pedidosHoy: number;
    enCamino: number;
    tiempoPromedio: number;
    ventasDelivery: number;
    activos: number;
    entregados: number;
  };
}

const tabs = [
  { key: "pedidos", label: "Pedidos Delivery" },
  { key: "repartidores", label: "Repartidores" },
  { key: "seguimiento", label: "Seguimiento" },
  { key: "historial", label: "Historial" },
] as const;

const statusStyles: Record<string, string> = {
  PENDIENTE: "border-amber-200 bg-amber-50 text-amber-700",
  EN_PROCESO: "border-blue-200 bg-blue-50 text-blue-700",
  LISTO: "border-violet-200 bg-violet-50 text-violet-700",
  ENTREGADO: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELADO: "border-rose-200 bg-rose-50 text-rose-700",
};

export function DeliveryClient({ pedidos: initialPedidos, repartidores, rol, stats }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("pedidos");
  const [pedidos, setPedidos] = useState(initialPedidos);
  const [loadingPedidoId, setLoadingPedidoId] = useState<number | null>(null);

  const isAdmin = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol);
  const activos = pedidos.filter((pedido) => pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO");
  const entregados = pedidos.filter((pedido) => pedido.estado === "ENTREGADO");

  async function assignDriver(pedidoId: number, repartidorId: string) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, repartidorId: repartidorId ? Number(repartidorId) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo asignar el repartidor.");

      setPedidos((current) =>
        current.map((pedido) =>
          pedido.id === pedidoId
            ? {
                ...pedido,
                repartidorId: data.repartidorId,
                repartidor: data.repartidor,
                trackingStage: data.repartidorId && pedido.estado === "LISTO" ? "EN_CAMINO" : pedido.trackingStage,
              }
            : pedido
        )
      );
    } finally {
      setLoadingPedidoId(null);
    }
  }

  async function updateStatus(pedidoId: number, estado: EstadoPedido) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar el estado.");

      setPedidos((current) =>
        current.map((pedido) => {
          if (pedido.id !== pedidoId) return pedido;

          const trackingStage =
            data.estado === "ENTREGADO"
              ? "ENTREGADO"
              : data.estado === "LISTO" && pedido.repartidorId
              ? "EN_CAMINO"
              : data.estado === "LISTO" || data.estado === "EN_PROCESO"
              ? "PREPARANDO"
              : data.estado === "CANCELADO"
              ? "CANCELADO"
              : "CONFIRMADO";

          return {
            ...pedido,
            estado: data.estado,
            trackingStage,
          };
        })
      );
    } finally {
      setLoadingPedidoId(null);
    }
  }

  function renderPedidoCard(pedido: PedidoDelivery) {
    const loading = loadingPedidoId === pedido.id;
    const stageLabel = getDeliveryStageLabel(pedido.trackingStage);

    return (
      <article key={pedido.id} className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-surface-muted">#{pedido.id}</span>
              <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", statusStyles[pedido.estado])}>
                {pedido.estado.replace("_", " ")}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-surface-text">{pedido.clienteNombre}</h3>
            <p className="mt-1 text-sm text-surface-muted">{stageLabel}</p>
          </div>
          <div className="rounded-2xl bg-surface-bg px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-surface-muted">Total</p>
            <p className="mt-1 text-lg font-black text-surface-text">{formatCurrency(pedido.total)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-bg p-4 text-sm text-surface-muted">
            <p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 text-brand-500" /> <span>{pedido.direccionEntrega ?? "Direccion pendiente"}</span></p>
            {pedido.referencia ? <p className="mt-2">Referencia: {pedido.referencia}</p> : null}
            {pedido.departamento ? <p className="mt-1">Departamento: {pedido.departamento}</p> : null}
            {pedido.telefonoCliente ? <p className="mt-2 flex items-center gap-2"><Phone size={14} className="text-brand-500" /> {pedido.telefonoCliente}</p> : null}
          </div>
          <div className="rounded-2xl bg-surface-bg p-4 text-sm text-surface-muted">
            <p className="flex items-center gap-2"><Wallet size={15} className="text-brand-500" /> {pedido.metodoPago}</p>
            <p className="mt-2 flex items-center gap-2"><Bike size={15} className="text-brand-500" /> {pedido.repartidor?.nombre ?? "Sin repartidor"}</p>
            <p className="mt-2">Creado: {new Date(pedido.creadoEn).toLocaleString("es-CL")}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-surface-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-muted">Consumo</p>
          <div className="mt-3 space-y-2 text-sm text-surface-text">
            {pedido.detalles.map((detalle) => (
              <div key={detalle.id} className="flex items-center justify-between gap-3">
                <span>{detalle.cantidad}x {detalle.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {(isAdmin || rol === "DELIVERY") && pedido.estado !== "ENTREGADO" ? (
          <div className="mt-4 space-y-3">
            {isAdmin ? (
              <select
                value={pedido.repartidorId ?? ""}
                onChange={(event) => void assignDriver(pedido.id, event.target.value)}
                disabled={loading}
                className="input w-full text-sm"
              >
                <option value="">Sin repartidor asignado</option>
                {repartidores.map((repartidor) => (
                  <option key={repartidor.id} value={repartidor.id}>
                    {repartidor.nombre} · {repartidor.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                  </option>
                ))}
              </select>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {pedido.estado === "PENDIENTE" ? (
                <button onClick={() => void updateStatus(pedido.id, "EN_PROCESO")} disabled={loading} className="btn-primary text-sm">
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Package2 size={15} />}
                  Pasar a cocina
                </button>
              ) : null}

              {pedido.estado === "EN_PROCESO" ? (
                <button onClick={() => void updateStatus(pedido.id, "LISTO")} disabled={loading} className="btn-primary text-sm bg-violet-600 hover:bg-violet-700">
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Marcar listo
                </button>
              ) : null}

              {pedido.estado === "LISTO" && pedido.repartidorId ? (
                <button onClick={() => void updateStatus(pedido.id, "ENTREGADO")} disabled={loading} className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700">
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Route size={15} />}
                  Confirmar entrega
                </button>
              ) : null}
            </div>

            {pedido.estado === "LISTO" && !pedido.repartidorId ? (
              <p className="text-xs font-medium text-violet-600">Asigna un repartidor para que el cliente vea el pedido en camino.</p>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-surface-muted">Pedidos hoy</p>
          <p className="mt-3 text-3xl font-black text-surface-text">{stats.pedidosHoy}</p>
        </div>
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-surface-muted">Activos</p>
          <p className="mt-3 text-3xl font-black text-surface-text">{stats.activos}</p>
        </div>
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-surface-muted">En camino</p>
          <p className="mt-3 text-3xl font-black text-surface-text">{stats.enCamino}</p>
        </div>
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-surface-muted">Tiempo promedio</p>
          <p className="mt-3 text-3xl font-black text-surface-text">{stats.tiempoPromedio} min</p>
        </div>
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-surface-muted">Entregados</p>
          <p className="mt-3 text-3xl font-black text-surface-text">{stats.entregados}</p>
        </div>
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-surface-muted">Ventas delivery</p>
          <p className="mt-3 text-3xl font-black text-surface-text">{formatCurrency(stats.ventasDelivery)}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-surface-border bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                activeTab === tab.key ? "bg-surface-text text-white" : "bg-surface-bg text-surface-muted hover:bg-surface-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "pedidos" ? (
        activos.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">{activos.map((pedido) => renderPedidoCard(pedido))}</div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-surface-border bg-white p-12 text-center text-surface-muted">No hay pedidos delivery activos.</div>
        )
      ) : null}

      {activeTab === "repartidores" ? (
        repartidores.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {repartidores.map((repartidor) => (
              <article key={repartidor.id} className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-surface-text">{repartidor.nombre}</p>
                    <p className="text-sm text-surface-muted">@{repartidor.usuario}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", repartidor.estado === "EN_REPARTO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                    {repartidor.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-surface-bg p-4 text-sm text-surface-muted">
                  <p className="flex items-center gap-2"><UserRound size={15} className="text-brand-500" /> {repartidor.sucursalNombre}</p>
                  <p className="mt-2 flex items-center gap-2"><ShoppingBag size={15} className="text-brand-500" /> {repartidor.activos} pedidos activos</p>
                </div>
                {repartidor.pedidos.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {repartidor.pedidos.map((pedido) => (
                      <div key={pedido.id} className="rounded-2xl border border-surface-border px-4 py-3 text-sm text-surface-muted">
                        <p className="font-semibold text-surface-text">Pedido #{pedido.id}</p>
                        <p className="mt-1">{pedido.direccionEntrega ?? "Direccion pendiente"}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-surface-border bg-white p-12 text-center text-surface-muted">No hay repartidores activos configurados.</div>
        )
      ) : null}

      {activeTab === "seguimiento" ? (
        activos.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {activos.map((pedido) => (
              <article key={pedido.id} className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-surface-text">Pedido #{pedido.id}</p>
                    <p className="text-sm text-surface-muted">{pedido.clienteNombre}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                    {getDeliveryStageLabel(pedido.trackingStage)}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-bg">
                  <div className={cn("h-full rounded-full", pedido.trackingStage === "ENTREGADO" ? "bg-emerald-500 w-full" : pedido.trackingStage === "EN_CAMINO" ? "bg-violet-500 w-[82%]" : pedido.trackingStage === "PREPARANDO" ? "bg-amber-500 w-[58%]" : "bg-brand-500 w-[28%]")} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-surface-muted">
                  <p className="flex items-center gap-2"><MapPin size={15} className="text-brand-500" /> {pedido.direccionEntrega ?? "Direccion pendiente"}</p>
                  <p className="flex items-center gap-2"><Bike size={15} className="text-brand-500" /> {pedido.repartidor?.nombre ?? "Sin repartir"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-surface-border bg-white p-12 text-center text-surface-muted">No hay pedidos para seguimiento en este momento.</div>
        )
      ) : null}

      {activeTab === "historial" ? (
        entregados.length > 0 ? (
          <div className="space-y-3">
            {entregados.map((pedido) => (
              <article key={pedido.id} className="rounded-[1.5rem] border border-surface-border bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-surface-text">Pedido #{pedido.id} · {pedido.clienteNombre}</p>
                    <p className="mt-1 text-sm text-surface-muted">{pedido.direccionEntrega}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-700">Entregado</p>
                    <p className="mt-1 text-sm text-surface-text">{formatCurrency(pedido.total)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-surface-border bg-white p-12 text-center text-surface-muted">Todavia no hay pedidos entregados para mostrar.</div>
        )
      ) : null}
    </div>
  );
}

