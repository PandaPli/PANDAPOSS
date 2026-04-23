"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bike, Clock3, MapPin, PackageCheck, RefreshCw,
  ShieldCheck, CheckCircle2, ChefHat,
  Truck, Star, ArrowUpRight, ExternalLink, Package2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryProgressValue, getDeliveryStageLabel } from "@/lib/delivery";
import type { DeliveryPedidoPublico } from "@/types";

interface Props {
  initialData: DeliveryPedidoPublico;
}

const stepsDelivery = [
  { key: "CONFIRMADO", title: "Confirmado",  subtitle: "Pedido recibido",     icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",  subtitle: "En la cocina",        icon: ChefHat      },
  { key: "EN_CAMINO",  title: "En camino",   subtitle: "El rider va hacia ti", icon: Bike         },
  { key: "ENTREGADO",  title: "Entregado",   subtitle: "¡Buen provecho!",     icon: Star         },
] as const;

const stepsRetiro = [
  { key: "CONFIRMADO", title: "Confirmado",        subtitle: "Pedido recibido",      icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",         subtitle: "En la cocina",         icon: ChefHat      },
  { key: "EN_CAMINO",  title: "Listo p/ retirar",  subtitle: "¡Tu pedido te espera!", icon: Package2     },
  { key: "ENTREGADO",  title: "Retirado",           subtitle: "¡Buen provecho!",      icon: Star         },
] as const;

export function TrackOrderClient({ initialData }: Props) {
  const [data, setData]         = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), 20_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/delivery/track?id=${data.id}`, { cache: "no-store" });
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setRefreshing(false);
    }
  }

  const esRetiro = /retiro/i.test(data.zonaDelivery ?? "") || (!data.zonaDelivery && !data.direccionEntrega);
  const steps    = esRetiro ? stepsRetiro : stepsDelivery;
  const progress    = getDeliveryProgressValue(data.trackingStage);
  const activeIndex = steps.findIndex((s) => s.key === data.trackingStage);
  const mapsUrl     = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccionEntrega)}`;
  const digits      = "codigoEntrega" in data && data.codigoEntrega
    ? data.codigoEntrega.split("")
    : null;

  return (
    <main className="min-h-screen bg-[#080b10] text-white selection:bg-orange-400/30">

      {/* ── Ambient glow ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-8 lg:max-w-5xl">

        {/* ── Header ── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                {esRetiro ? "Seguimiento retiro" : "Seguimiento delivery"}
              </span>
            </div>
            <h1 className="text-[clamp(2.2rem,8vw,3.5rem)] font-black leading-none tracking-tight">
              Pedido <span className="text-orange-400">#{data.id}</span>
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {getDeliveryStageLabel(data.trackingStage, esRetiro)} · estimado {data.estimadoMinutos} min
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void refresh()}
              aria-label="Actualizar estado"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <Link
              href="/pedir"
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-orange-400 active:scale-95"
            >
              Pedir de nuevo
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

          {/* ── LEFT column ── */}
          <div className="space-y-4">

            {/* Progress bar */}
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                <span className="font-semibold uppercase tracking-widest">Progreso</span>
                <span className="font-black text-white/70">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg,#f97316,#fb923c,#34d399)",
                  }}
                />
              </div>
            </div>

            {/* Step timeline */}
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="grid grid-cols-4 gap-1 relative">
                {/* Connecting line */}
                <div className="absolute left-[12.5%] right-[12.5%] top-5 h-px bg-white/10" />
                <div
                  className="absolute left-[12.5%] top-5 h-px bg-gradient-to-r from-orange-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${(activeIndex / (steps.length - 1)) * 75}%` }}
                />

                {steps.map((step, i) => {
                  const done    = i < activeIndex;
                  const current = i === activeIndex;
                  const Icon    = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all duration-300
                        ${done    ? "border-emerald-400 bg-emerald-400/20 text-emerald-300" : ""}
                        ${current ? "border-orange-400 bg-orange-400/20 text-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.3)]" : ""}
                        ${!done && !current ? "border-white/10 bg-white/5 text-white/25" : ""}
                      `}>
                        {done
                          ? <CheckCircle2 size={17} />
                          : <Icon size={17} />
                        }
                      </div>
                      <div className="text-center">
                        <p className={`text-[11px] font-black leading-tight ${current ? "text-orange-300" : done ? "text-emerald-300" : "text-white/30"}`}>
                          {step.title}
                        </p>
                        <p className={`mt-0.5 hidden text-[10px] sm:block ${current || done ? "text-white/40" : "text-white/15"}`}>
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info cards row */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Entrega */}
              <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-400/15">
                    <MapPin size={14} className="text-orange-300" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/40">Entrega</p>
                </div>
                <p className="text-sm font-semibold text-white/85 leading-snug">{data.direccionEntrega}</p>
                {data.referencia   && <p className="mt-1.5 text-xs text-white/40">Ref: {data.referencia}</p>}
                {data.departamento && <p className="mt-0.5 text-xs text-white/40">Dpto: {data.departamento}</p>}
              </div>

              {/* Despacho / Retiro */}
              <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${esRetiro ? "bg-emerald-400/15" : "bg-blue-400/15"}`}>
                    {esRetiro
                      ? <Package2 size={14} className="text-emerald-300" />
                      : <Bike size={14} className="text-blue-300" />
                    }
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    {esRetiro ? "Retiro en local" : "Despacho"}
                  </p>
                </div>
                <p className="text-base font-black text-white">
                  {esRetiro ? "Pasa a retirar tu pedido" : (data.repartidorNombre ?? "Por asignar")}
                </p>
                <div className="mt-2 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs text-white/45">
                    <Clock3 size={11} className="text-white/30" />
                    {new Date(data.creadoEn).toLocaleString("es-CL")}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-white/45">
                    <PackageCheck size={11} className="text-white/30" />
                    {getDeliveryStageLabel(data.trackingStage, esRetiro)}
                  </p>
                </div>
              </div>
            </div>

            {/* Google Maps card */}
            {data.direccionEntrega && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex cursor-pointer items-center gap-4 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950/60 to-indigo-950/40 p-4 transition-all duration-200 hover:border-blue-400/40 hover:from-blue-900/60 backdrop-blur-sm"
              >
                {/* Map preview placeholder */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-500/15">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
                  <MapPin size={22} className="text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-400">
                    Dónde va mi pedido
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white/75">
                    {data.direccionEntrega}
                  </p>
                  <p className="mt-1 text-[11px] text-blue-400/60">Abrir en Google Maps</p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 transition-all duration-200 group-hover:bg-blue-500/25 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ExternalLink size={15} />
                </div>
              </a>
            )}

            {/* Delivery code */}
            {"codigoEntrega" in data && data.codigoEntrega && digits && (
              <div className="overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-950/50 to-orange-950/30 p-6 text-center backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
                    Tu código de entrega
                  </p>
                </div>

                {/* 4 digit boxes */}
                <div className="flex items-center justify-center gap-3">
                  {digits.map((d, i) => (
                    <div
                      key={i}
                      className="flex h-16 w-14 items-center justify-center rounded-2xl border-2 border-amber-400/40 bg-amber-400/10 text-3xl font-black text-white shadow-[0_0_24px_rgba(251,191,36,0.12)]"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
                  Dile este código al repartidor cuando llegue a tu puerta para confirmar la entrega
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT column — Order summary ── */}
          <aside className="rounded-3xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm lg:self-start lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-400/15">
                <Truck size={14} className="text-emerald-300" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/40">Resumen del pedido</p>
            </div>

            <div className="space-y-2">
              {data.detalles.map((item) => (
                <div
                  key={`${item.nombre}-${item.subtotal}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-white/6 bg-white/4 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/90 leading-snug">{item.nombre}</p>
                    <p className="mt-0.5 text-xs text-white/35">
                      {item.cantidad} × {formatCurrency(item.precio, "$")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-white/80">
                    {formatCurrency(item.subtotal, "$")}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/45">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(data.subtotal, "$")}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/45">
                <span>Despacho</span>
                <span className="font-semibold">
                  {data.cargoEnvio > 0 ? formatCurrency(data.cargoEnvio, "$") : "Gratis"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-white/8 pt-3">
                <span className="text-sm font-black text-white">Total</span>
                <span className="text-xl font-black text-orange-400">{formatCurrency(data.total, "$")}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/4 px-3 py-2">
              <span className="text-xs text-white/35 uppercase tracking-widest font-semibold">Pago</span>
              <span className="text-xs font-black text-white/60">{data.metodoPago}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
