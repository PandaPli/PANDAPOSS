"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";

interface Props {
  simbolo?: string;
  mesaNombre?: string;
  meseroNombre?: string;
  logoUrl?: string | null;
  onClose: () => void;
}

export function PrecuentaModal({ simbolo = "$", mesaNombre, meseroNombre, logoUrl, onClose }: Props) {
  const { items, subtotal, totalDescuento, totalIva, total, descuento, ivaPorc } = useCartStore();
  const printRef = useRef<HTMLDivElement>(null);

  const sub = subtotal();
  const desc = totalDescuento();
  const iva = totalIva();
  const tot = total();
  const totalSugerido10 = tot * 1.1;
  const totalSugerido15 = tot * 1.15;
  const totalSugerido20 = tot * 1.2;

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=340,height=700");
    if (!printWindow) return;

    const printableLogoUrl = logoUrl ? new URL(logoUrl, window.location.origin).toString() : null;
    const html = printableLogoUrl
      ? content.innerHTML.replaceAll('src="__LOGO_URL__"', `src="${printableLogoUrl}"`)
      : content.innerHTML.replaceAll('src="__LOGO_URL__"', "src=\"\"");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Precuenta</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px; color: #111; }
            .logo-wrap { text-align: center; margin-bottom: 8px; }
            .logo { width: 68px; height: 68px; object-fit: contain; display: block; margin: 0 auto 6px; }
            .title { text-align: center; font-weight: bold; font-size: 14px; }
            .subtitle { text-align: center; font-size: 11px; color: #666; }
            .divider { border-top: 1px dashed #bbb; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
            .item { padding: 4px 0; border-bottom: 1px dotted #eee; }
            .item:last-child { border-bottom: 0; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 16px; font-weight: bold; }
            .suggested-box { margin: 10px 0 8px; border: 1px dashed #16a34a; border-radius: 8px; padding: 8px; background: #f0fdf4; }
            .suggested-label { text-align: center; font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase; }
            .suggested-total { text-align: center; font-size: 22px; font-weight: bold; color: #166534; margin-top: 4px; }
            .tip-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
            .warning { text-align: center; padding: 6px; border: 1px dashed #f59e0b; border-radius: 6px; margin-top: 10px; }
            .warning strong { color: #d97706; font-size: 12px; }
            .warning span { color: #92400e; font-size: 10px; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-surface-border p-5">
          <h2 className="text-lg font-bold text-surface-text">Precuenta</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-surface-muted transition-all hover:bg-surface-bg hover:text-surface-text">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div ref={printRef}>
            <div className="logo-wrap" style={{ textAlign: "center", marginBottom: 8 }}>
              {logoUrl ? (
                <img src="__LOGO_URL__" alt="Logo Sucursal" className="logo" style={{ width: 68, height: 68, objectFit: "contain", display: "block", margin: "0 auto 6px" }} />
              ) : null}
              <p className="title" style={{ textAlign: "center", fontWeight: "bold", fontSize: 14 }}>Precuenta</p>
              <p className="subtitle" style={{ textAlign: "center", fontSize: 11, color: "#666" }}>Ticket de revision</p>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

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

            <div>
              {items.map((item, i) => (
                <div key={i} className="item" style={{ padding: "4px 0", borderBottom: i < items.length - 1 ? "1px dotted #eee" : "none" }}>
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

            <div style={{ fontSize: 12 }}>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>Subtotal</span>
                <span>{formatCurrency(sub, simbolo)}</span>
              </div>
              {descuento > 0 && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#059669" }}>
                  <span>Descuento ({descuento}%)</span>
                  <span>- {formatCurrency(desc, simbolo)}</span>
                </div>
              )}
              {ivaPorc > 0 && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>IVA ({ivaPorc}%)</span>
                  <span>{formatCurrency(iva, simbolo)}</span>
                </div>
              )}
              <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "6px 0" }} />
              <div className="total-row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 16, fontWeight: "bold" }}>
                <span>TOTAL</span>
                <span>{formatCurrency(tot, simbolo)}</span>
              </div>
            </div>

            <div className="suggested-box" style={{ margin: "10px 0 8px", border: "1px dashed #16a34a", borderRadius: 8, padding: 8, background: "#f0fdf4" }}>
              <p className="suggested-label" style={{ textAlign: "center", fontSize: 11, fontWeight: "bold", color: "#166534", textTransform: "uppercase" }}>
                Total sugerido con propina 10%
              </p>
              <p className="suggested-total" style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", color: "#166534", marginTop: 4 }}>
                {formatCurrency(totalSugerido10, simbolo)}
              </p>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

            <div style={{ marginTop: 10, marginBottom: 12 }}>
              <p style={{ marginBottom: 6, textAlign: "center", fontSize: 12, fontWeight: "bold" }}>Otras propinas sugeridas</p>
              <div className="tip-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                <span>15% Maravilloso</span>
                <span style={{ fontWeight: "bold" }}>{formatCurrency(totalSugerido15, simbolo)}</span>
              </div>
              <div className="tip-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                <span>20% Extraordinario</span>
                <span style={{ fontWeight: "bold" }}>{formatCurrency(totalSugerido20, simbolo)}</span>
              </div>
            </div>

            <div className="warning" style={{ textAlign: "center", padding: "6px", border: "1px dashed #f59e0b", borderRadius: 6, marginTop: 8 }}>
              <p style={{ fontWeight: "bold", fontSize: 12, color: "#d97706" }}>*** PRECUENTA ***</p>
              <p style={{ fontSize: 10, color: "#92400e" }}>NO ES BOLETA NI FACTURA</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-surface-border p-5">
          <button onClick={onClose} className="flex-1 rounded-xl border-2 border-surface-border py-2.5 text-sm font-semibold text-surface-muted transition-all hover:bg-surface-bg">
            Cerrar
          </button>
          <button onClick={handlePrint} className="btn-primary flex-1 justify-center py-2.5">
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
