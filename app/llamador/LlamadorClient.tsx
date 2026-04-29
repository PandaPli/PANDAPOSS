"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useKdsSocket } from "@/hooks/useKdsSocket";
import { Bike, Maximize2, Monitor, RefreshCw, UtensilsCrossed } from "lucide-react";

/* ── Tipos ────────────────────────────────────────────────────────── */
interface OrdenLista {
  id: number;
  numero: number;
  tipo: string;
  observacion: string | null;
  listoEn: string | null;
  mesa: { nombre: string } | null;
  delivery: { zonaDelivery: string | null } | null;
}

type Seccion = "COCINA" | "KIOSKO" | "DELIVERY";

function detectarSeccion(o: OrdenLista): Seccion {
  if (o.tipo === "DELIVERY") return "DELIVERY";
  if (o.observacion?.includes("KIOSKO")) return "KIOSKO";
  return "COCINA";
}

/* ── Paletas de colores (sin clases Tailwind no-estándar) ─────────── */
interface Paleta {
  label: string;
  Icon: React.ElementType;
  colBorder: string;
  colBg: string;
  headerBg: string;
  titleColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  cardBorder: string;
  numColor: string;
  dotColor: string;
  glowColor: string;
}

const PALETAS: Record<Seccion, Paleta> = {
  COCINA: {
    label: "Cocina",
    Icon: UtensilsCrossed,
    colBorder:   "rgba(245,158,11,0.35)",
    colBg:       "rgba(245,158,11,0.04)",
    headerBg:    "rgba(245,158,11,0.06)",
    titleColor:  "#fcd34d",
    badgeBg:     "rgba(245,158,11,0.18)",
    badgeBorder: "rgba(245,158,11,0.4)",
    badgeColor:  "#fcd34d",
    cardBorder:  "rgba(245,158,11,0.25)",
    numColor:    "#fef3c7",
    dotColor:    "#f59e0b",
    glowColor:   "rgba(245,158,11,0.08)",
  },
  KIOSKO: {
    label: "Kiosko",
    Icon: Monitor,
    colBorder:   "rgba(139,92,246,0.35)",
    colBg:       "rgba(139,92,246,0.04)",
    headerBg:    "rgba(139,92,246,0.06)",
    titleColor:  "#c4b5fd",
    badgeBg:     "rgba(139,92,246,0.18)",
    badgeBorder: "rgba(139,92,246,0.4)",
    badgeColor:  "#c4b5fd",
    cardBorder:  "rgba(139,92,246,0.25)",
    numColor:    "#ede9fe",
    dotColor:    "#8b5cf6",
    glowColor:   "rgba(139,92,246,0.08)",
  },
  DELIVERY: {
    label: "Delivery",
    Icon: Bike,
    colBorder:   "rgba(6,182,212,0.35)",
    colBg:       "rgba(6,182,212,0.04)",
    headerBg:    "rgba(6,182,212,0.06)",
    titleColor:  "#67e8f9",
    badgeBg:     "rgba(6,182,212,0.18)",
    badgeBorder: "rgba(6,182,212,0.4)",
    badgeColor:  "#67e8f9",
    cardBorder:  "rgba(6,182,212,0.25)",
    numColor:    "#cffafe",
    dotColor:    "#06b6d4",
    glowColor:   "rgba(6,182,212,0.08)",
  },
};

const SECCIONES: Seccion[] = ["COCINA", "KIOSKO", "DELIVERY"];

/* ── Reloj ────────────────────────────────────────────────────────── */
function Reloj() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>
      {time}
    </span>
  );
}

/* ── Tarjeta de orden ─────────────────────────────────────────────── */
function OrdenCard({ orden, pal, isNew }: { orden: OrdenLista; pal: Paleta; isNew: boolean }) {
  const subLabel = orden.mesa?.nombre
    ? orden.mesa.nombre
    : orden.tipo === "DELIVERY"
    ? (/retiro/i.test(orden.delivery?.zonaDelivery ?? "") ? "Retiro" : "Delivery")
    : null;

  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.035)",
      border: `1.5px solid ${isNew ? "rgba(255,255,255,0.4)" : pal.cardBorder}`,
      borderRadius: 20,
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: isNew ? `0 0 32px ${pal.dotColor}55` : `0 4px 20px rgba(0,0,0,0.3)`,
      animation: isNew ? "newOrder 0.5s cubic-bezier(.22,1,.36,1)" : undefined,
      transition: "box-shadow 0.4s ease",
    }}>
      {/* Punto pulsante para orden nueva */}
      {isNew && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 10, height: 10, borderRadius: "50%",
          background: pal.dotColor,
          animation: "ping 1s cubic-bezier(0,0,.2,1) infinite",
        }} />
      )}

      {/* Número — gigante */}
      <p style={{
        fontSize: "clamp(2.8rem,5.5vw,5rem)",
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: pal.numColor,
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}>
        #{orden.numero}
      </p>

      {/* Sub-etiqueta (mesa / zona) */}
      {subLabel && (
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "3px 12px",
          borderRadius: 999,
          background: pal.badgeBg,
          border: `1px solid ${pal.badgeBorder}`,
          color: pal.badgeColor,
        }}>
          {subLabel}
        </span>
      )}
    </div>
  );
}

