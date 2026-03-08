"use client";

import { useState } from "react";
import { X, CreditCard, Banknote, ArrowLeftRight, Loader2, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import type { MetodoPago } from "@/types";

interface Props {
  simbolo?: string;
  cajaId?: number;
  usuarioId: number;
  onClose: () => void;
  onSuccess: (ventaId: number) => void;
}

const metodos: { key: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { key: "EFECTIVO", label: "Efectivo", icon: <Banknote size={18} /> },
  { key: "TARJETA", label: "Tarjeta", icon: <CreditCard size={18} /> },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: <ArrowLeftRight size={18} /> },
];

export function CheckoutModal({ simbolo = "$", cajaId, usuarioId, onClose, onSuccess }: Props) {
  const {
    items, total, subtotal, totalDescuento, totalIva,
    descuento, setDescuento, ivaPorc, setIva, mesaId, clienteId, clear
  } = useCartStore();

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const tot = total();
  const vuelto = efectivoRecibido ? Math.max(0, Number(efectivoRecibido) - tot) : 0;

  async function handleConfirmar() {
    if (items.length === 0) return;
    setLoading(true);
    setError("");

    const body = {
      cajaId,
      clienteId,
      usuarioId,
      mesaId,
      metodoPago,
      subtotal: subtotal(),
      descuento: totalDescuento(),
      impuesto: totalIva(),
      total: tot,
      items: items.map((i) => ({
        productoId: i.tipo === "producto" ? i.id : null,
        comboId: i.tipo === "combo" ? i.id : null,
        cantidad: i.cantidad,
        precio: i.precio,
        subtotal: i.precio * i.cantidad,
      })),
    };

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al registrar venta");
      }

      const venta = await res.json();
      setSuccess(true);
      clear();
      setTimeout(() => onSuccess(venta.id), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">¡Venta registrada!</h2>
          <p className="text-zinc-500 text-sm">Total cobrado: {formatCurrency(tot, simbolo)}</p>
          {vuelto > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-emerald-700 font-semibold">
              Vuelto: {formatCurrency(vuelto, simbolo)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900 text-lg">Confirmar Pago</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Resumen */}
          <div className="bg-zinc-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal ({items.length} productos)</span>
              <span>{formatCurrency(subtotal(), simbolo)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento</span>
                <span>- {formatCurrency(totalDescuento(), simbolo)}</span>
              </div>
            )}
            {ivaPorc > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>IVA ({ivaPorc}%)</span>
                <span>{formatCurrency(totalIva(), simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-zinc-900 text-base border-t border-zinc-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(tot, simbolo)}</span>
            </div>
          </div>

          {/* Ajustes descuento / IVA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Descuento (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={descuento}
                onChange={(e) => setDescuento(Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">IVA (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={ivaPorc}
                onChange={(e) => setIva(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="label">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {metodos.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetodoPago(m.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    metodoPago === m.key
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Efectivo recibido */}
          {metodoPago === "EFECTIVO" && (
            <div>
              <label className="label">Efectivo recibido</label>
              <input
                type="number"
                placeholder={`Min. ${formatCurrency(tot, simbolo)}`}
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(e.target.value)}
                className="input text-lg font-semibold"
              />
              {vuelto > 0 && (
                <p className="mt-1.5 text-sm font-semibold text-emerald-600">
                  Vuelto: {formatCurrency(vuelto, simbolo)}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={loading || items.length === 0}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {loading ? "Registrando..." : `Cobrar ${formatCurrency(tot, simbolo)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
