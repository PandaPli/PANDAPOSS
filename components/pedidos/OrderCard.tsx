"use client";

import { CheckCircle2, Clock, UtensilsCrossed, Loader2, Bell, Printer, ChefHat, Wine, Bike, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PedidoConDetalles, EstadoPedido } from "@/types";
import { useState, useEffect } from "react";
import { printFrame } from "@/lib/printFrame";

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
  PENDIENTE: "Iniciar preparación",
  EN_PROCESO: "Marcar listo ✓",
  LISTO: "Entregado",
};

// ── Estilo por tipo de pedido ─────────────────────────────────────────────
const tipoConfig: Record<string, {
  label: string;
  gradient: string;
  icon: React.ReactNode;
}> = {
  COCINA:    { label: "Cocina",    gradient: "from-orange-500 to-amber-500",   icon: <ChefHat size={14} /> },
  BAR:       { label: "Bar",       gradient: "from-blue-500 to-cyan-500",      icon: <Wine size={14} /> },
  DELIVERY:  { label: "Delivery",  gradient: "from-violet-500 to-purple-600",  icon: <Bike size={14} /> },
  MOSTRADOR: { label: "Mostrador", gradient: "from-emerald-500 to-teal-500",   icon: <ShoppingBag size={14} /> },
};

// ── Timer de urgencia ────────────────────────────────────────────────────
function getUrgency(creadoEn: string, now: number) {
  const mins = Math.floor((now - new Date(creadoEn).getTime()) / 60000);
  if (mins < 6)  return { label: `${mins}m`,    cls: "bg-emerald-500/20 text-emerald-300" };
  if (mins < 12) return { label: `${mins}m ⚡`,  cls: "bg-amber-500/20 text-amber-300" };
  return             { label: `${mins}m 🔥`,   cls: "bg-red-500/20 text-red-300" };
}

