"use client";

import { useState } from "react";
import { ChevronRight, Clock, Users, QrCode } from "lucide-react";
import { cn, timeAgo, formatCurrency } from "@/lib/utils";

const GRUPO_COLORS: Record<string, string> = {
  A1: "#3b82f6", A2: "#22c55e", A3: "#f97316",
  A4: "#a855f7", A5: "#ec4899",
};
import type { EstadoMesa, MesaConEstado } from "@/types";

interface TableMapProps {
  mesas: MesaConEstado[];
  onSelectMesa?: (mesa: MesaConEstado) => void;
}

const estadoConfig: Record<EstadoMesa, { label: string; card: string; badge: string; dot: string; summary: string }> = {
  LIBRE: {
    label: "Disponible",
    card: "border-emerald-300 bg-emerald-50/80 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)] hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer",
    badge: "border border-emerald-200 bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    summary: "Disponibles",
  },
  OCUPADA: {
    label: "Ocupada",
    card: "border-red-300 bg-red-50 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.14)] hover:border-red-400 hover:bg-red-50 cursor-pointer",
    badge: "border border-red-200 bg-red-100 text-red-700",
    dot: "bg-red-500",
    summary: "Ocupadas",
  },
  CUENTA: {
    label: "Pidio cuenta",
    card: "border-violet-300 bg-violet-50 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.16)] hover:border-violet-400 hover:bg-violet-50 cursor-pointer",
    badge: "border border-violet-200 bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    summary: "Pidieron cuenta",
  },
  RESERVADA: {
    label: "Reservada",
    card: "border-amber-300 bg-amber-50 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.16)] hover:border-amber-400 hover:bg-amber-50 cursor-pointer",
    badge: "border border-amber-200 bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    summary: "Reservadas",
  },
};

export function TableMap({ mesas, onSelectMesa }: TableMapProps) {
  // Deduplicar salas manteniendo esQR
  const salasMap = new Map<string, { nombre: string; esQR: boolean }>();
  mesas.forEach((m) => {
    if (!salasMap.has(m.sala.nombre)) {
      salasMap.set(m.sala.nombre, { nombre: m.sala.nombre, esQR: m.sala.esQR });
    }
  });
  const salas = Array.from(salasMap.values());
  const salasRegulares = salas.filter((s) => !s.esQR);
  const salasQR = salas.filter((s) => s.esQR);

  const defaultSala = salasRegulares[0]?.nombre ?? salasQR[0]?.nombre ?? "";
  const [salaFiltro, setSalaFiltro] = useState<string>(defaultSala);

  // Orden numérico: "Mesa 2" antes que "Mesa 10"
  const sortNumerical = (a: MesaConEstado, b: MesaConEstado) => {
    const n = (s: string) => parseInt(s.replace(/\D+/g, "") || "0", 10);
    const diff = n(a.nombre) - n(b.nombre);
    return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre, "es");
  };

  const mesasFiltradas = mesas
    .filter((m) => m.sala.nombre === salaFiltro)
    .slice()
    .sort(sortNumerical);

  const countPorEstado: Record<EstadoMesa, number> = {
    LIBRE: mesas.filter((m) => m.estado === "LIBRE").length,
    OCUPADA: mesas.filter((m) => m.estado === "OCUPADA").length,
    CUENTA: mesas.filter((m) => m.estado === "CUENTA").length,
    RESERVADA: mesas.filter((m) => m.estado === "RESERVADA").length,
  };

  // Mesas activas (no LIBRE) por sala
  const activasPorSala = (nombre: string) =>
    mesas.filter((m) => m.sala.nombre === nombre && m.estado !== "LIBRE").length;

  const renderMesaCard = (mesa: MesaConEstado) => {
    const cfg = estadoConfig[mesa.estado];
    const pedido = mesa.pedidoActivo;

    return (
      <button
        key={mesa.id}
        onClick={() => onSelectMesa?.(mesa)}
        className={cn("group rounded-[24px] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg relative", cfg.card)}
      >
        {mesa.sala.esQR && (
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-600 rounded-full p-0.5" title="Mesa QR">
            <QrCode size={11} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <span className={cn("h-3 w-3 flex-shrink-0 rounded-full shadow-sm", cfg.dot)} />
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.badge)}>{cfg.label}</span>
        </div>

        <p className="text-base font-bold leading-tight text-surface-text">{mesa.nombre}</p>
        <p className="mt-0.5 text-xs text-surface-muted">{mesa.sala.nombre}</p>

        {pedido ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-2xl font-black text-red-700 leading-none tracking-tight">
              {formatCurrency(pedido.total)}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-surface-muted">
                <Users size={11} />
                <span>{pedido._count.detalles} prod.</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-surface-muted">
                <Clock size={11} />
                <span>{timeAgo(pedido.creadoEn)}</span>
              </div>
            </div>
            {/* Grupos con sus totales */}
            {pedido.grupos && pedido.grupos.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {pedido.grupos.map(({ grupo, total: gt }) => {
                  const color = GRUPO_COLORS[grupo] ?? "#6b7280";
                  return (
                    <span
                      key={grupo}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {grupo} · {formatCurrency(gt)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-1 text-xs text-surface-muted">
            <Users size={12} />
            <span>Cap. {mesa.capacidad}</span>
          </div>
        )}

        <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <ChevronRight size={14} className="text-surface-muted" />
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(estadoConfig) as EstadoMesa[]).map((estado) => {
          const cfg = estadoConfig[estado];
          return (
            <div key={estado} className={cn("rounded-2xl border px-4 py-3", cfg.card)}>
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", cfg.dot)} />
                <span className="text-sm font-semibold text-surface-text">{cfg.summary}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-surface-text">{countPorEstado[estado]}</p>
            </div>
          );
        })}
      </div>

      {salas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {salasRegulares.map((sala) => {
            const activas = activasPorSala(sala.nombre);
            return (
              <button
                key={sala.nombre}
                onClick={() => setSalaFiltro(sala.nombre)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5",
                  salaFiltro === sala.nombre ? "bg-brand-600 text-white" : "border border-surface-border bg-white text-surface-muted hover:bg-surface-bg"
                )}
              >
                {sala.nombre}
                {activas > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    salaFiltro === sala.nombre ? "bg-white/25 text-white" : "bg-brand-100 text-brand-700"
                  )}>
                    {activas}
                  </span>
                )}
              </button>
            );
          })}

          {salasRegulares.length > 0 && salasQR.length > 0 && (
            <div className="flex items-center px-1">
              <div className="h-5 w-px bg-surface-border" />
            </div>
          )}

          {salasQR.map((sala) => {
            const activas = activasPorSala(sala.nombre);
            return (
              <button
                key={sala.nombre}
                onClick={() => setSalaFiltro(sala.nombre)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5",
                  salaFiltro === sala.nombre
                    ? "bg-blue-600 text-white"
                    : "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                )}
              >
                <QrCode size={12} />
                {sala.nombre}
                {activas > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    salaFiltro === sala.nombre ? "bg-white/25 text-white" : "bg-blue-200 text-blue-700"
                  )}>
                    {activas}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {mesasFiltradas.map(renderMesaCard)}
      </div>
    </div>
  );
}
