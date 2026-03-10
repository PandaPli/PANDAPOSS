"use client";

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
  // Agrupar por sala
  const grupos = mesas.reduce<Record<string, MesaConEstado[]>>((acc, m) => {
    const key = m.sala.nombre;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const totalLibres = mesas.filter((m) => m.estado === "LIBRE").length;
  const totalOcupadas = mesas.filter((m) => m.estado === "OCUPADA").length;
  const totalReservadas = mesas.filter((m) => m.estado === "RESERVADA").length;

  if (mesas.length === 0) {
    return (
      <div className="card p-16 text-center">
        <p className="text-surface-text font-semibold">Sin mesas registradas</p>
        <p className="text-surface-muted text-sm mt-1">Crea la primera mesa con el boton de arriba</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen global */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-surface-muted">{totalLibres} libres</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-surface-muted">{totalOcupadas} ocupadas</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-surface-muted">{totalReservadas} reservadas</span>
        </div>
      </div>

      {/* Secciones por sala */}
      {Object.entries(grupos).map(([salaNombre, mesasSala]) => {
        const libres = mesasSala.filter((m) => m.estado === "LIBRE").length;
        const ocupadas = mesasSala.filter((m) => m.estado === "OCUPADA").length;
        const reservadas = mesasSala.filter((m) => m.estado === "RESERVADA").length;

        return (
          <div key={salaNombre}>
            {/* Header sala */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-surface-text text-base">{salaNombre}</h3>
              <div className="flex items-center gap-2 text-xs text-surface-muted">
                {ocupadas > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {ocupadas} ocupada{ocupadas !== 1 ? "s" : ""}
                  </span>
                )}
                {reservadas > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {reservadas} reservada{reservadas !== 1 ? "s" : ""}
                  </span>
                )}
                {libres > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {libres} libre{libres !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            {/* Grid mesas de esta sala */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {mesasSala.map((mesa) => {
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
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cfg.dot)} />
                      <span className={cfg.badge}>{cfg.label}</span>
                    </div>

                    <p className="font-bold text-surface-text text-base leading-tight">{mesa.nombre}</p>

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

                    <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={14} className="text-surface-muted" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
