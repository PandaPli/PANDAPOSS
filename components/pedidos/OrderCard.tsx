"use client";

import React from "react";
import { CheckCircle2, Clock, UtensilsCrossed, Loader2, Bell, Printer, Bot } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { PedidoConDetalles, EstadoPedido } from "@/types";
import { useState } from "react";

function detectarOrigen(pedido: PedidoConDetalles): "chatbot" | "mesa" | "pos" {
  if (pedido.delivery?.zonaDelivery === "WhatsApp") return "chatbot";
  if (pedido.observacion?.includes("[WSP]")) return "chatbot";
  if (pedido.mesa) return "mesa";
  return "pos";
}

interface OrderCardProps {
  pedido: PedidoConDetalles;
  onUpdateEstado: (id: number, estado: EstadoPedido) => Promise<void>;
  onLlamarMesero: (id: number) => Promise<void>;
  isDelivery?: boolean;
  nightMode?: boolean;
}

const nextEstado: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: "EN_PROCESO",
  EN_PROCESO: "LISTO",
  // LISTO es estado final en cocina — el cajero cierra la mesa
};

const nextLabel: Partial<Record<EstadoPedido, string>> = {
  PENDIENTE: "Iniciar Preparacion",
  EN_PROCESO: "Marcar como listo",
};

const tipoLabel: Record<string, string> = {
  COCINA: "COCINA",
  BAR: "BAR",
  REPOSTERIA: "REPOSTERÍA",
  DELIVERY: "DELIVERY",
  MOSTRADOR: "MOSTRADOR",
};

function esTabla(nombre: string) {
  return /^tabla\b/i.test(nombre.trim());
}

