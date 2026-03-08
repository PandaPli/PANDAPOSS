"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OrderCard } from "@/components/pedidos/OrderCard";
import type { PedidoConDetalles, TipoPedido, EstadoPedido } from "@/types";
import { ChefHat, Wine, CakeSlice, Bike, UtensilsCrossed, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const tipoTabs: { key: TipoPedido | "TODOS"; label: string; icon: React.ReactNode }[] = [
  { key: "TODOS", label: "Todos", icon: <UtensilsCrossed size={16} /> },
  { key: "COCINA", label: "Cocina", icon: <ChefHat size={16} /> },
  { key: "BAR", label: "Bar", icon: <Wine size={16} /> },
  { key: "REPOSTERIA", label: "Repostería", icon: <CakeSlice size={16} /> },
  { key: "DELIVERY", label: "Delivery", icon: <Bike size={16} /> },
];

interface Props {
  pedidos: PedidoConDetalles[];
}

export function PedidosClient({ pedidos: initial }: Props) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(initial);
  const [tipoFiltro, setTipoFiltro] = useState<TipoPedido | "TODOS">("TODOS");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh cada 30 segundos
  const refresh = useCallback(() => {
    router.refresh();
    setLastRefresh(new Date());
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    setPedidos(initial);
  }, [initial]);

  const filtrados = tipoFiltro === "TODOS"
    ? pedidos
    : pedidos.filter((p) => p.tipo === tipoFiltro);

  const pendientes = filtrados.filter((p) => p.estado === "PENDIENTE").length;
  const enProceso = filtrados.filter((p) => p.estado === "EN_PROCESO").length;
  const listos = filtrados.filter((p) => p.estado === "LISTO").length;

  async function handleUpdateEstado(id: number, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    // Actualizar local
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado } : p))
    );
    if (estado === "ENTREGADO") {
      setTimeout(refresh, 500);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tabs tipo */}
      <div className="flex items-center gap-2 flex-wrap">
        {tipoTabs.map((tab) => {
          const count = tab.key === "TODOS"
            ? pedidos.length
            : pedidos.filter((p) => p.tipo === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setTipoFiltro(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                tipoFiltro === tab.key
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-bold",
                  tipoFiltro === tab.key ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={refresh}
          className="ml-auto flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          title="Actualizar"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Resumen de estados */}
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-amber-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {pendientes} pendiente{pendientes !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          {enProceso} en proceso
        </span>
        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {listos} listo{listos !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Columnas KDS */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <ChefHat size={40} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-zinc-400 font-medium">Sin pedidos activos</p>
          <p className="text-zinc-300 text-sm mt-1">Los pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              onUpdateEstado={handleUpdateEstado}
            />
          ))}
        </div>
      )}
    </div>
  );
}
