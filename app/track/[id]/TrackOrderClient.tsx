"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bike, Clock3, MapPin, RefreshCw, ShieldCheck,
  CheckCircle2, ChefHat, Truck, Star, ArrowUpRight,
  ExternalLink, Package2, Store, Navigation,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryStageLabel } from "@/lib/delivery";
import { createSlug } from "@/lib/slug";
import type { DeliveryPedidoPublico } from "@/types";

interface Props { initialData: DeliveryPedidoPublico }

/* ─── Paleta ─────────────────────────────────────────────────────── */
const C = {
  darkest: "#49225B",
  dark:    "#6E3482",
  mid:     "#A56ABD",
  pale:    "#E7DBEF",
  faint:   "#F5EBFA",
  emerald: "#059669",
  emeraldBg: "rgba(16,185,129,.10)",
  emeraldBorder: "rgba(16,185,129,.28)",
} as const;

/* ─── Steps ──────────────────────────────────────────────────────── */
const stepsDelivery = [
  { key: "CONFIRMADO", title: "Confirmado",      short: "OK",   icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",       short: "Chef", icon: ChefHat      },
  { key: "EN_CAMINO",  title: "En camino",        short: "Ruta", icon: Bike         },
  { key: "ENTREGADO",  title: "Entregado",        short: "¡Ya!", icon: Star         },
] as const;

const stepsRetiro = [
  { key: "CONFIRMADO", title: "Confirmado",       short: "OK",   icon: CheckCircle2 },
  { key: "PREPARANDO", title: "Preparando",        short: "Chef", icon: ChefHat      },
  { key: "EN_CAMINO",  title: "Listo p/ retirar", short: "Listo",icon: Package2     },
  { key: "ENTREGADO",  title: "Retirado",          short: "¡Ya!", icon: Star         },
] as const;

/* ─── Subtítulos hero ────────────────────────────────────────────── */
const HERO_SUB: Record<string, string> = {
  CONFIRMADO: "Tu pedido fue recibido con éxito",
  PREPARANDO: "La cocina ya está en acción",
  EN_CAMINO:  "¡Ya viene en camino hacia ti!",
  ENTREGADO:  "¡Que lo disfrutes mucho!",
};
const HERO_SUB_RETIRO: Record<string, string> = {
  ...HERO_SUB,
  EN_CAMINO: "Ya puedes pasar a buscarlo",
  ENTREGADO: "¡Gracias por elegirnos!",
};

/* ─── CSS keyframes (global scope, prefixed con "t-") ─────────────── */
const STYLES = `
  @keyframes t-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(110,52,130,.50); }
    65%  { box-shadow: 0 0 0 22px rgba(110,52,130,0); }
    100% { box-shadow: 0 0 0 0 rgba(110,52,130,0); }
  }
  @keyframes t-pulse-done {
    0%   { box-shadow: 0 0 0 0 rgba(16,185,129,.45); }
    65%  { box-shadow: 0 0 0 22px rgba(16,185,129,0); }
    100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
  }
  @keyframes t-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    40%       { transform: translateY(-7px) rotate(-4deg); }
    70%       { transform: translateY(-4px) rotate(2deg); }
  }
  @keyframes t-float-done {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.12); }
  }
  @keyframes t-shimmer {
    0%   { transform: translateX(-200%); }
    100% { transform: translateX(300%); }
  }
  @keyframes t-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes t-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes t-breathe {
    0%, 100% { opacity: .55; transform: scale(1); }
    50%       { opacity: .85; transform: scale(1.08); }
  }
  @keyframes t-step-pop {
    0%   { transform: scale(.7); opacity: 0; }
    60%  { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes t-dot-march {
    0%   { background-position: 0 0; }
    100% { background-position: 24px 0; }
  }

  .t-hero-active  { animation: t-pulse  2.4s ease-out infinite; }
  .t-hero-done    { animation: t-pulse-done 2.8s ease-out infinite; }
  .t-float-active { animation: t-float  3.6s ease-in-out infinite; }
  .t-float-done   { animation: t-float-done 2.8s ease-in-out infinite; }
  .t-spin         { animation: t-spin   1s linear infinite; }
  .t-breathe      { animation: t-breathe 4s ease-in-out infinite; }
  .t-step-pop     { animation: t-step-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
  .t-shimmer-wrap { position:relative; overflow:hidden; }
  .t-shimmer-wrap::after {
    content:'';
    position:absolute; inset:0;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255,255,255,.75) 50%,
      transparent 100%);
    animation: t-shimmer 1.9s linear infinite;
  }
  .t-dot-march {
    background-image: repeating-linear-gradient(
      90deg,
      rgba(110,52,130,.22) 0px,
      rgba(110,52,130,.22) 6px,
      transparent 6px,
      transparent 12px
    );
    background-size: 24px 3px;
    animation: t-dot-march .7s linear infinite;
  }
  .t-card {
    animation: t-fade-up .5s ease both;
    border-radius: 24px;
    border: 1px solid rgba(110,52,130,.15);
    background: white;
    box-shadow: 0 2px 12px rgba(73,34,91,.06), 0 8px 32px rgba(73,34,91,.05);
  }
  .t-card-sm {
    animation: t-fade-up .5s ease both;
    border-radius: 20px;
    border: 1px solid rgba(110,52,130,.14);
    background: white;
    box-shadow: 0 2px 10px rgba(73,34,91,.05);
  }
  .t-icon-badge {
    display:flex; align-items:center; justify-content:center;
    width:30px; height:30px; border-radius:10px;
    background: rgba(110,52,130,.09);
    flex-shrink:0;
  }
  .t-btn-refresh:hover { color: ${C.dark} !important; border-color: rgba(110,52,130,.40) !important; }
  .t-btn-refresh:active { transform: scale(.93); }
  .t-maps-card:hover { border-color: rgba(110,52,130,.38) !important; box-shadow: 0 4px 20px rgba(110,52,130,.12) !important; }
  .t-reorder:hover { opacity: .86 !important; }
  .t-retiro-btn:hover:not(:disabled) { background: rgba(16,185,129,.18) !important; }
`;

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
  const heroSub     = esRetiro ? HERO_SUB_RETIRO[data.trackingStage] : HERO_SUB[data.trackingStage];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <main style={{
        minHeight: "100vh",
        background: `linear-gradient(155deg, ${C.faint} 0%, ${C.pale} 48%, ${C.faint} 100%)`,
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: C.darkest,
      }}>

        {/* ── Orb de fondo ── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden>
          <div
            className="t-breathe"
            style={{
              position: "absolute", top: "-8%", left: "50%", transform: "translateX(-50%)",
              width: 640, height: 640, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(165,106,189,.16) 0%, transparent 65%)`,
              filter: "blur(40px)",
            }}
          />
        </div>

        <div style={{ position: "relative", margin: "0 auto", maxWidth: 680, padding: "28px 16px 88px" }}>

          {/* ── Header ── */}
          <header style={{
            marginBottom: 24,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            animation: "t-fade-up .4s ease both",
          }}>
            <div>
              <p style={{
                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.13em", color: C.mid, margin: "0 0 5px",
              }}>
                {esRetiro ? "Retiro en local" : "Seguimiento delivery"}
                {data.sucursalNombre && <> · {data.sucursalNombre}</>}
              </p>
              <h1 style={{
                fontSize: "clamp(22px,5vw,30px)", fontWeight: 900,
                letterSpacing: "-0.025em", lineHeight: 1, margin: 0, color: C.darkest,
              }}>
                Pedido&nbsp;<span style={{ color: C.dark }}>#{data.id}</span>
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => void refresh()}
                aria-label="Actualizar"
                className="t-btn-refresh"
                style={{
                  display: "flex", height: 40, width: 40,
                  alignItems: "center", justifyContent: "center",
                  borderRadius: 14, border: `1.5px solid rgba(110,52,130,.22)`,
                  background: "white", color: C.mid, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(73,34,91,.06)",
                  transition: "all .2s",
                }}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "t-spin" : ""}
                />
              </button>

              {menuUrl && (
                <Link
                  href={menuUrl}
                  className="t-reorder"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${C.dark}, ${C.darkest})`,
                    padding: "10px 16px",
                    fontSize: 12, fontWeight: 800, color: "white",
                    textDecoration: "none",
                    boxShadow: `0 4px 18px rgba(110,52,130,.32)`,
                    transition: "opacity .2s",
                  }}
                >
                  <Navigation size={12} /> Pedir de nuevo
                </Link>
              )}
            </div>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ════════════════════════════════════════════
                HERO STATUS CARD
            ════════════════════════════════════════════ */}
            <div
              className="t-card"
              style={{ padding: "36px 28px 28px", textAlign: "center", animationDelay: ".05s" }}
            >

              {/* Ícono grande con pulso */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <div
                  className={isDone ? "t-hero-done" : "t-hero-active"}
                  style={{
                    display: "flex", width: 88, height: 88,
                    alignItems: "center", justifyContent: "center",
                    borderRadius: 30,
                    border: `2.5px solid`,
                    transition: "all .6s ease",
                    ...(isDone
                      ? { borderColor: C.emerald, background: C.emeraldBg, color: C.emerald }
                      : { borderColor: C.dark, background: `rgba(110,52,130,.10)`, color: C.dark }
                    ),
                  }}
                >
                  {currentStep && (
                    <span className={isDone ? "t-float-done" : "t-float-active"} style={{ display: "flex" }}>
                      <currentStep.icon size={36} strokeWidth={1.8} />
                    </span>
                  )}
                </div>
              </div>

              {/* Título */}
              <h2 style={{
                fontSize: "clamp(26px,6vw,36px)", fontWeight: 900,
                letterSpacing: "-0.03em", lineHeight: 1.05,
                color: C.darkest, margin: "0 0 10px",
                transition: "all .5s ease",
              }}>
                {currentStep?.title ?? getDeliveryStageLabel(data.trackingStage, esRetiro)}
              </h2>

              {/* Subtítulo */}
              <p style={{ fontSize: 14, color: C.mid, margin: "0 0 18px", lineHeight: 1.55 }}>
                {heroSub}
              </p>

              {/* ETA pill */}
              {!isDone && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  borderRadius: 999,
                  background: `rgba(110,52,130,.08)`,
                  border: `1.5px solid rgba(110,52,130,.18)`,
                  padding: "7px 16px",
                  fontSize: 12, fontWeight: 700, color: C.dark,
                  marginBottom: 28,
                }}>
                  <Clock3 size={13} />
                  ~ {data.estimadoMinutos} min estimados
                </div>
              )}
              {isDone && <div style={{ marginBottom: 28 }} />}

              {/* ════ STEPPER ════ */}
              <div style={{ display: "flex", alignItems: "flex-start", padding: "0 4px" }}>
                {steps.map((step, i) => {
                  const done    = i < activeIndex;
                  const current = i === activeIndex;
                  const pending = i > activeIndex;
                  const Icon    = step.icon;

                  /* estado de la línea izquierda (de i-1 → i) */
                  const leftDone    = done || current;   // esa transición ya pasó
                  /* estado de la línea derecha (de i → i+1) */
                  const rightDone   = done;              // pasó
                  const rightActive = current;           // en tránsito → shimmer
                  /* la línea derecha "pending" es cuando !done && !current */

                  return (
                    <div
                      key={step.key}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
                    >

                      {/* Fila: línea-izq + círculo + línea-der */}
                      <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: 8 }}>

                        {/* Línea izquierda */}
                        {i > 0 && (
                          <div
                            className={leftDone ? "t-shimmer-wrap" : ""}
                            style={{
                              flex: 1, height: 3, borderRadius: 99,
                              overflow: "hidden",
                              transition: "background .55s ease",
                              background: leftDone
                                ? `linear-gradient(90deg, rgba(16,185,129,.7), rgba(110,52,130,.6))`
                                : `rgba(110,52,130,.13)`,
                            }}
                          />
                        )}

                        {/* Círculo del paso */}
                        <div
                          className={current ? "t-step-pop" : ""}
                          style={{
                            flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width:  current ? 46 : 38,
                            height: current ? 46 : 38,
                            borderRadius: current ? 16 : 13,
                            border: `2px solid`,
                            transition: "all .45s cubic-bezier(.34,1.56,.64,1)",
                            ...(done
                              ? { borderColor: C.emerald, background: C.emerald, color: "white" }
                              : current
                              ? { borderColor: C.dark, background: C.dark, color: "white",
                                  boxShadow: `0 0 0 5px rgba(110,52,130,.16), 0 6px 22px rgba(110,52,130,.28)` }
                              : { borderColor: `rgba(110,52,130,.18)`, background: C.faint, color: C.mid }
                            ),
                          }}
                        >
                          {done
                            ? <CheckCircle2 size={17} />
                            : <Icon size={current ? 20 : 16} />
                          }
                        </div>

                        {/* Línea derecha */}
                        {i < steps.length - 1 && (
                          <div
                            className={rightActive ? "t-shimmer-wrap" : (pending ? "t-dot-march" : "")}
                            style={{
                              flex: 1, height: 3, borderRadius: 99,
                              overflow: "hidden",
                              transition: "background .55s ease",
                              background: rightDone
                                ? `linear-gradient(90deg, rgba(110,52,130,.6), rgba(16,185,129,.7))`
                                : rightActive
                                ? `linear-gradient(90deg, rgba(110,52,130,.45), rgba(110,52,130,.18))`
                                : "transparent",
                            }}
                          />
                        )}
                      </div>

                      {/* Etiqueta */}
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: "0.02em",
                        textAlign: "center", lineHeight: 1.3, maxWidth: 62,
                        transition: "color .45s ease, opacity .45s ease",
                        color: done ? C.emerald : current ? C.dark : C.mid,
                        opacity: pending ? .45 : 1,
                      }}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ════ YA RETIRÉ ════ */}
            {esRetiro && data.trackingStage === "EN_CAMINO" && !retirado && (
              <button
                onClick={() => void confirmarRetiro()}
                disabled={confirming}
                className="t-retiro-btn"
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  borderRadius: 20, border: `2px solid ${C.emeraldBorder}`,
                  background: C.emeraldBg,
                  padding: "17px 20px", fontSize: 15, fontWeight: 900,
                  color: C.emerald, cursor: "pointer",
                  transition: "all .22s",
                  opacity: confirming ? .6 : 1,
                  animation: "t-fade-up .5s ease both",
                  animationDelay: ".1s",
                }}
              >
                {confirming
                  ? <span className="t-spin" style={{ height: 20, width: 20, borderRadius: "50%", border: `2.5px solid rgba(5,150,105,.28)`, borderTopColor: C.emerald, display: "inline-block" }} />
                  : <Package2 size={18} />
                }
                {confirming ? "Confirmando…" : "Ya retiré mi pedido"}
              </button>
            )}

            {/* ════ RETIRO CONFIRMADO ════ */}
            {esRetiro && retirado && (
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                borderRadius: 20, border: `1.5px solid ${C.emeraldBorder}`,
                background: C.emeraldBg, padding: "17px 20px",
                animation: "t-fade-up .4s ease both",
              }}>
                <Star size={22} style={{ color: C.emerald, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 900, color: C.emerald, margin: "0 0 2px" }}>¡Listo, buen provecho!</p>
                  <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>Retiro confirmado · ¡Gracias!</p>
                </div>
              </div>
            )}

            {/* ════ INFO CARDS ════ */}
            <div style={{
              display: "grid", gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            }}>

              {/* Dirección */}
              {!esRetiro && data.direccionEntrega && (
                <div className="t-card-sm" style={{ padding: 18, animationDelay: ".12s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div className="t-icon-badge">
                      <MapPin size={14} style={{ color: C.dark }} />
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.mid, margin: 0 }}>
                      Dirección
                    </p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.darkest, lineHeight: 1.45, margin: 0 }}>
                    {data.direccionEntrega}
                  </p>
                  {data.referencia   && <p style={{ marginTop: 5, fontSize: 11, color: C.mid, margin: "5px 0 0" }}>Ref: {data.referencia}</p>}
                  {data.departamento && <p style={{ fontSize: 11, color: C.mid, margin: "3px 0 0" }}>Dpto: {data.departamento}</p>}
                </div>
              )}

              {/* Rider / Local */}
              <div className="t-card-sm" style={{ padding: 18, animationDelay: ".17s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div className="t-icon-badge" style={{ background: esRetiro ? C.emeraldBg : undefined }}>
                    {esRetiro
                      ? <Store size={14} style={{ color: C.emerald }} />
                      : <Bike  size={14} style={{ color: C.dark }}   />
                    }
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.mid, margin: 0 }}>
                    {esRetiro ? "Retiro en local" : "Repartidor"}
                  </p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 900, color: C.darkest, margin: "0 0 6px" }}>
                  {esRetiro ? (data.sucursalNombre ?? "Pasa a retirar") : (data.repartidorNombre ?? "Por asignar")}
                </p>
                <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.mid, margin: 0 }}>
                  <Clock3 size={11} style={{ flexShrink: 0 }} />
                  {new Date(data.creadoEn).toLocaleString("es-CL")}
                </p>
              </div>
            </div>

            {/* ════ GOOGLE MAPS ════ */}
            {!esRetiro && data.direccionEntrega && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="t-card-sm t-maps-card"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", textDecoration: "none",
                  transition: "all .22s",
                  animationDelay: ".22s",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 15, flexShrink: 0,
                  background: `rgba(110,52,130,.09)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MapPin size={19} style={{ color: C.dark }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dark, margin: "0 0 3px" }}>
                    Ver en Google Maps
                  </p>
                  <p style={{ fontSize: 12, color: C.mid, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {data.direccionEntrega}
                  </p>
                </div>
                <ExternalLink size={15} style={{ flexShrink: 0, color: C.mid }} />
              </a>
            )}

            {/* ════ CÓDIGO DE ENTREGA ════ */}
            {digits && (
              <div className="t-card-sm" style={{ padding: "22px 20px", textAlign: "center", animationDelay: ".27s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 16 }}>
                  <ShieldCheck size={15} style={{ color: C.dark }} />
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.dark, margin: 0 }}>
                    Código de entrega
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {digits.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", height: 58, width: 48,
                        alignItems: "center", justifyContent: "center",
                        borderRadius: 16,
                        border: `2px solid rgba(110,52,130,.24)`,
                        background: C.faint,
                        fontSize: 28, fontWeight: 900, color: C.darkest,
                        boxShadow: "0 2px 8px rgba(73,34,91,.07)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 14, fontSize: 12, color: C.mid }}>Dile este código al repartidor</p>
              </div>
            )}

            {/* ════ RESUMEN DEL PEDIDO ════ */}
            <div className="t-card" style={{ padding: 22, animationDelay: ".32s" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div className="t-icon-badge" style={{ background: C.emeraldBg }}>
                  <Truck size={14} style={{ color: C.emerald }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.mid, margin: 0 }}>
                  Tu pedido
                </p>
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                {data.detalles.map((item) => (
                  <div
                    key={`${item.nombre}-${item.subtotal}`}
                    style={{
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                      borderRadius: 14, border: `1px solid rgba(110,52,130,.10)`,
                      background: C.faint, padding: "10px 14px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.darkest, lineHeight: 1.35, margin: "0 0 2px" }}>
                        {item.nombre}
                      </p>
                      <p style={{ fontSize: 11, color: C.mid, margin: 0 }}>
                        {item.cantidad} × {formatCurrency(item.precio, "$")}
                      </p>
                    </div>
                    <p style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: C.darkest, margin: 0 }}>
                      {formatCurrency(item.subtotal, "$")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div style={{
                borderRadius: 16, border: `1px solid rgba(110,52,130,.12)`,
                background: C.faint, padding: 16,
                display: "flex", flexDirection: "column", gap: 9,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mid }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(data.subtotal, "$")}</span>
                </div>
                {!esRetiro && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mid }}>
                    <span>Despacho</span>
                    <span>{data.cargoEnvio > 0 ? formatCurrency(data.cargoEnvio, "$") : "Gratis"}</span>
                  </div>
                )}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderTop: `1.5px solid rgba(110,52,130,.14)`, paddingTop: 12,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: C.darkest }}>Total</span>
                  <span style={{
                    fontSize: 22, fontWeight: 900, color: C.dark,
                    letterSpacing: "-0.02em",
                  }}>
                    {formatCurrency(data.total, "$")}
                  </span>
                </div>
              </div>

              {/* Pago */}
              <div style={{
                marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
                borderRadius: 12, background: C.pale, padding: "10px 14px",
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.mid }}>
                  Método de pago
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.darkest }}>
                  {data.metodoPago}
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
