"use client";

import { X, Printer } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import { useRef } from "react";

interface Props {
  simbolo?: string;
  mesaNombre?: string;
  meseroNombre?: string;
  onClose: () => void;
}

export function PrecuentaModal({ simbolo = "$", mesaNombre, meseroNombre, onClose }: Props) {
  const { items, subtotal, totalDescuento, totalIva, total, descuento, ivaPorc } = useCartStore();
  const printRef = useRef<HTMLDivElement>(null);

  const sub = subtotal();
  const desc = totalDescuento();
  const iva = totalIva();
  const tot = total();

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Precuenta</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 8px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          .item-row { padding: 3px 0; }
          .item-name { font-size: 11px; }
          .item-detail { font-size: 10px; color: #555; }
          .total-row { font-size: 14px; font-weight: bold; }
          .warning { font-size: 11px; font-weight: bold; margin-top: 8px; padding: 4px; border: 1px dashed #000; }
          .logo { width: 50px; height: 50px; margin: 0 auto 4px; display: block; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="font-bold text-surface-text text-lg">Precuenta</h2>
          <button
            onClick={onClose}
            className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ticket preview */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div ref={printRef}>
            <div className="center" style={{ textAlign: "center" }}>
              <img src="/logo.png" alt="PandaPoss" className="logo" style={{ width: 50, height: 50, margin: "0 auto 4px", display: "block" }} />
              <p className="bold" style={{ fontWeight: "bold", fontSize: 14 }}>PandaPoss</p>
              <p style={{ fontSize: 11, color: "#666" }}>Punto de Venta</p>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

            {/* Info */}
            <div style={{ fontSize: 12 }}>
              {mesaNombre && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>Mesa:</span>
                  <span style={{ fontWeight: "bold" }}>{mesaNombre}</span>
                </div>
              )}
              {meseroNombre && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>Mesero:</span>
                  <span>{meseroNombre}</span>
                </div>
              )}
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>Fecha:</span>
                <span>{fecha} {hora}</span>
              </div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

            {/* Items */}
            <div>
              {items.map((item, i) => (
                <div key={i} style={{ padding: "4px 0", borderBottom: i < items.length - 1 ? "1px dotted #eee" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ flex: 1 }}>{item.nombre}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
                    <span>{item.cantidad} x {formatCurrency(item.precio, simbolo)}</span>
                    <span style={{ fontWeight: "bold", color: "#000" }}>{formatCurrency(item.precio * item.cantidad, simbolo)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

            {/* Totales */}
            <div style={{ fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>Subtotal</span>
                <span>{formatCurrency(sub, simbolo)}</span>
              </div>
              {descuento > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#059669" }}>
                  <span>Descuento ({descuento}%)</span>
                  <span>- {formatCurrency(desc, simbolo)}</span>
                </div>
              )}
              {ivaPorc > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>IVA ({ivaPorc}%)</span>
                  <span>{formatCurrency(iva, simbolo)}</span>
                </div>
              )}
              <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 16, fontWeight: "bold" }}>
                <span>TOTAL</span>
                <span>{formatCurrency(tot, simbolo)}</span>
              </div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

            {/* Warning */}
            <div style={{ textAlign: "center", padding: "6px", border: "1px dashed #f59e0b", borderRadius: 6, marginTop: 8 }}>
              <p style={{ fontWeight: "bold", fontSize: 12, color: "#d97706" }}>*** PRECUENTA ***</p>
              <p style={{ fontSize: 10, color: "#92400e" }}>NO ES BOLETA NI FACTURA</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-surface-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-surface-border text-surface-muted font-semibold text-sm hover:bg-surface-bg transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 btn-primary justify-center py-2.5"
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
