"use client";

import React from "react";
import { CheckCircle2, Clock, Loader2, Bell, Printer, Bot, XCircle, ShieldCheck, RotateCcw, ShoppingBag, Utensils, MonitorSmartphone, Bike, Store, CreditCard, Banknote, ArrowLeftRight } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { PedidoConDetalles, EstadoPedido } from "@/types";
import type { Rol } from "@/types";
import { useState } from "react";

// ── Modalidad del pedido (como se entrega al cliente) ──────────────────────
type Modalidad = "MESA" | "RETIRO" | "KIOSKO" | "DELIVERY" | "MOSTRADOR";

function detectarModalidad(pedido: PedidoConDetalles): Modalidad {
  if (pedido.tipo === "DELIVERY") {
    // Si zonaDelivery dice "retiro", es un pedido de retiro en local
    const zona = pedido.delivery?.zonaDelivery ?? "";
    if (/retiro/i.test(zona)) return "RETIRO";
    return "DELIVERY";
  }
  if (pedido.mesa) return "MESA";
  const obs = pedido.observacion ?? "";
  if (obs.includes("KIOSKO")) return "KIOSKO";
  if (/PARA LLEVAR|LLEVAR|RETIRO/i.test(obs)) return "RETIRO";
  return "MOSTRADOR";
}

function getModalidadStyles(mod: Modalidad, nightMode: boolean) {
  switch (mod) {
    case "MESA":
      return {
        label: "MESA",
        icon: <Utensils size={11} />,
        cls: nightMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700 border border-blue-200",
      };
    case "RETIRO":
      return {
        label: "RETIRO",
        icon: <ShoppingBag size={11} />,
        cls: nightMode ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-orange-100 text-orange-700 border border-orange-200",
      };
    case "KIOSKO":
      return {
        label: "KIOSKO",
        icon: <MonitorSmartphone size={11} />,
        cls: nightMode ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-violet-100 text-violet-700 border border-violet-200",
      };
    case "DELIVERY":
      return {
        label: "DELIVERY",
        icon: <Bike size={11} />,
        cls: nightMode ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-cyan-100 text-cyan-700 border border-cyan-200",
      };
    default:
      return {
        label: "MOSTRADOR",
        icon: <Store size={11} />,
        cls: nightMode ? "bg-slate-500/20 text-slate-300 border border-slate-500/30" : "bg-slate-100 text-slate-700 border border-slate-200",
      };
  }
}

function detectarOrigen(pedido: PedidoConDetalles): "chatbot" | "mesa" | "pos" {
  if (pedido.delivery?.zonaDelivery === "WhatsApp") return "chatbot";
  if (pedido.observacion?.includes("[WSP]")) return "chatbot";
  if (pedido.mesa) return "mesa";
  return "pos";
}

// ── Estado de pago del pedido (para KDS) ───────────────────────────────────
// Le muestra al cajero/admin si el pedido ya viene pagado por tarjeta (MP),
// o si es efectivo / tarjeta al recibir / transferencia — antes de aceptar.
// Retorna null si no hay info de pago todavia (pedido de mesa que se cobra al final).
type EstadoPago = "PAGADO_TARJETA" | "TARJETA_EN_CASA" | "EFECTIVO" | "TRANSFERENCIA";

function detectarEstadoPago(pedido: PedidoConDetalles): EstadoPago | null {
  // 1. Mercado Pago aprobado: cualquier tipo (kiosko, /pedir, etc.)
  if (pedido.mpStatus === "approved") return "PAGADO_TARJETA";

  // 2. Pedido de /pedir: el metodo viene serializado en la observacion como
  //    "[DELIVERY]{...json...}" con campo metodoPago.
  if (pedido.tipo === "DELIVERY" && pedido.observacion?.startsWith("[DELIVERY]")) {
    try {
      const meta = JSON.parse(pedido.observacion.replace("[DELIVERY]", ""));
      const mp = meta.metodoPago as string | undefined;
      if (mp === "TARJETA")       return "TARJETA_EN_CASA";
      if (mp === "EFECTIVO")      return "EFECTIVO";
      if (mp === "TRANSFERENCIA") return "TRANSFERENCIA";
    } catch { /* obs mal formada, ignorar */ }
  }

  return null;
}

