"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bike, CheckCircle2, ChevronDown, ChevronUp, Clock3, MapPin, Package2,
  Phone, Plus, RefreshCw, Route, ShoppingBag, UserRound, Wallet, Bell, X,
  Flame, ChefHat, Truck, LayoutList, TrendingUp, Timer, Star, Printer,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import type { EstadoPedido } from "@/types";
import { IngresoManualForm } from "@/components/delivery/IngresoManualForm";

interface PedidoDetalle { id: number; cantidad: number; nombre: string; precio: number; }

interface PedidoDelivery {
  id: number;
  estado: EstadoPedido;
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
  PENDIENTE:  { border: "border-l-amber-400",  bg: "bg-amber-50",  badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  EN_PROCESO: { border: "border-l-blue-400",   bg: "bg-blue-50",   badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-400"  },
  LISTO:      { border: "border-l-violet-400", bg: "bg-violet-50", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  ENTREGADO:  { border: "border-l-emerald-400",bg: "bg-emerald-50",badge: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-400"},
  CANCELADO:  { border: "border-l-rose-400",   bg: "bg-rose-50",   badge: "bg-rose-100 text-rose-700",    dot: "bg-rose-400"  },
} as const;

export function DeliveryClient({ pedidos: initialPedidos, repartidores, rol, productos, sucursalId, simbolo, zonasDelivery, logoUrl, sucursalNombre, stats }: Props) {
  const [pedidos, setPedidos]                   = useState(initialPedidos);
  const [activeFilter, setActiveFilter]         = useState<FilterKey>("todos");
  const [showIngreso, setShowIngreso]           = useState(false);
  const [showFinalizados, setShowFinalizados]   = useState(false);
  const [showRepartidores, setShowRepartidores] = useState(false);
  const [loadingPedidoId, setLoadingPedidoId]   = useState<number | null>(null);
  const [newOrderAlert, setNewOrderAlert]       = useState<PedidoDelivery | null>(null);
  const knownIdsRef = useRef(new Set(initialPedidos.map((p) => p.id)));

  const isAdmin = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol);

  const activos    = pedidos.filter((p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO");
  const entregados = pedidos.filter((p) => p.estado === "ENTREGADO");

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

  /* ── Polling nuevos pedidos ── */
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
        setPedidos(fresh);
      }
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
        const trackingStage =
          data.estado === "ENTREGADO" ? "ENTREGADO" :
          data.estado === "LISTO" && p.repartidorId ? "EN_CAMINO" :
          data.estado === "LISTO" || data.estado === "EN_PROCESO" ? "PREPARANDO" :
          data.estado === "CANCELADO" ? "CANCELADO" : "CONFIRMADO";
        return { ...p, estado: data.estado, trackingStage };
      }));
    } finally { setLoadingPedidoId(null); }
  }

  async function printComanda(pedido: PedidoDelivery) {
    const fecha = new Date(pedido.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora  = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    // ── HTML para fallback Chrome ──────────────────────────────────────────
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" class="logo" alt="Logo" />`
      : `<div class="logo-placeholder">${sucursalNombre.charAt(0)}</div>`;
    const itemsHtml = pedido.detalles.map((d) => {
      const sub = d.precio * d.cantidad;
      return `<div class="item"><div class="item-left"><span class="qty">${d.cantidad}×</span><span class="nombre">${d.nombre}</span></div><span class="item-precio">${formatCurrency(sub, simbolo)}</span></div>`;
    }).join("");
    const envioHtml = pedido.cargoEnvio > 0
      ? `<div class="envio"><span>Envío</span><span>${formatCurrency(pedido.cargoEnvio, simbolo)}</span></div>`
      : "";
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comanda #${pedido.id}</title><style>
      @page{size:80mm auto;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Courier New',Courier,monospace;width:80mm;padding:4mm 4mm 12mm 4mm;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .logo{display:block;width:56px;height:56px;object-fit:contain;margin:0 auto 5px;}
      .logo-placeholder{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:10px;background:#111;color:#fff;font-size:26px;font-weight:900;margin:0 auto 5px;}
      .center{text-align:center;}.llegamos{font-size:20px;font-weight:900;letter-spacing:2px;text-align:center;margin:6px 0 2px;}
      .subtitulo{font-size:10px;text-align:center;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:8px;}
      .divider{border:none;border-top:1px dashed #000;margin:6px 0;}
      .meta{font-size:10px;color:#555;margin-bottom:2px;}.meta span{font-weight:bold;color:#000;}
      .item{display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;font-size:12px;border-bottom:1px dotted #ccc;}
      .item-left{display:flex;gap:5px;flex:1;min-width:0;}.qty{font-weight:900;flex-shrink:0;}.nombre{font-weight:600;}
      .item-precio{font-weight:700;flex-shrink:0;margin-left:6px;}
      .envio{display:flex;justify-content:space-between;font-size:11px;color:#555;padding:3px 0;}
      .total-box{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:5px 8px;border:2px solid #000;font-size:16px;font-weight:900;}
      .pago{text-align:center;font-size:10px;color:#555;margin-top:5px;}
      .footer{text-align:center;margin-top:12px;font-size:11px;font-weight:700;letter-spacing:1px;border-top:2px dashed #000;padding-top:8px;}
      .footer .sub{font-size:10px;font-weight:400;color:#555;margin-top:3px;letter-spacing:0;}
      @media print{html,body{width:80mm;}}
    </style></head><body>
      <div class="center">${logoHtml}</div>
      <div class="llegamos">¡LLEGAMOS!</div>
      <div class="subtitulo">Aquí está el resumen de tu compra</div>
      <hr class="divider"/>
      <div class="meta">Cliente: <span>${pedido.clienteNombre}</span></div>
      <div class="meta">Pedido: <span>#${pedido.id}</span> · <span>${fecha} ${hora}</span></div>
      <div class="meta">Dirección: <span>${pedido.direccionEntrega ?? ""}${pedido.referencia ? " · " + pedido.referencia : ""}</span></div>
      <hr class="divider"/>
      <div class="items">${itemsHtml}</div>
      ${envioHtml}
      <div class="total-box"><span>TOTAL</span><span>${formatCurrency(pedido.total, simbolo)}</span></div>
      <div class="pago">Forma de pago: ${pedido.metodoPago}</div>
      <hr class="divider"/>
      <div class="footer">¡GRACIAS Y QUE DISFRUTES!<div class="sub">Esperamos verte pronto 🐼</div></div>
    </body></html>`;

    // ── 1. Abrir ventana sincrónicamente ───────────────────────────────────
    const pw = window.open("", "_blank", "width=302,height=900");
    if (pw) {
      pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;color:#555;font-size:13px;}</style></head><body><div style="text-align:center"><div style="font-size:22px;margin-bottom:8px;">🖨️</div>Enviando a impresora…</div></body></html>`);
      pw.document.close();
    }

    // ── 2. Texto plano para TCP / lp ──────────────────────────────────────
    const LINE = "================================";
    const center32 = (s: string) => s.padStart(Math.floor((32 + s.length) / 2)).padEnd(32);
    const row32 = (l: string, r: string) => l.padEnd(32 - r.length) + r;
    const itemsText = pedido.detalles.map((d) =>
      row32(`${d.cantidad}x ${d.nombre}`, formatCurrency(d.precio * d.cantidad, simbolo))
    ).join("\n");
    const textContent = [
      LINE,
      center32("¡LLEGAMOS!"),
      center32("Resumen de tu compra"),
      LINE,
      `Cliente: ${pedido.clienteNombre}`,
      `Pedido: #${pedido.id}  ${fecha} ${hora}`,
      pedido.direccionEntrega ? `Dir: ${pedido.direccionEntrega}` : "",
      pedido.referencia       ? `Ref: ${pedido.referencia}`       : "",
      LINE,
      itemsText,
      LINE,
      pedido.cargoEnvio > 0 ? row32("Envio", formatCurrency(pedido.cargoEnvio, simbolo)) : "",
      row32("TOTAL", formatCurrency(pedido.total, simbolo)),
      LINE,
      `Pago: ${pedido.metodoPago}`,
      LINE,
      center32("¡GRACIAS Y QUE DISFRUTES!"),
      center32("Esperamos verte pronto"),
      LINE,
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

  function renderPedidoCard(pedido: PedidoDelivery) {
    const loading = loadingPedidoId === pedido.id;
    const style = STAGE_STYLE[pedido.estado as keyof typeof STAGE_STYLE] ?? STAGE_STYLE.PENDIENTE;
    const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    return (
      <article key={pedido.id} className={cn(
        "relative overflow-hidden rounded-2xl border border-surface-border bg-white shadow-sm transition hover:shadow-md border-l-4",
        style.border
      )}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2.5">
            <span className={cn("h-2 w-2 rounded-full", style.dot)} />
            <span className="font-mono text-xs font-bold text-surface-muted">#{pedido.id}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", style.badge)}>
              {pedido.estado.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-muted">{hora}</span>
            <div className="rounded-xl bg-surface-bg px-3 py-1">
              <span className="text-sm font-black text-surface-text">{formatCurrency(pedido.total)}</span>
            </div>
            <button
              onClick={() => printComanda(pedido)}
              title="Imprimir comanda para bolsa"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 active:scale-95"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Cliente */}
          <div>
            <p className="text-base font-black text-surface-text leading-tight">{pedido.clienteNombre}</p>
            <p className="text-xs text-surface-muted mt-0.5">{getDeliveryStageLabel(pedido.trackingStage)}</p>
          </div>

          {/* Dirección + pago */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-1.5 rounded-xl bg-surface-bg px-3 py-2 text-xs text-surface-muted">
              <MapPin size={11} className="mt-0.5 shrink-0 text-brand-400" />
              <span className="line-clamp-2 leading-relaxed">{pedido.direccionEntrega ?? "Sin dirección"}{pedido.referencia ? ` · ${pedido.referencia}` : ""}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-surface-bg px-3 py-2 text-xs text-surface-muted">
              <span className="flex items-center gap-1.5"><Wallet size={11} className="text-brand-400" />{pedido.metodoPago}</span>
              <span className="flex items-center gap-1.5"><Bike size={11} className="text-brand-400" />{pedido.repartidor?.nombre ?? <span className="italic text-surface-muted/60">Sin repartidor</span>}</span>
            </div>
          </div>

          {/* Productos */}
          {pedido.detalles.length > 0 && (
            <div className="rounded-xl border border-surface-border/60 px-3 py-2 text-xs space-y-0.5">
              {pedido.detalles.map((d) => (
                <div key={d.id} className="flex gap-1.5 text-surface-muted">
                  <span className="font-bold text-surface-text tabular-nums">{d.cantidad}×</span>
                  <span>{d.nombre}</span>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          {(isAdmin || rol === "DELIVERY") && pedido.estado !== "ENTREGADO" && (
            <div className="space-y-2 pt-1">
              {isAdmin && (
                <select
                  value={pedido.repartidorId ?? ""}
                  onChange={(e) => void assignDriver(pedido.id, e.target.value)}
                  disabled={loading}
                  className="input w-full text-xs py-2"
                >
                  <option value="">Sin repartidor asignado</option>
                  {repartidores.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre} · {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}</option>
                  ))}
                </select>
              )}
              <div className="flex flex-wrap gap-2">
                {pedido.estado === "PENDIENTE" && (
                  <button onClick={() => void updateStatus(pedido.id, "EN_PROCESO")} disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <ChefHat size={12} />}
                    Pasar a cocina
                  </button>
                )}
                {pedido.estado === "EN_PROCESO" && (
                  <button onClick={() => void updateStatus(pedido.id, "LISTO")} disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Marcar listo
                  </button>
                )}
                {pedido.estado === "LISTO" && pedido.repartidorId && (
                  <button onClick={() => void updateStatus(pedido.id, "ENTREGADO")} disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <Route size={12} />}
                    Confirmar entrega
                  </button>
                )}
                {pedido.estado === "LISTO" && !pedido.repartidorId && (
                  <p className="text-xs text-violet-600 font-medium">Asigna un repartidor para despachar.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Alerta nuevo pedido ── */}
      {newOrderAlert && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white animate-pulse">
            <Bell size={18} />
          </div>
          <div>
            <p className="font-bold text-surface-text text-sm">🔔 Nuevo pedido #{newOrderAlert.id}</p>
            <p className="text-xs text-surface-muted">{newOrderAlert.clienteNombre} · {formatCurrency(newOrderAlert.total)}</p>
          </div>
          <button onClick={() => setNewOrderAlert(null)} className="ml-1 rounded-xl p-1.5 text-surface-muted hover:bg-surface-bg transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Hoy",          value: stats.pedidosHoy,                      icon: Star,       color: "text-brand-500" },
          { label: "Activos",      value: stats.activos,                          icon: Flame,      color: "text-amber-500" },
          { label: "En camino",    value: stats.enCamino,                         icon: Truck,      color: "text-violet-500" },
          { label: "Tiempo prom.", value: `${stats.tiempoPromedio} min`,          icon: Timer,      color: "text-blue-500" },
          { label: "Entregados",   value: stats.entregados,                       icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Ventas",       value: formatCurrency(stats.ventasDelivery),   icon: TrendingUp, color: "text-rose-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={13} className={color} />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-muted">{label}</p>
            </div>
            <p className="text-xl font-black text-surface-text">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar: filtros + ingreso manual ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {([
            { key: "todos",      label: "Todos",     icon: LayoutList, activeClass: "bg-surface-text text-white",    inactiveClass: "bg-surface-bg text-surface-muted hover:bg-surface-border" },
            { key: "pendiente",  label: "Entrando",  icon: Flame,      activeClass: "bg-amber-500  text-white",      inactiveClass: "bg-amber-50  text-amber-700 hover:bg-amber-100"  },
            { key: "en_proceso", label: "En Cocina", icon: ChefHat,    activeClass: "bg-blue-600   text-white",      inactiveClass: "bg-blue-50   text-blue-700  hover:bg-blue-100"   },
            { key: "listo",      label: "En Ruta",   icon: Truck,      activeClass: "bg-violet-600 text-white",      inactiveClass: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
          ] as const).map(({ key, label, icon: Icon, activeClass, inactiveClass }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                activeFilter === key ? activeClass : inactiveClass
              )}
            >
              <Icon size={12} />
              {label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none tabular-nums",
                activeFilter === key ? "bg-white/20" : "bg-black/8"
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowIngreso((v) => !v)}
          className={cn("btn-primary text-sm gap-2", showIngreso && "bg-brand-700")}
        >
          <Plus size={15} />
          Ingreso Manual
        </button>
      </div>

      {/* ── Ingreso Manual ── */}
      {showIngreso && (
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-surface-text">Nuevo pedido manual</p>
            <button onClick={() => setShowIngreso(false)} className="rounded-xl p-1.5 text-surface-muted hover:bg-surface-bg transition">
              <X size={16} />
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
                clienteNombre: pedido.clienteNombre, telefonoCliente: null,
                direccionEntrega: null, referencia: null, departamento: null,
                metodoPago: "EFECTIVO", cargoEnvio: 0, subtotal: 0, total: 0,
                repartidorId: null, creadoEn: new Date().toISOString(), repartidor: null, detalles: [],
              };
              knownIdsRef.current.add(pedido.id);
              setPedidos((prev) => [nuevo, ...prev]);
              setShowIngreso(false);
            }}
          />
        </div>
      )}

      {/* ── Pedidos activos ── */}
      {filteredActivos.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredActivos.map((pedido) => renderPedidoCard(pedido))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center text-sm text-surface-muted">
          No hay pedidos {activeFilter !== "todos" ? "en este estado" : "activos"} en este momento.
        </div>
      )}

      {/* ── Repartidores (colapsible) ── */}
      {repartidores.length > 0 && (
        <div>
          <button
            onClick={() => setShowRepartidores((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm font-semibold text-surface-text shadow-sm hover:bg-surface-bg transition"
          >
            <span className="flex items-center gap-2">
              <Bike size={15} className="text-brand-500" />
              Repartidores
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">{repartidores.length}</span>
            </span>
            {showRepartidores ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showRepartidores && (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {repartidores.map((r) => (
                <article key={r.id} className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-surface-text">{r.nombre}</p>
                      <p className="text-xs text-surface-muted">@{r.usuario}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      r.estado === "EN_REPARTO" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {r.estado === "EN_REPARTO" ? "En reparto" : "Disponible"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-3 text-xs text-surface-muted">
                    <span className="flex items-center gap-1"><UserRound size={11} className="text-brand-400" />{r.sucursalNombre}</span>
                    <span className="flex items-center gap-1"><ShoppingBag size={11} className="text-brand-400" />{r.activos} activos</span>
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
            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition",
            showFinalizados
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-surface-border bg-white text-surface-text shadow-sm hover:bg-surface-bg"
          )}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Delivery Finalizados
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">{entregados.length}</span>
          </span>
          {showFinalizados ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showFinalizados && (
          <div className="mt-3 space-y-2">
            {entregados.length > 0 ? entregados.map((pedido) => (
              <article key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="font-bold text-surface-text text-sm">#{pedido.id} · {pedido.clienteNombre}</p>
                  <p className="mt-0.5 text-xs text-surface-muted">{pedido.direccionEntrega ?? "Sin dirección"}{pedido.repartidor?.nombre ? ` · ${pedido.repartidor.nombre}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Entregado</span>
                  <span className="font-black text-surface-text">{formatCurrency(pedido.total)}</span>
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-surface-border bg-white p-8 text-center text-sm text-surface-muted">
                Todavía no hay pedidos entregados.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
