"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TableMap } from "@/components/pos/TableMap";
import { InactivityScreen } from "@/components/InactivityScreen";
import type { MesaConEstado } from "@/types";
import { X, ShoppingCart, Plus, Maximize, Minimize, LogIn, Trash2, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Props {
  mesas: MesaConEstado[];
}

interface ItemPreview {
  nombre: string;
  cantidad: number;
}

export function MesasClient({ mesas }: Props) {
  const router = useRouter();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConEstado | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [itemsPreview, setItemsPreview] = useState<ItemPreview[]>([]);
  const [loadingBorrar, setLoadingBorrar] = useState(false);
  const [liberando, setLiberando] = useState(false);

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

  async function handleBorrarMesa() {
    if (!mesaSeleccionada) return;
    setLoadingBorrar(true);
    try {
      const res = await fetch(`/api/mesas/${mesaSeleccionada.id}`);
      const data = await res.json();
      setItemsPreview(data.items ?? []);
      setShowConfirmar(true);
    } finally {
      setLoadingBorrar(false);
    }
  }

  async function confirmarLiberar() {
    if (!mesaSeleccionada) return;
    setLiberando(true);
    try {
      await fetch(`/api/mesas/${mesaSeleccionada.id}`, { method: "DELETE" });
      setShowConfirmar(false);
      setMesaSeleccionada(null);
      router.refresh();
    } finally {
      setLiberando(false);
    }
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

                  {/* Entrar a la Mesa — acción principal */}
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
                  >
                    <LogIn size={17} />
                    Entrar a la Mesa
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                      className="btn-primary justify-center text-sm py-2.5"
                    >
                      <ShoppingCart size={15} />
                      Cobrar
                    </a>
                    <a
                      href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                      className="btn-secondary justify-center text-sm py-2.5"
                    >
                      <Plus size={15} />
                      Agregar
                    </a>
                  </div>

                  {/* Borrar y Liberar Mesa */}
                  <button
                    onClick={handleBorrarMesa}
                    disabled={loadingBorrar}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    {loadingBorrar ? "Cargando..." : "Borrar y Liberar Mesa"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-surface-muted text-sm text-center py-2">Mesa disponible</p>
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
                  >
                    <LogIn size={17} />
                    Entrar a la Mesa
                  </a>
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
      {/* Modal de confirmación — Borrar y Liberar Mesa */}
      {showConfirmar && mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-surface-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-surface-text">Borrar y Liberar Mesa</h3>
                <p className="text-sm text-surface-muted">{mesaSeleccionada.nombre}</p>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-surface-muted">
                Se eliminarán los siguientes productos del pedido activo:
              </p>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-surface-border divide-y divide-surface-border">
                {itemsPreview.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-surface-muted text-center">Sin productos</p>
                ) : (
                  itemsPreview.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-surface-text">{item.nombre}</span>
                      <span className="text-sm font-medium text-surface-muted">×{item.cantidad}</span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-red-500 font-medium">
                Esta acción no se puede deshacer. La mesa quedará libre.
              </p>
            </div>

            {/* Botones */}
            <div className="grid grid-cols-2 gap-3 p-5 pt-0">
              <button
                onClick={() => setShowConfirmar(false)}
                disabled={liberando}
                className="btn-secondary justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarLiberar}
                disabled={liberando}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {liberando ? "Liberando..." : "Sí, Borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </InactivityScreen>
  );
}



