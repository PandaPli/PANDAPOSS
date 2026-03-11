"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UtensilsCrossed, GlassWater, Cake, CheckCircle2,
  Bell, Clock, Users, ChefHat, Loader2,
} from "lucide-react";
import Link from "next/link";

/* ── Tipos ─────────────────────────────────────────────── */
interface MesaActiva {
  id: number;
  nombre: string;
  sala: string;
  abiertoEn: string;
  pedidosActivos: number;
}

interface MesaEspera {
  id: number;
  nombre: string;
  sala: string;
}

interface Alerta {
  id: number;
  tipo: "COCINA" | "BAR" | "REPOSTERIA" | "DELIVERY" | "MOSTRADOR";
  mesa: string;
  listoEn: string;
}

interface WaiterData {
  mesasAtendidas: number;
  mesasActivas: MesaActiva[];
  alertas: Alerta[];
  esperando: MesaEspera[];
}

/* ── Helpers ────────────────────────────────────────────── */
function elapsedMin(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatElapsed(min: number): string {
  if (min < 60) return `${String(min).padStart(2, "0")} min`;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function tiempoColor(min: number): string {
  if (min < 15) return "text-emerald-600 bg-emerald-50";
  if (min < 30) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

const TIPO_CONFIG: Record<
  Alerta["tipo"],
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  COCINA:    { label: "Cocina",    icon: <ChefHat size={16} />,      color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  BAR:       { label: "Barra",     icon: <GlassWater size={16} />,   color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  REPOSTERIA:{ label: "Repostería",icon: <Cake size={16} />,         color: "text-pink-600",   bg: "bg-pink-50 border-pink-200" },
  DELIVERY:  { label: "Delivery",  icon: <UtensilsCrossed size={16}/>,color: "text-teal-600",  bg: "bg-teal-50 border-teal-200" },
  MOSTRADOR: { label: "Mostrador", icon: <UtensilsCrossed size={16}/>,color: "text-gray-600",  bg: "bg-gray-50 border-gray-200" },
};

/* ── Componente ─────────────────────────────────────────── */
export function WaiterPanelClient({ initial }: { initial: WaiterData }) {
  const [data, setData]     = useState<WaiterData>(initial);
  const [tick, setTick]     = useState(0);   // fuerza re-render para timers
  const [attending, setAttending] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/waiter");
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
  }, []);

  // Polling cada 30 s
  useEffect(() => {
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Tick cada 60 s para actualizar timers
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  async function atender(pedidoId: number) {
    setAttending(pedidoId);
    try {
      await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ENTREGADO" }),
      });
      await fetchData();
    } finally {
      setAttending(null);
    }
  }

  const { mesasAtendidas, mesasActivas, alertas, esperando } = data;

  return (
    <div className="space-y-5" suppressHydrationWarning>

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Mesas atendidas */}
        <div className="rounded-xl p-4 bg-brand-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-brand-600">Atendidas hoy</p>
              <p className="text-3xl font-bold text-brand-700 mt-1">{mesasAtendidas}</p>
              <p className="text-xs text-brand-500 mt-0.5">mesas finalizadas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-brand-500" />
            </div>
          </div>
        </div>

        {/* Mesas en atención */}
        <div className="rounded-xl p-4 bg-amber-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600">En atención</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{mesasActivas.length}</p>
              <p className="text-xs text-amber-500 mt-0.5">mesas activas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-amber-600" />
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className={`rounded-xl p-4 ${alertas.length > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-medium ${alertas.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
                Alertas
              </p>
              <p className={`text-3xl font-bold mt-1 ${alertas.length > 0 ? "text-red-700" : "text-emerald-700"}`}>
                {alertas.length}
              </p>
              <p className={`text-xs mt-0.5 ${alertas.length > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {alertas.length > 0 ? "listos para entregar" : "sin alertas"}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alertas.length > 0 ? "bg-red-100" : "bg-emerald-100"}`}>
              <Bell size={20} className={alertas.length > 0 ? "text-red-500" : "text-emerald-600"} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Alertas ───────────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-red-500" />
            <h2 className="font-bold text-surface-text">Pedidos Listos para Entregar</h2>
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {alertas.length}
            </span>
          </div>
          <div className="space-y-2">
            {alertas.map((a) => {
              const cfg = TIPO_CONFIG[a.tipo];
              const mins = elapsedMin(a.listoEn);
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg}`}
                >
                  <div className={`flex items-center gap-1.5 font-semibold text-sm ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </div>
                  <span className="text-sm text-surface-text font-medium">
                    — Mesa {a.mesa}
                  </span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${tiempoColor(mins)}`}>
                    {formatElapsed(mins)}
                  </span>
                  <button
                    onClick={() => atender(a.id)}
                    disabled={attending === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    {attending === a.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCircle2 size={12} />
                    }
                    Atender
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mesas en Atención ─────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="font-bold text-surface-text">Mesas en Atención</h2>
          </div>
          <Link
            href="/mesas"
            className="text-xs text-brand-500 font-semibold hover:underline"
          >
            Ver plano →
          </Link>
        </div>

        {mesasActivas.length === 0 ? (
          <div className="text-center py-6 text-surface-muted">
            <UtensilsCrossed size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin mesas activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mesasActivas.map((m) => {
              const mins = elapsedMin(m.abiertoEn);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-bg border border-surface-border"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-surface-text">{m.nombre}</p>
                    <p className="text-xs text-surface-muted truncate">{m.sala}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tiempoColor(mins)}`}>
                      ⏱ {formatElapsed(mins)}
                    </span>
                    {m.pedidosActivos > 0 && (
                      <span className="text-xs text-brand-500 font-medium">
                        {m.pedidosActivos} en cocina
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Clientes a Atender ────────────────────────────── */}
      {esperando.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-violet-500" />
            <h2 className="font-bold text-surface-text">Esperando Orden</h2>
            <span className="ml-auto bg-violet-100 text-violet-700 text-xs rounded-full px-2 py-0.5 font-semibold">
              {esperando.length} mesa{esperando.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {esperando.map((m) => (
              <Link
                key={m.id}
                href={`/ventas/nueva`}
                className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-violet-800">{m.nombre}</p>
                  <p className="text-xs text-violet-500">{m.sala} · Esperando orden</p>
                </div>
                <span className="ml-auto text-xs text-violet-600 font-semibold">
                  Tomar orden →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
