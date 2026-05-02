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

/* ── Paleta ──────────────────────────────────────────────────────── */
const C = {
  darkest: "#49225B",
  dark:    "#6E3482",
  mid:     "#A56ABD",
  pale:    "#E7DBEF",
  faint:   "#F5EBFA",
} as const;

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
    <main style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${C.faint} 0%, ${C.pale} 55%, ${C.faint} 100%)`,
      color: C.darkest,
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>

      {/* Glow suave */}
      <div style={{
        pointerEvents: "none", position: "fixed", inset: 0, overflow: "hidden",
      }} aria-hidden>
        <div style={{
          position: "absolute", top: -128, left: "50%", transform: "translateX(-50%)",
          height: 420, width: 420, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(165,106,189,0.18) 0%, transparent 70%)`,
          filter: "blur(60px)",
        }} />
      </div>

      <div style={{ position: "relative", margin: "0 auto", maxWidth: 672, padding: "24px 16px 80px", }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.mid, marginBottom: 4 }}>
              {esRetiro ? "Retiro en local" : "Seguimiento delivery"}
              {data.sucursalNombre && <> · {data.sucursalNombre}</>}
            </p>
            <h1 style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: C.darkest, margin: 0 }}>
              Pedido <span style={{ color: C.dark }}>#{data.id}</span>
            </h1>
          </div>

          <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 8 }}>
            <button
              onClick={() => void refresh()}
              aria-label="Actualizar"
              style={{
                display: "flex", height: 36, width: 36, cursor: "pointer",
                alignItems: "center", justifyContent: "center",
                borderRadius: 12, border: `1.5px solid rgba(110,52,130,.22)`,
                background: "white", color: C.mid,
                transition: "color .18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.dark)}
              onMouseLeave={e => (e.currentTarget.style.color = C.mid)}
            >
              <RefreshCw size={14} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
            {menuUrl && (
              <Link
                href={menuUrl}
                style={{
                  display: "inline-flex", cursor: "pointer",
                  alignItems: "center", gap: 6,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.dark}, ${C.darkest})`,
                  padding: "8px 12px",
                  fontSize: 12, fontWeight: 800, color: "white",
                  textDecoration: "none",
                  boxShadow: `0 4px 14px rgba(110,52,130,.30)`,
                  transition: "opacity .18s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = ".88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Pedir de nuevo <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        </header>

        <div style={{ display: "grid", gap: 16 }}>

          {/* ── Estado + pasos en UNA sola card ── */}
          <div style={{
            borderRadius: 24, border: `1px solid rgba(110,52,130,.18)`,
            background: "white",
            boxShadow: `0 2px 16px rgba(73,34,91,.06)`,
            padding: 20,
          }}>

            {/* Estado actual */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{
                display: "flex", height: 56, width: 56, flexShrink: 0,
                alignItems: "center", justifyContent: "center",
                borderRadius: 18, borderWidth: 2, borderStyle: "solid",
                transition: "all .3s",
                ...(isDone
                  ? { borderColor: "#10b981", background: "rgba(16,185,129,.12)", color: "#059669" }
                  : { borderColor: C.dark, background: `rgba(110,52,130,.12)`, color: C.dark,
                      boxShadow: `0 0 24px rgba(110,52,130,.20)` }
                ),
              }}>
                {currentStep && <currentStep.icon size={24} />}
              </div>
              <div>
                <p style={{ fontSize: "clamp(18px,4vw,22px)", fontWeight: 900, lineHeight: 1.1, color: C.darkest, margin: "0 0 4px" }}>
                  {currentStep?.title ?? getDeliveryStageLabel(data.trackingStage, esRetiro)}
                </p>
                <p style={{ fontSize: 13, color: C.mid, margin: 0 }}>{subtitle}</p>
                {!isDone && (
                  <p style={{ fontSize: 11, color: C.mid, opacity: .6, marginTop: 4 }}>~ {data.estimadoMinutos} min estimados</p>
                )}
              </div>
            </div>

            {/* Pasos inline */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {steps.map((step, i) => {
                const done    = i < activeIndex;
                const current = i === activeIndex;
                const Icon    = step.icon;
                return (
                  <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {/* Connector line */}
                    <div style={{ position: "relative", display: "flex", width: "100%", alignItems: "center", justifyContent: "center" }}>
                      {i > 0 && (
                        <div style={{
                          position: "absolute", right: "50%", top: "50%", height: 1, width: "100%",
                          transform: "translateY(-50%)",
                          background: (done || current)
                            ? `linear-gradient(to right, rgba(110,52,130,.50), rgba(16,185,129,.50))`
                            : `rgba(110,52,130,.15)`,
                        }} />
                      )}
                      <div style={{
                        position: "relative", zIndex: 10,
                        display: "flex", height: 32, width: 32,
                        alignItems: "center", justifyContent: "center",
                        borderRadius: 10, borderWidth: 1.5, borderStyle: "solid",
                        transition: "all .3s",
                        ...(done
                          ? { borderColor: "rgba(16,185,129,.60)", background: "rgba(16,185,129,.12)", color: "#059669" }
                          : current
                          ? { borderColor: C.dark, background: `rgba(110,52,130,.12)`, color: C.dark,
                              boxShadow: `0 0 14px rgba(110,52,130,.25)` }
                          : { borderColor: `rgba(110,52,130,.15)`, background: C.faint, color: C.mid, opacity: .5 }
                        ),
                      }}>
                        {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                      </div>
                    </div>
                    <p style={{
                      fontSize: 9, fontWeight: 800, textAlign: "center", lineHeight: 1.2,
                      letterSpacing: "0.04em", width: "100%",
                      color: current ? C.dark : done ? "#059669" : C.mid,
                      opacity: (!done && !current) ? .55 : 1,
                    }}>
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
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                borderRadius: 24, border: "1.5px solid rgba(16,185,129,.35)",
                background: "rgba(16,185,129,.10)",
                padding: "16px 20px", fontSize: 15, fontWeight: 900,
                color: "#059669", cursor: "pointer",
                transition: "all .18s",
                opacity: confirming ? .6 : 1,
              }}
              onMouseEnter={e => !confirming && (e.currentTarget.style.background = "rgba(16,185,129,.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(16,185,129,.10)")}
            >
              {confirming
                ? <span style={{ height: 20, width: 20, borderRadius: "50%", border: "2px solid rgba(5,150,105,.3)", borderTopColor: "#059669", display: "inline-block", animation: "spin 1s linear infinite" }} />
                : <Package2 size={18} />
              }
              {confirming ? "Confirmando…" : "Ya retiré mi pedido"}
            </button>
          )}

          {/* Confirmación exitosa */}
          {esRetiro && retirado && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              borderRadius: 24, border: "1.5px solid rgba(16,185,129,.25)",
              background: "rgba(16,185,129,.08)", padding: "16px 20px",
            }}>
              <Star size={20} style={{ color: "#059669", flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 900, color: "#059669", margin: "0 0 2px" }}>¡Listo, buen provecho!</p>
                <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>Retiro confirmado · ¡Gracias!</p>
              </div>
            </div>
          )}

          {/* ── Info row ── */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>

            {/* Delivery: dirección */}
            {!esRetiro && data.direccionEntrega && (
              <div style={{
                borderRadius: 18, border: `1px solid rgba(110,52,130,.18)`,
                background: "white", padding: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <MapPin size={12} style={{ color: C.dark }} />
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.mid, margin: 0 }}>Dirección</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.darkest, lineHeight: 1.4, margin: 0 }}>{data.direccionEntrega}</p>
                {data.referencia   && <p style={{ marginTop: 4, fontSize: 11, color: C.mid }}>Ref: {data.referencia}</p>}
                {data.departamento && <p style={{ fontSize: 11, color: C.mid }}>Dpto: {data.departamento}</p>}
              </div>
            )}

            {/* Retiro: local / Delivery: rider */}
            <div style={{
              borderRadius: 18, border: `1px solid rgba(110,52,130,.18)`,
              background: "white", padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {esRetiro
                  ? <Store size={12} style={{ color: "#059669" }} />
                  : <Bike  size={12} style={{ color: C.dark }}    />
                }
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.mid, margin: 0 }}>
                  {esRetiro ? "Retiro en local" : "Repartidor"}
                </p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 900, color: C.darkest, margin: "0 0 6px" }}>
                {esRetiro
                  ? (data.sucursalNombre ?? "Pasa a retirar")
                  : (data.repartidorNombre ?? "Por asignar")}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.mid, margin: 0 }}>
                <Clock3 size={10} style={{ flexShrink: 0 }} />
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
              style={{
                display: "flex", cursor: "pointer", alignItems: "center", gap: 12,
                borderRadius: 18, border: `1px solid rgba(110,52,130,.20)`,
                background: `rgba(110,52,130,.06)`, padding: 14,
                textDecoration: "none",
                transition: "border-color .18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(110,52,130,.40)`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = `rgba(110,52,130,.20)`)}
            >
              <div style={{
                display: "flex", height: 36, width: 36, flexShrink: 0,
                alignItems: "center", justifyContent: "center",
                borderRadius: 11, background: `rgba(110,52,130,.12)`,
              }}>
                <MapPin size={16} style={{ color: C.dark }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.dark, margin: "0 0 2px" }}>Ver en Google Maps</p>
                <p style={{ fontSize: 11, color: C.mid, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.direccionEntrega}</p>
              </div>
              <ExternalLink size={13} style={{ flexShrink: 0, color: C.mid }} />
            </a>
          )}

          {/* Código de entrega */}
          {digits && (
            <div style={{
              borderRadius: 18, border: `1px solid rgba(110,52,130,.25)`,
              background: `rgba(110,52,130,.07)`, padding: 16, textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                <ShieldCheck size={13} style={{ color: C.dark }} />
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.dark, margin: 0 }}>Código de entrega</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {digits.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", height: 44, width: 38,
                      alignItems: "center", justifyContent: "center",
                      borderRadius: 12, border: `1.5px solid rgba(110,52,130,.30)`,
                      background: `rgba(110,52,130,.10)`,
                      fontSize: 22, fontWeight: 900, color: C.darkest,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 10, fontSize: 11, color: C.mid }}>Dile este código al repartidor</p>
            </div>
          )}

          {/* ── Resumen ── */}
          <div style={{
            borderRadius: 24, border: `1px solid rgba(110,52,130,.18)`,
            background: "white",
            boxShadow: `0 2px 16px rgba(73,34,91,.06)`,
            padding: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Truck size={12} style={{ color: "#059669" }} />
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.mid, margin: 0 }}>Resumen</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.detalles.map((item) => (
                <div
                  key={`${item.nombre}-${item.subtotal}`}
                  style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                    borderRadius: 12, border: `1px solid rgba(110,52,130,.12)`,
                    background: C.faint, padding: "8px 12px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.darkest, lineHeight: 1.3, margin: "0 0 2px" }}>{item.nombre}</p>
                    <p style={{ fontSize: 11, color: C.mid, margin: 0 }}>{item.cantidad} × {formatCurrency(item.precio, "$")}</p>
                  </div>
                  <p style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: C.darkest }}>
                    {formatCurrency(item.subtotal, "$")}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 12, borderRadius: 12, border: `1px solid rgba(110,52,130,.15)`,
              background: C.faint, padding: 12, display: "flex", flexDirection: "column", gap: 6,
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
                display: "flex", justifyContent: "space-between",
                borderTop: `1px solid rgba(110,52,130,.15)`, paddingTop: 8,
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.darkest }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{formatCurrency(data.total, "$")}</span>
              </div>
            </div>

            <div style={{
              marginTop: 8, display: "flex", justifyContent: "space-between",
              borderRadius: 12, background: C.faint, padding: "8px 12px",
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.mid }}>Pago</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.darkest }}>{data.metodoPago}</span>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