export function OrderCard({ pedido, onUpdateEstado, onLlamarMesero, isDelivery, sucursalId, sucursalNombre, sucursalRut, sucursalTelefono, sucursalDireccion, sucursalGiroComercial }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMesero, setLoadingMesero] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Timer vivo — actualiza cada 30s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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
    const hora  = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const mesaLabel   = pedido.mesa?.nombre ?? `Pedido #${pedido.numero}`;
    const meseroLabel = pedido.usuario?.nombre ?? "—";
    const tipo        = tipoConfig[pedido.tipo]?.label ?? pedido.tipo;

    const itemsHtml = pedido.detalles.map((d) => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "—";
      if (d.cancelado) return `
        <div class="item" style="opacity:0.5;">
          <div class="item-row" style="text-decoration:line-through;">
            <span class="qty">${d.cantidad}x</span>
            <span class="item-name">${nombre}</span>
            <span style="font-size:11px;margin-left:6px;">[ANULADO]</span>
          </div>
        </div>`;
      return `
        <div class="item">
          <div class="item-row">
            <span class="qty">${d.cantidad}x</span>
            <span class="item-name">${nombre}</span>
          </div>
          ${d.observacion ? `<div class="item-obs">➜ ${d.observacion}</div>` : ""}
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Comanda #${pedido.numero}</title>
      <style>
        @page{size:80mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;font-size:14px;width:72mm;padding:4mm 4mm 8mm;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .center{text-align:center}.bold{font-weight:bold}.big{font-size:22px;font-weight:bold}
        .tipo-badge{display:inline-block;border:2px solid #000;padding:2px 10px;font-size:15px;font-weight:bold;letter-spacing:2px;margin:4px 0}
        .divider{border:none;border-top:1px dashed #000;margin:5px 0}.divider-solid{border:none;border-top:2px solid #000;margin:5px 0}
        .meta-row{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
        .item{margin:5px 0}.item-row{display:flex;align-items:baseline;gap:6px}
        .qty{font-size:18px;font-weight:bold;min-width:28px}.item-name{font-size:15px;font-weight:bold;flex:1}
        .item-obs{font-size:12px;margin-left:34px;font-style:italic}.obs-box{border:1px dashed #000;padding:4px 6px;font-size:12px;margin-top:6px}
      </style></head>
      <body>
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

    printFrame(html);
  }

  // ── Datos derivados ───────────────────────────────────────────────────
  const siguiente  = nextEstado[pedido.estado];
  const urgency    = getUrgency(pedido.creadoEn, now);
  const tipo       = tipoConfig[pedido.tipo] ?? tipoConfig["COCINA"];

  let customerName    = "";
  let cleanObservation = pedido.observacion || "";

  if (pedido.tipo === "DELIVERY" && cleanObservation.startsWith("[DELIVERY]")) {
    try {
      const data = JSON.parse(cleanObservation.replace("[DELIVERY]", ""));
      if (data.clienteNombre) customerName = data.clienteNombre.split(" ")[0];
      const notes: string[] = [];
      if (data.direccion) notes.push(`Dir: ${data.direccion}`);
      if (data.referencia) notes.push(`Ref: ${data.referencia}`);
      cleanObservation = notes.join(" | ");
    } catch { /* ignore */ }
  } else if (cleanObservation) {
    const match = cleanObservation.match(/Cliente:\s*([^,\n]+)/i);
    if (match) {
      customerName     = match[1].trim();
      cleanObservation = cleanObservation.replace(match[0], "").replace(/^[-,\s]+|[-,\s]+$/g, "");
    }
  }

  let cardTitle = pedido.mesa?.nombre
    ? `${pedido.mesa.nombre}${customerName ? ` / ${customerName}` : ""}`
    : pedido.tipo === "DELIVERY" && customerName
      ? `${customerName} #${pedido.numero ?? pedido.id}`
      : `Pedido #${pedido.numero ?? pedido.id}${customerName ? ` / ${customerName}` : ""}`;

  const itemCount = pedido.detalles.filter(d => !d.cancelado).reduce((s, d) => s + d.cantidad, 0);

  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-2xl bg-slate-800 shadow-xl shadow-black/30 transition-all",
      pedido.meseroLlamado && "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900"
    )}>

      {/* ── Banner mesero ── */}
      {pedido.meseroLlamado && (
        <div className="flex items-center gap-2 bg-amber-400 px-4 py-2 text-amber-950 text-xs font-black tracking-wide">
          <Bell size={13} className="animate-bounce" />
          MESERO SOLICITADO — pendiente de retirar
        </div>
      )}

      {/* ── Header de color (por tipo) ── */}
      <div className={cn("flex items-center justify-between px-4 py-3 bg-gradient-to-r", tipo.gradient)}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
            {tipo.icon}
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90">{tipo.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Personas */}
          {pedido.mesa && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white">
              <UtensilsCrossed size={11} /> {itemCount}
            </span>
          )}
          {/* Timer urgencia */}
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-black tabular-nums", urgency.cls)}>
            <Clock size={11} className="inline mr-1 -mt-px" />
            {urgency.label}
          </span>
        </div>
      </div>

      {/* ── Título mesa / pedido ── */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 px-4 py-3">
        <div>
          <h4 className="text-base font-black text-white leading-tight">{cardTitle}</h4>
          {pedido.usuario && (
            <p className="mt-0.5 text-xs text-slate-400">👤 {pedido.usuario.nombre}</p>
          )}
        </div>
        <span className="rounded-xl bg-slate-700 px-2 py-1 font-mono text-xs font-bold text-slate-300">
          #{pedido.numero ?? pedido.id}
        </span>
      </div>

      {/* ── Items ── */}
      <div className="flex-1 divide-y divide-slate-700/50 px-4 py-1">
        {pedido.detalles.map((d) => {
          const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "—";
          return (
            <div key={d.id} className={cn("flex items-start gap-3 py-3", d.cancelado && "opacity-40")}>
              {/* Cantidad */}
              <span className={cn(
                "w-9 shrink-0 text-center text-xl font-black tabular-nums leading-none mt-0.5",
                d.cancelado ? "text-slate-500 line-through" : "text-white"
              )}>
                {d.cantidad}×
              </span>
              {/* Nombre + obs */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-bold leading-snug",
                  d.cancelado ? "text-slate-500 line-through" : "text-slate-100"
                )}>
                  {nombre}
                  {d.cancelado && <span className="ml-2 text-[10px] font-black text-red-400 not-italic">[ANULADO]</span>}
                </p>
                {d.observacion && !d.cancelado && (
                  <p className="mt-0.5 text-xs italic text-amber-300/80">➜ {d.observacion}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Observación general */}
      {cleanObservation && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <span className="text-amber-400 text-sm shrink-0">📝</span>
          <p className="text-xs text-amber-300 leading-snug">{cleanObservation}</p>
        </div>
      )}

      {/* ── Acciones ── */}
      {!isDelivery && (
        <div className="flex border-t border-slate-700/60">
          {/* Botón principal — grande y táctil */}
          {siguiente && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className={cn(
                "flex flex-1 items-center justify-center gap-2.5 py-4 text-sm font-black tracking-wide text-white transition-all active:scale-[0.98] disabled:opacity-50",
                pedido.estado === "PENDIENTE"  && "bg-brand-600 hover:bg-brand-500",
                pedido.estado === "EN_PROCESO" && "bg-amber-500 hover:bg-amber-400",
                pedido.estado === "LISTO"      && "bg-emerald-600 hover:bg-emerald-500",
              )}
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <CheckCircle2 size={18} />
              }
              {nextLabel[pedido.estado]}
            </button>
          )}

          {/* Botones secundarios */}
          <div className="flex flex-col border-l border-slate-700/60">
            <button
              onClick={handleLlamarMesero}
              disabled={loadingMesero || pedido.meseroLlamado}
              title={pedido.meseroLlamado ? "Mesero llamado" : "Llamar mesero"}
              className={cn(
                "flex flex-1 items-center justify-center px-4 transition-all active:scale-95 disabled:opacity-50",
                pedido.meseroLlamado
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              {loadingMesero
                ? <Loader2 size={16} className="animate-spin" />
                : <Bell size={16} className={pedido.meseroLlamado ? "animate-bounce" : ""} />
              }
            </button>
            <button
              onClick={handlePrint}
              title="Imprimir comanda"
              className="flex flex-1 items-center justify-center border-t border-slate-700/60 px-4 text-slate-400 transition-all hover:bg-slate-700 hover:text-white active:scale-95"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
