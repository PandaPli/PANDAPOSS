"use client";

import { useState } from "react";
import { X, CreditCard, Banknote, ArrowLeftRight, Loader2, CheckCircle2, Plus, Trash2, Printer } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import type { MetodoPago, PagoItem } from "@/types";

interface Props {
  simbolo?: string;
  cajaId?: number;
  usuarioId: number;
  onClose: () => void;
  onSuccess: (ventaId: number) => void;
}

const metodos: { key: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { key: "EFECTIVO", label: "Efectivo", icon: <Banknote size={16} /> },
  { key: "TARJETA", label: "Tarjeta", icon: <CreditCard size={16} /> },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: <ArrowLeftRight size={16} /> },
];

export function CheckoutModal({ simbolo = "$", cajaId, usuarioId, onClose, onSuccess }: Props) {
  const {
    items, total, subtotal, totalDescuento, totalIva,
    descuento, setDescuento, ivaPorc, setIva, mesaId, clienteId, pedidoId, clear
  } = useCartStore();

  // Pagos agregados
  const [pagos, setPagos] = useState<PagoItem[]>([]);
  const [metodoActual, setMetodoActual] = useState<MetodoPago>("EFECTIVO");
  const [montoActual, setMontoActual] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [vueltoFinal, setVueltoFinal] = useState(0);
  const [ventaInfo, setVentaInfo] = useState<{ id: number; numero: string } | null>(null);
  const [itemsSnapshot, setItemsSnapshot] = useState<typeof items>([]);

  const tot = total();
  const sumaPagos = pagos.reduce((acc, p) => acc + p.monto, 0);
  const pendiente = Math.max(0, tot - sumaPagos);
  const sobrepago = Math.max(0, sumaPagos - tot);

  function handleAgregarPago() {
    setError("");
    const monto = Number(montoActual);
    if (!montoActual || isNaN(monto) || monto <= 0) {
      setError("Ingrese un monto valido");
      return;
    }

    setPagos([...pagos, { metodoPago: metodoActual, monto }]);
    setMontoActual("");
  }

  function handlePagoTotal() {
    // Shortcut: agregar pago por el total pendiente
    if (pendiente <= 0) return;
    setPagos([...pagos, { metodoPago: metodoActual, monto: pendiente }]);
    setMontoActual("");
  }

  function handleEliminarPago(index: number) {
    setPagos(pagos.filter((_, i) => i !== index));
  }

  async function handleConfirmar() {
    if (items.length === 0) return;

    // Validar que hay pagos
    if (pagos.length === 0) {
      setError("Agregue al menos un metodo de pago");
      return;
    }

    // Validar que cubra el total
    if (sumaPagos < tot) {
      setError(`Falta ${formatCurrency(pendiente, simbolo)} por cubrir`);
      return;
    }

    setLoading(true);
    setError("");

    const metodoPagoFinal: MetodoPago = pagos.length > 1 ? "MIXTO" : pagos[0].metodoPago;

    const body = {
      cajaId,
      clienteId,
      usuarioId,
      mesaId,
      pedidoId: pedidoId || undefined,
      metodoPago: metodoPagoFinal,
      subtotal: subtotal(),
      descuento: totalDescuento(),
      impuesto: totalIva(),
      total: tot,
      pagos: pagos.map((p) => ({
        metodoPago: p.metodoPago,
        monto: p.monto,
        referencia: p.referencia,
      })),
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
        let errorMsg = "Error al registrar la venta";
        try {
          const d = await res.json();
          errorMsg = d.error ?? errorMsg;
        } catch {
          // La respuesta no es JSON
        }
        throw new Error(errorMsg);
      }

      const venta = await res.json();

      // Calcular vuelto (solo si hay efectivo y sobrepago)
      const tieneEfectivo = pagos.some((p) => p.metodoPago === "EFECTIVO");
      if (tieneEfectivo && sobrepago > 0) {
        setVueltoFinal(sobrepago);
      }

      // Guardar snapshot antes de limpiar el carrito
      setItemsSnapshot([...items]);
      setVentaInfo({ id: venta.id, numero: venta.numero ?? String(venta.id) });
      setSuccess(true);
      clear();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleImprimir(imprimir: boolean) {
    if (imprimir && ventaInfo) {
      const win = window.open("", "_blank", "width=400,height=600");
      if (win) {
        const fecha = new Date().toLocaleString("es-CL");
        const lineas = itemsSnapshot
          .map(
            (it) =>
              `<tr>
                <td style="padding:2px 4px">${it.nombre}</td>
                <td style="padding:2px 4px;text-align:center">${it.cantidad}</td>
                <td style="padding:2px 4px;text-align:right">${formatCurrency(it.precio * it.cantidad, simbolo)}</td>
              </tr>`
          )
          .join("");

        win.document.write(`
          <!DOCTYPE html><html><head>
          <meta charset="utf-8"/>
          <title>Boleta ${ventaInfo.numero}</title>
          <style>
            body{font-family:monospace;font-size:13px;margin:0;padding:16px;color:#111}
            h2{text-align:center;margin:0 0 4px}
            .center{text-align:center}
            .sep{border:none;border-top:1px dashed #999;margin:8px 0}
            table{width:100%;border-collapse:collapse}
            th{text-align:left;border-bottom:1px solid #ccc;padding:2px 4px;font-size:11px;color:#555}
            .total{font-weight:bold;font-size:15px}
            .vuelto{background:#d1fae5;padding:6px 8px;border-radius:6px;margin-top:8px;font-weight:bold;text-align:center}
          </style>
          </head><body>
          <h2>PandaPoss</h2>
          <p class="center" style="margin:0;font-size:12px;color:#555">Boleta N° ${ventaInfo.numero}</p>
          <p class="center" style="margin:4px 0 0;font-size:11px;color:#888">${fecha}</p>
          <hr class="sep"/>
          <table>
            <thead><tr>
              <th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio</th>
            </tr></thead>
            <tbody>${lineas}</tbody>
          </table>
          <hr class="sep"/>
          <table>
            <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(subtotal(), simbolo)}</td></tr>
            ${totalDescuento() > 0 ? `<tr><td>Descuento</td><td style="text-align:right">- ${formatCurrency(totalDescuento(), simbolo)}</td></tr>` : ""}
            ${totalIva() > 0 ? `<tr><td>IVA</td><td style="text-align:right">${formatCurrency(totalIva(), simbolo)}</td></tr>` : ""}
            <tr class="total"><td>TOTAL</td><td style="text-align:right">${formatCurrency(tot, simbolo)}</td></tr>
          </table>
          ${vueltoFinal > 0 ? `<div class="vuelto">Vuelto: ${formatCurrency(vueltoFinal, simbolo)}</div>` : ""}
          <hr class="sep"/>
          <p class="center" style="font-size:11px;color:#888;margin-top:8px">¡Gracias por su compra!</p>
          <script>window.onload=function(){window.print();window.close();}<\/script>
          </body></html>
        `);
        win.document.close();
      }
    }
    onSuccess(ventaInfo!.id);
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-surface-text mb-1">¡Venta completada!</h2>
          <p className="text-surface-muted text-sm">Total cobrado: {formatCurrency(tot, simbolo)}</p>
          {vueltoFinal > 0 && (
            <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-emerald-700 font-semibold">
              Vuelto: {formatCurrency(vueltoFinal, simbolo)}
            </div>
          )}

          {/* Pregunta de impresión */}
          <div className="mt-5 pt-5 border-t border-surface-border">
            <p className="text-sm font-semibold text-surface-text mb-3 flex items-center justify-center gap-2">
              <Printer size={16} className="text-surface-muted" />
              ¿Desea imprimir la boleta?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleImprimir(true)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all"
              >
                <Printer size={15} /> Sí, imprimir
              </button>
              <button
                onClick={() => handleImprimir(false)}
                className="py-2.5 rounded-xl border border-surface-border text-surface-muted hover:bg-surface-bg font-semibold text-sm transition-all"
              >
                No, continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-surface-text text-lg">Confirmar Pago</h2>
          <button
            onClick={onClose}
            className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Resumen */}
          <div className="bg-surface-bg rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-surface-muted">
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
              <div className="flex justify-between text-surface-muted">
                <span>IVA ({ivaPorc}%)</span>
                <span>{formatCurrency(totalIva(), simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-surface-text text-base border-t border-surface-border pt-2 mt-2">
              <span>Total</span>
              <span className="text-brand-500">{formatCurrency(tot, simbolo)}</span>
            </div>
          </div>

          {/* Ajustes */}
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

          {/* Pagos agregados */}
          {pagos.length > 0 && (
            <div>
              <label className="label">Pagos agregados</label>
              <div className="space-y-2">
                {pagos.map((pago, i) => {
                  const m = metodos.find((m) => m.key === pago.metodoPago);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">{m?.icon}</span>
                        <span className="text-sm font-semibold text-emerald-700">{m?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-700">
                          {formatCurrency(pago.monto, simbolo)}
                        </span>
                        <button
                          onClick={() => handleEliminarPago(i)}
                          className="w-6 h-6 rounded-lg text-red-400 hover:bg-red-100 flex items-center justify-center transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pendiente / Sobrepago */}
                <div className={`flex justify-between text-sm font-semibold px-1 ${pendiente > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  <span>{pendiente > 0 ? "Pendiente" : "Cubierto"}</span>
                  <span>
                    {pendiente > 0
                      ? formatCurrency(pendiente, simbolo)
                      : sobrepago > 0
                      ? `Vuelto: ${formatCurrency(sobrepago, simbolo)}`
                      : formatCurrency(0, simbolo)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Agregar pago */}
          {pendiente > 0 && (
            <div className="space-y-3">
              <label className="label">Agregar pago</label>

              {/* Metodo selector */}
              <div className="grid grid-cols-3 gap-2">
                {metodos.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetodoActual(m.key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      metodoActual === m.key
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-border text-surface-muted hover:bg-surface-bg"
                    }`}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Monto input */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Monto (pendiente: ${formatCurrency(pendiente, simbolo)})`}
                  value={montoActual}
                  onChange={(e) => setMontoActual(e.target.value)}
                  className="input flex-1 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregarPago()}
                />
                <button
                  onClick={handleAgregarPago}
                  className="px-3 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-all flex items-center gap-1 text-sm font-semibold"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Shortcut: pagar todo con metodo actual */}
              <button
                onClick={handlePagoTotal}
                className="w-full py-2 rounded-xl border-2 border-dashed border-surface-border text-surface-muted text-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-all"
              >
                Pagar {formatCurrency(pendiente, simbolo)} con {metodos.find((m) => m.key === metodoActual)?.label}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={loading || items.length === 0 || pagos.length === 0 || sumaPagos < tot}
            className="btn-primary w-full py-3 text-base"
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
