"use client";

import { useState } from "react";
import { Users, Clock, ChevronRight } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { MesaConEstado, EstadoMesa } from "@/types";

interface TableMapProps {
  mesas: MesaConEstado[];
  onSelectMesa?: (mesa: MesaConEstado) => void;
}

const estadoConfig: Record<EstadoMesa, { label: string; card: string; badge: string; dot: string }> = {
  LIBRE: {
    label: "Libre",
    card: "bg-white border-surface-border hover:border-emerald-300 hover:shadow-md cursor-pointer",
    badge: "badge-libre",
    dot: "bg-emerald-500",
  },
  OCUPADA: {
    label: "Ocupada",
    card: "bg-red-50 border-red-200 hover:border-red-300 cursor-pointer",
    badge: "badge-ocupada",
    dot: "bg-red-500",
  },
  RESERVADA: {
    label: "Reservada",
    card: "bg-amber-50 border-amber-200 hover:border-amber-300 cursor-pointer",
    badge: "badge-reservada",
    dot: "bg-amber-500",
  },
};

export function TableMap({ mesas, onSelectMesa }: TableMapProps) {
  const [salaFiltro, setSalaFiltro] = useState<string>("todas");

  // Agrupar por sala
  const salas = Array.from(new Set(mesas.map((m) => m.sala.nombre)));
  const mesasFiltradas = salaFiltro === "todas"
    ? mesas
    : mesas.filter((m) => m.sala.nombre === salaFiltro);

  const countPorEstado = {
    LIBRE: mesas.filter((m) => m.estado === "LIBRE").length,
    OCUPADA: mesas.filter((m) => m.estado === "OCUPADA").length,
    RESERVADA: mesas.filter((m) => m.estado === "RESERVADA").length,
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-surface-muted">{countPorEstado.LIBRE} libres</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-surface-muted">{countPorEstado.OCUPADA} ocupadas</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-surface-muted">{countPorEstado.RESERVADA} reservadas</span>
        </div>
      </div>

      {/* Filtro por sala */}
      {salas.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSalaFiltro("todas")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
              salaFiltro === "todas"
                ? "bg-brand-600 text-white"
                : "bg-white text-surface-muted border border-surface-border hover:bg-surface-bg"
            )}
          >
            Todas
          </button>
          {salas.map((sala) => (
            <button
              key={sala}
              onClick={() => setSalaFiltro(sala)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
                salaFiltro === sala
                  ? "bg-brand-600 text-white"
                  : "bg-white text-surface-muted border border-surface-border hover:bg-surface-bg"
              )}
            >
              {sala}
            </button>
          ))}
        </div>
      )}

      {/* Grid mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesasFiltradas.map((mesa) => {
          const cfg = estadoConfig[mesa.estado];
          const pedido = mesa.pedidoActivo;

          return (
            <button
              key={mesa.id}
              onClick={() => onSelectMesa?.(mesa)}
              className={cn(
                "card p-4 border text-left transition-all group",
                cfg.card
              )}
            >
              {/* Estado dot */}
              <div className="flex items-center justify-between mb-3">
                <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cfg.dot)} />
                <span className={cfg.badge}>{cfg.label}</span>
              </div>

              {/* Nombre mesa */}
              <p className="font-bold text-surface-text text-base leading-tight">{mesa.nombre}</p>
              <p className="text-xs text-surface-muted mt-0.5">{mesa.sala.nombre}</p>

              {/* Info pedido */}
              {pedido ? (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-surface-muted">
                    <Users size={12} />
                    <span>{pedido._count.detalles} producto{pedido._count.detalles !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-surface-muted">
                    <Clock size={12} />
                    <span>{timeAgo(pedido.creadoEn)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1 text-xs text-surface-muted">
                  <Users size={12} />
                  <span>Cap. {mesa.capacidad}</span>
                </div>
              )}

              {/* Arrow hover */}
              <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-surface-muted" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
