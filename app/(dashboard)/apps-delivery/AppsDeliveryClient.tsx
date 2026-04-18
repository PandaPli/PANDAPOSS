"use client";

import { useState, useRef } from "react";
import { Printer, QrCode, RotateCcw } from "lucide-react";
import QRCode from "qrcode";
import { createSlug } from "@/lib/slug";

interface Props {
  sucursalNombre: string;
  simbolo: string;
}

export function AppsDeliveryClient({ sucursalNombre, simbolo }: Props) {
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [printing, setPrinting] = useState(false);
  const nombreRef = useRef<HTMLInputElement>(null);

  const menuUrl = `https://pandaposs.com/pedir/${createSlug(sucursalNombre)}`;

  async function imprimirTicket() {
    if (!nombre.trim() || !monto) return;
    setPrinting(true);

    try {
      const qrDataUrl = await QRCode.toDataURL(menuUrl, {
        margin: 1,
        width: 280,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });

      const montoNum = parseFloat(monto);
      const montoFormateado = `${simbolo} ${montoNum.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket Apps Delivery</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 0; size: 80mm auto; }
    html, body { height: fit-content; min-height: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 72mm;
      padding: 4mm 4mm 2mm 4mm;
      background: #fff;
      color: #000;
    }
    .center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #000; margin: 4mm 0; }
    .divider-solid { border: none; border-top: 2px solid #000; margin: 4mm 0; }
    .sucursal {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 2mm;
      word-break: break-word;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #555;
      margin-bottom: 2mm;
    }
    .cliente-nombre {
      font-size: 22px;
      font-weight: 900;
      line-height: 1.15;
      word-break: break-word;
      margin-bottom: 2mm;
    }
    .monto {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.02em;
      margin: 2mm 0 1mm;
    }
    .qr-wrap { margin: 3mm 0 1mm; }
    .qr-wrap img { width: 66mm; height: 66mm; }
    .qr-url {
      font-size: 10px;
      color: #000;
      font-weight: 700;
      word-break: break-all;
      margin-top: 2mm;
    }
    .reorder-label {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #000;
      margin-top: 3mm;
      margin-bottom: 2mm;
    }
    .cut-feed { height: 3mm; }
  </style>
</head>
<body>
  <div class="center">
    <p class="sucursal">${sucursalNombre}</p>
    <hr class="divider" />

    <p class="label">Cliente</p>
    <p class="cliente-nombre">${nombre.trim()}</p>

    <hr class="divider" />

    <p class="label">Total</p>
    <p class="monto">${montoFormateado}</p>

    <hr class="divider-solid" />

    <p class="reorder-label">ESCANEA Y VUELVE A PEDIR</p>
    <div class="qr-wrap">
      <img src="${qrDataUrl}" alt="QR Reorden" />
    </div>
    <p class="qr-url">${menuUrl.replace("https://", "")}</p>
  </div>
  <div class="cut-feed"></div>

  <script>
    var imgs = document.images;
    var loaded = 0;
    function tryPrint() { loaded++; if (loaded >= imgs.length) { window.print(); window.close(); } }
    if (imgs.length === 0) { window.print(); window.close(); }
    else { for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) tryPrint();
      else { imgs[i].onload = tryPrint; imgs[i].onerror = tryPrint; }
    }}
  <\/script>
</body>
</html>`;

      const win = window.open("", "_blank", "width=400,height=600");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } finally {
      setPrinting(false);
    }
  }

  function limpiar() {
    setNombre("");
    setMonto("");
    setTimeout(() => nombreRef.current?.focus(), 50);
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Form */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-surface-text mb-1.5">
            Nombre del cliente
          </label>
          <input
            ref={nombreRef}
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("monto-input")?.focus()}
            placeholder="Ej: Juan García"
            className="w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-3 text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
            autoFocus
          />
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-surface-text mb-1.5">
            Monto total <span className="text-surface-muted font-normal">({simbolo})</span>
          </label>
          <input
            id="monto-input"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && imprimirTicket()}
            placeholder="0"
            min={0}
            step={0.01}
            className="w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-3 text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={imprimirTicket}
            disabled={!nombre.trim() || !monto || printing}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {printing ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            Imprimir ticket
          </button>
          <button
            onClick={limpiar}
            title="Limpiar"
            className="rounded-xl border border-surface-border px-3 py-3 text-surface-muted hover:text-surface-text hover:bg-surface-muted transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Preview card */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={16} className="text-surface-muted" />
          <span className="text-sm font-medium text-surface-text">Vista previa del QR</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-surface-muted">
          <span className="font-mono bg-surface-muted/60 rounded-lg px-3 py-1.5 text-xs break-all">
            {menuUrl}
          </span>
        </div>
        <p className="mt-3 text-xs text-surface-muted">
          El QR apunta a tu menú online. El cliente escanea y puede volver a pedir directo desde Panda.
        </p>
      </div>
    </div>
  );
}
