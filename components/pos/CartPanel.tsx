"use client";

import { Minus, Plus, Trash2, ShoppingCart, Receipt } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";

interface Props {
  simbolo?: string;
  onCheckout: () => void;
}

export function CartPanel({ simbolo = "$", onCheckout }: Props) {
  const { items, removeItem, updateCantidad, subtotal, totalDescuento, totalIva, total, descuento, ivaPorc } =
    useCartStore();

  const sub = subtotal();
  const desc = totalDescuento();
  const iva = totalIva();
  const tot = total();

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-100">
        <ShoppingCart size={18} className="text-brand-600" />
        <h2 className="font-bold text-zinc-900">Carrito</h2>
        {items.length > 0 && (
          <span className="ml-auto bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-300">
            <ShoppingCart size={36} className="mb-2" />
            <p className="text-sm">El carrito está vacío</p>
            <p className="text-xs mt-1">Selecciona productos del menú</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.tipo}-${item.id}`}
              className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 truncate">{item.nombre}</p>
                <p className="text-xs text-brand-600 font-medium mt-0.5">
                  {formatCurrency(item.precio * item.cantidad, simbolo)}
                </p>
              </div>

              {/* Cantidad */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => updateCantidad(item.id, item.tipo, item.cantidad - 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                <button
                  onClick={() => updateCantidad(item.id, item.tipo, item.cantidad + 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={() => removeItem(item.id, item.tipo)}
                  className="w-6 h-6 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totales */}
      {items.length > 0 && (
        <div className="p-4 border-t border-zinc-100 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-500">
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
              <div className="flex justify-between text-zinc-500">
                <span>IVA ({ivaPorc}%)</span>
                <span>{formatCurrency(iva, simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-zinc-900 text-base pt-1.5 border-t border-zinc-100">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(tot, simbolo)}</span>
            </div>
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
