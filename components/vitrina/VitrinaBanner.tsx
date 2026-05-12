"use client";

import { useEffect, useState } from "react";
import { Trophy, Sun, Zap, ShoppingCart, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface VitrinaItem {
  tipo: "mes" | "dia" | "fugaz";
  titulo: string | null;
  producto: {
    id: number;
    nombre: string;
    precio: number;          // precio original
    precioEspecial: number | null; // precio promocional
    imagen: string | null;
    descripcion: string | null;
  };
  hasta: string | null; // ISO — solo oferta fugaz
}

interface Props {
  items: VitrinaItem[];
  simbolo: string;
  onAdd: (productoId: number, precio: number) => void;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const CONFIG = {
  mes: {
    label: "⭐ Producto del Mes",
    icon: Trophy,
    gradient: "from-amber-500 to-yellow-400",
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-amber-200",
    badge: "bg-amber-500",
    btn: "bg-amber-500 hover:bg-amber-600",
    tag: "text-amber-700",
  },
  dia: {
    label: "☀️ Producto del Día",
    icon: Sun,
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50",
    border: "border-orange-200",
    badge: "bg-orange-500",
    btn: "bg-orange-500 hover:bg-orange-600",
    tag: "text-orange-700",
  },
  fugaz: {
    label: "⚡ Oferta Fugaz",
    icon: Zap,
    gradient: "from-red-500 to-rose-400",
    bg: "bg-gradient-to-br from-red-50 to-rose-50",
    border: "border-red-200",
    badge: "bg-red-500",
    btn: "bg-red-500 hover:bg-red-600",
    tag: "text-red-700",
  },
} as const;

/* ─── Countdown hook ──────────────────────────────────────────────────────── */
function useCountdown(hasta: string | null) {
  const [ms, setMs] = useState(() => hasta ? new Date(hasta).getTime() - Date.now() : null);
  useEffect(() => {
    if (!hasta) return;
    const id = setInterval(() => setMs(new Date(hasta).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasta]);
  return ms;
}

/* ─── Single vitrina card ─────────────────────────────────────────────────── */
function VitrinaCard({ item, simbolo, onAdd }: { item: VitrinaItem; simbolo: string; onAdd: Props["onAdd"] }) {
  const cfg = CONFIG[item.tipo];
  const ms  = useCountdown(item.hasta);

  // Oferta fugaz: ocultar si ya expiró
  if (item.tipo === "fugaz" && ms !== null && ms <= 0) return null;

  const precioFinal = item.producto.precioEspecial ?? item.producto.precio;
  const tieneDescuento = item.producto.precioEspecial !== null && item.producto.precioEspecial < item.producto.precio;

  // Formato countdown
  let countdown: string | null = null;
  if (ms !== null && ms > 0) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    countdown = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  }

  return (
    <div className={`flex-shrink-0 w-56 sm:w-64 rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden shadow-sm`}>
      {/* Header badge */}
      <div className={`flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r ${cfg.gradient}`}>
        <cfg.icon size={12} className="text-white flex-shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">
          {item.titulo || cfg.label}
        </p>
      </div>

      {/* Body */}
      <div className="flex items-center gap-3 p-3">
        {/* Imagen */}
        <div className="flex-shrink-0">
          {item.producto.imagen ? (
            <img
              src={item.producto.imagen}
              alt={item.producto.nombre}
              className="h-16 w-16 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-white/70 flex items-center justify-center text-2xl">
              🍽️
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-stone-800 leading-tight line-clamp-2">
            {item.producto.nombre}
          </p>

          {/* Precio */}
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-base font-black ${cfg.tag}`}>
              {formatCurrency(precioFinal, simbolo)}
            </span>
            {tieneDescuento && (
              <span className="text-xs text-stone-400 line-through">
                {formatCurrency(item.producto.precio, simbolo)}
              </span>
            )}
          </div>

          {/* Countdown para oferta fugaz */}
          {countdown && (
            <div className="mt-1 flex items-center gap-1 text-red-600">
              <Clock size={10} className="flex-shrink-0" />
              <span className="text-[10px] font-black tabular-nums">{countdown}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <button
          onClick={() => onAdd(item.producto.id, precioFinal)}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition active:scale-95 ${cfg.btn}`}
        >
          <ShoppingCart size={13} />
          Agregar
        </button>
      </div>
    </div>
  );
}

/* ─── Banner principal ────────────────────────────────────────────────────── */
export function VitrinaBanner({ items, simbolo, onAdd }: Props) {
  if (!items.length) return null;

  return (
    <div className="overflow-x-auto scrollbar-none -mx-3 px-3 sm:-mx-6 sm:px-6">
      <div className="flex gap-3 pb-1">
        {items.map((item, i) => (
          <VitrinaCard key={`${item.tipo}-${i}`} item={item} simbolo={simbolo} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
