"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Clock, Package, CreditCard, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";

interface Alertas {
  pedidosAtrasados: number;
  stockBajo: number;
  mpPendientes: number;
  mesasCuenta: number;
  total: number;
}

const POLL_MS = 60_000;

export function NotifBell() {
  const [data, setData] = useState<Alertas | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchAlertas() {
    try {
      const res = await fetch("/api/alertas");
      if (res.ok) setData(await res.json());
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    fetchAlertas();
    const id = setInterval(fetchAlertas, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const total = data?.total ?? 0;

  const items = data
    ? [
        { label: "Pedidos atrasados", count: data.pedidosAtrasados, icon: Clock,           href: "/pedidos",  color: "text-red-500" },
        { label: "Stock bajo",         count: data.stockBajo,         icon: Package,         href: "/productos", color: "text-amber-500" },
        { label: "Pagos MP pendientes",count: data.mpPendientes,      icon: CreditCard,      href: "/pedidos",  color: "text-orange-500" },
        { label: "Mesas en cuenta",    count: data.mesasCuenta,       icon: UtensilsCrossed, href: "/mesas",    color: "text-blue-500" },
      ].filter((i) => i.count > 0)
    : [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/10"
        title="Alertas"
      >
        <Bell size={18} className="text-white" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[48px] z-50 w-72 overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-elevated backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-surface-border bg-gradient-to-r from-brand-50 to-brand-100/50 px-4 py-3">
              <p className="text-sm font-bold text-surface-text">Alertas activas</p>
              <button onClick={() => setOpen(false)} className="text-surface-muted hover:text-surface-text">
                <X size={14} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-surface-muted">
                Sin alertas — todo en orden ✓
              </div>
            ) : (
              <div className="py-1">
                {items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-brand-50"
                  >
                    <item.icon size={16} className={item.color} />
                    <span className="flex-1 text-sm text-surface-text">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.count}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-surface-border px-4 py-2">
              <p className="text-center text-[10px] text-surface-muted">
                Actualiza cada 60 s
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
