"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bike, CheckCircle2, ChevronDown, ChevronUp, MapPin,
  Phone, Plus, RefreshCw, Route, ShoppingBag, UserRound, Wallet, Bell, X,
  Flame, ChefHat, Truck, LayoutList, ArrowRight,
  Package2, Printer, XCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import { createSlug } from "@/lib/slug";
import QRCode from "qrcode";
import type { EstadoPedido } from "@/types";
import { IngresoManualForm } from "@/components/delivery/IngresoManualForm";

interface PedidoDetalle { id: number; cantidad: number; nombre: string; precio: number; }

interface PedidoDelivery {
  id: number;
  estado: EstadoPedido;
  meseroLlamado: boolean;
  llamadoTipo: string | null;
  trackingStage: "CONFIRMADO" | "PREPARANDO" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";
  clienteNombre: string;
  telefonoCliente: string | null;
  direccionEntrega: string | null;
  referencia: string | null;
  departamento: string | null;
  metodoPago: string;
  cargoEnvio: number;
  subtotal: number;
  total: number;
  repartidorId: number | null;
  creadoEn: string;
  repartidor: { nombre: string } | null;
  detalles: PedidoDetalle[];
  // "Retiro en tienda" cuando el cliente eligió modoRetiro en /pedir;
  // si no, contiene el nombre de la zona de delivery o null (retrocompat).
  zonaDelivery: string | null;
}

interface Repartidor {
  id: number;
  nombre: string;
  usuario: string;
  sucursalNombre: string;
  activos: number;
  estado: "DISPONIBLE" | "EN_REPARTO";
  pedidos: { id: number; estado: string; direccionEntrega: string | null }[];
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string | null;
  codigo?: string | null;
  categoria?: { nombre: string };
}

interface ZonaDelivery { id: number; nombre: string; precio: number }

interface Props {
  pedidos: PedidoDelivery[];
  repartidores: Repartidor[];
  rol: string;
  productos: Producto[];
  sucursalId: number | null;
  simbolo: string;
  zonasDelivery: ZonaDelivery[];
  logoUrl: string | null;
  sucursalNombre: string;
  stats: {
    pedidosHoy: number;
    enCamino: number;
    tiempoPromedio: number;
    ventasDelivery: number;
    activos: number;
    entregados: number;
  };
}

type FilterKey = "todos" | "pendiente" | "en_proceso" | "listo";

