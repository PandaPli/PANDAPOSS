"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";
import { Bike, ChefHat, Maximize2, Monitor, RefreshCw, UtensilsCrossed } from "lucide-react";

/* ── Tipos ───────────────────────────────────────────────────────── */
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

/* ── Secciones ───────────────────────────────────────────────────── */
const SECCIONES = [
  {
    key: "COCINA" as Seccion,
    label: "Cocina",
    Icon: UtensilsCrossed,
    border: "border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    title: "text-amber-300",
    num: "text-amber-100",
    cardBorder: "border-amber-500/30",
    cardShadow: "shadow-amber-500/10",
    dot: "bg-amber-400",
    glow: "rgba(245,158,11,.06)",
  },
  {
    key: "KIOSKO" as Seccion,
    label: "Kiosko",
    Icon: Monitor,
    border: "border-violet-500/40",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    title: "text-violet-300",
    num: "text-violet-100",
    cardBorder: "border-violet-500/30",
    cardShadow: "shadow-violet-500/10",
    dot: "bg-violet-400",
    glow: "rgba(139,92,246,.06)",
  },
  {
    key: "DELIVERY" as Seccion,
    label: "Delivery",
    Icon: Bike,
    border: "border-cyan-500/40",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    title: "text-cyan-300",
    num: "text-cyan-100",
    cardBorder: "border-cyan-500/30",
    cardShadow: "shadow-cyan-500/10",
    dot: "bg-cyan-400",
    glow: "rgba(6,182,212,.06)",
  },
] as const;

/* ── Reloj ───────────────────────────────────────────────────────── */
function Reloj() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-2xl font-bold text-white/50 tabular-nums">{time}</span>;
}