export function OrderCard({ pedido, onUpdateEstado, onLlamarMesero, isDelivery, nightMode }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMesero, setLoadingMesero] = useState(false);
  const [tablaNotas, setTablaNotas] = useState<Record<number, string>>({});
  const [savedNotas, setSavedNotas] = useState<Record<number, boolean>>({});

  async function guardarNota(detalleId: number) {
    const nota = tablaNotas[detalleId]?.trim() ?? "";
    try {
      await fetch(`/api/pedidos/detalles/${detalleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacion: nota || null }),
      });
      setSavedNotas((prev) => ({ ...prev, [detalleId]: true }));
      setTimeout(() => setSavedNotas((prev) => ({ ...prev, [detalleId]: false })), 2000);
    } catch { /* ignore */ }
  }

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

  function handlePrint() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const mesaLabel = pedido.mesa?.nombre ?? `Pedido #${pedido.numero}`;
    const meseroLabel = pedido.usuario?.nombre ?? "—";
    const tipo = tipoLabel[pedido.tipo] ?? pedido.tipo;

    const itemsHtml = pedido.detalles.map((d) => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "—";
      if (d.cancelado) {
        return `
          <div class="item" style="opacity:0.5;">
            <div class="item-row" style="text-decoration:line-through;">
              <span class="qty">${d.cantidad}x</span>
              <span class="item-name">${nombre}</span>
              <span style="font-size:11px;margin-left:6px;">[ANULADO]</span>
            </div>
          </div>
        `;
      }
      const notaTabla = esTabla(nombre) && tablaNotas[d.id] ? tablaNotas[d.id].trim() : null;
      return `
        <div class="item">
          <div class="item-row">
            <span class="qty">${d.cantidad}x</span>
            <span class="item-name">${nombre}</span>
          </div>
          ${Array.isArray(d.opciones) && d.opciones.length > 0
            ? (d.opciones as { opcionNombre: string; precio: number }[]).map((o) =>
                `<div class="item-obs" style="color:#7c3aed;">• ${o.opcionNombre}${o.precio > 0 ? ` +${o.precio}` : ""}</div>`
              ).join("")
            : ""}
          ${d.observacion ? `<div class="item-obs">➜ ${d.observacion}</div>` : ""}
          ${notaTabla ? `<div class="item-obs" style="font-weight:bold;font-style:normal;">★ ${notaTabla}</div>` : ""}
        </div>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comanda #${pedido.numero}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: fit-content; min-height: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 14px;
              width: 72mm;
              padding: 4mm 4mm 2mm 4mm;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .big { font-size: 22px; font-weight: bold; }
            .tipo-badge {
              display: inline-block;
              border: 2px solid #000;
              padding: 2px 10px;
              font-size: 15px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 4px 0;
            }
            .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            .divider-solid { border: none; border-top: 2px solid #000; margin: 5px 0; }
            .meta-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
            .meta-label { color: #000; }
            .item { margin: 5px 0; }
            .item-row { display: flex; align-items: baseline; gap: 6px; }
            .qty { font-size: 18px; font-weight: bold; min-width: 28px; }
            .item-name { font-size: 15px; font-weight: bold; flex: 1; }
            .item-obs { font-size: 12px; margin-left: 34px; font-style: italic; }
            .obs-box { border: 1px dashed #000; padding: 4px 6px; font-size: 12px; margin-top: 6px; }
            .cut-feed { height: 3mm; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="tipo-badge">${tipo}</div>
          </div>

          <hr class="divider" />

          <div class="center big">${mesaLabel}</div>

          <hr class="divider" />

          <div class="meta-row">
            <span class="meta-label">Mesero/a:</span>
            <span class="bold">${meseroLabel}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Pedido:</span>
            <span class="bold">#${pedido.numero}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Fecha:</span>
            <span>${fecha} ${hora}</span>
          </div>

          <hr class="divider-solid" />

          ${itemsHtml}

          ${pedido.observacion ? `
          <hr class="divider" />
          <div class="obs-box">📝 ${pedido.observacion}</div>
          ` : ""}

          <div class="cut-feed"></div>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=320,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  const siguiente = nextEstado[pedido.estado];
  const tiempoStr = timeAgo(pedido.creadoEn);
  const origen = detectarOrigen(pedido);

  // Determinar a quién llamar según tipo de pedido
  const callTipo = pedido.tipo === "DELIVERY" ? "RIDER" : pedido.mesa ? "MESERO" : "CAJERO";
  const callLabel = callTipo === "RIDER" ? "Rider" : callTipo === "CAJERO" ? "Cajero" : "Mesero";
  const callBannerText = pedido.llamadoTipo === "RIDER" ? "Listo para Rider" : pedido.llamadoTipo === "CAJERO" ? "Listo para Cajero" : "Mesero solicitado";
  const callBannerColor = pedido.llamadoTipo === "RIDER" ? "bg-blue-500" : pedido.llamadoTipo === "CAJERO" ? "bg-purple-500" : "bg-amber-400";

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
    // Limpiar tag [WSP] de pedidos WhatsApp
    cleanObservation = cleanObservation.replace(/\[WSP\]\s*\|?\s*/g, "").trim();
    const match = cleanObservation.match(/Cliente:\s*([^,\n|]+)/i);
    if (match) {
      customerName = match[1].replace(/\(.*?\)/, "").trim();
      cleanObservation = cleanObservation.replace(match[0], "").trim();
      cleanObservation = cleanObservation.replace(/^[-|,\s]+|[-|,\s]+$/g, "");
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
      "p-0 overflow-hidden animate-fade-in rounded-2xl border shadow-sm",
      nightMode ? "bg-gray-900 border-gray-700" : "bg-white border-surface-border",
      pedido.meseroLlamado && "ring-2 ring-amber-400",
      origen === "chatbot" && "ring-2 ring-emerald-400"
    )}>
      {/* Banner ChatBot WhatsApp */}
      {origen === "chatbot" && (
        <div className="flex items-center gap-1.5 bg-emerald-500 px-3 py-1 text-white text-xs font-bold">
          <Bot size={12} />
          🐼 ChatBot WhatsApp
        </div>
      )}

      {/* Banner llamada al mesero/cajero/rider */}
      {pedido.meseroLlamado && (
        <div className={`flex items-center gap-1.5 ${callBannerColor} px-3 py-1 text-white text-xs font-bold`}>
          <Bell size={12} className="animate-bounce" />
          {callBannerText}
        </div>
      )}

      {/* Header compacto */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="min-w-0 flex-1">
          <h4 className={cn("font-bold text-sm leading-tight truncate", nightMode ? "text-gray-100" : "text-surface-text")}>
            {cardTitle}
          </h4>
          {pedido.usuario && (
            <div className={cn("text-[11px] mt-0.5", nightMode ? "text-gray-400" : "text-surface-muted")}>
              👤 {pedido.usuario.nombre}
            </div>
          )}
        </div>
        <div className={cn("flex items-center gap-1 text-[11px] ml-2 shrink-0", nightMode ? "text-gray-400" : "text-surface-muted")}>
          <Clock size={11} />
          <span>{tiempoStr}</span>
        </div>
      </div>

      {/* Productos */}
      <div className="px-3 pb-2 space-y-1">
        {pedido.detalles.map((d) => (
          <React.Fragment key={d.id}>
            <div className={cn(
              "flex items-start gap-2 rounded px-2 py-1",
              d.cancelado
                ? nightMode ? "bg-gray-800 opacity-50" : "bg-gray-100 opacity-60"
                : nightMode ? "bg-gray-800" : "bg-surface-bg"
            )}>
              <span className={cn("font-bold text-sm shrink-0 w-7", d.cancelado ? "text-gray-500 line-through" : "text-brand-500")}>
                {d.cantidad}x
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={cn("text-sm font-semibold leading-tight", d.cancelado ? "line-through text-gray-400" : nightMode ? "text-gray-100" : "text-surface-text")}>
                    {d.producto?.nombre ?? d.combo?.nombre ?? "—"}
                  </p>
                  {d.cancelado && (
                    <span className="bg-red-900/50 text-red-400 text-[10px] px-1 rounded font-bold">ANULADO</span>
                  )}
                </div>
                {Array.isArray(d.opciones) && d.opciones.length > 0 && !d.cancelado && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {(d.opciones as { grupoNombre: string; opcionNombre: string; precio: number }[]).map((o, i) => (
                      <span key={i} className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", nightMode ? "bg-violet-900/60 text-violet-300" : "bg-violet-100 text-violet-700")}>
                        {o.opcionNombre}{o.precio > 0 ? ` +${o.precio}` : ""}
                      </span>
                    ))}
                  </div>
                )}
                {d.observacion && !d.cancelado && (
                  <p className={cn("text-[11px] italic mt-0.5", nightMode ? "text-amber-400" : "text-amber-600")}>→ {d.observacion}</p>
                )}
              </div>
            </div>
            {esTabla(d.producto?.nombre ?? d.combo?.nombre ?? "") && !d.cancelado && (
              <div className="mt-1 px-1">
                <textarea
                  rows={2}
                  placeholder="Nota cocina: envoltorio, relleno... (Enter para guardar)"
                  value={tablaNotas[d.id] ?? (d.observacion ?? "")}
                  onChange={(e) => setTablaNotas((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  onBlur={() => void guardarNota(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void guardarNota(d.id);
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                  className="w-full rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 placeholder-amber-400 resize-none focus:outline-none focus:border-amber-500"
                />
                {savedNotas[d.id] && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Nota guardada</p>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Observacion general */}
      {cleanObservation && (
        <div className={cn("mx-3 mb-2 text-[11px] rounded px-2 py-1", nightMode ? "text-gray-400 bg-gray-800 border border-gray-700" : "text-surface-muted bg-amber-50 border border-amber-200")}>
          📝 {cleanObservation}
        </div>
      )}

      {/* Acciones */}
      {!isDelivery && (
        <div className={cn("flex border-t", nightMode ? "border-gray-700" : "border-surface-border")}>
          {siguiente && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-bold transition-all",
                pedido.estado === "PENDIENTE" && "bg-brand-500 hover:bg-brand-600 text-white",
                pedido.estado === "EN_PROCESO" && "bg-amber-500 hover:bg-amber-600 text-white",
                pedido.estado === "LISTO" && "bg-emerald-500 hover:bg-emerald-600 text-white",
                "disabled:opacity-50"
              )}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {nextLabel[pedido.estado]}
            </button>
          )}
          <button
            onClick={handleLlamarMesero}
            disabled={loadingMesero || pedido.meseroLlamado}
            className={cn(
              "px-3 py-2.5 text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50",
              nightMode ? "border-l border-gray-700" : "border-l border-surface-border",
              pedido.meseroLlamado
                ? nightMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600"
                : nightMode ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-surface-muted hover:bg-brand-50 hover:text-brand-600"
            )}
          >
            {loadingMesero ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} className={pedido.meseroLlamado ? "animate-bounce" : ""} />}
            {pedido.meseroLlamado ? "Llamado" : callLabel}
          </button>
          <button
            onClick={handlePrint}
            title="Imprimir comanda"
            className={cn(
              "px-3 py-2.5 transition-all flex items-center justify-center",
              nightMode ? "border-l border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "border-l border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
            )}
          >
            <Printer size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