/* ── Columna de sección ───────────────────────────────────────────── */
function SeccionCol({ sec, ordenes, newIds }: { sec: Seccion; ordenes: OrdenLista[]; newIds: Set<number> }) {
  const pal: Paleta = PALETAS[sec];

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      borderRadius: 24,
      border: `1px solid ${pal.colBorder}`,
      background: pal.colBg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      overflow: "hidden",
      boxShadow: `0 8px 40px ${pal.glowColor}`,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 24px",
        borderBottom: `1px solid ${pal.colBorder}`,
        background: pal.headerBg,
        flexShrink: 0,
      }}>
        <pal.Icon size={20} style={{ color: pal.titleColor }} />
        <h2 style={{
          color: pal.titleColor,
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "'Outfit', system-ui, sans-serif",
          margin: 0,
        }}>
          {pal.label}
        </h2>
        <span style={{
          marginLeft: "auto",
          fontSize: 13,
          fontWeight: 900,
          padding: "2px 12px",
          borderRadius: 999,
          background: pal.badgeBg,
          border: `1px solid ${pal.badgeBorder}`,
          color: pal.badgeColor,
        }}>
          {ordenes.length}
        </span>
      </div>

      {/* Lista de órdenes */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {ordenes.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: 12,
            opacity: 0.18,
            minHeight: 160,
          }}>
            <pal.Icon size={44} style={{ color: pal.titleColor }} />
            <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0 }}>Sin órdenes listas</p>
          </div>
        ) : (
          ordenes.map(o => (
            <OrdenCard key={o.id} orden={o} pal={pal} isNew={newIds.has(o.id)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────── */
interface Props {
  sucursalId: number | null;
  sucursalNombre: string;
  initialData: OrdenLista[];
}

export function LlamadorClient({ sucursalId, sucursalNombre, initialData }: Props) {
  const [ordenes, setOrdenes] = useState<OrdenLista[]>(initialData);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef<Set<number>>(new Set(initialData.map(o => o.id)));

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/llamador");
      if (!res.ok) return;
      const data: OrdenLista[] = await res.json();

      const dataIds = new Set(data.map(o => o.id));
      const nuevos = new Set<number>();
      for (const id of dataIds) {
        if (!prevIdsRef.current.has(id)) nuevos.add(id);
      }
      prevIdsRef.current = dataIds;

      setOrdenes(data);
      if (nuevos.size > 0) {
        setNewIds(nuevos);
        setTimeout(() => setNewIds(prev => {
          const next = new Set(prev);
          nuevos.forEach(id => next.delete(id));
          return next;
        }), 6000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useKdsSocket(sucursalId, fetchOrdenes);

  useEffect(() => {
    const id = setInterval(fetchOrdenes, 30_000);
    return () => clearInterval(id);
  }, [fetchOrdenes]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  const porSeccion: Record<Seccion, OrdenLista[]> = {
    COCINA:   ordenes.filter(o => detectarSeccion(o) === "COCINA"),
    KIOSKO:   ordenes.filter(o => detectarSeccion(o) === "KIOSKO"),
    DELIVERY: ordenes.filter(o => detectarSeccion(o) === "DELIVERY"),
  };

  const total = ordenes.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        @keyframes newOrder {
          0%   { transform: scale(0.85); opacity: 0; }
          65%  { transform: scale(1.03); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
      `}</style>

      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Outfit', system-ui, sans-serif",
        background: "linear-gradient(160deg, #05101f 0%, #090818 55%, #04100e 100%)",
        position: "relative",
      }}>
        {/* Glows ambientales */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {[
            { top: "-10%", left: "8%",  color: "rgba(245,158,11,0.06)",  size: 600, delay: "0s" },
            { top: "25%",  right: "4%", color: "rgba(139,92,246,0.06)",  size: 500, delay: "3s" },
            { bottom:"8%", left: "28%", color: "rgba(6,182,212,0.05)",   size: 620, delay: "6s" },
          ].map((g, i) => (
            <div key={i} style={{
              position: "absolute",
              width: g.size, height: g.size * 0.85,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${g.color} 0%, transparent 70%)`,
              filter: "blur(80px)",
              animation: `ambientPulse ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: g.delay,
              ...("top" in g ? { top: g.top } : { bottom: (g as { bottom: string }).bottom }),
              ...("left" in g ? { left: g.left } : { right: (g as { right: string }).right }),
            }} />
          ))}
        </div>

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <header style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="PandaPOS" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <div>
              <p style={{ color: "white", fontWeight: 900, fontSize: 20, lineHeight: 1, letterSpacing: "-.02em" }}>
                {sucursalNombre}
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                Órdenes listas para retirar
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {total > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 16px", borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "ping 1.5s ease-in-out infinite" }} />
                <span style={{ color: "white", fontWeight: 900, fontSize: 14 }}>
                  {total} lista{total !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <Reloj />

            <button onClick={fetchOrdenes} disabled={loading} title="Actualizar" style={{
              background: "none", border: "none", cursor: "pointer",
              color: loading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)",
              padding: 8, borderRadius: 10, transition: "color 0.2s",
            }}>
              <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>

            <button onClick={toggleFullscreen} title="Pantalla completa" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)",
              padding: 8, borderRadius: 10,
            }}>
              <Maximize2 size={18} />
            </button>
          </div>
        </header>

        {/* ── COLUMNAS ─────────────────────────────────────────────── */}
        <main style={{
          position: "relative", zIndex: 10,
          flex: 1,
          display: "flex",
          gap: 16,
          padding: 16,
          overflow: "hidden",
        }}>
          {SECCIONES.map(sec => (
            <SeccionCol key={sec} sec={sec} ordenes={porSeccion[sec]} newIds={newIds} />
          ))}
        </main>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer style={{
          position: "relative", zIndex: 10,
          textAlign: "center", padding: "6px 0", flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <p style={{ color: "rgba(255,255,255,0.1)", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            PandaPOS · Llamador de órdenes
          </p>
        </footer>
      </div>
    </>
  );
}
