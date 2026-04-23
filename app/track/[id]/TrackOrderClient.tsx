"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bike, Clock3, MapPin, RefreshCw, ShieldCheck,
  CheckCircle2, ChefHat, Truck, Star, ArrowUpRight,
  ExternalLink, Package2, Store,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import { createSlug } from "@/lib/slug";
import type { DeliveryPedidoPublico } from "@/types";

interface Props { initialData: DeliveryPedidoPublico }

const stepsDelivery = [
  { key: "CONFIRMADO", title: "Confirmado",       icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",        icon: ChefHat      },
  { key: "EN_CAMINO",  title: "En camino",         icon: Bike         },
  { key: "ENTREGADO",  title: "Entregado",         icon: Star         },
] as const;

const stepsRetiro = [
  { key: "CONFIRMADO", title: "Confirmado",        icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",         icon: ChefHat      },
  { key: "EN_CAMINO",  title: "Listo p/ retirar",  icon: Package2     },
  { key: "ENTREGADO",  title: "Retirado",           icon: Star         },
] as const;

const subtitles: Record<string, string> = {
  CONFIRMADO: "Pedido recibido",
  PREPARANDO: "En cocina",
  EN_CAMINO:  "¡Tu pedido te espera!",
  ENTREGADO:  "¡Buen provecho!",
};
const subtitlesDelivery: Record<string, string> = {
  ...subtitles,
  EN_CAMINO: "El rider va hacia ti",
  ENTREGADO: "¡Buen provecho!",
};

export function TrackOrderClient({ initialData }: Props) {
  const [data, setData]             = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [retirado, setRetirado]     = useState(false);

  useEffect(() => {
    const iv = setInterval(() => void refresh(), 20_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  async function confirmarRetiro() {
    setConfirming(true);
    try {
      const res = await fetch("/api/delivery/retiro-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: data.id }),
      });
      if (!res.ok) return;
      setRetirado(true);
      setData((p) => ({ ...p, estado: "ENTREGADO", trackingStage: "ENTREGADO" }));
    } finally { setConfirming(false); }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/delivery/track?id=${data.id}`, { cache: "no-store" });
      if (!res.ok) return;
      setData(await res.json());
    } finally { setRefreshing(false); }
  }

  const esRetiro    = /retiro/i.test(data.zonaDelivery ?? "") || (!data.zonaDelivery && !data.direccionEntrega);
  const isDone      = data.trackingStage === "ENTREGADO" || data.trackingStage === "CANCELADO";
  const menuUrl     = data.sucursalNombre ? `https://pandaposs.com/pedir/${createSlug(data.sucursalNombre)}` : null;
  const steps       = esRetiro ? stepsRetiro : stepsDelivery;
  const activeIndex = steps.findIndex((s) => s.key === data.trackingStage);
  const currentStep = steps[activeIndex];
  const mapsUrl     = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccionEntrega ?? "")}`;
  const digits      = "codigoEntrega" in data && data.codigoEntrega ? data.codigoEntrega.split("") : null;
  const subtitle    = esRetiro ? subtitles[data.trackingStage] : subtitlesDelivery[data.trackingStage];

  return (
    <main className="min-h-screen bg-[#080b10] text-white selection:bg-orange-400/30">

      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 pb-20 pt-6 lg:max-w-5xl">

        {/* ── Header ── */}
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
              {esRetiro ? "Retiro en local" : "Seguimiento delivery"}
              {data.sucursalNombre && <> · {data.sucursalNombre}</>}
            </p>
            <h1 className="text-3xl font-black leading-none tracking-tight">
              Pedido <span className="text-orange-400">#{data.id}</span>
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => void refresh()}
              aria-label="Actualizar"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition hover:text-white active:scale-95"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            {menuUrl && (
              <Link
                href={menuUrl}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-400 active:scale-95"
              >
                Pedir de nuevo <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT ── */}
          <div className="space-y-3">

            {/* ── Estado + pasos en UNA sola card ── */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">

              {/* Estado actual */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all
                  ${isDone
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                    : "border-orange-400 bg-orange-400/15 text-orange-300 shadow-[0_0_24px_rgba(251,146,60,0.2)]"
                  }`}
                >
                  {currentStep && <currentStep.icon size={24} />}
                </div>
                <div>
                  <p className="text-2xl font-black leading-tight">
                    {currentStep?.title ?? getDeliveryStageLabel(data.trackingStage, esRetiro)}
                  </p>
                  <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>
                  {!isDone && (
                    <p className="text-xs text-white/25 mt-1">~ {data.estimadoMinutos} min estimados</p>
                  )}
                </div>
              </div>

              {/* Pasos inline */}
              <div className="flex items-center gap-0">
                {steps.map((step, i) => {
                  const done    = i < activeIndex;
                  const current = i === activeIndex;
                  const Icon    = step.icon;
                  return (
                    <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                      {/* Connector line */}
                      <div className="relative flex w-full items-center justify-center">
                        {i > 0 && (
                          <div className={`absolute right-1/2 top-1/2 h-px w-full -translate-y-1/2
                            ${done || current ? "bg-gradient-to-r from-orange-400/60 to-emerald-400/60" : "bg-white/10"}`}
                          />
                        )}
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300
                          ${done    ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-300" : ""}
                          ${current ? "border-orange-400 bg-orange-400/15 text-orange-300 shadow-[0_0_14px_rgba(251,146,60,0.3)]" : ""}
                          ${!done && !current ? "border-white/10 bg-white/[0.03] text-white/20" : ""}
                        `}>
                          {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                        </div>
                      </div>
                      <p className={`text-[9px] font-bold text-center leading-tight w-full
                        ${current ? "text-orange-300" : done ? "text-emerald-300" : "text-white/20"}`}
                      >
                        {step.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── YA RETIRÉ ── */}
            {esRetiro && data.trackingStage === "EN_CAMINO" && !retirado && (
              <button
                onClick={() => void confirmarRetiro()}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-2 rounded-3xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-[.99] disabled:opacity-60 px-5 py-4 text-base font-black text-emerald-300 transition-all"
              >
                {confirming
                  ? <span className="h-5 w-5 rounded-full border-2 border-emerald-300/30 border-t-emerald-300 animate-spin" />
                  : <Package2 size={18} />
                }
                {confirming ? "Confirmando…" : "Ya retiré mi pedido"}
              </button>
            )}

            {/* Confirmación exitosa */}
            {esRetiro && retirado && (
              <div className="flex items-center gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                <Star size={20} className="text-emerald-300 shrink-0" />
                <div>
                  <p className="font-black text-emerald-300">¡Listo, buen provecho!</p>
                  <p className="text-xs text-white/35 mt-0.5">Retiro confirmado · ¡Gracias!</p>
                </div>
              </div>
            )}

            {/* ── Info row (solo lo relevante) ── */}
            <div className="grid gap-3 sm:grid-cols-2">

              {/* Delivery: dirección */}
              {!esRetiro && data.direccionEntrega && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={12} className="text-orange-300" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Dirección</p>
                  </div>
                  <p className="text-sm font-semibold text-white/80 leading-snug">{data.direccionEntrega}</p>
                  {data.referencia   && <p className="mt-1 text-xs text-white/30">Ref: {data.referencia}</p>}
                  {data.departamento && <p className="text-xs text-white/30">Dpto: {data.departamento}</p>}
                </div>
              )}

              {/* Retiro: local / Delivery: rider */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  {esRetiro
                    ? <Store size={12} className="text-emerald-300" />
                    : <Bike  size={12} className="text-blue-300"    />
                  }
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    {esRetiro ? "Retiro en local" : "Repartidor"}
                  </p>
                </div>
                <p className="text-sm font-black text-white">
                  {esRetiro
                    ? (data.sucursalNombre ?? "Pasa a retirar")
                    : (data.repartidorNombre ?? "Por asignar")}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-white/30">
                  <Clock3 size={10} className="shrink-0" />
                  {new Date(data.creadoEn).toLocaleString("es-CL")}
                </p>
              </div>
            </div>

            {/* Google Maps — solo delivery con dirección real */}
            {!esRetiro && data.direccionEntrega && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-blue-500/15 bg-blue-950/40 p-3.5 transition hover:border-blue-400/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
                  <MapPin size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Ver en Google Maps</p>
                  <p className="mt-0.5 truncate text-xs text-white/50">{data.direccionEntrega}</p>
                </div>
                <ExternalLink size={13} className="shrink-0 text-blue-400/50 group-hover:text-blue-300" />
              </a>
            )}

            {/* Código de entrega */}
            {digits && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-950/40 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <ShieldCheck size={13} className="text-amber-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Código de entrega</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {digits.map((d, i) => (
                    <div
                      key={i}
                      className="flex h-12 w-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-2xl font-black text-white"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-xs text-white/30">Dile este código al repartidor</p>
              </div>
            )}
          </div>

          {/* ── RIGHT — Resumen ── */}
          <aside className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-sm lg:self-start lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={12} className="text-emerald-300" />
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Resumen</p>
            </div>

            <div className="space-y-1">
              {data.detalles.map((item) => (
                <div
                  key={`${item.nombre}-${item.subtotal}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 leading-snug">{item.nombre}</p>
                    <p className="text-xs text-white/25">{item.cantidad} × {formatCurrency(item.precio, "$")}</p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-white/70">
                    {formatCurrency(item.subtotal, "$")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-1.5">
              <div className="flex justify-between text-xs text-white/35">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal, "$")}</span>
              </div>
              {!esRetiro && (
                <div className="flex justify-between text-xs text-white/35">
                  <span>Despacho</span>
                  <span>{data.cargoEnvio > 0 ? formatCurrency(data.cargoEnvio, "$") : "Gratis"}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/8 pt-2">
                <span className="text-sm font-black text-white">Total</span>
                <span className="text-lg font-black text-orange-400">{formatCurrency(data.total, "$")}</span>
              </div>
            </div>

            <div className="mt-2 flex justify-between rounded-xl bg-white/[0.03] px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Pago</span>
              <span className="text-xs font-black text-white/50">{data.metodoPago}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
