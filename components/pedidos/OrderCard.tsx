"use client";

import { CheckCircle2, Clock, UtensilsCrossed, Loader2, Bell, Printer } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { PedidoConDetalles, EstadoPedido } from "@/types";
import { useState } from "react";

interface OrderCardProps {
  pedido: PedidoConDetalles;
  onUpdateEstado: (id: number, estado: EstadoPedido) => Promise<void>;
  onLlamarMesero: (id: number) => Promise<void>;
  isDelivery?: boolean;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  sucursalRut?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalGiroComercial?: string | null;
}

const nextEstado: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: "EN_PROCESO",
  EN_PROCESO: "LISTO",
  LISTO: "ENTREGADO",
};

const nextLabel: Partial<Record<EstadoPedido, string>> = {
  PENDIENTE: "Iniciar Preparacion",
  EN_PROCESO: "Marcar como listo",
  LISTO: "Listo!",
};

const tipoLabel: Record<string, string> = {
  COCINA: "COCINA",
  BAR: "BAR",
  DELIVERY: "DELIVERY",
  MOSTRADOR: "MOSTRADOR",
};

export function OrderCard({ pedido, onUpdateEstado, onLlamarMesero, isDelivery, sucursalId, sucursalNombre, sucursalRut, sucursalTelefono, sucursalDireccion, sucursalGiroComercial }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMesero, setLoadingMesero] = useState(false);

  async function handleUpdate() {
    const next = nextEstado[pedido.estado];
    if (!next) return;
    setLoading(true);
    await onUpdateEstado(pedido.id, next);
    setLoading(false);
  }

  async function handleLlamarMesero() {
    setLoadingMesero(true);
    await onLlamarMesero(pedido.id);
    setLoadingMesero(false);
  }

  async function handlePrint() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const mesaLabel = pedido.mesa?.nombre ?? `Pedido #${pedido.numero}`;
    const meseroLabel = pedido.usuario?.nombre ?? "—";
    const tipo = tipoLabel[pedido.tipo] ?? pedido.tipo;

    // ── HTML para fallback Chrome ──────────────────────────────────────────
    const legalLines = [
      sucursalNombre ? `<div style="font-weight:bold;font-size:12px;">${sucursalNombre}</div>` : "",
      sucursalGiroComercial ? `<div>${sucursalGiroComercial}</div>` : "",
      sucursalRut ? `<div>RUT: ${sucursalRut}</div>` : "",
      sucursalDireccion ? `<div>${sucursalDireccion}</div>` : "",
      sucursalTelefono ? `<div>Tel: ${sucursalTelefono}</div>` : "",
    ].filter(Boolean).join("");

    const itemsHtml = pedido.detalles.map((d) => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "—";
      if (d.cancelado) {
        return `<div class="item" style="opacity:0.5;"><div class="item-row" style="text-decoration:line-through;"><span class="qty">${d.cantidad}x</span><span class="item-name">${nombre}</span><span style="font-size:11px;margin-left:6px;">[ANULADO]</span></div></div>`;
      }
      return `<div class="item"><div class="item-row"><span class="qty">${d.cantidad}x</span><span class="item-name">${nombre}</span></div>${d.observacion ? `<div class="item-obs">➜ ${d.observacion}</div>` : ""}</div>`;
    }).join("");

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comanda #${pedido.numero}</title><style>
      @page{size:80mm auto;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Courier New',Courier,monospace;font-size:13px;width:80mm;padding:4mm 4mm 10mm 4mm;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .center{text-align:center;}.bold{font-weight:bold;}.big{font-size:20px;font-weight:bold;}
      .tipo-badge{display:inline-block;border:2px solid #000;padding:2px 10px;font-size:14px;font-weight:bold;letter-spacing:2px;margin:4px 0;}
      .divider{border:none;border-top:1px dashed #000;margin:5px 0;}.divider-solid{border:none;border-top:2px solid #000;margin:5px 0;}
      .meta-row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0;}
      .item{margin:5px 0;}.item-row{display:flex;align-items:baseline;gap:6px;}
      .qty{font-size:16px;font-weight:bold;min-width:26px;}.item-name{font-size:13px;font-weight:bold;flex:1;}
      .item-obs{font-size:11px;margin-left:32px;font-style:italic;}
      .obs-box{border:1px dashed #000;padding:4px 6px;font-size:11px;margin-top:6px;}
      @media print{html,body{width:80mm;}}
    </style></head><body>
      ${legalLines ? `<div style="text-align:center;font-size:11px;line-height:1.5;margin-bottom:4px;">${legalLines}</div><hr class="divider"/>` : ""}
      <div class="center"><div class="tipo-badge">${tipo}</div></div>
      <hr class="divider"/>
      <div class="center big">${mesaLabel}</div>
      <hr class="divider"/>
      <div class="meta-row"><span>Mesero/a:</span><span class="bold">${meseroLabel}</span></div>
      <div class="meta-row"><span>Pedido:</span><span class="bold">#${pedido.numero}</span></div>
      <div class="meta-row"><span>Fecha:</span><span>${fecha} ${hora}</span></div>
      <hr class="divider-solid"/>
      ${itemsHtml}
      ${pedido.observacion ? `<hr class="divider"/><div class="obs-box">📝 ${pedido.observacion}</div>` : ""}
    </body></html>`;

    // ── 1. Abrir ventana sincrónicamente (antes de cualquier await) ────────
    const pw = window.open("", "_blank", "width=302,height=700");
    if (pw) {
      pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;color:#555;font-size:13px;}</style></head><body><div style="text-align:center"><div style="font-size:22px;margin-bottom:8px;">🖨️</div>Enviando a impresora…</div></body></html>`);
      pw.document.close();
    }

    // ── 2. Texto plano para TCP / lp ──────────────────────────────────────
    const LINE = "================================";
    const center32 = (s: string) => s.padStart(Math.floor((32 + s.length) / 2)).padEnd(32);
    const legalSection = [
      sucursalNombre        ? center32(sucursalNombre)              : "",
      sucursalGiroComercial ? center32(sucursalGiroComercial)       : "",
      sucursalRut           ? center32(`RUT: ${sucursalRut}`)       : "",
      sucursalDireccion     ? center32(sucursalDireccion)           : "",
      sucursalTelefono      ? center32(`Tel: ${sucursalTelefono}`)  : "",
    ].filter(Boolean).join("\n");
    const itemsText = pedido.detalles
      .filter((d) => !d.cancelado)
      .map((d) => {
        const nombre = (d.producto?.nombre ?? d.combo?.nombre ?? "—").toUpperCase();
        const line1 = `${d.cantidad}x  ${nombre}`;
        return d.observacion ? `${line1}\n     * ${d.observacion}` : line1;
      }).join("\n");
    const textContent = [
      legalSection ? legalSection + "\n" + LINE : "",
      center32(tipo),
      center32(mesaLabel),
      LINE,
      `Mesero: ${meseroLabel}`,
      `Pedido: #${pedido.numero}`,
      `${fecha}  ${hora}`,
      LINE,
      itemsText,
      LINE,
      center32("-- PandaPoss --"),
    ].filter(Boolean).join("\n") + "\n";

    // ── 3. Intentar TCP ESC/POS ────────────────────────────────────────────
    if (sucursalId) {
      try {
        const res = await fetch("/api/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sucursalId, content: textContent }),
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) { pw?.close(); return; }
      } catch { /* TCP falló → siguiente */ }
    }

    // ── 4. Intentar lp / USB Linux ────────────────────────────────────────
    try {
      const res = await fetch("/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId, content: textContent }),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) { pw?.close(); return; }
    } catch { /* lp falló → Chrome */ }

    // ── 5. Fallback Chrome ────────────────────────────────────────────────
    if (!pw) return;
    pw.document.write(fullHtml);
    pw.document.close();
    pw.onload = () => { pw.focus(); pw.print(); };
    setTimeout(() => { try { pw.focus(); pw.print(); } catch { /* cerrado */ } }, 500);
  }

  const siguiente = nextEstado[pedido.estado];
  const tiempoStr = timeAgo(pedido.creadoEn);

  let customerName = "";
  let cleanObservation = pedido.observacion || "";

  if (pedido.tipo === "DELIVERY" && cleanObservation.startsWith("[DELIVERY]")) {
    try {
      const jsonStr = cleanObservation.replace("[DELIVERY]", "");
      const data = JSON.parse(jsonStr);
      if (data.clienteNombre) {
        customerName = data.clienteNombre;
        // Solo la primera palabra si es largo
        customerName = customerName.split(" ")[0];
      }
      const notes = [];
      if (data.direccion) notes.push(`Dir: ${data.direccion}`);
      if (data.referencia) notes.push(`Ref: ${data.referencia}`);
      cleanObservation = notes.join(" | ");
    } catch (e) {}
  } else if (cleanObservation) {
    const match = cleanObservation.match(/Cliente:\s*([^,\n]+)/i);
    if (match) {
      customerName = match[1].trim();
      cleanObservation = cleanObservation.replace(match[0], "").trim();
      cleanObservation = cleanObservation.replace(/^[-,\s]+|[-,\s]+$/g, "");
    }
  }

  let cardTitle = "";
  if (pedido.mesa?.nombre) {
    cardTitle = pedido.mesa.nombre;
    if (customerName) {
      const capitalized = customerName.charAt(0).toUpperCase() + customerName.slice(1);
      cardTitle += ` / ${capitalized}`;
    }
  } else {
    if (pedido.tipo === "DELIVERY" && customerName) {
      const capitalized = customerName.charAt(0).toUpperCase() + customerName.slice(1).toLowerCase();
      cardTitle = `Ped ${capitalized} #${pedido.numero || pedido.id}`;
    } else {
      cardTitle = `Pedido #${pedido.numero || pedido.id}`;
      if (customerName) {
        const capitalized = customerName.charAt(0).toUpperCase() + customerName.slice(1);
        cardTitle += ` / ${capitalized}`;
      }
    }
  }

  return (
    <div className={cn(
      "card p-0 overflow-hidden animate-fade-in",
      pedido.meseroLlamado && "ring-2 ring-amber-400"
    )}>
      {/* Banner llamada al mesero */}
      {pedido.meseroLlamado && (
        <div className="flex items-center gap-2 bg-amber-400 px-4 py-1.5 text-white text-xs font-bold">
          <Bell size={13} className="animate-bounce" />
          Mesero solicitado — pendiente de retirar
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h4 className="font-bold text-surface-text text-base">
            {cardTitle}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-surface-muted mt-0.5">
            <UtensilsCrossed size={11} />
            <span>
              {pedido.tipo === "COCINA" ? "Pedido de comida"
                : pedido.tipo === "BAR" ? "Pedido de bebidas"
                : pedido.tipo === "DELIVERY" ? "Pedido delivery"
                : "Pedido mostrador"}
            </span>
          </div>
          {pedido.usuario && (
            <div className="text-xs text-surface-muted mt-0.5">
              👤 {pedido.usuario.nombre}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-surface-muted">
          <Clock size={12} />
          <span>Hace {tiempoStr}</span>
        </div>
      </div>

      {/* Productos */}
      <div className="px-4 pb-3 space-y-1.5">
        {pedido.detalles.map((d) => (
          <div
            key={d.id}
            className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
              d.cancelado
                ? "bg-gray-100 opacity-60"
                : "bg-surface-bg"
            }`}
          >
            <span className={`font-bold text-sm flex-shrink-0 ${d.cancelado ? "text-gray-400 line-through" : "text-brand-600"}`}>
              {d.cantidad}x
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-semibold ${d.cancelado ? "line-through text-gray-400" : "text-surface-text"}`}>
                  {d.producto?.nombre ?? d.combo?.nombre ?? "—"}
                </p>
                {d.cancelado && (
                  <span className="bg-red-100 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold">ANULADO</span>
                )}
              </div>
              {d.observacion && !d.cancelado && (
                <p className="text-xs text-surface-muted italic mt-0.5">{d.observacion}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Observacion general */}
      {cleanObservation && (
        <div className="mx-4 mb-3 text-xs text-surface-muted bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          📝 {cleanObservation}
        </div>
      )}

      {/* Acciones */}
      {!isDelivery && (
        <div className="flex border-t border-surface-border">
          {siguiente && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all",
                pedido.estado === "PENDIENTE" && "bg-brand-500 hover:bg-brand-600 text-white",
                pedido.estado === "EN_PROCESO" && "bg-amber-500 hover:bg-amber-600 text-white",
                pedido.estado === "LISTO" && "bg-emerald-500 hover:bg-emerald-600 text-white",
                "disabled:opacity-50"
              )}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {nextLabel[pedido.estado]}
            </button>
          )}
          <button
            onClick={handleLlamarMesero}
            disabled={loadingMesero || pedido.meseroLlamado}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all border-l border-surface-border flex items-center gap-1.5 disabled:opacity-50",
              pedido.meseroLlamado
                ? "bg-amber-50 text-amber-600"
                : "text-surface-muted hover:bg-brand-50 hover:text-brand-600"
            )}
          >
            {loadingMesero ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Bell size={14} className={pedido.meseroLlamado ? "animate-bounce" : ""} />
            )}
            {pedido.meseroLlamado ? "Llamado" : "Llamar Mesero"}
          </button>
          <button
            onClick={handlePrint}
            title="Imprimir comanda"
            className="px-3 py-3 text-surface-muted hover:text-brand-600 hover:bg-brand-50 transition-all border-l border-surface-border flex items-center justify-center"
          >
            <Printer size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
