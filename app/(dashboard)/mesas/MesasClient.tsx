"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TableMap } from "@/components/pos/TableMap";
import { InactivityScreen } from "@/components/InactivityScreen";
import type { MesaConEstado } from "@/types";
import { X, ShoppingCart, Plus, Maximize, Minimize } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Props {
  mesas: MesaConEstado[];
}

export function MesasClient({ mesas }: Props) {
  const router = useRouter();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConEstado | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  async function cambiarEstado(id: number, estado: string) {
    await fetch("/api/mesas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    router.refresh();
    setMesaSeleccionada(null);
  }

  return (
    <InactivityScreen>
      {/* Encabezado con botón fullscreen */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Atención</h1>
          <p className="text-surface-muted text-sm mt-1">Puntos de atención y estado de mesas</p>
        </div>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-medium text-surface-muted shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span className="hidden sm:inline">{isFullscreen ? "Salir" : "Pantalla completa"}</span>
        </button>
      </div>

      <TableMap mesas={mesas} onSelectMesa={setMesaSeleccionada} />

      {/* Modal detalle mesa */}
      {mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-bold text-surface-text text-lg">{mesaSeleccionada.nombre}</h2>
                <p className="text-sm text-surface-muted">{mesaSeleccionada.sala.nombre}</p>
              </div>
              <button
                onClick={() => setMesaSeleccionada(null)}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {mesaSeleccionada.pedidoActivo ? (
                <div className="space-y-3">
                  <div className="bg-surface-bg rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Pedido activo:</span>
                      <span className="font-medium">#{mesaSeleccionada.pedidoActivo.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Productos:</span>
                      <span className="font-medium">{mesaSeleccionada.pedidoActivo._count.detalles}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Desde:</span>
                      <span className="font-medium">{formatDateTime(mesaSeleccionada.pedidoActivo.creadoEn)}</span>
                    </div>
                  </div>

                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="btn-primary w-full justify-center"
                  >
                    <ShoppingCart size={16} />
                    Cobrar Mesa
                  </a>
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="btn-secondary w-full justify-center"
                  >
                    <Plus size={16} />
                    Agregar Productos
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-surface-muted text-sm text-center py-2">Mesa disponible</p>
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="btn-primary w-full justify-center"
                  >
                    <Plus size={16} />
                    Nueva Orden
                  </a>
                  <button
                    onClick={() => cambiarEstado(mesaSeleccionada.id, "RESERVADA")}
                    className="btn-secondary w-full justify-center"
                  >
                    Marcar como Reservada
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </InactivityScreen>
  );
}