const STAGE_STYLE = {
  PENDIENTE:  { border: "border-amber-300",   dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-800",   ring: "ring-amber-300",  cardBg: "bg-amber-50/40"  },
  EN_PROCESO: { border: "border-blue-300",    dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-800",     ring: "ring-blue-300",   cardBg: "bg-blue-50/40"   },
  LISTO:      { border: "border-violet-400",  dot: "bg-violet-500",  badge: "bg-violet-100 text-violet-800", ring: "ring-violet-300", cardBg: "bg-violet-50/40" },
  ENTREGADO:  { border: "border-emerald-300", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800", ring: "ring-emerald-300", cardBg: "bg-emerald-50/40" },
  CANCELADO:  { border: "border-rose-300",    dot: "bg-rose-400",    badge: "bg-rose-100 text-rose-800",     ring: "ring-rose-300",   cardBg: "bg-rose-50/40"   },
} as const;

export function DeliveryClient({ pedidos: initialPedidos, repartidores, rol, productos, sucursalId, simbolo, zonasDelivery, logoUrl, sucursalNombre, stats }: Props) {
  const [pedidos, setPedidos]                   = useState(initialPedidos);
  const [activeFilter, setActiveFilter]         = useState<FilterKey>("todos");
  const [selectedId, setSelectedId]             = useState<number | null>(null);
  const [showIngreso, setShowIngreso]           = useState(false);
  const [showFinalizados, setShowFinalizados]   = useState(false);
  const [showRepartidores, setShowRepartidores] = useState(false);
  const [loadingPedidoId, setLoadingPedidoId]   = useState<number | null>(null);
  const [newOrderAlert, setNewOrderAlert]       = useState<PedidoDelivery | null>(null);
  const knownIdsRef = useRef(new Set(initialPedidos.map((p) => p.id)));

  const isAdmin = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol);

  // Pedidos activos: solo los de HOY (evita que órdenes viejas no cerradas contaminen la vista)
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
  const activos    = pedidos.filter((p) =>
    p.estado !== "ENTREGADO" && p.estado !== "CANCELADO" &&
    new Date(p.creadoEn) >= inicioHoy
  );
  const entregados = pedidos.filter((p) => p.estado === "ENTREGADO" && new Date(p.creadoEn) >= inicioHoy);

  const counts: Record<FilterKey, number> = {
    todos:      activos.length,
    pendiente:  activos.filter((p) => p.estado === "PENDIENTE").length,
    en_proceso: activos.filter((p) => p.estado === "EN_PROCESO").length,
    listo:      activos.filter((p) => p.estado === "LISTO").length,
  };

  const filteredActivos =
    activeFilter === "todos"      ? activos :
    activeFilter === "pendiente"  ? activos.filter((p) => p.estado === "PENDIENTE") :
    activeFilter === "en_proceso" ? activos.filter((p) => p.estado === "EN_PROCESO") :
                                    activos.filter((p) => p.estado === "LISTO");

  const selectedOrder = selectedId != null ? pedidos.find((p) => p.id === selectedId) ?? null : null;

  /* ── Auto-seleccionar el primer activo si no hay seleccionado ── */
  useEffect(() => {
    if (selectedId == null && filteredActivos.length > 0) {
      setSelectedId(filteredActivos[0].id);
    }
  }, []);

  /* ── Si el pedido seleccionado ya no está en la lista filtrada, limpiar ── */
  useEffect(() => {
    if (selectedId != null && !activos.find((p) => p.id === selectedId)) {
      setSelectedId(activos.length > 0 ? activos[0].id : null);
    }
  }, [pedidos]);

  /* ── Polling ── */
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/orders");
      if (!res.ok) return;
      const data = await res.json();
      const fresh: PedidoDelivery[] = data.pedidos ?? data;
      const incoming = fresh.filter((p) => !knownIdsRef.current.has(p.id) && p.estado !== "ENTREGADO" && p.estado !== "CANCELADO");
      if (incoming.length > 0) {
        setNewOrderAlert(incoming[0]);
        incoming.forEach((p) => knownIdsRef.current.add(p.id));
      }
      setPedidos(fresh);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, 20_000);
    return () => clearInterval(id);
  }, [poll]);

  async function assignDriver(pedidoId: number, repartidorId: string) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/assign", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, repartidorId: repartidorId ? Number(repartidorId) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos((cur) => cur.map((p) => p.id === pedidoId ? {
        ...p,
        repartidorId: data.repartidorId,
        repartidor: data.repartidor,
        trackingStage: data.repartidorId && p.estado === "LISTO" ? "EN_CAMINO" : p.trackingStage,
      } : p));
    } finally { setLoadingPedidoId(null); }
  }

  async function updateStatus(pedidoId: number, estado: EstadoPedido) {
    setLoadingPedidoId(pedidoId);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos((cur) => cur.map((p) => {
        if (p.id !== pedidoId) return p;
        const esRetiroPedido = /retiro/i.test(p.zonaDelivery ?? "");
        const trackingStage =
          data.estado === "ENTREGADO" ? "ENTREGADO" :
          data.estado === "LISTO" && (p.repartidorId || esRetiroPedido) ? "EN_CAMINO" :
          data.estado === "LISTO" || data.estado === "EN_PROCESO" ? "PREPARANDO" :
          data.estado === "CANCELADO" ? "CANCELADO" : "CONFIRMADO";
        return { ...p, estado: data.estado, trackingStage };
      }));
    } finally { setLoadingPedidoId(null); }
  }

  async function imprimirPrecuenta(pedido: PedidoDelivery) {
    const fmt = (n: number) => formatCurrency(Number(n) || 0, simbolo);
    const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    // Detectar modo retiro: el cliente desde /pedir setea zonaDelivery="Retiro en tienda".
    // Retrocompat: si zonaDelivery es null y no hay direccionEntrega, asumimos retiro.
    const esRetiro =
      (pedido.zonaDelivery?.toLowerCase().includes("retiro") ?? false) ||
      (!pedido.zonaDelivery && !pedido.direccionEntrega);
    const badgeLabel = esRetiro ? "RETIRO EN TIENDA" : "DELIVERY";
    const itemsHtml = pedido.detalles.map((d) => {
      const precio = Number(d.precio) || 0;
      return `
      <div class="item">
        <div class="item-row">
          <span class="qty">${d.cantidad}x</span>
          <span class="item-name">${d.nombre}</span>
          <span class="item-price">${fmt(precio * d.cantidad)}</span>
        </div>
      </div>`;
    }).join("");

    // QR al menú online del restaurante
    const menuUrl = `https://pandaposs.com/pedir/${createSlug(sucursalNombre)}`;
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(menuUrl, { margin: 1, width: 280, errorCorrectionLevel: "M" });
    } catch { /* si falla el QR, seguimos sin él */ }

    const qrHtml = qrDataUrl ? `
      <hr class="divider-solid"/>
      <div class="qr-block">
        <div class="rest-nombre">${sucursalNombre}</div>
        <div class="qr-title">ESCANEA Y VUELVE A PEDIR</div>
        <img src="${qrDataUrl}" alt="QR Menú" class="qr-img"/>
        <div class="qr-url">${menuUrl.replace("https://", "")}</div>
      </div>` : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: fit-content; min-height: 0; }
        body { font-family: 'Courier New', monospace; font-size: 13px; width: 72mm; padding: 4mm 4mm 2mm 4mm; color: #000; background: #fff; }
        .center { text-align: center; }
        .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .divider-solid { border: none; border-top: 2px solid #000; margin: 5px 0; }
        .big-name { font-size: 26px; font-weight: 900; text-align: center; line-height: 1.1; margin: 6px 0; word-break: break-word; }
        .pedido-num { font-size: 20px; font-weight: 900; text-align: center; letter-spacing: 2px; margin-bottom: 4px; }
        .badge { display: inline-block; border: 2px solid #000; padding: 2px 10px; font-size: 13px; font-weight: 900; letter-spacing: 2px; }
        .meta { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
        .item { margin: 4px 0; }
        .item-row { display: flex; align-items: baseline; gap: 4px; }
        .qty { font-size: 16px; font-weight: 900; min-width: 26px; }
        .item-name { font-size: 13px; font-weight: 700; flex: 1; }
        .item-price { font-size: 12px; text-align: right; white-space: nowrap; }
        .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; margin-top: 6px; }
        .label { font-size: 11px; color: #555; }
        .qr-block { text-align: center; margin-top: 6px; padding: 4px 0; }
        .rest-nombre { font-size: 20px; font-weight: 900; color: #000; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; word-break: break-word; }
        .qr-title { font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #000; margin-bottom: 6px; text-transform: uppercase; }
        .qr-img { width: 66mm; height: 66mm; display: block; margin: 0 auto; }
        .qr-url { font-size: 10px; margin-top: 4px; word-break: break-all; color: #000; font-weight: 700; }
        .cut-feed { height: 3mm; }
      </style></head><body>
      <div class="center"><span class="badge">${badgeLabel}</span></div>
      <hr class="divider"/>
      <div class="pedido-num">Pedido #${pedido.id}</div>
      <div class="big-name">${pedido.clienteNombre}</div>
      <hr class="divider-solid"/>
      <div class="meta"><span class="label">Hora:</span><span>${hora}</span></div>
      <div class="meta"><span class="label">Pago:</span><span>${pedido.metodoPago}</span></div>
      ${esRetiro
        ? `<div class="meta"><span class="label">Modo:</span><span>Retiro en tienda</span></div>`
        : pedido.direccionEntrega
          ? `<div class="meta"><span class="label">Dir:</span><span style="text-align:right;flex:1;padding-left:4px">${pedido.direccionEntrega}</span></div>`
          : ""}
      <hr class="divider"/>
      ${itemsHtml}
      <hr class="divider-solid"/>
      ${pedido.cargoEnvio > 0 ? `<div class="meta"><span>Envío</span><span>${fmt(pedido.cargoEnvio)}</span></div>` : ""}
      <div class="total-row"><span>TOTAL</span><span>${fmt(pedido.total)}</span></div>
      ${qrHtml}
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
    </body></html>`;

    const win = window.open("", "_blank", "width=320,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  /* ── Compact card (estilo mesa) ── */
  function renderCompactCard(pedido: PedidoDelivery) {
    const style   = STAGE_STYLE[pedido.estado as keyof typeof STAGE_STYLE] ?? STAGE_STYLE.PENDIENTE;
    const isSelected = selectedId === pedido.id;
    const hora    = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const cardEsRetiro = /retiro/i.test(pedido.zonaDelivery ?? "") || (!pedido.zonaDelivery && !pedido.direccionEntrega);

    return (
      <button
        key={pedido.id}
        onClick={() => setSelectedId(isSelected ? null : pedido.id)}
        className={cn(
          "relative w-full text-left rounded-2xl border-2 bg-white shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] p-4 flex flex-col gap-2",
          isSelected ? cn("shadow-md ring-2", style.ring, style.border) : "border-surface-border/60 hover:border-surface-border"
        )}
      >
        {/* Status dot + badge */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none", style.badge)}>
              {pedido.estado.replace("_", " ")}
            </span>
          </div>
          <span className="text-[10px] text-surface-muted tabular-nums">{hora}</span>
        </div>

        {/* ID */}
        <p className="font-mono text-[11px] font-bold text-surface-muted leading-none">#{pedido.id}</p>

        {/* Cliente */}
        <p className="font-black text-surface-text text-sm leading-tight line-clamp-2">{pedido.clienteNombre}</p>

        {/* Total */}
        <p className="text-base font-black text-surface-text leading-none mt-auto">{formatCurrency(pedido.total)}</p>

        {/* Indicador modo */}
        {cardEsRetiro ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Package2 size={10} className="shrink-0 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">Retiro en local</span>
          </div>
        ) : pedido.repartidor ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Bike size={10} className="shrink-0 text-brand-400" />
            <span className="text-[10px] text-surface-muted truncate">{pedido.repartidor.nombre}</span>
          </div>
        ) : null}
      </button>
    );
  }

  /* ── Panel de detalle (visor) ── */
  function renderDetailPanel() {
    if (!selectedOrder) {
      return (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-surface-border bg-white text-center px-6">
          <Package2 size={32} className="mb-3 text-surface-muted/30" />
          <p className="text-sm font-semibold text-surface-muted">Selecciona un pedido para ver los detalles</p>
        </div>
      );
    }

    const pedido  = selectedOrder;
    const loading = loadingPedidoId === pedido.id;
    const style   = STAGE_STYLE[pedido.estado as keyof typeof STAGE_STYLE] ?? STAGE_STYLE.PENDIENTE;
    const hora    = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const esRetiro =
      /retiro/i.test(pedido.zonaDelivery ?? "") ||
      (!pedido.zonaDelivery && !pedido.direccionEntrega);

    return (
      <div className="rounded-2xl border border-surface-border bg-white shadow-sm overflow-hidden">

        {/* Banner Rider listo */}
        {pedido.meseroLlamado && pedido.llamadoTipo === "RIDER" && (
          <div className="flex items-center gap-2 bg-blue-500 px-4 py-2 text-white text-xs font-bold">
            <Bell size={13} className="animate-bounce" />
            Pedido listo — avisale al Rider que puede retirar
          </div>
        )}

        {/* Header del visor */}
        <div className={cn("px-5 py-4 border-b border-surface-border/50 flex items-center justify-between gap-3")}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn("h-3 w-3 rounded-full shrink-0", style.dot)} />
            <span className="font-mono text-sm font-black text-surface-muted">#{pedido.id}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider", style.badge)}>
              {pedido.estado.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-surface-muted">{hora}</span>
            <button
              onClick={() => setSelectedId(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-muted hover:bg-surface-bg transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* Cliente */}
          <div>
            <p className="text-2xl font-black text-surface-text leading-tight">{pedido.clienteNombre}</p>
            <p className="text-sm text-surface-muted mt-0.5">{getDeliveryStageLabel(pedido.trackingStage, /retiro/i.test(pedido.zonaDelivery ?? ""))}</p>
            {pedido.telefonoCliente && (
              <a
                href={`tel:${pedido.telefonoCliente}`}
                className="inline-flex items-center gap-1.5 mt-1.5 text-sm font-semibold text-brand-600 hover:underline"
              >
                <Phone size={13} />
                {pedido.telefonoCliente}
              </a>
            )}
          </div>

          {/* Dirección / Retiro */}
          <div className={cn(
            "flex items-start gap-2.5 rounded-xl px-4 py-3",
            esRetiro ? "bg-emerald-50 border border-emerald-200" : "bg-surface-bg"
          )}>
            {esRetiro
              ? <Package2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              : <MapPin size={15} className="mt-0.5 shrink-0 text-brand-400" />
            }
            <p className={cn("text-sm leading-snug", esRetiro ? "font-bold text-emerald-700" : "text-surface-muted")}>
              {esRetiro ? "Retiro en local" : (pedido.direccionEntrega ?? "Sin dirección")}
              {!esRetiro && pedido.referencia ? <span className="text-surface-muted/60"> · {pedido.referencia}</span> : null}
              {!esRetiro && pedido.departamento ? <span className="text-surface-muted/60"> · {pedido.departamento}</span> : null}
            </p>
          </div>

          {/* Pago + repartidor/modo */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface-bg px-3 py-2.5">
              <Wallet size={13} className="shrink-0 text-brand-400" />
              <span className="text-sm font-semibold text-surface-text truncate">{pedido.metodoPago}</span>
            </div>
            {esRetiro ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <Package2 size={13} className="shrink-0 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700 truncate">Retiro en local</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-surface-bg px-3 py-2.5">
                <Bike size={13} className="shrink-0 text-brand-400" />
                <span className={cn("text-sm truncate", pedido.repartidor ? "font-semibold text-surface-text" : "italic text-surface-muted/60")}>
                  {pedido.repartidor?.nombre ?? "Sin repartidor"}
                </span>
              </div>
            )}
          </div>

          {/* Productos */}
          {pedido.detalles.length > 0 && (
            <div className="rounded-xl border border-surface-border/60 divide-y divide-surface-border/40">
              {pedido.detalles.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-7 shrink-0 text-center text-sm font-black text-surface-text tabular-nums">{d.cantidad}×</span>
                  <span className="text-sm text-surface-muted flex-1">{d.nombre}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totales */}
          <div className="rounded-xl bg-surface-bg px-4 py-3 flex flex-col gap-1.5">
            {pedido.cargoEnvio > 0 && (
              <div className="flex items-center justify-between text-sm text-surface-muted">
                <span>Cargo envío</span>
                <span>{formatCurrency(pedido.cargoEnvio)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-surface-text">Total</span>
              <span className="text-xl font-black text-surface-text">{formatCurrency(pedido.total)}</span>
            </div>
          </div>

          {/* Acciones */}
          {(isAdmin || rol === "DELIVERY") && pedido.estado !== "ENTREGADO" && (
            <div className="flex flex-col gap-3">

              {/* Selector de repartidor — solo para pedidos DELIVERY (no retiro) */}
              {isAdmin && !esRetiro && (
                <select
                  value={pedido.repartidorId ?? ""}
                  onChange={(e) => void assignDriver(pedido.id, e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-surface-border bg-surface-bg px-4 text-sm font-semibold text-surface-text h-12 appearance-none cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="">Sin repartidor asignado</option>
                  {repartidores.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} · {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                    </option>
                  ))}
                </select>
              )}

              {pedido.estado === "PENDIENTE" && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => void updateStatus(pedido.id, "EN_PROCESO")}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <ChefHat size={18} />}
                    Aceptar → Enviar a Cocina
                    {!loading && <ArrowRight size={16} className="ml-auto opacity-60" />}
                  </button>
                  <button
                    onClick={() => void updateStatus(pedido.id, "CANCELADO")}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-700 transition active:scale-95 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Rechazar pedido
                  </button>
                </div>
              )}
              {(pedido.estado === "EN_PROCESO" || pedido.estado === "LISTO") && (
                <button
                  onClick={() => imprimirPrecuenta(pedido)}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-surface-border bg-white py-3 text-sm font-bold text-surface-text transition active:scale-95 hover:bg-surface-bg"
                >
                  <Printer size={16} />
                  Imprimir Precuenta
                </button>
              )}
              {pedido.estado === "EN_PROCESO" && (
                <button
                  onClick={() => void updateStatus(pedido.id, "LISTO")}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Marcar listo
                  {!loading && <ArrowRight size={16} className="ml-auto opacity-60" />}
                </button>
              )}
              {/* Confirmar entrega: retiro no necesita repartidor */}
              {pedido.estado === "LISTO" && (esRetiro || pedido.repartidorId) && (
                <button
                  onClick={() => void updateStatus(pedido.id, "ENTREGADO")}
                  disabled={loading}
                  className={cn(
                    "flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50",
                    esRetiro ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : esRetiro ? <Package2 size={18} /> : <Route size={18} />}
                  {esRetiro ? "Confirmar retiro" : "Confirmar entrega"}
                  {!loading && <ArrowRight size={16} className="ml-auto opacity-60" />}
                </button>
              )}
              {pedido.estado === "LISTO" && !esRetiro && !pedido.repartidorId && (
                <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5">
                  <Bike size={16} className="shrink-0 text-violet-500" />
                  <p className="text-sm font-semibold text-violet-700">Asigna un repartidor para despachar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Alerta nuevo pedido ── */}
      {newOrderAlert && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-4 rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-2xl sm:max-w-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white animate-pulse">
            <Bell size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-surface-text">Nuevo pedido #{newOrderAlert.id}</p>
            <p className="text-sm text-surface-muted truncate">{newOrderAlert.clienteNombre} · {formatCurrency(newOrderAlert.total)}</p>
          </div>
          <button
            onClick={() => { setNewOrderAlert(null); setSelectedId(newOrderAlert.id); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-surface-muted hover:bg-surface-bg transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Toolbar: filtros + stats compactas + ingreso manual ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "todos",      label: "Todos",     icon: LayoutList, activeClass: "bg-slate-800 text-white shadow-md",       inactiveClass: "bg-white border border-surface-border text-surface-muted hover:bg-surface-bg" },
            { key: "pendiente",  label: "Por Aceptar", icon: Flame,    activeClass: "bg-amber-500 text-white shadow-md",       inactiveClass: "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"  },
            { key: "en_proceso", label: "En Cocina", icon: ChefHat,    activeClass: "bg-blue-600 text-white shadow-md",        inactiveClass: "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"   },
            { key: "listo",      label: "En Ruta",   icon: Truck,      activeClass: "bg-violet-600 text-white shadow-md",      inactiveClass: "bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100" },
          ] as const).map(({ key, label, icon: Icon, activeClass, inactiveClass }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 h-11 text-sm font-bold transition-all active:scale-95",
                activeFilter === key ? activeClass : inactiveClass
              )}
            >
              <Icon size={15} />
              {label}
              <span className={cn(
                "min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-black tabular-nums",
                activeFilter === key ? "bg-white/25 text-current" : "bg-black/8"
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Stats contextuales compactas */}
          <div className="hidden sm:flex items-center gap-1 divide-x divide-surface-border rounded-2xl border border-surface-border bg-white px-1 h-11">
            <div className="flex items-center gap-1.5 px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-black text-surface-text tabular-nums">{stats.entregados}</span>
              <span className="text-[11px] text-surface-muted uppercase tracking-wider font-semibold">entregados</span>
            </div>
            <div className="flex items-center gap-1.5 px-3">
              <span className="text-[11px] font-black text-surface-text">{formatCurrency(stats.ventasDelivery)}</span>
              <span className="text-[11px] text-surface-muted uppercase tracking-wider font-semibold">hoy</span>
            </div>
          </div>

          <button
            onClick={() => setShowIngreso((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl h-11 px-5 text-sm font-bold text-white transition-all active:scale-95 shadow",
              showIngreso ? "bg-brand-800" : "bg-brand-600 hover:bg-brand-700"
            )}
          >
            <Plus size={18} />
            Ingreso Manual
          </button>
        </div>
      </div>

      {/* ── Ingreso Manual ── */}
      {showIngreso && (
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold text-surface-text">Nuevo pedido manual</p>
            <button onClick={() => setShowIngreso(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-surface-muted hover:bg-surface-bg transition">
              <X size={18} />
            </button>
          </div>
          <IngresoManualForm
            productos={productos}
            sucursalId={sucursalId}
            simbolo={simbolo}
            zonasDelivery={zonasDelivery}
            onOrderCreated={(pedido) => {
              const nuevo: PedidoDelivery = {
                id: pedido.id, estado: "PENDIENTE", trackingStage: "CONFIRMADO",
                clienteNombre: pedido.clienteNombre, telefonoCliente: pedido.telefono,
                direccionEntrega: pedido.direccion, referencia: pedido.referencia || null, departamento: null,
                metodoPago: "EFECTIVO", cargoEnvio: 0, subtotal: 0, total: 0,
                repartidorId: null, creadoEn: new Date().toISOString(), repartidor: null, detalles: [],
                meseroLlamado: false, llamadoTipo: null,
                zonaDelivery: null,
              };
              knownIdsRef.current.add(pedido.id);
              setPedidos((prev) => [nuevo, ...prev]);
              setSelectedId(pedido.id);
              setShowIngreso(false);
            }}
          />
        </div>
      )}

      {/* ── Grid compacto + Visor de detalle ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* Grid de tarjetas compactas */}
        <div className="flex-1 min-w-0">
          {filteredActivos.length > 0 ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredActivos.map((pedido) => renderCompactCard(pedido))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-border bg-white p-14 text-center">
              <Bike size={32} className="mx-auto mb-3 text-surface-muted/40" />
              <p className="text-sm font-semibold text-surface-muted">
                No hay pedidos {activeFilter !== "todos" ? "en este estado" : "activos"} en este momento.
              </p>
            </div>
          )}
        </div>

        {/* Visor de detalle — sticky */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky top-4">
          {renderDetailPanel()}
        </div>
      </div>

      {/* ── Repartidores (colapsible) ── */}
      {repartidores.length > 0 && (
        <div>
          <button
            onClick={() => setShowRepartidores((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-surface-border bg-white px-5 py-4 text-sm font-bold text-surface-text shadow-sm hover:bg-surface-bg transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5">
              <Bike size={16} className="text-brand-500" />
              Repartidores
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-black text-brand-700">{repartidores.length}</span>
            </span>
            {showRepartidores ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showRepartidores && (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {repartidores.map((r) => (
                <article key={r.id} className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-surface-text">{r.nombre}</p>
                      <p className="text-xs text-surface-muted mt-0.5">@{r.usuario}</p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
                      r.estado === "EN_REPARTO" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    )}>
                      {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-surface-muted">
                    <span className="flex items-center gap-1.5"><UserRound size={12} className="text-brand-400" />{r.sucursalNombre}</span>
                    <span className="flex items-center gap-1.5"><ShoppingBag size={12} className="text-brand-400" />{r.activos} activos</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Finalizados ── */}
      <div>
        <button
          onClick={() => setShowFinalizados((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-sm font-bold transition active:scale-[0.99]",
            showFinalizados
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-surface-border bg-white text-surface-text shadow-sm hover:bg-surface-bg"
          )}
        >
          <span className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Delivery Finalizados
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">{entregados.length}</span>
          </span>
          {showFinalizados ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFinalizados && (
          <div className="mt-3 space-y-2">
            {entregados.length > 0 ? entregados.map((pedido) => (
              <article key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="font-bold text-surface-text">#{pedido.id} · {pedido.clienteNombre}</p>
                  <p className="mt-0.5 text-xs text-surface-muted">
                    {pedido.direccionEntrega ?? "Sin dirección"}
                    {pedido.repartidor?.nombre ? ` · ${pedido.repartidor.nombre}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700">Entregado</span>
                  <span className="text-base font-black text-surface-text">{formatCurrency(pedido.total)}</span>
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center text-sm text-surface-muted">
                Todavía no hay pedidos entregados.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
