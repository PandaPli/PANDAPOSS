"use client";

import { Minus, Plus, Trash2, ShoppingCart, Receipt, Send, FileText, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";

interface Props {
  simbolo?: string;
  onCheckout: () => void;
  onOrden: () => void;
  onPrecuenta: () => void;
  ordenLoading?: boolean;
}

export function CartPanel({ simbolo = "$", onCheckout, onOrden, onPrecuenta, ordenLoading }: Props) {
  const { items, removeItem, updateCantidad, subtotal, totalDescuento, totalIva, total, descuento, ivaPorc, pedidoId } =
    useCartStore();

  const sub = subtotal();
  const desc = totalDescuento();
  const iva = totalIva();
  const tot = total();

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
          items.map((item) => (
            <div
              key={`${item.tipo}-${item.id}`}
              className="flex items-start gap-3 p-3 bg-surface-bg rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-text truncate">{item.nombre}</p>
                <p className="text-xs text-brand-500 font-medium mt-0.5">
                  {formatCurrency(item.precio * item.cantidad, simbolo)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
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
              </div>
            </div>
          ))
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
