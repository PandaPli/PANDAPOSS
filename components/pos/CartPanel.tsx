"use client";

import { useCallback, useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, Receipt, Send, FileText, Loader2, Ban, Check } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

interface Props {
  simbolo?: string;
  onCheckout: () => void;
  onOrden: () => void;
  onPrecuenta: () => void;
  ordenLoading?: boolean;
  canCancelItems?: boolean;
}

/** Llama al API para persistir el cambio de un detalle en DB → KDS lo verá en próximo poll */
async function syncDetalle(detalleId: number, patch: { cancelado?: boolean; cantidad?: number; observacion?: string | null }) {
  await fetch(`/api/pedidos/detalles/${detalleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => {}); // silencioso — el carrito local ya se actualizó
}

export function CartPanel({ simbolo = "$", onCheckout, onOrden, onPrecuenta, ordenLoading, canCancelItems = false }: Props) {
  const { items, removeItem, updateCantidad, updateObservacion, cancelItem, subtotal, totalDescuento, totalIva, total, descuento, ivaPorc, pedidoId } =
    useCartStore();

  // Track observaciones "sucias" para ítems guardados (para mostrar botón guardar nota)
  const [dirtyObs, setDirtyObs] = useState<Record<string, string>>({});

  const sub  = subtotal();
  const desc = totalDescuento();
  const iva  = totalIva();
  const tot  = total();

  const itemKey = (item: CartItem) => `${item.tipo}-${item.id}`;

  /** Anular / reactivar ítem guardado → sincroniza con KDS inmediatamente */
  const handleCancel = useCallback(async (item: CartItem) => {
    const newCancelado = !item.cancelado;
    cancelItem(item.id, item.tipo);
    if (item.detalleId) {
      await syncDetalle(item.detalleId, { cancelado: newCancelado });
    }
  }, [cancelItem]);

  /** Guardar cambio de observación de ítem ya enviado a cocina */
  const handleSaveObs = useCallback(async (item: CartItem) => {
    const key = itemKey(item);
    const nuevaObs = dirtyObs[key] ?? item.observacion ?? "";
    updateObservacion(item.id, item.tipo, nuevaObs);
    setDirtyObs((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (item.detalleId) {
      await syncDetalle(item.detalleId, { observacion: nuevaObs || null });
    }
  }, [dirtyObs, updateObservacion]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-surface-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-surface-border">
        <ShoppingCart size={18} className="text-brand-500" />
        <h2 className="font-bold text-surface-text">Carrito</h2>
        {items.length > 0 && (
          <span className="ml-auto bg-brand-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </div>

      {/* Pedido vinculado */}
      {pedidoId && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex items-center gap-1.5">
          <Send size={12} />
          Orden #{pedidoId} enviada a cocina
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-muted">
            <ShoppingCart size={36} className="mb-2 opacity-30" />
            <p className="text-sm">El carrito esta vacio</p>
            <p className="text-xs mt-1 opacity-60">Selecciona productos del menu</p>
          </div>
        ) : (
          items.map((item) => {
            const key = itemKey(item);
            const obsValue = dirtyObs[key] ?? item.observacion ?? "";
            const obsDirty = key in dirtyObs && dirtyObs[key] !== (item.observacion ?? "");

            return (
              <div
                key={key}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${item.cancelado ? "bg-gray-100 opacity-60" : "bg-surface-bg"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold truncate ${item.cancelado ? "line-through text-gray-400" : "text-surface-text"}`}>
                      {item.nombre}
                    </p>
                    {item.cancelado ? (
                      <span className="bg-red-100 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold">ANULADO</span>
                    ) : item.guardado ? (
                      <span title="Enviado a cocina" className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">ENVIADO</span>
                    ) : null}
                  </div>

                  <p className={`text-xs font-medium mt-0.5 ${item.cancelado ? "line-through text-gray-400" : "text-brand-500"}`}>
                    {formatCurrency(item.precio * item.cantidad, simbolo)}
                  </p>

                  {!item.cancelado && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <input
                        type="text"
                        value={obsValue}
                        onChange={(e) => {
                          if (item.guardado) {
                            setDirtyObs((prev) => ({ ...prev, [key]: e.target.value }));
                          } else {
                            updateObservacion(item.id, item.tipo, e.target.value);
                          }
                        }}
                        placeholder="Nota: sin sal, poco hielo..."
                        className="flex-1 text-xs px-2 py-1 rounded-lg border border-surface-border bg-white text-surface-text placeholder:text-surface-muted focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
                      />
                      {/* Botón guardar nota solo si el ítem ya está en cocina y la nota cambió */}
                      {item.guardado && obsDirty && (
                        <button
                          onClick={() => handleSaveObs(item)}
                          title="Enviar nota a cocina"
                          className="w-6 h-6 rounded-md bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-all flex-shrink-0"
                        >
                          <Check size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Ítems NO guardados: controles normales */}
                  {!item.guardado && !item.cancelado && (
                    <>
                      <button
                        onClick={() => updateCantidad(item.id, item.tipo, item.cantidad - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-brand-50 hover:border-brand-200 transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                      <button
                        onClick={() => updateCantidad(item.id, item.tipo, item.cantidad + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-brand-50 hover:border-brand-200 transition-all"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id, item.tipo)}
                        className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-all ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}

                  {/* Ítems GUARDADOS con permiso: solo botón anular */}
                  {item.guardado && canCancelItems && (
                    <button
                      onClick={() => handleCancel(item)}
                      title={item.cancelado ? "Reactivar producto" : "Anular producto"}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ml-1 ${
                        item.cancelado
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "text-red-400 hover:bg-red-50"
                      }`}
                    >
                      <Ban size={12} />
                    </button>
                  )}

                  {/* Ítems GUARDADOS sin permiso: solo mostrar cantidad */}
                  {item.guardado && !canCancelItems && !item.cancelado && (
                    <span className="w-5 text-center text-sm font-bold text-surface-muted">{item.cantidad}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Totales + Botones */}
      {items.length > 0 && (
        <div className="p-4 border-t border-surface-border space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-surface-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(sub, simbolo)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento ({descuento}%)</span>
                <span>- {formatCurrency(desc, simbolo)}</span>
              </div>
            )}
            {ivaPorc > 0 && (
              <div className="flex justify-between text-surface-muted">
                <span>IVA ({ivaPorc}%)</span>
                <span>{formatCurrency(iva, simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-surface-text text-base pt-1.5 border-t border-surface-border">
              <span>Total</span>
              <span className="text-brand-500">{formatCurrency(tot, simbolo)}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOrden}
              disabled={ordenLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-all disabled:opacity-50"
            >
              {ordenLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Orden
            </button>
            <button
              onClick={onPrecuenta}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-surface-border bg-surface-bg text-surface-text text-sm font-semibold hover:bg-white hover:border-brand-200 transition-all"
            >
              <FileText size={15} />
              Precuenta
            </button>
          </div>

          <button
            onClick={onCheckout}
            className="btn-primary w-full justify-center text-base py-3"
          >
            <Receipt size={18} />
            Cobrar
          </button>
        </div>
      )}
    </div>
  );
}
