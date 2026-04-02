"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import { THERMAL_CSS } from "@/lib/print";

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

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Precuenta</title><style>${THERMAL_CSS}</style></head><body>${html}<script>var imgs=document.images,loaded=0;function tryPrint(){loaded++;if(loaded>=imgs.length){window.print();window.close();}}if(imgs.length===0){window.print();window.close();}else{for(var i=0;i<imgs.length;i++){if(imgs[i].complete)tryPrint();else{imgs[i].onload=tryPrint;imgs[i].onerror=tryPrint;}}}<\/script></body></html>`);
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
          <div ref={printRef} style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#000" }}>
            {/* Encabezado */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              {logoUrl ? (
                <img src="__LOGO_URL__" alt="Logo" style={{ width: 56, height: 56, objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
              ) : null}
              <p style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", letterSpacing: 2, marginTop: 2 }}>Precuenta</p>
              <p style={{ fontSize: 11 }}>Ticket de revisión</p>
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Mesa / Mesero / Fecha */}
            <div style={{ fontSize: 12 }}>
              {mesaNombre && <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}><span>Mesa</span><span style={{ fontWeight: "bold" }}>{mesaNombre}</span></div>}
              {meseroNombre && <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}><span>Atendió</span><span>{meseroNombre}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}><span>Fecha</span><span>{fecha} {hora}</span></div>
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Items */}
            <div>
              {items.map((item, i) => (
                <div key={i} style={{ padding: "3px 0", borderBottom: i < items.length - 1 ? "1px dotted #000" : "none" }}>
                  <div style={{ fontSize: 12, fontWeight: "bold" }}>{item.nombre}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 1 }}>
                    <span>{item.cantidad} x {formatCurrency(item.precio, simbolo)}</span>
                    <span>{formatCurrency(item.precio * item.cantidad, simbolo)}</span>
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Totales */}
            <div style={{ fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                <span>Subtotal</span><span>{formatCurrency(sub, simbolo)}</span>
              </div>
              {descuento > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                  <span>Descuento ({descuento}%)</span><span>- {formatCurrency(desc, simbolo)}</span>
                </div>
              )}
              {ivaPorc > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                  <span>IVA ({ivaPorc}%)</span><span>{formatCurrency(iva, simbolo)}</span>
                </div>
              )}
            </div>
            <hr style={{ border: "none", borderTop: "2px solid #000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: "bold", padding: "4px 0" }}>
              <span>TOTAL</span><span>{formatCurrency(tot, simbolo)}</span>
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Propinas */}
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Propina sugerida</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" }}><span>10%</span><span><b>{formatCurrency(totalSugerido10, simbolo)}</b></span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" }}><span>15%</span><span><b>{formatCurrency(totalSugerido15, simbolo)}</b></span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" }}><span>20%</span><span><b>{formatCurrency(totalSugerido20, simbolo)}</b></span></div>

            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Aviso */}
            <p style={{ textAlign: "center", fontWeight: "bold", fontSize: 12 }}>*** PRECUENTA ***</p>
            <p style={{ textAlign: "center", fontSize: 11 }}>No es boleta ni factura</p>
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
