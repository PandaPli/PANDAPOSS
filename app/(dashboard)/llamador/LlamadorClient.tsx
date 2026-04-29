"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useKdsSocket } from "@/hooks/useKdsSocket";
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

/* ── Configuración de secciones ─────────────────────────────────── */
const SECCIONES: {
  key: Seccion;
  label: string;
  emoji: string;
  Icon: React.ElementType;
  border: string;
  glow: string;
  badge: string;
  title: string;
  num: string;
  bg: string;
  cardBorder: string;
  cardGlow: string;
  dot: string;
}[] = [
  {
    key: "COCINA",
    label: "Cocina",
    emoji: "🍳",
    Icon: UtensilsCrossed,
    border: "border-amber-500/40",
    glow: "shadow-amber-500/20",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    title: "text-amber-300",
    num: "text-amber-100",
    bg: "bg-amber-500/8",
    cardBorder: "border-amber-500/30",
    cardGlow: "shadow-amber-500/15",
    dot: "bg-amber-400",
  },
  {
    key: "KIOSKO",
    label: "Kiosko",
    emoji: "📱",
    Icon: Monitor,
    border: "border-violet-500/40",
    glow: "shadow-violet-500/20",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    title: "text-violet-300",
    num: "text-violet-100",
    bg: "bg-violet-500/8",
    cardBorder: "border-violet-500/30",
    cardGlow: "shadow-violet-500/15",
    dot: "bg-violet-400",
  },
  {
    key: "DELIVERY",
    label: "Delivery",
    emoji: "🚴",
    Icon: Bike,
    border: "border-cyan-500/40",
    glow: "shadow-cyan-500/20",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    title: "text-cyan-300",
    num: "text-cyan-100",
    bg: "bg-cyan-500/8",
    cardBorder: "border-cyan-500/30",
    cardGlow: "shadow-cyan-500/15",
    dot: "bg-cyan-400",
  },
];

/* ── Reloj ───────────────────────────────────────────────────────── */
function Reloj() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-2xl font-bold text-white/60 tabular-nums">{time}</span>;
}

