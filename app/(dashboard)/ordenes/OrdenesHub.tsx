"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bike, ShoppingBag, Star, Clock, User,
  Package, UtensilsCrossed, CheckCircle2,
  Loader2,
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
  {
    href:     "/mesas",
    icon:     UtensilsCrossed,
    label:    "Servir",
    desc:     "Mesas y servicio en sala",
    gradient: "from-rose-400 to-pink-500",
    glow:     "0 8px 24px rgba(244,63,94,.25)",
    ring:     "ring-rose-200",
  },
] as const;

export function OrdenesHub({ deliveryPedidos, llevarPedidos, simbolo }: Props) {
  const [deliveries, setDeliveries] = useState(deliveryPedidos);
  const [retiros, setRetiros] = useState(llevarPedidos);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function entregarDelivery(pedidoId: number) {
    setLoadingId(pedidoId);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, estado: "ENTREGADO" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error");
      }
      setDeliveries((prev) => prev.filter((p) => p.id !== pedidoId));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  async function entregarRetiro(pedidoId: number) {
    setLoadingId(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ENTREGADO" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error");
      }
      setRetiros((prev) => prev.filter((p) => p.id !== pedidoId));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-500/20">
          <Star size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-surface-text leading-none">Ordenes</h1>
          <p className="text-[11px] text-surface-muted">Retiro y Delivery</p>
        </div>
      </div>

      {/* ── Hub icons ── */}
      <div className="grid grid-cols-3 gap-2">
        {HUBS.map(({ href, icon: Icon, label, gradient, glow, ring }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group card p-3 flex flex-col items-center gap-2 cursor-pointer text-center",
              "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
              "hover:ring-2", ring,
            )}
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              style={{ boxShadow: glow }}
            >
              <Icon size={18} className="text-white" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold text-surface-text">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Split dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* ── Delivery column ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-xs font-bold text-surface-text">Delivery</h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {deliveries.length}
              </span>
            </div>
            <Link
              href="/ordenes/delivery"
              className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
            >
              Ver todos →
            </Link>
          </div>

          {deliveries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-5 text-center">
              <Bike size={22} className="mx-auto text-amber-300 mb-1" />
              <p className="text-[11px] text-amber-400 font-semibold">Sin pedidos delivery activos</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {deliveries.map((p) => (
                <DeliveryCard
                  key={p.id}
                  pedido={p}
                  simbolo={simbolo}
                  loading={loadingId === p.id}
                  onEntregar={() => entregarDelivery(p.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Retiro column ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-surface-text">Retiro</h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {retiros.length}
              </span>
            </div>
            <Link
              href="/ordenes/llevar"
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              Ver todos →
            </Link>
          </div>

          {retiros.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center">
              <ShoppingBag size={22} className="mx-auto text-emerald-300 mb-1" />
              <p className="text-[11px] text-emerald-400 font-semibold">Sin pedidos para llevar activos</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {retiros.map((p) => (
                <LlevarCard
                  key={p.id}
                  pedido={p}
                  simbolo={simbolo}
                  loading={loadingId === p.id}
                  onEntregar={() => entregarRetiro(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Delivery order card ── */
function DeliveryCard({ pedido, simbolo, loading, onEntregar }: { pedido: DeliveryPedido; simbolo: string; loading: boolean; onEntregar: () => void }) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const cfg = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, dot: "bg-gray-400" };
  const isListo = pedido.estado === "LISTO";

  return (
    <div className="group rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-2.5 hover:shadow-sm hover:border-amber-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-amber-700">#{pedido.numero}</span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-px rounded-full bg-amber-100/80 text-amber-600">
            <span className={cn("w-1 h-1 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
        <span className="text-xs font-black text-surface-text">{formatCurrency(pedido.total, simbolo)}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-surface-muted">
        <span className="flex items-center gap-1 truncate font-medium"><User size={10} className="text-amber-400 shrink-0" />{pedido.clienteNombre}</span>
        <span className="flex items-center gap-1 shrink-0"><Clock size={10} className="text-amber-400" />{hora}</span>
        <span className="flex items-center gap-1 shrink-0 ml-auto"><Package size={9} />{pedido.items}</span>
      </div>
      {isListo && (
        <button
          onClick={onEntregar}
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-[11px] font-bold py-2 transition-all disabled:opacity-50"
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <CheckCircle2 size={12} />
          }
          Entregado
        </button>
      )}
    </div>
  );
}

/* ── Llevar / Retiro order card ── */
function LlevarCard({ pedido, simbolo, loading, onEntregar }: { pedido: LlevarPedido; simbolo: string; loading: boolean; onEntregar: () => void }) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const cfg = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, dot: "bg-gray-400" };
  const isListo = pedido.estado === "LISTO";

  return (
    <div className="group rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-2.5 hover:shadow-sm hover:border-emerald-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-emerald-700">#{pedido.numero}</span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-px rounded-full bg-emerald-100/80 text-emerald-600">
            <span className={cn("w-1 h-1 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
        <span className="text-xs font-black text-surface-text">{formatCurrency(pedido.total, simbolo)}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-surface-muted">
        <span className="flex items-center gap-1 truncate font-medium"><User size={10} className="text-emerald-400 shrink-0" />{pedido.clienteNombre}</span>
        {pedido.horaRetiro && <span className="flex items-center gap-1 shrink-0"><CheckCircle2 size={10} className="text-emerald-400" />{pedido.horaRetiro}</span>}
        <span className="flex items-center gap-1 shrink-0"><Clock size={10} className="text-emerald-400" />{hora}</span>
        <span className="flex items-center gap-1 shrink-0 ml-auto"><Package size={9} />{pedido.items}</span>
      </div>
      {isListo && (
        <button
          onClick={onEntregar}
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-[11px] font-bold py-2 transition-all disabled:opacity-50"
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <CheckCircle2 size={12} />
          }
          Entregado
        </button>
      )}
    </div>
  );
}
