"use client";

import { CheckCircle2, Clock, UtensilsCrossed, Loader2, Bell } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { PedidoConDetalles, EstadoPedido } from "@/types";
import { useState } from "react";

interface OrderCardProps {
  pedido: PedidoConDetalles;
  onUpdateEstado: (id: number, estado: EstadoPedido) => Promise<void>;
  onLlamarMesero: (id: number) => Promise<void>;
}

const nextEstado: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: "EN_PROCESO",
  EN_PROCESO: "LISTO",
  LISTO: "ENTREGADO",
};

const nextLabel: Partial<Record<EstadoPedido, string>> = {
  PENDIENTE: "Iniciar Preparacion",
  EN_PROCESO: "Marcar como listo",
  LISTO: "Listo!",
};

export function OrderCard({ pedido, onUpdateEstado, onLlamarMesero }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMesero, setLoadingMesero] = useState(false);

  async function handleUpdate() {
    const next = nextEstado[pedido.estado];
    if (!next) return;
    setLoading(true);
    await onUpdateEstado(pedido.id, next);
    setLoading(false);
  }

  async function handleLlamarMesero() {
    setLoadingMesero(true);
    await onLlamarMesero(pedido.id);
    setLoadingMesero(false);
  }

  const siguiente = nextEstado[pedido.estado];
  const tiempoStr = timeAgo(pedido.creadoEn);

  return (
    <div className={cn(
      "card p-0 overflow-hidden animate-fade-in",
      pedido.meseroLlamado && "ring-2 ring-amber-400"
    )}>
      {/* Banner llamada al mesero */}
      {pedido.meseroLlamado && (
        <div className="flex items-center gap-2 bg-amber-400 px-4 py-1.5 text-white text-xs font-bold">
          <Bell size={13} className="animate-bounce" />
          Mesero solicitado — pendiente de retirar
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h4 className="font-bold text-surface-text text-base">
            {pedido.mesa?.nombre ?? `Pedido #${pedido.numero}`}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-surface-muted mt-0.5">
            <UtensilsCrossed size={11} />
            <span>
              {pedido.tipo === "COCINA" ? "Pedido de comida"
                : pedido.tipo === "BAR" ? "Pedido de bebidas"
                : pedido.tipo === "REPOSTERIA" ? "Pedido reposteria"
                : pedido.tipo === "DELIVERY" ? "Pedido delivery"
                : "Pedido mostrador"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-surface-muted">
          <Clock size={12} />
          <span>Hace {tiempoStr}</span>
        </div>
      </div>

      {/* Productos */}
      <div className="px-4 pb-3 space-y-1.5">
        {pedido.detalles.map((d) => (
          <div key={d.id} className="flex items-start gap-2 bg-surface-bg rounded-lg px-3 py-2">
            <span className="font-bold text-sm text-brand-600 flex-shrink-0">
              {d.cantidad}x
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-text">
                {d.producto?.nombre ?? d.combo?.nombre ?? "—"}
              </p>
              {d.observacion && (
                <p className="text-xs text-surface-muted italic mt-0.5">{d.observacion}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Observacion general */}
      {pedido.observacion && (
        <div className="mx-4 mb-3 text-xs text-surface-muted bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          📝 {pedido.observacion}
        </div>
      )}

      {/* Acciones */}
      <div className="flex border-t border-surface-border">
        {siguiente && (
          <button
            onClick={handleUpdate}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all",
              pedido.estado === "PENDIENTE" && "bg-brand-500 hover:bg-brand-600 text-white",
              pedido.estado === "EN_PROCESO" && "bg-amber-500 hover:bg-amber-600 text-white",
              pedido.estado === "LISTO" && "bg-emerald-500 hover:bg-emerald-600 text-white",
              "disabled:opacity-50"
            )}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {nextLabel[pedido.estado]}
          </button>
        )}
        <button
          onClick={handleLlamarMesero}
          disabled={loadingMesero || pedido.meseroLlamado}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-all border-l border-surface-border flex items-center gap-1.5 disabled:opacity-50",
            pedido.meseroLlamado
              ? "bg-amber-50 text-amber-600"
              : "text-surface-muted hover:bg-brand-50 hover:text-brand-600"
          )}
        >
          {loadingMesero ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Bell size={14} className={pedido.meseroLlamado ? "animate-bounce" : ""} />
          )}
          {pedido.meseroLlamado ? "Llamado" : "Llamar Mesero"}
        </button>
      </div>
    </div>
  );
}