function getEstadoPagoStyles(estado: EstadoPago, nightMode: boolean) {
  switch (estado) {
    case "PAGADO_TARJETA":
      return {
        label: "PAGADO POR TARJETA",
        icon: <CreditCard size={11} />,
        cls: nightMode
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          : "bg-emerald-100 text-emerald-700 border border-emerald-300",
      };
    case "TARJETA_EN_CASA":
      return {
        label: "TARJETA EN CASA",
        icon: <CreditCard size={11} />,
        cls: nightMode
          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
          : "bg-orange-100 text-orange-700 border border-orange-300",
      };
    case "EFECTIVO":
      return {
        label: "PAGO EFECTIVO",
        icon: <Banknote size={11} />,
        cls: nightMode
          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
          : "bg-yellow-100 text-yellow-800 border border-yellow-300",
      };
    case "TRANSFERENCIA":
      return {
        label: "TRANSFERENCIA",
        icon: <ArrowLeftRight size={11} />,
        cls: nightMode
          ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
          : "bg-violet-100 text-violet-700 border border-violet-300",
      };
  }
}

interface OrderCardProps {
  pedido: PedidoConDetalles;
  onUpdateEstado: (id: number, estado: EstadoPedido) => Promise<void>;
  onLlamarMesero: (id: number) => Promise<void>;
  onReturnToProcess?: (id: number) => Promise<void>;
  rol?: Rol;
  nightMode?: boolean;
}

const tipoLabel: Record<string, string> = {
  COCINA: "COCINA",
  BAR: "BAR",
  REPOSTERIA: "REPOSTERIA",
  DELIVERY: "DELIVERY",
  MOSTRADOR: "MOSTRADOR",
};

function esTabla(nombre: string) {
  return /^tabla\b/i.test(nombre.trim());
}

// ── Permisos por rol ────────────────────────────────────────────────────────
function canConfirmOrders(rol?: Rol): boolean {
  return ["CASHIER", "RESTAURANTE", "ADMIN_GENERAL"].includes(rol ?? "");
}

function canPrepareOrders(rol?: Rol): boolean {
  return ["CHEF", "BAR", "RESTAURANTE", "ADMIN_GENERAL"].includes(rol ?? "");
}

// ── Estilos por estado ──────────────────────────────────────────────────────
function getEstadoStyles(estado: EstadoPedido, nightMode: boolean) {
  switch (estado) {
    case "PENDIENTE":
      return {
        card: nightMode
          ? "bg-red-950/40 border-l-4 border-l-red-500 border border-red-500/20"
          : "bg-red-50/80 border-l-4 border-l-red-500 border border-red-200",
        badge: nightMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700",
        badgeLabel: "POR CONFIRMAR",
        dot: "bg-red-500 animate-pulse",
        headerText: nightMode ? "text-red-300" : "text-red-800",
      };
    case "EN_PROCESO":
      return {
        card: nightMode
          ? "bg-amber-950/30 border-l-4 border-l-amber-500 border border-amber-500/20"
          : "bg-amber-50/80 border-l-4 border-l-amber-500 border border-amber-200",
        badge: nightMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700",
        badgeLabel: "CONFIRMADO",
        dot: "bg-amber-400",
        headerText: nightMode ? "text-amber-300" : "text-amber-800",
      };
    case "LISTO":
      return {
        card: nightMode
          ? "bg-emerald-950/30 border-l-4 border-l-emerald-500 border border-emerald-500/20"
          : "bg-emerald-50/80 border-l-4 border-l-emerald-500 border border-emerald-200",
        badge: nightMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700",
        badgeLabel: "COMPLETADO",
        dot: "bg-emerald-400",
        headerText: nightMode ? "text-emerald-300" : "text-emerald-800",
      };
    default:
      return {
        card: nightMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-surface-border",
        badge: nightMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600",
        badgeLabel: estado,
        dot: "bg-gray-400",
        headerText: nightMode ? "text-gray-300" : "text-gray-700",
      };
  }
}

