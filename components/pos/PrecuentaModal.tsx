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
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  sucursalRut?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalGiroComercial?: string | null;
}

export function PrecuentaModal({ simbolo = "$", mesaNombre, meseroNombre, logoUrl, onClose, sucursalId, sucursalNombre, sucursalRut, sucursalTelefono, sucursalDireccion, sucursalGiroComercial }: Props) {
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

  async function handlePrint() {
    // ── 1. Construir HTML para fallback (se abre ventana ANTES de cualquier await) ──
    const content = printRef.current;
    if (!content) return;

    const printableLogoUrl = logoUrl ? new URL(logoUrl, window.location.origin).toString() : null;
    const html = printableLogoUrl
      ? content.innerHTML.replaceAll('src="__LOGO_URL__"', `src="${printableLogoUrl}"`)
      : content.innerHTML.replaceAll('src="__LOGO_URL__"', 'src=""');

    const fullHtml = `<!DOCTYPE html>
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
        <body>${html}</body>
      </html>`;

    // ── 2. Abrir ventana SINCRÓNICAMENTE antes de cualquier await ──────────
    const pw = window.open("", "_blank", "width=320,height=800");

    const now = new Date();
    const fechaPrint = now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaPrint  = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    const printPayload = {
      sucursalId,
      type: "precuenta" as const,
      data: {
        simbolo, mesaNombre, meseroNombre,
        sucursalNombre, sucursalRut, sucursalTelefono, sucursalDireccion, sucursalGiroComercial,
        items: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
        subtotal: sub, descuento, descuentoMonto: desc,
        ivaPorc, ivaMonto: iva, total: tot,
        fecha: fechaPrint, hora: horaPrint,
      },
    };

    // ── 3. Intentar TCP ESC/POS (/api/print-receipt) ───────────────────────
    if (sucursalId) {
      try {
        const res = await fetch("/api/print-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(printPayload),
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) { pw?.close(); return; }
      } catch { /* TCP falló → intentar siguiente */ }
    }

    // ── 4. Intentar sistema Linux (/print → lp/usb) ────────────────────────
    try {
      const res = await fetch("/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(printPayload),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) { pw?.close(); return; }
    } catch { /* lp falló → abrir Chrome */ }

    // ── 5. Fallback final: abrir ventana Chrome y disparar print ───────────
    if (!pw) return;
    pw.document.write(fullHtml);
    pw.document.close();
    pw.onload = () => { pw.focus(); pw.print(); };
    // fallback por si onload ya disparó antes de asignarlo
    setTimeout(() => { try { pw.focus(); pw.print(); } catch { /* ya cerró */ } }, 500);
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
            {/* Datos legales */}
            {(sucursalNombre || sucursalGiroComercial || sucursalRut || sucursalDireccion || sucursalTelefono) && (
              <div style={{ textAlign: "center", fontSize: 11, lineHeight: 1.5, marginBottom: 6 }}>
                {sucursalNombre && <div style={{ fontWeight: "bold", fontSize: 13 }}>{sucursalNombre}</div>}
                {sucursalGiroComercial && <div>{sucursalGiroComercial}</div>}
                {sucursalRut && <div>RUT: {sucursalRut}</div>}
                {sucursalDireccion && <div>{sucursalDireccion}</div>}
                {sucursalTelefono && <div>Tel: {sucursalTelefono}</div>}
              </div>
            )}
            {(sucursalNombre || sucursalGiroComercial || sucursalRut || sucursalDireccion || sucursalTelefono) && (
              <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
            )}
            {/* Encabezado */}
            <div className="logo-wrap" style={{ textAlign: "center", marginBottom: 6 }}>
              {logoUrl ? (
                <img src="__LOGO_URL__" alt="Logo" className="logo" style={{ width: 60, height: 60, objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
              ) : null}
              <p className="title" style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, letterSpacing: 1 }}>Precuenta</p>
              <p className="subtitle" style={{ textAlign: "center", fontSize: 12 }}>Ticket de revision</p>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Mesa y Mesero destacados */}
            {(mesaNombre || meseroNombre) && (
              <div style={{ border: "1px solid #000", padding: "5px 8px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {mesaNombre && (
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Mesa</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", lineHeight: 1.1 }}>{mesaNombre}</div>
                  </div>
                )}
                {mesaNombre && meseroNombre && (
                  <div style={{ borderLeft: "1px dashed #000", height: 36, margin: "0 8px" }} />
                )}
                {meseroNombre && (
                  <div style={{ textAlign: "center", flex: 2 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Mesero/a</div>
                    <div style={{ fontSize: 14, fontWeight: "bold", lineHeight: 1.2 }}>{meseroNombre}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                <span>Fecha:</span>
                <span>{fecha} {hora}</span>
              </div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Items */}
            <div>
              {items.map((item, i) => (
                <div key={i} className="item" style={{ padding: "4px 0", borderBottom: i < items.length - 1 ? "1px dotted #000" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 13, fontWeight: "bold", flex: 1 }}>{item.nombre}</span>
                    <span style={{ fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>{formatCurrency(item.precio * item.cantidad, simbolo)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#000" }}>
                    <span style={{ background: "#000", color: "#fff", padding: "0 4px", borderRadius: 2, fontWeight: "bold", marginRight: 4 }}>{item.cantidad}</span>
                    <span>× {formatCurrency(item.precio, simbolo)} c/u</span>
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
