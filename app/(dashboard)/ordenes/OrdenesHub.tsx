"use client";

import Link from "next/link";
import {
  Bike, ShoppingBag, Star, Clock, User,
  Package, UtensilsCrossed, CheckCircle2,
  Eye, Printer, X, MapPin, CreditCard, Truck, ShoppingCart,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

/* ── Types ── */
interface ProductoDetalle {
  nombre:   string;
  cantidad: number;
  precio:   number;
}

interface PedidoBase {
  id:            number;
  numero:        number;
  estado:        string;
  clienteNombre: string;
  total:         number;
  creadoEn:      string;
  items:         number;
  metodoPago:    string;
  cargoEnvio:    number;
  descuento:     number;
  productos:     ProductoDetalle[];
}

interface DeliveryPedido extends PedidoBase {
  tipo:      "DELIVERY";
  direccion: string | null;
  telefono:  string | null;
}

interface LlevarPedido extends PedidoBase {
  tipo:       "RETIRO";
  horaRetiro: string | null;
}

type AnyPedido = DeliveryPedido | LlevarPedido;

interface Props {
  deliveryPedidos:  DeliveryPedido[];
  llevarPedidos:    LlevarPedido[];
  simbolo:          string;
  sucursalNombre:   string;
  pedidoUrl:        string;
}

/* ── Estado → config visual ── */
const ESTADO_CONFIG: Record<string, { label: string; dot: string }> = {
  PENDIENTE:  { label: "Pendiente",  dot: "bg-amber-400" },
  EN_PROCESO: { label: "Preparando", dot: "bg-blue-400"  },
  LISTO:      { label: "Listo",      dot: "bg-emerald-400" },
};

const PAGO_LABEL: Record<string, string> = {
  EFECTIVO:        "Efectivo",
  TARJETA:         "Tarjeta",
  TRANSFERENCIA:   "Transferencia",
  MERCADO_PAGO:    "Mercado Pago",
  DEBITO:          "Débito",
  CREDITO:         "Crédito",
};

/* ── Hub icons ── */
const HUBS = [
  { href: "/ordenes/delivery", icon: Bike,            label: "Delivery", gradient: "from-amber-400 to-orange-500",  glow: "0 8px 24px rgba(245,158,11,.25)",  ring: "ring-amber-200"  },
  { href: "/ordenes/llevar",   icon: ShoppingBag,     label: "Retiro",   gradient: "from-emerald-400 to-teal-500",  glow: "0 8px 24px rgba(16,185,129,.25)", ring: "ring-emerald-200" },
  { href: "/mesas",            icon: UtensilsCrossed, label: "Servir",   gradient: "from-rose-400 to-pink-500",     glow: "0 8px 24px rgba(244,63,94,.25)",  ring: "ring-rose-200"    },
] as const;

/* ════════════════════════════════════════
   Hub principal
════════════════════════════════════════ */
export function OrdenesHub({ deliveryPedidos, llevarPedidos, simbolo, sucursalNombre, pedidoUrl }: Props) {
  const [selected, setSelected] = useState<AnyPedido | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-3">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-500/20">
          <Star size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-surface-text leading-none">Ordenes</h1>
          <p className="text-[11px] text-surface-muted">Retiro y Delivery</p>
        </div>
      </div>

      {/* Hub icons */}
      <div className="grid grid-cols-3 gap-2">
        {HUBS.map(({ href, icon: Icon, label, gradient, glow, ring }) => (
          <Link
            key={href}
            href={href}
            className={cn("group card p-3 flex flex-col items-center gap-2 cursor-pointer text-center", "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200", "hover:ring-2", ring)}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`} style={{ boxShadow: glow }}>
              <Icon size={18} className="text-white" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold text-surface-text">{label}</p>
          </Link>
        ))}
      </div>

      {/* Split dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Delivery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-xs font-bold text-surface-text">Delivery</h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{deliveryPedidos.length}</span>
            </div>
            <Link href="/ordenes/delivery" className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline">Ver todos →</Link>
          </div>

          {deliveryPedidos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-5 text-center">
              <Bike size={22} className="mx-auto text-amber-300 mb-1" />
              <p className="text-[11px] text-amber-400 font-semibold">Sin pedidos delivery activos</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {deliveryPedidos.map((p) => (
                <OrderCard key={p.id} pedido={p} simbolo={simbolo} accentColor="amber" onDetail={() => setSelected(p)} pedidoUrl={pedidoUrl} sucursalNombre={sucursalNombre} />
              ))}
            </div>
          )}
        </div>

        {/* Retiro */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-surface-text">Retiro</h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{llevarPedidos.length}</span>
            </div>
            <Link href="/ordenes/llevar" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Ver todos →</Link>
          </div>

          {llevarPedidos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center">
              <ShoppingBag size={22} className="mx-auto text-emerald-300 mb-1" />
              <p className="text-[11px] text-emerald-400 font-semibold">Sin pedidos para llevar activos</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {llevarPedidos.map((p) => (
                <OrderCard key={p.id} pedido={p} simbolo={simbolo} accentColor="emerald" onDetail={() => setSelected(p)} pedidoUrl={pedidoUrl} sucursalNombre={sucursalNombre} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      {selected && (
        <PedidoDetailModal
          pedido={selected}
          simbolo={simbolo}
          sucursalNombre={sucursalNombre}
          pedidoUrl={pedidoUrl}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   Tarjeta de pedido con botones ojo + print
════════════════════════════════════════ */
function OrderCard({
  pedido, simbolo, accentColor, onDetail, pedidoUrl, sucursalNombre,
}: {
  pedido:          AnyPedido;
  simbolo:         string;
  accentColor:     "amber" | "emerald";
  onDetail:        () => void;
  pedidoUrl:       string;
  sucursalNombre:  string;
}) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const cfg  = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, dot: "bg-gray-400" };
  const isAmber = accentColor === "amber";

  const borderColor = isAmber ? "border-amber-100 hover:border-amber-200"   : "border-emerald-100 hover:border-emerald-200";
  const bgColor     = isAmber ? "from-white to-amber-50/40"                 : "from-white to-emerald-50/40";
  const numColor    = isAmber ? "text-amber-700"                            : "text-emerald-700";
  const badgeBg     = isAmber ? "bg-amber-100/80 text-amber-600"            : "bg-emerald-100/80 text-emerald-600";
  const iconColor   = isAmber ? "text-amber-400"                            : "text-emerald-400";

  return (
    <div className={`group rounded-xl border ${borderColor} bg-gradient-to-br ${bgColor} p-2.5 hover:shadow-sm transition-all duration-200`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-black ${numColor}`}>#{pedido.numero}</span>
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-px rounded-full ${badgeBg}`}>
            <span className={cn("w-1 h-1 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-surface-text">{formatCurrency(pedido.total, simbolo)}</span>
          {/* Botón ojo */}
          <button
            type="button"
            onClick={onDetail}
            title="Ver detalle"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-surface-border bg-white text-surface-muted hover:border-violet-300 hover:text-violet-600 transition-colors"
          >
            <Eye size={12} />
          </button>
          {/* Botón imprimir */}
          <button
            type="button"
            onClick={() => printEtiqueta(pedido, simbolo, sucursalNombre, pedidoUrl)}
            title="Imprimir etiqueta"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-surface-border bg-white text-surface-muted hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Printer size={12} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-surface-muted">
        <span className={`flex items-center gap-1 truncate font-medium`}>
          <User size={10} className={`${iconColor} shrink-0`} />{pedido.clienteNombre}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Clock size={10} className={iconColor} />{hora}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-auto">
          <Package size={9} />{pedido.items}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Modal de detalle
════════════════════════════════════════ */
function PedidoDetailModal({
  pedido, simbolo, sucursalNombre, pedidoUrl, onClose,
}: {
  pedido:          AnyPedido;
  simbolo:         string;
  sucursalNombre:  string;
  pedidoUrl:       string;
  onClose:         () => void;
}) {
  const hora  = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const fecha = new Date(pedido.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
  const cfg   = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, dot: "bg-gray-400" };
  const esDelivery = pedido.tipo === "DELIVERY";

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 text-white ${esDelivery ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              {esDelivery ? <Truck size={18} /> : <ShoppingBag size={18} />}
            </div>
            <div>
              <p className="font-black text-base leading-none">Pedido #{pedido.numero}</p>
              <p className="text-xs text-white/80 mt-0.5">{fecha} · {hora}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printEtiqueta(pedido, simbolo, sucursalNombre, pedidoUrl)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              title="Imprimir etiqueta"
            >
              <Printer size={15} />
            </button>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Estado badge */}
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", pedido.estado === "LISTO" ? "bg-emerald-100 text-emerald-700" : pedido.estado === "EN_PROCESO" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
              <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* Info cliente */}
          <div className="space-y-2 rounded-xl border border-surface-border bg-surface-bg p-3">
            <InfoRow icon={<User size={14} className="text-violet-500" />} label="Cliente" value={pedido.clienteNombre} />
            <InfoRow icon={<CreditCard size={14} className="text-blue-500" />} label="Pago" value={PAGO_LABEL[pedido.metodoPago] ?? pedido.metodoPago} />
            <InfoRow
              icon={esDelivery ? <Truck size={14} className="text-amber-500" /> : <ShoppingCart size={14} className="text-emerald-500" />}
              label="Entrega"
              value={esDelivery ? "Delivery" : "Retiro en local"}
            />
            {esDelivery && (pedido as DeliveryPedido).direccion && (
              <InfoRow icon={<MapPin size={14} className="text-red-500" />} label="Dirección" value={(pedido as DeliveryPedido).direccion!} />
            )}
            {!esDelivery && (pedido as LlevarPedido).horaRetiro && (
              <InfoRow icon={<Clock size={14} className="text-emerald-500" />} label="Hora retiro" value={(pedido as LlevarPedido).horaRetiro!} />
            )}
          </div>

          {/* Productos */}
          <div>
            <p className="text-xs font-bold text-surface-muted uppercase tracking-wide mb-2">Productos</p>
            <div className="space-y-1">
              {pedido.productos.map((prod, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-surface-text">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-surface-bg border border-surface-border text-[11px] font-black text-surface-muted">{prod.cantidad}</span>
                    {prod.nombre}
                  </span>
                  <span className="font-semibold text-surface-text shrink-0 ml-2">{formatCurrency(prod.precio * prod.cantidad, simbolo)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="border-t border-surface-border pt-3 space-y-1.5">
            {pedido.cargoEnvio > 0 && (
              <div className="flex justify-between text-sm text-surface-muted">
                <span>Envío</span>
                <span>{formatCurrency(pedido.cargoEnvio, simbolo)}</span>
              </div>
            )}
            {pedido.descuento > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Descuento</span>
                <span>-{formatCurrency(pedido.descuento, simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base text-surface-text">
              <span>Total</span>
              <span>{formatCurrency(pedido.total, simbolo)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-surface-border px-5 py-3 bg-surface-bg flex justify-between items-center">
          <p className="text-xs text-surface-muted">{sucursalNombre}</p>
          <button
            type="button"
            onClick={() => printEtiqueta(pedido, simbolo, sucursalNombre, pedidoUrl)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <Printer size={14} />
            Imprimir etiqueta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helper InfoRow ── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-surface-muted shrink-0 w-20">{label}</span>
      <span className="font-medium text-surface-text leading-tight">{value}</span>
    </div>
  );
}

/* ════════════════════════════════════════
   Función de impresión — abre popup con etiqueta
════════════════════════════════════════ */
async function printEtiqueta(
  pedido:         AnyPedido,
  simbolo:        string,
  sucursalNombre: string,
  pedidoUrl:      string,
) {
  // Generar QR como data URL
  const QRCode = await import("qrcode");
  const qrDataUrl = await QRCode.toDataURL(pedidoUrl, {
    width: 140,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const hora  = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const fecha = new Date(pedido.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  const esDelivery = pedido.tipo === "DELIVERY";

  const productosHtml = pedido.productos
    .map((p) => `
      <tr>
        <td style="padding:3px 0;font-size:13px;">${p.cantidad}x ${p.nombre}</td>
        <td style="padding:3px 0;font-size:13px;text-align:right;font-weight:600;">${simbolo}${(p.precio * p.cantidad).toLocaleString("es-CL")}</td>
      </tr>`)
    .join("");

  const envioRow = pedido.cargoEnvio > 0
    ? `<tr><td style="font-size:12px;color:#666;padding-top:4px;">Envío</td><td style="font-size:12px;color:#666;text-align:right;padding-top:4px;">${simbolo}${pedido.cargoEnvio.toLocaleString("es-CL")}</td></tr>`
    : "";

  const descuentoRow = pedido.descuento > 0
    ? `<tr><td style="font-size:12px;color:#16a34a;padding-top:2px;">Descuento</td><td style="font-size:12px;color:#16a34a;text-align:right;padding-top:2px;">-${simbolo}${pedido.descuento.toLocaleString("es-CL")}</td></tr>`
    : "";

  const entregaInfo = esDelivery
    ? `<p style="margin:2px 0;font-size:12px;color:#555;">📍 ${(pedido as DeliveryPedido).direccion ?? "Sin dirección"}</p>`
    : (pedido as LlevarPedido).horaRetiro
      ? `<p style="margin:2px 0;font-size:12px;color:#555;">🕐 Retiro: ${(pedido as LlevarPedido).horaRetiro}</p>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Etiqueta #${pedido.numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #fff;
      color: #111;
      width: 320px;
      padding: 0;
    }
    .wrap { border: 2px solid #000; border-radius: 10px; overflow: hidden; }
    .header {
      background: #111;
      color: #fff;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left .pedido-num { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
    .header-left .sucursal   { font-size: 11px; color: #aaa; margin-top: 1px; }
    .badge {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-delivery { background:#f59e0b; color:#000; }
    .badge-retiro   { background:#10b981; color:#fff; }
    .section { padding: 10px 14px; border-bottom: 1px dashed #ddd; }
    .row { display:flex; justify-content:space-between; align-items:center; margin-bottom:3px; }
    .label-sm { font-size:10px; color:#888; text-transform:uppercase; font-weight:700; letter-spacing:0.5px; }
    .value-md { font-size:13px; font-weight:600; }
    table { width:100%; border-collapse:collapse; }
    .total-row td { padding-top:6px; font-size:15px; font-weight:900; border-top:2px solid #000; }
    .qr-section {
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f9f9f9;
    }
    .qr-text { flex:1; }
    .qr-text .vuelve { font-size:14px; font-weight:900; color:#111; }
    .qr-text .url    { font-size:9px; color:#888; margin-top:2px; word-break:break-all; }
    .fecha-hora { font-size:10px; color:#888; text-align:center; padding:5px; }
    @media print {
      html, body { width:320px; }
      @page { margin: 0; size: 320px auto; }
    }
  </style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="pedido-num">Pedido #${pedido.numero}</div>
      <div class="sucursal">${sucursalNombre}</div>
    </div>
    <span class="badge ${esDelivery ? "badge-delivery" : "badge-retiro"}">${esDelivery ? "🛵 Delivery" : "🛍️ Retiro"}</span>
  </div>

  <!-- Cliente + pago -->
  <div class="section">
    <p style="margin-bottom:1px;"><span class="label-sm">Cliente</span></p>
    <p style="font-size:16px;font-weight:900;margin-bottom:6px;">👤 ${pedido.clienteNombre}</p>
    <div class="row">
      <span class="label-sm">Pago</span>
      <span class="value-md">💳 ${PAGO_LABEL[pedido.metodoPago] ?? pedido.metodoPago}</span>
    </div>
    ${entregaInfo ? `<div style="margin-top:4px;">${entregaInfo}</div>` : ""}
  </div>

  <!-- Productos -->
  <div class="section">
    <p class="label-sm" style="margin-bottom:6px;">Productos</p>
    <table>
      <tbody>
        ${productosHtml}
        ${envioRow}
        ${descuentoRow}
        <tr class="total-row">
          <td>TOTAL</td>
          <td style="text-align:right;">${simbolo}${pedido.total.toLocaleString("es-CL")}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- QR Vuelve a pedir -->
  <div class="qr-section">
    <img src="${qrDataUrl}" width="80" height="80" alt="QR" style="border-radius:6px;border:1px solid #ddd;" />
    <div class="qr-text">
      <div class="vuelve">¡Vuelve a pedir!</div>
      <div class="url">${pedidoUrl}</div>
    </div>
  </div>

  <!-- Fecha hora -->
  <div class="fecha-hora">${fecha} · ${hora}</div>

</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const popup = window.open("", "_blank", "width=380,height=600,scrollbars=yes");
  if (popup) {
    popup.document.write(html);
    popup.document.close();
  }
}