export function OrderCard({ pedido, onUpdateEstado, onLlamarMesero, onReturnToProcess, rol, nightMode = false }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [loadingMesero, setLoadingMesero] = useState(false);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [tablaNotas, setTablaNotas] = useState<Record<number, string>>({});
  const [savedNotas, setSavedNotas] = useState<Record<number, boolean>>({});

  const isDeliveryRole = rol === "DELIVERY";
  const canConfirm = canConfirmOrders(rol);
  const canPrepare = canPrepareOrders(rol);
  const styles = getEstadoStyles(pedido.estado, nightMode);

  async function guardarNota(detalleId: number) {
    const nota = tablaNotas[detalleId]?.trim() ?? "";
    try {
      await fetch(`/api/pedidos/detalles/${detalleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacion: nota || null }),
      });
      setSavedNotas(prev => ({ ...prev, [detalleId]: true }));
      setTimeout(() => setSavedNotas(prev => ({ ...prev, [detalleId]: false })), 2000);
    } catch { /* ignore */ }
  }

  // ── Acciones según estado y rol ─────────────────────────────────────────
  async function handleAccept() {
    setLoading(true);
    await onUpdateEstado(pedido.id, "EN_PROCESO");
    setLoading(false);
  }

  async function handleReject() {
    if (!confirm("¿Rechazar este pedido? Esta accion no se puede deshacer.")) return;
    setLoadingReject(true);
    await onUpdateEstado(pedido.id, "CANCELADO");
    setLoadingReject(false);
  }

  async function handleComplete() {
    setLoading(true);
    await onUpdateEstado(pedido.id, "LISTO");
    setLoading(false);
  }

  async function handleLlamarMesero() {
    setLoadingMesero(true);
    await onLlamarMesero(pedido.id);
    setLoadingMesero(false);
  }

  async function handleReturnToProcess() {
    if (!onReturnToProcess) return;
    if (!confirm("Devolver este pedido a preparacion? Se quitara el estado COMPLETADO.")) return;
    setLoadingReturn(true);
    await onReturnToProcess(pedido.id);
    setLoadingReturn(false);
  }

  function handlePrint() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const mesaLabel = pedido.mesa?.nombre ?? `Pedido #${pedido.numero}`;
    const meseroLabel = pedido.usuario?.nombre ?? "--";
    const tipo = tipoLabel[pedido.tipo] ?? pedido.tipo;

    const itemsHtml = pedido.detalles.map(d => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "--";
      if (d.cancelado) {
        return `<div class="item" style="opacity:0.5;"><div class="item-row" style="text-decoration:line-through;"><span class="qty">${d.cantidad}x</span><span class="item-name">${nombre}</span><span style="font-size:11px;margin-left:6px;">[ANULADO]</span></div></div>`;
      }
      const notaTabla = esTabla(nombre) && tablaNotas[d.id] ? tablaNotas[d.id].trim() : null;
      return `
        <div class="item">
          <div class="item-row"><span class="qty">${d.cantidad}x</span><span class="item-name">${nombre}</span></div>
          ${Array.isArray(d.opciones) && d.opciones.length > 0
            ? (d.opciones as { opcionNombre: string; precio: number }[]).map(o =>
                `<div class="item-obs" style="color:#7c3aed;">* ${o.opcionNombre}${o.precio > 0 ? ` +${o.precio}` : ""}</div>`
              ).join("") : ""}
          ${d.observacion ? `<div class="item-obs">-> ${d.observacion}</div>` : ""}
          ${notaTabla ? `<div class="item-obs" style="font-weight:bold;font-style:normal;">* ${notaTabla}</div>` : ""}
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Comanda #${pedido.numero}</title>
      <style>@page{size:80mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}html,body{height:fit-content;min-height:0}body{font-family:'Courier New',Courier,monospace;font-size:14px;width:72mm;padding:4mm 4mm 2mm 4mm;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.center{text-align:center}.bold{font-weight:bold}.big{font-size:22px;font-weight:bold}.tipo-badge{display:inline-block;border:2px solid #000;padding:2px 10px;font-size:15px;font-weight:bold;letter-spacing:2px;margin:4px 0}.divider{border:none;border-top:1px dashed #000;margin:5px 0}.divider-solid{border:none;border-top:2px solid #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}.item{margin:5px 0}.item-row{display:flex;align-items:baseline;gap:6px}.qty{font-size:18px;font-weight:bold;min-width:28px}.item-name{font-size:15px;font-weight:bold;flex:1}.item-obs{font-size:12px;margin-left:34px;font-style:italic}.obs-box{border:1px dashed #000;padding:4px 6px;font-size:12px;margin-top:6px}.cut-feed{height:3mm}</style></head><body>
      <div class="center"><div class="tipo-badge">${tipo}</div></div><hr class="divider"/><div class="center big">${mesaLabel}</div><hr class="divider"/>
      <div class="meta-row"><span>Mesero/a:</span><span class="bold">${meseroLabel}</span></div>
      <div class="meta-row"><span>Pedido:</span><span class="bold">#${pedido.numero}</span></div>
      <div class="meta-row"><span>Fecha:</span><span>${fecha} ${hora}</span></div>
      <hr class="divider-solid"/>${itemsHtml}
      ${pedido.observacion ? `<hr class="divider"/><div class="obs-box">${pedido.observacion}</div>` : ""}
      <div class="cut-feed"></div><script>window.onload=function(){window.print();window.close();}<\/script></body></html>`;

    const win = window.open("", "_blank", "width=320,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  const tiempoStr = timeAgo(pedido.creadoEn);
  const origen = detectarOrigen(pedido);
  const modalidad = detectarModalidad(pedido);
  const modStyles = getModalidadStyles(modalidad, nightMode);
  const estadoPago = detectarEstadoPago(pedido);
  const pagoStyles = estadoPago ? getEstadoPagoStyles(estadoPago, nightMode) : null;

  // Urgencia: PENDIENTE > 2 min
  const minPendiente = pedido.estado === "PENDIENTE"
    ? Math.floor((Date.now() - new Date(pedido.creadoEn).getTime()) / 60000)
    : 0;
  const urgente = pedido.estado === "PENDIENTE" && minPendiente >= 2;

  // Llamada labels
  const callTipo = pedido.tipo === "DELIVERY" ? "RIDER" : pedido.mesa ? "MESERO" : "CAJERO";
  const callLabel = callTipo === "RIDER" ? "Rider" : callTipo === "CAJERO" ? "Cajero" : "Mesero";
  const callBannerText = pedido.llamadoTipo === "RIDER" ? "Listo para Rider" : pedido.llamadoTipo === "CAJERO" ? "Listo para Cajero" : "Mesero solicitado";
  const callBannerColor = pedido.llamadoTipo === "RIDER" ? "bg-blue-500" : pedido.llamadoTipo === "CAJERO" ? "bg-purple-500" : "bg-amber-400";

  // ── Parsear titulo y observacion ────────────────────────────────────────
  let customerName = "";
  let cleanObservation = pedido.observacion || "";

  if (pedido.tipo === "DELIVERY" && cleanObservation.startsWith("[DELIVERY]")) {
    try {
      const jsonStr = cleanObservation.replace("[DELIVERY]", "");
      const data = JSON.parse(jsonStr);
      if (data.clienteNombre) customerName = data.clienteNombre.split(" ")[0];
      const notes = [];
      if (data.direccion) notes.push(`Dir: ${data.direccion}`);
      if (data.referencia) notes.push(`Ref: ${data.referencia}`);
      cleanObservation = notes.join(" | ");
    } catch { /* ignore */ }
  } else if (cleanObservation) {
    cleanObservation = cleanObservation.replace(/\[WSP\]\s*\|?\s*/g, "").trim();
    const match = cleanObservation.match(/Cliente:\s*([^,\n|]+)/i);
    if (match) {
      customerName = match[1].replace(/\(.*?\)/, "").trim();
      cleanObservation = cleanObservation.replace(match[0], "").trim().replace(/^[-|,\s]+|[-|,\s]+$/g, "");
    }
  }

  let cardTitle = "";
  if (pedido.mesa?.nombre) {
    cardTitle = pedido.mesa.nombre;
    if (customerName) cardTitle += ` / ${customerName.charAt(0).toUpperCase() + customerName.slice(1)}`;
  } else if (pedido.tipo === "DELIVERY" && customerName) {
    cardTitle = `Ped ${customerName.charAt(0).toUpperCase() + customerName.slice(1).toLowerCase()} #${pedido.numero || pedido.id}`;
  } else {
    cardTitle = `Pedido #${pedido.numero || pedido.id}`;
    if (customerName) cardTitle += ` / ${customerName.charAt(0).toUpperCase() + customerName.slice(1)}`;
  }

  return (
    <div className={cn(
      "p-0 overflow-hidden animate-fade-in rounded-2xl shadow-sm transition-all",
      styles.card,
      urgente && "ring-2 ring-red-500 shadow-red-500/20 shadow-lg",
      pedido.meseroLlamado && "ring-2 ring-amber-400",
      origen === "chatbot" && "ring-2 ring-emerald-400"
    )}>
      {/* Banner ChatBot WhatsApp */}
      {origen === "chatbot" && (
        <div className="flex items-center gap-1.5 bg-emerald-500 px-3 py-1 text-white text-xs font-bold">
          <Bot size={12} />
          ChatBot WhatsApp
        </div>
      )}

      {/* Banner llamada */}
      {pedido.meseroLlamado && (
        <div className={`flex items-center gap-1.5 ${callBannerColor} px-3 py-1 text-white text-xs font-bold`}>
          <Bell size={12} className="animate-bounce" />
          {callBannerText}
        </div>
      )}

      {/* ── Header con badge de estado ────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-center justify-between mb-1.5 gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider", styles.badge)}>
              <div className={cn("h-2 w-2 rounded-full", styles.dot)} />
              {styles.badgeLabel}
            </div>
            <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider", modStyles.cls)}>
              {modStyles.icon}
              {modStyles.label}
            </div>
            {pagoStyles && (
              <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider", pagoStyles.cls)}>
                {pagoStyles.icon}
                {pagoStyles.label}
              </div>
            )}
          </div>
          <div className={cn("flex items-center gap-1 text-[11px] shrink-0", nightMode ? "text-gray-400" : "text-surface-muted")}>
            <Clock size={11} />
            <span className={cn(urgente && "text-red-400 font-bold")}>{tiempoStr}</span>
          </div>
        </div>
        <div className="min-w-0">
          <h4 className={cn("font-bold text-sm leading-tight truncate", nightMode ? "text-gray-100" : "text-surface-text")}>
            {cardTitle}
          </h4>
          {pedido.usuario && (
            <div className={cn("text-[11px] mt-0.5", nightMode ? "text-gray-400" : "text-surface-muted")}>
              {pedido.usuario.nombre}
            </div>
          )}
        </div>
      </div>

      {/* ── Productos ─────────────────────────────────────────────── */}
      <div className="px-3 pb-2 space-y-1">
        {pedido.detalles.map(d => (
          <React.Fragment key={d.id}>
            <div className={cn(
              "flex items-start gap-2 rounded px-2 py-1",
              d.cancelado
                ? nightMode ? "bg-gray-800 opacity-50" : "bg-gray-100 opacity-60"
                : nightMode ? "bg-white/5" : "bg-surface-bg"
            )}>
              <span className={cn("font-bold text-sm shrink-0 w-7", d.cancelado ? "text-gray-500 line-through" : "text-brand-500")}>
                {d.cantidad}x
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={cn("text-sm font-semibold leading-tight", d.cancelado ? "line-through text-gray-400" : nightMode ? "text-gray-100" : "text-surface-text")}>
                    {d.producto?.nombre ?? d.combo?.nombre ?? "--"}
                  </p>
                  {d.cancelado && (
                    <span className="bg-red-900/50 text-red-400 text-[10px] px-1 rounded font-bold">ANULADO</span>
                  )}
                </div>
                {Array.isArray(d.opciones) && d.opciones.length > 0 && !d.cancelado && !esTabla(d.producto?.nombre ?? d.combo?.nombre ?? "") && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {(d.opciones as { grupoNombre: string; opcionNombre: string; precio: number }[]).map((o, i) => (
                      <span key={i} className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", nightMode ? "bg-violet-900/60 text-violet-300" : "bg-violet-100 text-violet-700")}>
                        {o.opcionNombre}{o.precio > 0 ? ` +${o.precio}` : ""}
                      </span>
                    ))}
                  </div>
                )}
                {d.observacion && !d.cancelado && !esTabla(d.producto?.nombre ?? d.combo?.nombre ?? "") && (
                  <p className={cn("text-[11px] italic mt-0.5", nightMode ? "text-amber-400" : "text-amber-600")}>{d.observacion}</p>
                )}
              </div>
            </div>
            {esTabla(d.producto?.nombre ?? d.combo?.nombre ?? "") && !d.cancelado && (
              <div className="mt-1 px-1">
                <textarea
                  rows={2}
                  placeholder="Nota cocina: envoltorio, relleno..."
                  value={tablaNotas[d.id] ?? (d.observacion ?? "")}
                  onChange={e => setTablaNotas(prev => ({ ...prev, [d.id]: e.target.value }))}
                  onBlur={() => void guardarNota(d.id)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void guardarNota(d.id);
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                  className="w-full rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 placeholder-amber-400 resize-none focus:outline-none focus:border-amber-500"
                />
                {savedNotas[d.id] && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Nota guardada</p>}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Observacion general ───────────────────────────────────── */}
      {cleanObservation && (
        <div className={cn("mx-3 mb-2 text-[11px] rounded px-2 py-1", nightMode ? "text-gray-400 bg-white/5 border border-white/10" : "text-surface-muted bg-amber-50 border border-amber-200")}>
          {cleanObservation}
        </div>
      )}

      {/* ── Acciones (por rol y estado) ───────────────────────────── */}
      {!isDeliveryRole && (
        <div className={cn("border-t", nightMode ? "border-white/10" : "border-surface-border")}>

          {/* ═══ PENDIENTE: solo cajera puede aceptar/rechazar ═══ */}
          {pedido.estado === "PENDIENTE" && canConfirm && (
            <div className="flex">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-black transition-all bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                Aceptar Pedido
              </button>
              <button
                onClick={handleReject}
                disabled={loadingReject}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold transition-all disabled:opacity-50",
                  nightMode ? "border-l border-white/10 text-red-400 hover:bg-red-900/30" : "border-l border-surface-border text-red-500 hover:bg-red-50"
                )}
              >
                {loadingReject ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />}
                Rechazar
              </button>
              <button
                onClick={handlePrint}
                title="Imprimir comanda"
                className={cn(
                  "px-3 py-3 transition-all flex items-center justify-center",
                  nightMode ? "border-l border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5" : "border-l border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
                )}
              >
                <Printer size={14} />
              </button>
            </div>
          )}

          {/* PENDIENTE: chef/bar solo ven estado, no pueden actuar */}
          {pedido.estado === "PENDIENTE" && !canConfirm && (
            <div className="flex">
              <div className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold",
                nightMode ? "text-red-400/60 bg-red-950/20" : "text-red-400 bg-red-50"
              )}>
                <Clock size={13} />
                Esperando confirmacion de caja
              </div>
              <button
                onClick={handlePrint}
                title="Imprimir comanda"
                className={cn(
                  "px-3 py-3 transition-all flex items-center justify-center",
                  nightMode ? "border-l border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5" : "border-l border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
                )}
              >
                <Printer size={14} />
              </button>
            </div>
          )}

          {/* ═══ EN_PROCESO: chef/bar pueden completar ═══ */}
          {pedido.estado === "EN_PROCESO" && canPrepare && (
            <div className="flex">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-black transition-all bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Marcar Completado
              </button>
              <button
                onClick={handleLlamarMesero}
                disabled={loadingMesero || pedido.meseroLlamado}
                className={cn(
                  "px-4 py-3 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50",
                  nightMode ? "border-l border-white/10" : "border-l border-surface-border",
                  pedido.meseroLlamado
                    ? nightMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600"
                    : nightMode ? "text-gray-400 hover:bg-white/5 hover:text-gray-200" : "text-surface-muted hover:bg-brand-50 hover:text-brand-600"
                )}
              >
                {loadingMesero ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} className={pedido.meseroLlamado ? "animate-bounce" : ""} />}
                {pedido.meseroLlamado ? "Llamado" : callLabel}
              </button>
              <button
                onClick={handlePrint}
                title="Imprimir comanda"
                className={cn(
                  "px-3 py-3 transition-all flex items-center justify-center",
                  nightMode ? "border-l border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5" : "border-l border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
                )}
              >
                <Printer size={14} />
              </button>
            </div>
          )}

          {/* EN_PROCESO: cajera solo ve estado */}
          {pedido.estado === "EN_PROCESO" && !canPrepare && (
            <div className="flex">
              <div className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold",
                nightMode ? "text-amber-400/60 bg-amber-950/20" : "text-amber-600 bg-amber-50"
              )}>
                <Loader2 size={13} className="animate-spin" />
                En preparacion...
              </div>
              <button
                onClick={handlePrint}
                title="Imprimir comanda"
                className={cn(
                  "px-3 py-3 transition-all flex items-center justify-center",
                  nightMode ? "border-l border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5" : "border-l border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
                )}
              >
                <Printer size={14} />
              </button>
            </div>
          )}

          {/* ═══ LISTO: llamar mesero/cajero ═══ */}
          {pedido.estado === "LISTO" && (
            <div className="flex">
              <button
                onClick={handleLlamarMesero}
                disabled={loadingMesero || pedido.meseroLlamado}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold transition-all disabled:opacity-50",
                  pedido.meseroLlamado
                    ? nightMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
              >
                {loadingMesero ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} className={pedido.meseroLlamado ? "animate-bounce" : ""} />}
                {pedido.meseroLlamado ? `${callLabel} notificado` : `Llamar ${callLabel}`}
              </button>
              {canConfirm && onReturnToProcess && (
                <button
                  onClick={handleReturnToProcess}
                  disabled={loadingReturn}
                  title="Devolver a preparacion (solo Cajera / Admin Sucursal)"
                  className={cn(
                    "px-3 py-3 transition-all flex items-center justify-center disabled:opacity-50",
                    nightMode
                      ? "border-l border-white/10 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                      : "border-l border-surface-border text-red-500 hover:bg-red-50 hover:text-red-600"
                  )}
                >
                  {loadingReturn ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                </button>
              )}
              <button
                onClick={handlePrint}
                title="Imprimir comanda"
                className={cn(
                  "px-3 py-3 transition-all flex items-center justify-center",
                  nightMode ? "border-l border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5" : "border-l border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
                )}
              >
                <Printer size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
