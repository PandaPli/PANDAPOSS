"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";
import { Bike, ChefHat, Maximize2, Monitor, RefreshCw, UtensilsCrossed, CheckCircle2 } from "lucide-react";

/* ── Tipos ───────────────────────────────────────────────────────── */
interface Orden {
  id: number;
  numero: number;
  tipo: string;
  estado: string;
  observacion: string | null;
  listoEn: string | null;
  mesa: { nombre: string } | null;
  delivery: { zonaDelivery: string | null } | null;
}

type Seccion = "COCINA" | "KIOSKO" | "DELIVERY";

function detectarSeccion(o: Orden): Seccion {
  if (o.tipo === "DELIVERY") return "DELIVERY";
  if (o.observacion?.includes("KIOSKO")) return "KIOSKO";
  return "COCINA";
}

/**
 * Extrae el primer nombre del cliente desde el campo observacion.
 * Soporta tres formatos:
 *   1. [DELIVERY]{...json con clienteNombre...}  (pedidos delivery)
 *   2. "... · 👤 Nombre · ..."                   (pedidos kiosko)
 *   3. "... Cliente: Nombre ..."                  (chatbot WhatsApp / otros)
 */
function extractNombre(o: Orden): string | null {
  const obs = o.observacion;
  if (!obs) return null;

  // 1. Delivery: JSON embebido
  if (obs.startsWith("[DELIVERY]")) {
    try {
      const data = JSON.parse(obs.replace("[DELIVERY]", "")) as { clienteNombre?: string };
      if (data.clienteNombre) {
        const primero = data.clienteNombre.trim().split(/\s+/)[0];
        return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
      }
    } catch { /* ignore */ }
  }

  // 2. Kiosko: "👤 NombreCliente"
  const matchEmoji = obs.match(/👤\s*([^·\n|]+)/);
  if (matchEmoji) {
    const primero = matchEmoji[1].trim().split(/\s+/)[0];
    return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
  }

  // 3. WhatsApp / otros: "Cliente: Nombre"
  const matchCliente = obs.match(/Cliente:\s*([^,\n|]+)/i);
  if (matchCliente) {
    const primero = matchCliente[1].replace(/\(.*?\)/, "").trim().split(/\s+/)[0];
    return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
  }

  return null;
}

/* ── Secciones ───────────────────────────────────────────────────── */
const SECCIONES: {
  key: Seccion;
  label: string;
  Icon: React.ElementType;
  border: string;
  badge: string;
  titleCls: string;
  glow: string;
}[] = [
  { key: "COCINA",   label: "Cocina",   Icon: UtensilsCrossed, border: "border-amber-500/40",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",  titleCls: "text-amber-300",  glow: "rgba(245,158,11,.08)"  },
  { key: "KIOSKO",   label: "Kiosko",   Icon: Monitor,         border: "border-violet-500/40", badge: "bg-violet-500/20 text-violet-300 border-violet-500/40", titleCls: "text-violet-300", glow: "rgba(139,92,246,.08)"  },
  { key: "DELIVERY", label: "Delivery", Icon: Bike,            border: "border-cyan-500/40",   badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",       titleCls: "text-cyan-300",   glow: "rgba(6,182,212,.08)"   },
];

/* ── Tarjeta de orden ────────────────────────────────────────────── */
function OrdenCard({ orden, isNew }: { orden: Orden; isNew: boolean }) {
  const esListo = orden.estado === "LISTO";
  const esRetiro = orden.delivery?.zonaDelivery && /retiro/i.test(orden.delivery.zonaDelivery);
  const nombre = extractNombre(orden);
  const numOrden = orden.numero || orden.id;

  // Sublabel: mesa > zona delivery > nada
  const sublabel = orden.mesa?.nombre
    ? orden.mesa.nombre
    : orden.tipo === "DELIVERY"
    ? (esRetiro ? "Retiro" : "Delivery")
    : null;

  const colorPrimario = esListo ? "#86efac" : "rgba(255,255,255,.85)";
  const colorSecundario = esListo ? "rgba(134,239,172,.5)" : "rgba(255,255,255,.35)";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        border: esListo ? "2px solid rgba(34,197,94,.5)" : "1.5px solid rgba(255,255,255,.08)",
        background: esListo
          ? "linear-gradient(135deg, rgba(34,197,94,.12) 0%, rgba(16,185,129,.08) 100%)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "18px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        boxShadow: esListo ? "0 0 24px rgba(34,197,94,.2)" : "none",
        animation: isNew ? "newOrder .55s cubic-bezier(.34,1.56,.64,1) both" : undefined,
      }}
    >
      {/* Badge estado */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
        textTransform: "uppercase", letterSpacing: ".08em",
        background: esListo ? "rgba(34,197,94,.2)" : "rgba(245,158,11,.15)",
        border: esListo ? "1px solid rgba(34,197,94,.4)" : "1px solid rgba(245,158,11,.3)",
        color: esListo ? "#4ade80" : "#fbbf24",
      }}>
        {esListo
          ? <><CheckCircle2 size={10} /> ¡Listo!</>
          : <><ChefHat size={10} /> Preparando</>
        }
      </div>

      {nombre ? (
        /* Con nombre: nombre grande + número secundario */
        <>
          <p style={{
            fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em",
            fontSize: "clamp(1.9rem, 3.8vw, 3.4rem)",
            color: colorPrimario,
            textAlign: "center",
            wordBreak: "break-word",
          }}>
            {nombre}
          </p>
          <p style={{
            fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em",
            fontVariantNumeric: "tabular-nums",
            fontSize: "clamp(1rem, 1.8vw, 1.5rem)",
            color: colorSecundario,
          }}>
            #{numOrden}
          </p>
        </>
      ) : (
        /* Sin nombre: número grande solo */
        <p style={{
          fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
          fontSize: "clamp(2.8rem, 5.2vw, 5rem)",
          color: colorPrimario,
        }}>
          #{numOrden}
        </p>
      )}

      {/* Sublabel (mesa/zona) */}
      {sublabel && (
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
          padding: "2px 10px", borderRadius: 999,
          background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.5)",
        }}>
          {sublabel}
        </span>
      )}

      {/* Punto pulsante si es nuevo */}
      {isNew && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 10, height: 10, borderRadius: "50%",
          background: esListo ? "#4ade80" : "#fbbf24",
          animation: "pingDot 1s ease-in-out infinite",
        }} />
      )}
    </div>
  );
}

