"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Clock3, MapPin, PackageCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryProgressValue, getDeliveryStageLabel } from "@/lib/delivery";
import type { DeliveryPedidoPublico } from "@/types";

interface Props {
  initialData: DeliveryPedidoPublico;
}

const steps = [
  { key: "CONFIRMADO", title: "Pedido confirmado" },
  { key: "PREPARANDO", title: "Preparando" },
  { key: "EN_CAMINO", title: "En camino" },
  { key: "ENTREGADO", title: "Entregado" },
] as const;

export function TrackOrderClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 20000);

    return () => clearInterval(interval);
  }, [data.id]);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/delivery/track?id=${data.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const next = await res.json();
      setData(next);
    } finally {
      setRefreshing(false);
    }
  }

  const progress = getDeliveryProgressValue(data.trackingStage);
  const activeIndex = steps.findIndex((step) => step.key === data.trackingStage);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#121212_0%,#1f2937_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Seguimiento delivery</p>
            <h1 className="mt-2 text-4xl font-black">Pedido #{data.id}</h1>
            <p className="mt-2 text-sm text-white/70">{getDeliveryStageLabel(data.trackingStage)} · estimado actual {data.estimadoMinutos} min</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              Actualizar
            </button>
            <Link href="/pedir" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-stone-900 transition hover:bg-amber-300">
              Hacer otro pedido
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-[0_45px_120px_-70px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-white/70">
                <span>Progreso del pedido</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => {
                const active = index <= activeIndex || data.trackingStage === step.key;
                return (
                  <div key={step.key} className={`rounded-[1.4rem] border p-4 transition ${active ? "border-emerald-300/50 bg-emerald-400/15 text-white" : "border-white/10 bg-white/5 text-white/45"}`}>
                    <p className="text-xs uppercase tracking-[0.22em]">Paso {index + 1}</p>
                    <p className="mt-2 text-sm font-bold">{step.title}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Entrega</p>
                <div className="mt-3 space-y-3 text-sm text-white/80">
                  <p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 text-amber-300" /> <span>{data.direccionEntrega}</span></p>
                  {data.referencia ? <p>Referencia: {data.referencia}</p> : null}
                  {data.departamento ? <p>Departamento: {data.departamento}</p> : null}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Despacho</p>
                <div className="mt-3 space-y-3 text-sm text-white/80">
                  <p className="flex items-center gap-2"><Bike size={15} className="text-amber-300" /> {data.repartidorNombre ? data.repartidorNombre : "Repartidor por asignar"}</p>
                  <p className="flex items-center gap-2"><Clock3 size={15} className="text-amber-300" /> Pedido creado {new Date(data.creadoEn).toLocaleString("es-CL")}</p>
                  <p className="flex items-center gap-2"><PackageCheck size={15} className="text-amber-300" /> {getDeliveryStageLabel(data.trackingStage)}</p>
                </div>
              </div>
            </div>

            {/* Código de entrega — visible cuando el rider está en camino */}
            {"codigoEntrega" in data && data.codigoEntrega && (
              <div className="mt-4 rounded-[1.5rem] border border-amber-400/40 bg-amber-400/15 p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-amber-300" />
                  <p className="text-xs uppercase tracking-[0.25em] font-bold text-amber-300">Tu código de entrega</p>
                </div>
                <p className="text-4xl font-black tracking-[0.4em] text-white mt-1">{data.codigoEntrega}</p>
                <p className="text-xs text-white/60 mt-3">Entrega este código al repartidor cuando llegue a tu puerta</p>
              </div>
            )}
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-[0_45px_120px_-70px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Resumen</p>
            <div className="mt-4 space-y-3">
              {data.detalles.map((item) => (
                <div key={`${item.nombre}-${item.subtotal}`} className="rounded-[1.3rem] border border-white/10 bg-white/6 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{item.nombre}</p>
                      <p className="mt-1 text-xs text-white/55">{item.cantidad} x {formatCurrency(item.precio, "$")}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(item.subtotal, "$")}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-amber-300/25 bg-amber-400/10 p-4 text-sm">
              <div className="flex items-center justify-between text-white/75">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal, "$")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-white/75">
                <span>Despacho</span>
                <span>{formatCurrency(data.cargoEnvio, "$")}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-lg font-black text-white">
                <span>Total</span>
                <span>{formatCurrency(data.total, "$")}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