/* ── Tarjeta de orden ────────────────────────────────────────────── */
function OrdenCard({ orden, cfg, isNew }: { orden: OrdenLista; cfg: typeof SECCIONES[0]; isNew: boolean }) {
  const label = orden.mesa?.nombre
    ? orden.mesa.nombre
    : orden.tipo === "DELIVERY"
    ? (orden.delivery?.zonaDelivery && /retiro/i.test(orden.delivery.zonaDelivery) ? "Retiro" : "Delivery")
    : null;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border p-5
        flex flex-col items-center justify-center gap-1
        transition-all duration-500
        ${cfg.cardBorder}
        shadow-lg ${cfg.cardGlow}
        ${isNew ? "animate-pulse-once ring-2 ring-white/30" : ""}
      `}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: isNew ? "newOrder 0.6s ease-out" : undefined,
      }}
    >
      {/* Punto pulsante si es nuevo */}
      {isNew && (
        <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${cfg.dot} animate-ping`} />
      )}

      {/* Número de orden — MUY GRANDE */}
      <p className={`font-black leading-none tabular-nums ${cfg.num}`}
        style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", letterSpacing: "-0.03em" }}>
        #{orden.numero}
      </p>

      {/* Etiqueta opcional (mesa / zona) */}
      {label && (
        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${cfg.badge}`}>
          {label}
        </span>
      )}
    </div>
  );
}

/* ── Columna de sección ──────────────────────────────────────────── */
function SeccionCol({ cfg, ordenes, newIds }: {
  cfg: typeof SECCIONES[0];
  ordenes: OrdenLista[];
  newIds: Set<number>;
}) {
  return (
    <div className={`flex flex-col flex-1 min-w-0 rounded-3xl border ${cfg.border} shadow-xl ${cfg.glow} overflow-hidden`}
      style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>

      {/* Header sección */}
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${cfg.border}`}
        style={{ background: "rgba(255,255,255,0.03)" }}>
        <cfg.Icon size={22} className={cfg.title} />
        <h2 className={`text-lg font-black uppercase tracking-widest ${cfg.title}`}>
          {cfg.label}
        </h2>
        <span className={`ml-auto text-sm font-black px-3 py-0.5 rounded-full border ${cfg.badge}`}>
          {ordenes.length}
        </span>
      </div>

      {/* Órdenes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {ordenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-20">
            <cfg.Icon size={40} className={cfg.title} />
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

      // Detectar IDs nuevos
      const dataIds = new Set(data.map(o => o.id));
      const nuevos = new Set<number>();
      for (const id of dataIds) {
        if (!prevIdsRef.current.has(id)) nuevos.add(id);
      }
      prevIdsRef.current = dataIds;

      setOrdenes(data);
      if (nuevos.size > 0) {
        setNewIds(nuevos);
        // Quitar el highlight después de 5 segundos
        setTimeout(() => setNewIds(prev => {
          const next = new Set(prev);
          nuevos.forEach(id => next.delete(id));
          return next;
        }), 5000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket en tiempo real
  useKdsSocket(sucursalId, fetchOrdenes);

  // Refresh automático cada 30s como fallback
  useEffect(() => {
    const id = setInterval(fetchOrdenes, 30_000);
    return () => clearInterval(id);
  }, [fetchOrdenes]);

  // Pantalla completa
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // Agrupar por sección
  const porSeccion = {
    COCINA:   ordenes.filter(o => detectarSeccion(o) === "COCINA"),
    KIOSKO:   ordenes.filter(o => detectarSeccion(o) === "KIOSKO"),
    DELIVERY: ordenes.filter(o => detectarSeccion(o) === "DELIVERY"),
  };

  const total = ordenes.length;

  return (
    <>
      {/* Animaciones CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes newOrder {
          0%   { transform: scale(0.88); opacity: 0; }
          60%  { transform: scale(1.04); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .llamador-root { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>

      <div
        className="llamador-root min-h-screen flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #050d1a 0%, #090818 50%, #060f10 100%)",
          position: "relative",
        }}
      >
        {/* Glow ambiental de fondo */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-10%", left: "10%", width: 600, height: 500,
            borderRadius: "50%", background: "radial-gradient(ellipse, rgba(245,158,11,.07) 0%, transparent 70%)",
            filter: "blur(80px)", animation: "glow-pulse 8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "20%", right: "5%", width: 500, height: 400,
            borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,.07) 0%, transparent 70%)",
            filter: "blur(80px)", animation: "glow-pulse 10s ease-in-out infinite", animationDelay: "3s" }} />
          <div style={{ position: "absolute", bottom: "10%", left: "30%", width: 600, height: 400,
            borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,.06) 0%, transparent 70%)",
            filter: "blur(80px)", animation: "glow-pulse 9s ease-in-out infinite", animationDelay: "6s" }} />
        </div>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Logo + nombre sucursal */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PandaPOS" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-white font-black text-xl leading-none" style={{ letterSpacing: "-.02em" }}>
                {sucursalNombre}
              </p>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mt-0.5">
                Órdenes listas para retirar
              </p>
            </div>
          </div>

          {/* Total + reloj + acciones */}
          <div className="flex items-center gap-5">
            {total > 0 && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-white font-black text-sm">{total} lista{total !== 1 ? "s" : ""}</span>
              </div>
            )}
            <Reloj />
            <button onClick={fetchOrdenes} disabled={loading} title="Actualizar"
              className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all disabled:opacity-30">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={toggleFullscreen} title="Pantalla completa"
              className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all">
              <Maximize2 size={18} />
            </button>
          </div>
        </header>

        {/* ── CUERPO: 3 columnas ──────────────────────────────────── */}
        <main className="relative z-10 flex flex-1 gap-4 p-5 overflow-hidden">
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
        <footer className="relative z-10 text-center py-2 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-white/15 text-xs font-semibold tracking-widest uppercase">
            PandaPOS · Llamador de órdenes
          </p>
        </footer>
      </div>
    </>
  );
}
