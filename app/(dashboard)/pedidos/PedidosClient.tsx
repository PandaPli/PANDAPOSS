"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OrderCard } from "@/components/pedidos/OrderCard";
import type { PedidoConDetalles, TipoPedido, EstadoPedido } from "@/types";
import { ChefHat, Wine, Bike, UtensilsCrossed, RefreshCw, Clock, PlaySquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKdsUI, KdsFilter } from "@/stores/kdsStore";
import type { Rol } from "@/types";

const tipoTabs: { key: TipoPedido | "TODOS"; label: string; icon: React.ReactNode }[] = [
  { key: "TODOS", label: "Todos", icon: <UtensilsCrossed size={16} /> },
  { key: "COCINA", label: "Cocina", icon: <ChefHat size={16} /> },
  { key: "BAR", label: "Bar", icon: <Wine size={16} /> },
  { key: "DELIVERY", label: "Delivery", icon: <Bike size={16} /> },
];

const estadoTabs: { key: KdsFilter; label: string; icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string }[] = [
  { key: "PENDIENTE", label: "Pendientes", icon: <Clock size={16} />, colorClass: "text-brand-600", bgClass: "bg-brand-50 hover:bg-brand-100", borderClass: "border-brand-200" },
  { key: "EN_PROCESO", label: "En Preparación", icon: <PlaySquare size={16} />, colorClass: "text-amber-600", bgClass: "bg-amber-50 hover:bg-amber-100", borderClass: "border-amber-200" },
  { key: "LISTO", label: "Listos", icon: <CheckCircle2 size={16} />, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 hover:bg-emerald-100", borderClass: "border-emerald-200" },
];

/* Role default filters logic
 * If the user is a Mesero, they might default to some view or only care about their tables.
 * For now, we apply standard logic.
 */

interface Props {
  pedidos: PedidoConDetalles[];
  rol?: Rol;
  welcome?: { emoji: string; msg: string } | null;
}

export function PedidosClient({ pedidos: initial, rol, welcome }: Props) {
  const isDelivery = rol === "DELIVERY";
  const { filter, setFilter } = useKdsUI();

  // Set default initial list, filtered down instantly on frontend
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>(initial);

  // Default tipo tab by role
  const defaultTipo: TipoPedido | "TODOS" =
    isDelivery     ? "DELIVERY" :
    rol === "CHEF" ? "COCINA"   :
    rol === "BAR"  ? "BAR"      :
    "TODOS";
  const [tipoFiltro, setTipoFiltro] = useState<TipoPedido | "TODOS">(defaultTipo);

  const fetchPedidos = useCallback(async () => {
    try {
      // Fetch only the requests for the current filter state to save bandwidth
      const res = await fetch(`/api/pedidos?estado=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [filter]);

  useEffect(() => {
    // Whenever the filter changes, fetch latest.
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  // First local filter for the UI (Instant feedback before fetch completes, and also correctly handles local initial state)
  const filtrados = pedidos.filter((p) => {
    const matchEstado = p.estado === filter;
    const matchTipo = tipoFiltro === "TODOS" || p.tipo === tipoFiltro;
    return matchEstado && matchTipo;
  });

  async function handleUpdateEstado(id: number, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    
    // Optimistic update
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado, meseroLlamado: estado === "ENTREGADO" ? false : p.meseroLlamado }
          : p
      )
    );
    
    // Trigger refresh immediately across all states (if we transition a state, it should vanish from current view immediately)
    if (estado === "ENTREGADO") {
      setTimeout(fetchPedidos, 500);
    }
  }

  async function handleLlamarMesero(id: number) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meseroLlamado: true, estado: "LISTO" }),
    });
    // Optimistic
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, meseroLlamado: true, estado: "LISTO" } : p
      )
    );
  }

  return (
    <div className="space-y-2">
      {/* Barra de filtros compacta */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Estado */}
        <div className="flex items-center gap-1 p-1 bg-surface-background border border-surface-border rounded-lg">
          {estadoTabs.map((tab) => {
            const isActive = filter === tab.key;
            const cnt = pedidos.filter(p => p.estado === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  isActive
                    ? `bg-white shadow-sm ${tab.colorClass}`
                    : "text-surface-muted hover:text-surface-text hover:bg-surface-border/50"
                )}
              >
                {tab.icon}
                {tab.label}
                {cnt > 0 && (
                  <span className={cn("text-[10px] rounded-full px-1.5 min-w-[18px] text-center font-bold",
                    isActive ? "bg-current/10" : "bg-slate-100 text-slate-600"
                  )}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Separador */}
        <span className="w-px h-6 bg-surface-border" />

        {/* Tipo */}
        {tipoTabs.map((tab) => {
          const count = tab.key === "TODOS"
            ? pedidos.filter(p => p.estado === filter).length
            : pedidos.filter(p => p.tipo === tab.key && p.estado === filter).length;
          return (
            <button
              key={tab.key}
              onClick={() => setTipoFiltro(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                tipoFiltro === tab.key
                  ? "bg-slate-800 text-white border-slate-900"
                  : "bg-white border-surface-border text-surface-muted hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={cn("text-[10px] rounded-full px-1.5 min-w-[18px] text-center font-bold",
                  tipoFiltro === tab.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                )}>{count}</span>
              )}
            </button>
          );
        })}

        <button
          onClick={fetchPedidos}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-surface-muted hover:text-brand-600 transition-colors bg-white border border-surface-border px-3 py-1.5 rounded-lg hover:bg-brand-50"
          title="Actualizar"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Grid KDS */}
      {filtrados.length === 0 ? (
        <div className="card p-10 text-center shadow-sm">
          <img src="/logo.png" alt="PandaPoss" className="w-12 h-12 mx-auto mb-3 opacity-40 grayscale" />
          <p className="text-surface-text font-semibold">No hay pedidos {filter.replace('_', ' ').toLowerCase()}</p>
          <p className="text-surface-muted text-xs mt-1">Actualizando automáticamente…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {filtrados.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              onUpdateEstado={handleUpdateEstado}
              onLlamarMesero={handleLlamarMesero}
              isDelivery={isDelivery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

