"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableMap } from "@/components/pos/TableMap";
import type { MesaConEstado } from "@/types";
import { X, ShoppingCart, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Props {
  mesas: MesaConEstado[];
}

export function MesasClient({ mesas }: Props) {
  const router = useRouter();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConEstado | null>(null);

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
    <>
      <TableMap mesas={mesas} onSelectMesa={setMesaSeleccionada} />

      {/* Modal detalle mesa */}
      {mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="font-bold text-zinc-900 text-lg">{mesaSeleccionada.nombre}</h2>
                <p className="text-sm text-zinc-400">{mesaSeleccionada.sala.nombre}</p>
              </div>
              <button
                onClick={() => setMesaSeleccionada(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {mesaSeleccionada.pedidoActivo ? (
                <div className="space-y-3">
                  <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Pedido activo:</span>
                      <span className="font-medium">#{mesaSeleccionada.pedidoActivo.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Productos:</span>
                      <span className="font-medium">{mesaSeleccionada.pedidoActivo._count.detalles}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Desde:</span>
                      <span className="font-medium">{formatDateTime(mesaSeleccionada.pedidoActivo.creadoEn)}</span>
                    </div>
                  </div>

                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}&pedido=${mesaSeleccionada.pedidoActivo.id}`}
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
                  <p className="text-zinc-500 text-sm text-center py-2">Mesa disponible</p>
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
    </>
  );
}
