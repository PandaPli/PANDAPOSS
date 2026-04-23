"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bike, Clock3, MapPin, PackageCheck, RefreshCw,
  ShieldCheck, CheckCircle2, ChefHat,
  Truck, Star, ArrowUpRight, ExternalLink, Package2, Store,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryProgressValue, getDeliveryStageLabel } from "@/lib/delivery";
import { createSlug } from "@/lib/slug";
import type { DeliveryPedidoPublico } from "@/types";

interface Props { initialData: DeliveryPedidoPublico }

const stepsDelivery = [
  { key: "CONFIRMADO", title: "Confirmado",      subtitle: "Pedido recibido",        icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",       subtitle: "En la cocina",           icon: ChefHat      },
  { key: "EN_CAMINO",  title: "En camino",        subtitle: "El rider va hacia ti",   icon: Bike         },
  { key: "ENTREGADO",  title: "Entregado",        subtitle: "¡Buen provecho!",        icon: Star         },
] as const;

const stepsRetiro = [
  { key: "CONFIRMADO", title: "Confirmado",       subtitle: "Pedido recibido",        icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",        subtitle: "En la cocina",           icon: ChefHat      },
  { key: "EN_CAMINO",  title: "Listo p/ retirar", subtitle: "¡Tu pedido te espera!",  icon: Package2     },
  { key: "ENTREGADO",  title: "Retirado",          subtitle: "¡Buen provecho!",        icon: Star         },
] as const;

export function TrackOrderClient({ initialData }: Props) {
  const [data, setData]           = useState(initialData);
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
  const progress    = getDeliveryProgressValue(data.trackingStage);
  const mapsUrl     = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccionEntrega ?? "")}`;
  const digits      = "codigoEntrega" in data && data.codigoEntrega ? data.codigoEntrega.split("") : null;
  const currentStep = steps[activeIndex];

  return (
    <main className="min-h-screen bg-[#080b10] text-white selection:bg-orange-400/30">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[100px]" />
        {esRetiro
          ? <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-emerald-600/8 blur-[90px]" />
          : <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-blue-600/8 blur-[90px]" />
        }
      </div>

      <div className="relative mx-auto max-w-2xl px-4 pb-20 pt-6 lg:max-w-5xl">

        {/* ── Header ── */}
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                {esRetiro ? "Retiro en local" : "Seguimiento delivery"}
              </span>
            </div>
            <h1 className="text-[clamp(2rem,7vw,3rem)] font-black leading-none tracking-tight">
              Pedido <span className="text-orange-400">#{data.id}</span>
            </h1>
            {data.sucursalNombre && (
              <p className="mt-1 text-sm font-semibold text-white/40">{data.sucursalNombre}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-1">
            <button
              onClick={() => void refresh()}
              aria-label="Actualizar estado"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white active:scale-95"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            {menuUrl && (
              <Link
                href={menuUrl}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-400 active:scale-95"
              >
                Pedir de nuevo
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT ── */}
          <div className="space-y-3">

            {/* Status hero */}
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Progreso</span>
                  <span className="text-[10px] font-black text-white/50">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg,#f97316,#fb923c,#34d399)" }}
                  />
                </div>
              </div>

              {/* Current state big display */}
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all
                  ${isDone
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                    : "border-orange-400 bg-orange-400/15 text-orange-300 shadow-[0_0_28px_rgba(251,146,60,0.25)]"
                  }`}
                >
                  {currentStep && <currentStep.icon size={26} />}
                </div>
                <div>
                  <p className="text-xl font-black text-white leading-tight">
                    {currentStep?.title ?? getDeliveryStageLabel(data.trackingStage, esRetiro)}
                  </p>
                  <p className="text-sm text-white/45 mt-0.5">{currentStep?.subtitle}</p>
                  {!isDone && (
                    <p className="mt-1 text-xs text-white/30">Estimado: {data.estimadoMinutos} min</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step timeline */}
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.04] px-5 py-4 backdrop-blur-sm">
              <div className="grid grid-cols-4 gap-1 relative">
                <div className="absolute left-[12.5%] right-[12.5%] top-[18px] h-px bg-white/10" />
                <div
                  className="absolute left-[12.5%] top-[18px] h-px bg-gradient-to-r from-orange-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${(activeIndex / (steps.length - 1)) * 75}%` }}
                />
                {steps.map((step, i) => {
                  const done    = i < activeIndex;
                  const current = i === activeIndex;
                  const Icon    = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all duration-300
                        ${done    ? "border-emerald-400 bg-emerald-400/20 text-emerald-300" : ""}
                        ${current ? "border-orange-400 bg-orange-400/20 text-orange-300 shadow-[0_0_16px_rgba(251,146,60,0.3)]" : ""}
                        ${!done && !current ? "border-white/10 bg-white/5 text-white/20" : ""}
                      `}>
                        {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                      </div>
                      <p className={`text-[10px] font-black text-center leading-tight
                        ${current ? "text-orange-300" : done ? "text-emerald-300" : "text-white/25"}`}
                      >
                        {step.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── YA RETIRÉ (solo retiro + listo) ── */}
            {esRetiro && data.trackingStage === "EN_CAMINO" && !retirado && (
              <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-teal-950/40 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">
                  ¡Tu pedido está listo!
                </p>
                <p className="text-sm text-white/55 mb-4">
                  Confirmá cuando lo hayas retirado en el local.
                </p>
                <button
                  onClick={() => void confirmarRetiro()}
                  disabled={confirming}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[.98] disabled:opacity-60 px-5 py-3.5 text-base font-black text-white transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                >
                  {confirming
                    ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <Package2 size={18} />
                  }
                  {confirming ? "Confirmando…" : "Ya retiré mi pedido"}
                </button>
              </div>
            )}

            {/* Confirmación exitosa */}
            {esRetiro && retirado && (
              <div className="flex items-center gap-4 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-teal-950/40 p-5 backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
                  <Star size={22} />
                </div>
                <div>
                  <p className="font-black text-emerald-300">¡Listo, buen provecho!</p>
                  <p className="text-sm text-white/40 mt-0.5">Retiro confirmado · ¡Gracias por tu pedido!</p>
                </div>
              </div>
            )}

            {/* Info cards */}
            <div className={`grid gap-3 ${esRetiro ? "" : "sm:grid-cols-2"}`}>

              {/* Solo delivery: dirección */}
              {!esRetiro && (
                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-400/15">
                      <MapPin size={12} className="text-orange-300" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Dirección</p>
                  </div>
                  <p className="text-sm font-semibold text-white/85 leading-snug">{data.direccionEntrega}</p>
                  {data.referencia   && <p className="mt-1 text-xs text-white/35">Ref: {data.referencia}</p>}
                  {data.departamento && <p className="mt-0.5 text-xs text-white/35">Dpto: {data.departamento}</p>}
                </div>
              )}

              {/* Rider / Retiro en local */}
              <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${esRetiro ? "bg-emerald-400/15" : "bg-blue-400/15"}`}>
                    {esRetiro
                      ? <Store size={12} className="text-emerald-300" />
                      : <Bike  size={12} className="text-blue-300"    />
                    }
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                    {esRetiro ? "Retiro en local" : "Repartidor"}
                  </p>
                </div>
                <p className="text-sm font-black text-white">
                  {esRetiro ? (data.sucursalNombre ?? "Pasa a retirar tu pedido") : (data.repartidorNombre ?? "Por asignar")}
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-xs text-white/35">
                    <Clock3 size={10} className="shrink-0" />
                    {new Date(data.creadoEn).toLocaleString("es-CL")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/35">
                    <PackageCheck size={10} className="shrink-0" />
                    {getDeliveryStageLabel(data.trackingStage, esRetiro)}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps — solo si hay dirección real (delivery) */}
            {!esRetiro && data.direccionEntrega && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950/60 to-indigo-950/40 p-4 transition-all hover:border-blue-400/40 backdrop-blur-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
                  <MapPin size={18} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Dónde va mi pedido</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white/70">{data.direccionEntrega}</p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 transition group-hover:bg-blue-500/25">
                  <ExternalLink size={13} />
                </div>
              </a>
            )}

            {/* Código de entrega */}
            {digits && (
              <div className="overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-950/50 to-orange-950/30 p-5 text-center backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <ShieldCheck size={14} className="text-amber-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Código de entrega
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {digits.map((d, i) => (
                    <div
                      key={i}
                      className="flex h-14 w-12 items-center justify-center rounded-xl border-2 border-amber-400/40 bg-amber-400/10 text-2xl font-black text-white"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/35 max-w-xs mx-auto leading-relaxed">
                  Dile este código al repartidor cuando llegue
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT — Order summary ── */}
          <aside className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-sm lg:self-start lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/15">
                <Truck size={12} className="text-emerald-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Resumen</p>
            </div>

            <div className="space-y-1.5">
              {data.detalles.map((item) => (
                <div
                  key={`${item.nombre}-${item.subtotal}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/85 leading-snug">{item.nombre}</p>
                    <p className="mt-0.5 text-xs text-white/30">
                      {item.cantidad} × {formatCurrency(item.precio, "$")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-white/75">
                    {formatCurrency(item.subtotal, "$")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(data.subtotal, "$")}</span>
              </div>
              {!esRetiro && (
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>Despacho</span>
                  <span className="font-semibold">
                    {data.cargoEnvio > 0 ? formatCurrency(data.cargoEnvio, "$") : "Gratis"}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-white/8 pt-2">
                <span className="text-sm font-black text-white">Total</span>
                <span className="text-lg font-black text-orange-400">{formatCurrency(data.total, "$")}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Pago</span>
              <span className="text-xs font-black text-white/55">{data.metodoPago}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
