import type { Metadata } from "next";
import Link from "next/link";
import { Bike, ShoppingBag, ArrowRight, Star } from "lucide-react";

export const metadata: Metadata = { title: "PP — Ordenes" };

/* ─── Módulos del hub ────────────────────────────────────────────────────── */
const HUBS = [
  {
    href:        "/ordenes/delivery",
    icon:        Bike,
    label:       "Delivery",
    description: "Gestionar pedidos de entrega a domicilio",
    gradient:    "from-amber-400 to-orange-500",
    glow:        "rgba(245,158,11,.25)",
    badge:       "Activo",
    badgeColor:  "bg-amber-100 text-amber-700",
  },
  {
    href:        "/ordenes/llevar",
    icon:        ShoppingBag,
    label:       "Llevar",
    description: "Pedidos para llevar — nombre, pedido y horario de retiro",
    gradient:    "from-emerald-400 to-teal-500",
    glow:        "rgba(16,185,129,.25)",
    badge:       null,
    badgeColor:  "",
  },
] as const;

export default function OrdenesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Star size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-surface-text leading-tight">Ordenes</h1>
          <p className="text-xs text-surface-muted mt-0.5">Centro de gestión de pedidos</p>
        </div>
      </div>

      {/* ── Grid de módulos ─────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-1">
        {HUBS.map(({ href, icon: Icon, label, description, gradient, glow, badge, badgeColor }) => (
          <Link
            key={href}
            href={href}
            className="group card p-5 flex items-center gap-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            {/* Ícono */}
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}
              style={{ boxShadow: `0 8px 24px ${glow}` }}
            >
              <Icon size={26} className="text-white" strokeWidth={1.8} />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-black text-surface-text">{label}</p>
                {badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-surface-muted leading-snug">{description}</p>
            </div>

            {/* Flecha */}
            <ArrowRight
              size={18}
              className="text-surface-muted/40 group-hover:text-surface-muted group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </Link>
        ))}
      </div>

    </div>
  );
}