/* ── Tarjeta orden ───────────────────────────────────────────────── */
function OrdenCard({ orden, cfg, isNew }: {
  orden: OrdenLista;
  cfg: typeof SECCIONES[number];
  isNew: boolean;
}) {
  const esRetiro = orden.delivery?.zonaDelivery && /retiro/i.test(orden.delivery.zonaDelivery);
  const sublabel = orden.mesa?.nombre
    ? orden.mesa.nombre
    : orden.tipo === "DELIVERY"
    ? (esRetiro ? "Retiro" : "Delivery")
    : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col items-center justify-center gap-2 transition-all duration-500 shadow-lg ${cfg.cardBorder} ${cfg.cardShadow}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: isNew ? "newOrder .55s cubic-bezier(.34,1.56,.64,1) both" : undefined,
      }}
    >
      {isNew && (
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${cfg.dot} animate-ping`} />
      )}
      <p
        className={`font-black leading-none tabular-nums ${cfg.num}`}
        style={{ fontSize: "clamp(2.8rem,5.5vw,5.2rem)", letterSpacing: "-0.03em" }}
      >
        #{orden.numero}
      </p>
      {sublabel && (
        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${cfg.badge}`}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

/* ── Columna sección ─────────────────────────────────────────────── */
function SeccionCol({ cfg, ordenes, newIds }: {
  cfg: typeof SECCIONES[number];
  ordenes: OrdenLista[];
  newIds: Set<number>;
}) {
  return (
    <div
      className={`flex flex-col flex-1 min-w-0 rounded-3xl border ${cfg.border} overflow-hidden`}
      style={{
        background: `linear-gradient(160deg, rgba(255,255,255,.025) 0%, ${cfg.glow} 100%)`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: `0 0 40px 0 ${cfg.glow}`,
      }}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${cfg.border}`}
        style={{ background: "rgba(0,0,0,.15)" }}>
        <cfg.Icon size={22} className={cfg.title} />
        <h2 className={`text-xl font-black uppercase tracking-widest ${cfg.title}`}>{cfg.label}</h2>
        <span className={`ml-auto text-sm font-black px-3 py-0.5 rounded-full border ${cfg.badge}`}>
          {ordenes.length}
        </span>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ordenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-20">
            <cfg.Icon size={48} className={cfg.title} />
            <p className="text-white text-sm font-bold">Sin órdenes listas</p>
          </div>
        ) : (
          ordenes.map(o => (
            <OrdenCard key={o.id} orden={o} cfg={cfg} isNew={newIds.has(o.id)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────── */
interface Props {
  sucursalId: number;
  sucursalNombre: string;
  initialData: OrdenLista[];
}

let socket: Socket | null = null;

export function LlamadorPublicoClient({ sucursalId, sucursalNombre, initialData }: Props) {
  const [ordenes, setOrdenes] = useState<OrdenLista[]>(initialData);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef<Set<number>>(new Set(initialData.map(o => o.id)));

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/llamador/publico?sucursalId=${sucursalId}`);
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
  }, [sucursalId]);

  /* Socket en tiempo real */
  useEffect(() => {
    if (!socket || socket.disconnected) {
      socket = ioClient({ path: "/api/socket/io", reconnectionAttempts: 10 });
    }
    socket.emit("kds:join", sucursalId);

    const handleUpdate = () => void fetchOrdenes();
    socket.on("pedido:nuevo", handleUpdate);
    socket.on("pedido:update", handleUpdate);
    return () => {
      socket?.off("pedido:nuevo", handleUpdate);
      socket?.off("pedido:update", handleUpdate);
    };
  }, [sucursalId, fetchOrdenes]);

  /* Polling de respaldo cada 30 s */
  useEffect(() => {
    const id = setInterval(() => void fetchOrdenes(), 30_000);
    return () => clearInterval(id);
  }, [fetchOrdenes]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }

  const porSeccion = {
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

        @keyframes newOrder {
          0%   { opacity: 0; transform: scale(.82) translateY(12px); }
          100% { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: .5; }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }

        html, body { height: 100%; overflow: hidden; }
      `}</style>

      <div
        style={{
          fontFamily: "'Outfit', system-ui, sans-serif",
          minHeight: "100vh",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #050d1a 0%, #080816 55%, #060f10 100%)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Glows ambientales */}
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {[
            { top: "-15%", left: "5%",  w: 700, h: 550, c: "rgba(245,158,11,.07)", d: "8s",  dd: "0s" },
            { top: "25%",  right: "3%", w: 550, h: 450, c: "rgba(139,92,246,.07)", d: "11s", dd: "3s" },
            { bottom: "5%",left: "32%", w: 650, h: 400, c: "rgba(6,182,212,.06)",  d: "9s",  dd: "6s" },
          ].map((g, i) => (
            <div key={i} style={{
              position: "absolute",
              top: g.top, left: (g as {left?: string}).left, right: (g as {right?: string}).right, bottom: (g as {bottom?: string}).bottom,
              width: g.w, height: g.h,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${g.c} 0%, transparent 72%)`,
              filter: "blur(90px)",
              animation: `ambientPulse ${g.d} ease-in-out infinite`,
              animationDelay: g.dd,
            }} />
          ))}
        </div>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="PandaPOS" style={{ width: 38, height: 38, objectFit: "contain" }} />
            <div>
              <p style={{ color: "white", fontWeight: 900, fontSize: 22, lineHeight: 1, letterSpacing: "-.02em" }}>
                {sucursalNombre}
              </p>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: ".1em", marginTop: 3 }}>
                Órdenes listas para retirar
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {total > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 16px", borderRadius: 999,
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
                  animation: "ambientPulse 1.5s ease-in-out infinite" }} />
                <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
                  {total} lista{total !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <Reloj />

            <button
              onClick={() => void fetchOrdenes()}
              disabled={loading}
              title="Actualizar"
              style={{
                background: "none", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
                padding: 8, cursor: "pointer", color: "rgba(255,255,255,.4)",
                transition: "all .18s", display: "flex",
              }}
            >
              <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>

            <button
              onClick={toggleFullscreen}
              title="Pantalla completa"
              style={{
                background: "none", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
                padding: 8, cursor: "pointer", color: "rgba(255,255,255,.4)",
                transition: "all .18s", display: "flex",
              }}
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </header>

        {/* ── COLUMNAS ────────────────────────────────────────────── */}
        <main style={{
          position: "relative", zIndex: 10,
          display: "flex", flex: 1, gap: 16, padding: 16,
          overflow: "hidden",
        }}>
          {SECCIONES.map(cfg => (
            <SeccionCol
              key={cfg.key}
              cfg={cfg}
              ordenes={porSeccion[cfg.key]}
              newIds={newIds}
            />
          ))}
        </main>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{
          position: "relative", zIndex: 10,
          textAlign: "center", padding: "8px 0", flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,.04)",
        }}>
          <p style={{ color: "rgba(255,255,255,.12)", fontSize: 11,
            fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>
            PandaPOS · Llamador de órdenes
          </p>
        </footer>
      </div>
    </>
  );
}
