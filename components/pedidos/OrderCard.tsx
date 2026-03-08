"use client";

import { CheckCircle2, Clock, UtensilsCrossed, Loader2 } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { PedidoConDetalles, EstadoPedido } from "@/types";
import { useState } from "react";

interface OrderCardProps {
  pedido: PedidoConDetalles;
  onUpdateEstado: (id: number, estado: EstadoPedido) => Promise<void>;
}

const estadoStyles: Record<EstadoPedido, string> = {
  PENDIENTE: "border-amber-200 bg-amber-50",
  EN_PROCESO: "border-blue-200 bg-blue-50",
  LISTO: "border-emerald-200 bg-emerald-50",
  ENTREGADO: "border-zinc-200 bg-white opacity-60",
  CANCELADO: "border-red-200 bg-red-50 opacity-60",
};

const nextEstado: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: "EN_PROCESO",
  EN_PROCESO: "LISTO",
  LISTO: "ENTREGADO",
};

const nextLabel: Partial<Record<EstadoPedido, string>> = {
  PENDIENTE: "Iniciar preparación",
  EN_PROCESO: "Marcar como listo",
  LISTO: "Marcar entregado",
};

export function OrderCard({ pedido, onUpdateEstado }: OrderCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    const next = nextEstado[pedido.estado];
    if (!next) return;
    setLoading(true);
    await onUpdateEstado(pedido.id, next);
    setLoading(false);
  }

  const siguiente = nextEstado[pedido.estado];

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all", estadoStyles[pedido.estado])}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 text-base">#{pedido.numero}</span>
            {pedido.mesa && (
              <span className="flex items-center gap-1 text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-600 font-medium">
                <UtensilsCrossed size={11} />
                {pedido.mesa.nombre}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
            <Clock size={11} />
            {timeAgo(pedido.creadoEn)}
          </div>
        </div>

        {/* Estado badge */}
        <span className={cn(
          "text-xs font-semibold px-2 py-1 rounded-lg",
          pedido.estado === "PENDIENTE" && "bg-amber-200 text-amber-800",
          pedido.estado === "EN_PROCESO" && "bg-blue-200 text-blue-800",
          pedido.estado === "LISTO" && "bg-emerald-200 text-emerald-800",
        )}>
          {pedido.estado === "PENDIENTE" ? "Pendiente"
            : pedido.estado === "EN_PROCESO" ? "En proceso"
            : pedido.estado === "LISTO" ? "Listo"
            : pedido.estado}
        </span>
      </div>

      {/* Productos */}
      <div className="space-y-1.5">
        {pedido.detalles.map((d) => (
          <div key={d.id} className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-zinc-900 text-white text-xs rounded flex items-center justify-center font-bold">
              {d.cantidad}
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {d.producto?.nombre ?? d.combo?.nombre ?? "—"}
              </p>
              {d.observacion && (
                <p className="text-xs text-zinc-400 italic">{d.observacion}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Observación */}
      {pedido.observacion && (
        <p className="text-xs text-zinc-500 bg-white/60 rounded-lg px-3 py-2 border border-zinc-200">
          📝 {pedido.observacion}
        </p>
      )}

      {/* Acción */}
      {siguiente && (
        <button
          onClick={handleUpdate}
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
            pedido.estado === "PENDIENTE" && "bg-amber-500 hover:bg-amber-600 text-white",
            pedido.estado === "EN_PROCESO" && "bg-blue-600 hover:bg-blue-700 text-white",
            pedido.estado === "LISTO" && "bg-emerald-600 hover:bg-emerald-700 text-white",
            "disabled:opacity-60"
          )}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {nextLabel[pedido.estado]}
        </button>
      )}
    </div>
  );
}