/* ── Columna de sección ──────────────────────────────────────────── */
function SeccionCol({ cfg, ordenes, newIds }: {
  cfg: typeof SECCIONES[number];
  ordenes: Orden[];
  newIds: Set<number>;
}) {
  const listos = ordenes.filter(o => o.estado === "LISTO").length;

  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1, minWidth: 0,
      borderRadius: 24, border: `1px solid ${cfg.border.replace("border-", "").replace("/40", "")}`,
      borderColor: cfg.border.includes("amber") ? "rgba(245,158,11,.3)"
        : cfg.border.includes("violet") ? "rgba(139,92,246,.3)"
        : "rgba(6,182,212,.3)",
      overflow: "hidden",
      background: `linear-gradient(160deg, rgba(255,255,255,.025) 0%, ${cfg.glow} 100%)`,
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        background: "rgba(0,0,0,.15)",
      }}>
        <cfg.Icon size={20} style={{ color: cfg.titleCls.includes("amber") ? "#fbbf24" : cfg.titleCls.includes("violet") ? "#a78bfa" : "#67e8f9", flexShrink: 0 }} />
        <h2 style={{ color: cfg.titleCls.includes("amber") ? "#fbbf24" : cfg.titleCls.includes("violet") ? "#a78bfa" : "#67e8f9",
          fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: ".1em", flex: 1 }}>
          {cfg.label}
        </h2>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {listos > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
              background: "rgba(34,197,94,.2)", border: "1px solid rgba(34,197,94,.4)", color: "#4ade80",
            }}>
              {listos} listo{listos !== 1 ? "s" : ""}
            </span>
          )}
          <span style={{
            fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 999,
            background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.5)",
          }}>
            {ordenes.length}
          </span>
        </div>
      </div>

      {/* Órdenes */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {ordenes.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: 160, gap: 12, opacity: .18 }}>
            <cfg.Icon size={44} style={{ color: "white" }} />
            <p style={{ color: "white", fontSize: 13, fontWeight: 700 }}>Sin pedidos activos</p>
          </div>
        ) : (
          // LISTO primero, luego EN_PROCESO
          [...ordenes].sort((a, b) => {
            if (a.estado === "LISTO" && b.estado !== "LISTO") return -1;
            if (b.estado === "LISTO" && a.estado !== "LISTO") return 1;
            return 0;
          }).map(o => (
            <OrdenCard key={o.id} orden={o} isNew={newIds.has(o.id)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Reloj ───────────────────────────────────────────────────────── */
function Reloj() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,.45)", letterSpacing: ".04em" }}>{time}</span>;
}

/* ── Componente principal ────────────────────────────────────────── */
interface Props {
  sucursalId: number;
  sucursalNombre: string;
  initialData: Orden[];
}

let socket: Socket | null = null;

export function LlamadorPublicoClient({ sucursalId, sucursalNombre, initialData }: Props) {
  const [ordenes, setOrdenes] = useState<Orden[]>(initialData);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef<Set<number>>(new Set(initialData.map(o => o.id)));

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/llamador/publico?sucursalId=${sucursalId}`);
      if (!res.ok) return;
      const data: Orden[] = await res.json();

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

  /* Socket tiempo real */
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

  /* Polling cada 20 s */
  useEffect(() => {
    const id = setInterval(() => void fetchOrdenes(), 20_000);
    return () => clearInterval(id);
  }, [fetchOrdenes]);

  const porSeccion = {
    COCINA:   ordenes.filter(o => detectarSeccion(o) === "COCINA"),
    KIOSKO:   ordenes.filter(o => detectarSeccion(o) === "KIOSKO"),
    DELIVERY: ordenes.filter(o => detectarSeccion(o) === "DELIVERY"),
  };

  const totalListos = ordenes.filter(o => o.estado === "LISTO").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        @keyframes newOrder {
          0%   { opacity: 0; transform: scale(.82) translateY(14px); }
          100% { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes pingDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: .6; }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: .45; }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }
      `}</style>

      <div style={{
        fontFamily: "'Outfit', system-ui, sans-serif",
        height: "100vh", display: "flex", flexDirection: "column",
        background: "linear-gradient(160deg, #060d1c 0%, #080816 55%, #05100e 100%)",
        overflow: "hidden", position: "relative",
      }}>

        {/* Glows ambientales */}
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {([
            { t:"-15%", l:"5%",  w:700, h:550, c:"rgba(245,158,11,.06)", d:"8s",  dd:"0s"  },
            { t:"25%",  r:"3%",  w:550, h:450, c:"rgba(139,92,246,.06)", d:"11s", dd:"3s"  },
            { b:"5%",   l:"30%", w:650, h:400, c:"rgba(6,182,212,.05)",  d:"9s",  dd:"6s"  },
          ] as {t?:string;b?:string;l?:string;r?:string;w:number;h:number;c:string;d:string;dd:string}[]).map((g, i) => (
            <div key={i} style={{
              position:"absolute", top:g.t, bottom:g.b, left:g.l, right:g.r,
              width:g.w, height:g.h, borderRadius:"50%",
              background:`radial-gradient(ellipse, ${g.c} 0%, transparent 72%)`,
              filter:"blur(90px)",
              animation:`ambientPulse ${g.d} ease-in-out infinite`,
              animationDelay:g.dd,
            }} />
          ))}
        </div>

        {/* HEADER */}
        <header style={{
          position:"relative", zIndex:10, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 24px",
          borderBottom:"1px solid rgba(255,255,255,.06)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <img src="/logo.png" alt="PandaPOS" style={{ width:36, height:36, objectFit:"contain" }} />
            <div>
              <p style={{ color:"white", fontWeight:900, fontSize:20, lineHeight:1, letterSpacing:"-.02em" }}>
                {sucursalNombre}
              </p>
              <p style={{ color:"rgba(255,255,255,.3)", fontSize:10, fontWeight:600,
                textTransform:"uppercase", letterSpacing:".1em", marginTop:3 }}>
                Estado de pedidos en tiempo real
              </p>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {totalListos > 0 && (
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"6px 16px", borderRadius:999,
                background:"rgba(34,197,94,.12)", border:"1px solid rgba(34,197,94,.3)",
              }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#4ade80",
                  animation:"pingDot 1.5s ease-in-out infinite" }} />
                <span style={{ color:"#4ade80", fontWeight:800, fontSize:13 }}>
                  {totalListos} listo{totalListos !== 1 ? "s" : ""} para retirar
                </span>
              </div>
            )}
            <Reloj />
            <button onClick={() => void fetchOrdenes()} disabled={loading}
              style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:10,
                padding:8, cursor:"pointer", color:"rgba(255,255,255,.4)", display:"flex" }}>
              <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button onClick={() => document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen()}
              style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:10,
                padding:8, cursor:"pointer", color:"rgba(255,255,255,.4)", display:"flex" }}>
              <Maximize2 size={16} />
            </button>
          </div>
        </header>

        {/* COLUMNAS */}
        <main style={{
          position:"relative", zIndex:10,
          display:"flex", flex:1, gap:12, padding:12,
          overflow:"hidden",
        }}>
          {SECCIONES.map(cfg => (
            <SeccionCol key={cfg.key} cfg={cfg} ordenes={porSeccion[cfg.key]} newIds={newIds} />
          ))}
        </main>

        {/* FOOTER */}
        <footer style={{
          position:"relative", zIndex:10, flexShrink:0,
          textAlign:"center", padding:"6px 0",
          borderTop:"1px solid rgba(255,255,255,.04)",
        }}>
          <p style={{ color:"rgba(255,255,255,.1)", fontSize:10, fontWeight:600,
            textTransform:"uppercase", letterSpacing:".1em" }}>
            PandaPOS · Llamador de órdenes
          </p>
        </footer>
      </div>
    </>
  );
}
