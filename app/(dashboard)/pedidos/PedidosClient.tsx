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
  { key: "REPOSTERIA", label: "Reposteria", icon: <CakeSlice size={16} /> },
  { key: "DELIVERY", label: "Delivery", icon: <Bike size={16} /> },
];

interface Props {
  pedidos: PedidoConDetalles[];
}

export function PedidosClient({ pedidos: initial }: Props) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(initial);
  const [tipoFiltro, setTipoFiltro] = useState<TipoPedido | "TODOS">("TODOS");
  const [, setLastRefresh] = useState(new Date());

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

  const pendientes = filtrados.filter((p) => p.estado === "PENDIENTE");
  const enProceso = filtrados.filter((p) => p.estado === "EN_PROCESO");
  const listos = filtrados.filter((p) => p.estado === "LISTO");

  async function handleUpdateEstado(id: number, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
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
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                tipoFiltro === tab.key
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-white border border-surface-border text-surface-muted hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200"
              )}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs rounded-full px-2 py-0.5 min-w-[22px] text-center font-bold",
                  tipoFiltro === tab.key ? "bg-white/25 text-white" : "bg-brand-100 text-brand-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={refresh}
          className="ml-auto flex items-center gap-2 text-xs text-surface-muted hover:text-brand-600 transition-colors bg-white border border-surface-border px-3 py-2 rounded-xl hover:bg-brand-50"
          title="Actualizar"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Columnas KDS */}
      {filtrados.length === 0 ? (
        <div className="card p-16 text-center">
          <img src="/logo.png" alt="PandaPoss" className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-surface-text font-semibold text-lg">Sin pedidos activos</p>
          <p className="text-surface-muted text-sm mt-1">Los pedidos apareceran aqui automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Pendientes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <h3 className="font-bold text-surface-text">Pendientes</h3>
              <span className="text-xs font-bold bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                {pendientes.length}
              </span>
            </div>
            {pendientes.length === 0 ? (
              <div className="card p-8 text-center border-dashed">
                <p className="text-surface-muted text-sm">Sin pedidos pendientes</p>
              </div>
            ) : (
              pendientes.map((pedido) => (
                <OrderCard key={pedido.id} pedido={pedido} onUpdateEstado={handleUpdateEstado} />
              ))
            )}
          </div>

          {/* Columna En Preparacion */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="font-bold text-surface-text">En Preparacion</h3>
              <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                {enProceso.length}
              </span>
            </div>
            {enProceso.length === 0 ? (
              <div className="card p-8 text-center border-dashed">
                <p className="text-surface-muted text-sm">Nada en preparacion</p>
              </div>
            ) : (
              enProceso.map((pedido) => (
                <OrderCard key={pedido.id} pedido={pedido} onUpdateEstado={handleUpdateEstado} />
              ))
            )}
          </div>

          {/* Columna Listo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-surface-text">Listo para servir</h3>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                {listos.length}
              </span>
            </div>
            {listos.length === 0 ? (
              <div className="card p-8 text-center border-dashed">
                <p className="text-surface-muted text-sm">Nada listo aun</p>
              </div>
            ) : (
              listos.map((pedido) => (
                <OrderCard key={pedido.id} pedido={pedido} onUpdateEstado={handleUpdateEstado} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
