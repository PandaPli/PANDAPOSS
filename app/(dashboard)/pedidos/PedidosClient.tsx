"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderCard } from "@/components/pedidos/OrderCard";
import type { PedidoConDetalles, TipoPedido, EstadoPedido } from "@/types";
import {
  ChefHat, Wine, Bike, UtensilsCrossed, RefreshCw,
  Clock, PlaySquare, CheckCircle2, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKdsUI, KdsFilter } from "@/stores/kdsStore";
import type { Rol } from "@/types";

const tipoTabs: { key: TipoPedido | "TODOS"; label: string; icon: React.ReactNode }[] = [
  { key: "TODOS",    label: "Todos",     icon: <UtensilsCrossed size={15} /> },
  { key: "COCINA",   label: "Cocina",    icon: <ChefHat size={15} /> },
  { key: "BAR",      label: "Bar",       icon: <Wine size={15} /> },
  { key: "DELIVERY", label: "Delivery",  icon: <Bike size={15} /> },
];

const estadoTabs: {
  key: KdsFilter; label: string; icon: React.ReactNode;
  activeGradient: string; dot: string;
}[] = [
  {
    key: "PENDIENTE",  label: "Pendientes",     icon: <Clock size={16} />,
    activeGradient: "from-brand-600 to-brand-700",   dot: "bg-brand-400",
  },
  {
    key: "EN_PROCESO", label: "En preparación", icon: <PlaySquare size={16} />,
    activeGradient: "from-amber-500 to-orange-600",  dot: "bg-amber-400",
  },
  {
    key: "LISTO",      label: "Listos",          icon: <CheckCircle2 size={16} />,
    activeGradient: "from-emerald-600 to-teal-600",  dot: "bg-emerald-400",
  },
];

interface Props {
  pedidos: PedidoConDetalles[];
  rol?: Rol;
  sucursalNombre?: string | null;
  sucursalRut?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalGiroComercial?: string | null;
}

export function PedidosClient({ pedidos: initial, rol, sucursalNombre, sucursalRut, sucursalTelefono, sucursalDireccion, sucursalGiroComercial }: Props) {
  const isDelivery = rol === "DELIVERY";
  const { filter, setFilter } = useKdsUI();
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>(initial);
  const [refreshing, setRefreshing] = useState(false);

  const defaultTipo: TipoPedido | "TODOS" =
    isDelivery     ? "DELIVERY" :
    rol === "CHEF" ? "COCINA"   :
    rol === "BAR"  ? "BAR"      : "TODOS";
  const [tipoFiltro, setTipoFiltro] = useState<TipoPedido | "TODOS">(defaultTipo);

  const fetchPedidos = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(`/api/pedidos?estado=${filter}`);
      if (res.ok) setPedidos(await res.json());
    } catch { /* ignore */ }
    finally { if (showSpinner) setRefreshing(false); }
  }, [filter]);

  useEffect(() => {
    fetchPedidos();
    const id = setInterval(fetchPedidos, 30_000);
    return () => clearInterval(id);
  }, [fetchPedidos]);

  const filtrados = pedidos.filter((p) => {
    const matchEstado = p.estado === filter;
    const matchTipo   = tipoFiltro === "TODOS" || p.tipo === tipoFiltro;
    return matchEstado && matchTipo;
  });

  async function handleUpdateEstado(id: number, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setPedidos((prev) => prev.map((p) =>
      p.id === id ? { ...p, estado, meseroLlamado: estado === "ENTREGADO" ? false : p.meseroLlamado } : p
    ));
    if (estado === "ENTREGADO") setTimeout(fetchPedidos, 500);
  }

  async function handleLlamarMesero(id: number) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meseroLlamado: true, estado: "LISTO" }),
    });
    setPedidos((prev) => prev.map((p) =>
      p.id === id ? { ...p, meseroLlamado: true, estado: "LISTO" } : p
    ));
  }

  const activeTab = estadoTabs.find(t => t.key === filter)!;

  // Contadores por tipo para el filtro activo
  function countFor(tipo: TipoPedido | "TODOS") {
    return tipo === "TODOS"
      ? pedidos.filter(p => p.estado === filter).length
      : pedidos.filter(p => p.tipo === tipo && p.estado === filter).length;
  }

  return (
    // Fondo oscuro KDS — cubre toda el área de contenido
    <div className="min-h-screen bg-slate-900 -mx-6 -mt-6 px-5 pt-5 pb-8 space-y-5">

      {/* ── Barra superior KDS ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* Tabs de estado — grandes y táctiles */}
        <div className="grid grid-cols-3 gap-2 flex-1 max-w-xl">
          {estadoTabs.map((tab) => {
            const isActive = filter === tab.key;
            const count = pedidos.filter(p => p.estado === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-2xl h-13 px-3 py-3 text-sm font-bold transition-all active:scale-95",
                  isActive
                    ? `bg-gradient-to-br ${tab.activeGradient} text-white shadow-lg`
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[22px] rounded-full px-1.5 text-center text-[11px] font-black tabular-nums",
                    isActive ? "bg-white text-slate-900" : "bg-slate-600 text-white"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filtro tipo + refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {tipoTabs.map((tab) => {
            const count = countFor(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setTipoFiltro(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl h-10 px-3.5 text-xs font-bold transition-all active:scale-95",
                  tipoFiltro === tab.key
                    ? "bg-white text-slate-900 shadow"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                )}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                    tipoFiltro === tab.key ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-300"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => void fetchPedidos(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl h-10 px-3.5 text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── Título de sección ── */}
      <div className="flex items-center gap-3">
        <span className={cn("h-3 w-3 rounded-full shrink-0", activeTab.dot)} />
        <h3 className="text-base font-black text-white tracking-wide">{activeTab.label}</h3>
        <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-black text-slate-300 tabular-nums">
          {filtrados.length}
        </span>
        <div className="flex-1 h-px bg-slate-700/60" />
      </div>

      {/* ── Grid de pedidos ── */}
      {filtrados.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-800/50 text-center">
          <img src="/logo.png" alt="PandaPoss" className="w-16 h-16 mx-auto mb-4 opacity-20 grayscale" />
          <p className="text-slate-400 font-bold text-lg">Sin pedidos {filter.replace("_", " ").toLowerCase()}</p>
          <p className="text-slate-600 text-sm mt-1">Actualizando automáticamente cada 30 segundos…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtrados.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              onUpdateEstado={handleUpdateEstado}
              onLlamarMesero={handleLlamarMesero}
              isDelivery={isDelivery}
              sucursalNombre={sucursalNombre}
              sucursalRut={sucursalRut}
              sucursalTelefono={sucursalTelefono}
              sucursalDireccion={sucursalDireccion}
              sucursalGiroComercial={sucursalGiroComercial}
            />
          ))}
        </div>
      )}
    </div>
  );
}
