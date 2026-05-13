"use client";

import Link from "next/link";
import {
  Bike, ShoppingBag, ArrowRight, Star, Clock, User,
  Package, MapPin, ChefHat, CheckCircle2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

/* ── Types ── */
interface PedidoResumen {
  id: number;
  numero: number;
  estado: string;
  clienteNombre: string;
  total: number;
  creadoEn: string;
  items: number;
}

interface DeliveryPedido extends PedidoResumen {
  direccion: string | null;
}

interface LlevarPedido extends PedidoResumen {
  horaRetiro: string | null;
}

interface Props {
  deliveryPedidos: DeliveryPedido[];
  llevarPedidos: LlevarPedido[];
  simbolo: string;
}

/* ── Estado → config visual ── */
const ESTADO_CONFIG: Record<string, { label: string; dot: string }> = {
  PENDIENTE:  { label: "Pendiente",   dot: "bg-amber-400" },
  EN_PROCESO: { label: "Preparando",  dot: "bg-blue-400" },
  LISTO:      { label: "Listo",       dot: "bg-emerald-400" },
};

/* ── Hub icons ── */
const HUBS = [
  {
    href:     "/ordenes/delivery",
    icon:     Bike,
    label:    "Delivery",
    desc:     "Pedidos de entrega a domicilio",
    gradient: "from-amber-400 to-orange-500",
    glow:     "0 8px 24px rgba(245,158,11,.25)",
    ring:     "ring-amber-200",
  },
  {
    href:     "/ordenes/llevar",
    icon:     ShoppingBag,
    label:    "Retiro",
    desc:     "Pedidos para llevar",
    gradient: "from-emerald-400 to-teal-500",
    glow:     "0 8px 24px rgba(16,185,129,.25)",
    ring:     "ring-emerald-200",
  },
] as const;

export function OrdenesHub({ deliveryPedidos, llevarPedidos, simbolo }: Props) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Star size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-surface-text leading-tight">Ordenes</h1>
          <p className="text-xs text-surface-muted mt-0.5">Retiro y Delivery</p>
        </div>
      </div>

      {/* ── Hub icons row ── */}
      <div className="grid grid-cols-2 gap-3">
        {HUBS.map(({ href, icon: Icon, label, desc, gradient, glow, ring }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group card p-4 flex items-center gap-4 cursor-pointer",
              "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
              "hover:ring-2", ring,
            )}
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
              style={{ boxShadow: glow }}
            >
              <Icon size={22} className="text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-surface-text">{label}</p>
              <p className="text-xs text-surface-muted leading-snug">{desc}</p>
            </div>
            <ArrowRight
              size={16}
              className="text-surface-muted/30 group-hover:text-surface-muted group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </Link>
        ))}
      </div>

      {/* ── Split dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Delivery column ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-surface-text">Delivery</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {deliveryPedidos.length}
              </span>
            </div>
            <Link
              href="/ordenes/delivery"
              className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
            >
              Ver todos →
            </Link>
          </div>

          {deliveryPedidos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
              <Bike size={28} className="mx-auto text-amber-300 mb-2" />
              <p className="text-xs text-amber-400 font-semibold">Sin pedidos delivery activos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {deliveryPedidos.map((p) => (
                <DeliveryCard key={p.id} pedido={p} simbolo={simbolo} />
              ))}
            </div>
          )}
        </div>

        {/* ── Llevar / Retiro column ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-surface-text">Retiro</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {llevarPedidos.length}
              </span>
            </div>
            <Link
              href="/ordenes/llevar"
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              Ver todos →
            </Link>
          </div>

          {llevarPedidos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
              <ShoppingBag size={28} className="mx-auto text-emerald-300 mb-2" />
              <p className="text-xs text-emerald-400 font-semibold">Sin pedidos para llevar activos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {llevarPedidos.map((p) => (
                <LlevarCard key={p.id} pedido={p} simbolo={simbolo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Delivery order card ── */
function DeliveryCard({ pedido, simbolo }: { pedido: DeliveryPedido; simbolo: string }) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const cfg = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, dot: "bg-gray-400" };

  return (
    <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-3.5 hover:shadow-md hover:shadow-amber-100/50 hover:border-amber-200 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-amber-700">#{pedido.numero}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-600">
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
        <span className="text-sm font-black text-surface-text">{formatCurrency(pedido.total, simbolo)}</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-surface-muted">
          <User size={11} className="text-amber-400 shrink-0" />
          <span className="truncate font-medium">{pedido.clienteNombre}</span>
        </div>
        {pedido.direccion && (
          <div className="flex items-center gap-1.5 text-xs text-surface-muted">
            <MapPin size={11} className="text-amber-400 shrink-0" />
            <span className="truncate">{pedido.direccion}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-surface-muted">
            <Clock size={11} className="text-amber-400 shrink-0" />
            <span>{hora}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-surface-muted">
            <Package size={10} />
            <span>{pedido.items} {pedido.items === 1 ? "item" : "items"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Llevar / Retiro order card ── */
function LlevarCard({ pedido, simbolo }: { pedido: LlevarPedido; simbolo: string }) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const cfg = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, dot: "bg-gray-400" };

  return (
    <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-3.5 hover:shadow-md hover:shadow-emerald-100/50 hover:border-emerald-200 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-emerald-700">#{pedido.numero}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-600">
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
        <span className="text-sm font-black text-surface-text">{formatCurrency(pedido.total, simbolo)}</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-surface-muted">
          <User size={11} className="text-emerald-400 shrink-0" />
          <span className="truncate font-medium">{pedido.clienteNombre}</span>
        </div>
        {pedido.horaRetiro && (
          <div className="flex items-center gap-1.5 text-xs text-surface-muted">
            <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
            <span>Retiro: {pedido.horaRetiro}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-surface-muted">
            <Clock size={11} className="text-emerald-400 shrink-0" />
            <span>{hora}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-surface-muted">
            <Package size={10} />
            <span>{pedido.items} {pedido.items === 1 ? "item" : "items"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
