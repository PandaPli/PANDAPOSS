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

    const printWindow = window.open("", "_blank", "width=320,height=800");
    if (!printWindow) return;

    const printableLogoUrl = logoUrl ? new URL(logoUrl, window.location.origin).toString() : null;
    const html = printableLogoUrl
      ? content.innerHTML.replaceAll('src="__LOGO_URL__"', `src="${printableLogoUrl}"`)
      : content.innerHTML.replaceAll('src="__LOGO_URL__"', 'src=""');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Precuenta</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 13px;
              width: 72mm;
              padding: 4mm 4mm 8mm 4mm;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .logo-wrap { text-align: center; margin-bottom: 6px; }
            .logo { width: 60px; height: 60px; object-fit: contain; display: block; margin: 0 auto 4px; }
            .title { text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 1px; }
            .subtitle { text-align: center; font-size: 12px; }
            .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; gap: 4px; padding: 2px 0; font-size: 13px; }
            .item { padding: 3px 0; }
            .item-name { font-size: 13px; font-weight: bold; }
            .item-detail { display: flex; justify-content: space-between; font-size: 12px; }
            .item-amount { font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 18px; font-weight: bold; }
            .suggested-box { margin: 8px 0; border: 1px dashed #000; padding: 6px; text-align: center; }
            .suggested-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .suggested-total { font-size: 24px; font-weight: bold; margin-top: 2px; }
            .tip-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
            .warning { text-align: center; padding: 5px; border: 1px dashed #000; margin-top: 8px; }
            .warning-title { font-weight: bold; font-size: 13px; }
            .warning-sub { font-size: 11px; }
            .footer { text-align: center; font-size: 10px; margin-top: 8px; }
          </style>
        </head>
        <body>
          ${html}
          <script>
            var imgs = document.images;
            var loaded = 0;
            function tryPrint() {
              loaded++;
              if (loaded >= imgs.length) { window.print(); window.close(); }
            }
            if (imgs.length === 0) { window.print(); window.close(); }
            else { for (var i = 0; i < imgs.length; i++) {
              if (imgs[i].complete) tryPrint();
              else { imgs[i].onload = tryPrint; imgs[i].onerror = tryPrint; }
            }}
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            {/* Encabezado */}
            <div className="logo-wrap" style={{ textAlign: "center", marginBottom: 6 }}>
              {logoUrl ? (
                <img src="__LOGO_URL__" alt="Logo" className="logo" style={{ width: 60, height: 60, objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
              ) : null}
              <p className="title" style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, letterSpacing: 1 }}>Precuenta</p>
              <p className="subtitle" style={{ textAlign: "center", fontSize: 12 }}>Ticket de revision</p>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Info mesa/mesero/fecha */}
            <div style={{ fontSize: 13 }}>
              {mesaNombre && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>Mesa:</span>
                  <span style={{ fontWeight: "bold" }}>{mesaNombre}</span>
                </div>
              )}
              {meseroNombre && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>Mesero:</span>
                  <span style={{ fontWeight: "bold" }}>{meseroNombre}</span>
                </div>
              )}
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>Fecha:</span>
                <span>{fecha} {hora}</span>
              </div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Items */}
            <div>
              {items.map((item, i) => (
                <div key={i} className="item" style={{ padding: "3px 0", borderBottom: i < items.length - 1 ? "1px dotted #000" : "none" }}>
                  <div className="item-name" style={{ fontSize: 13, fontWeight: "bold" }}>{item.nombre}</div>
                  <div className="item-detail" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>{item.cantidad} x {formatCurrency(item.precio, simbolo)}</span>
                    <span className="item-amount" style={{ fontWeight: "bold" }}>{formatCurrency(item.precio * item.cantidad, simbolo)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Totales */}
            <div style={{ fontSize: 13 }}>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>Subtotal</span>
                <span>{formatCurrency(sub, simbolo)}</span>
              </div>
              {descuento > 0 && (
                <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
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
              <div className="divider" style={{ borderTop: "2px solid #000", margin: "6px 0" }} />
              <div className="total-row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 18, fontWeight: "bold" }}>
                <span>TOTAL</span>
                <span>{formatCurrency(tot, simbolo)}</span>
              </div>
            </div>

            {/* Propina sugerida 10% */}
            <div className="suggested-box" style={{ margin: "8px 0", border: "1px dashed #000", padding: 6, textAlign: "center" }}>
              <p className="suggested-label" style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>
                Total sugerido con propina 10%
              </p>
              <p className="suggested-total" style={{ fontSize: 24, fontWeight: "bold", marginTop: 2 }}>
                {formatCurrency(totalSugerido10, simbolo)}
              </p>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Otras propinas */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ marginBottom: 4, textAlign: "center", fontSize: 12, fontWeight: "bold" }}>Otras propinas sugeridas</p>
              <div className="tip-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
                <span>15% Maravilloso</span>
                <span style={{ fontWeight: "bold" }}>{formatCurrency(totalSugerido15, simbolo)}</span>
              </div>
              <div className="tip-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
                <span>20% Extraordinario</span>
                <span style={{ fontWeight: "bold" }}>{formatCurrency(totalSugerido20, simbolo)}</span>
              </div>
            </div>

            {/* Aviso */}
            <div className="warning" style={{ textAlign: "center", padding: 5, border: "1px dashed #000", marginTop: 8 }}>
              <p className="warning-title" style={{ fontWeight: "bold", fontSize: 13 }}>*** PRECUENTA ***</p>
              <p className="warning-sub" style={{ fontSize: 11 }}>NO ES BOLETA NI FACTURA</p>
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
