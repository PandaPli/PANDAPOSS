"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import type { VisorMsg } from "@/lib/visorBus";

type VisorState = "idle" | "cart" | "success";

interface CartMsg {
  type: "cart";
  items: {
    id: number;
    tipo: string;
    nombre: string;
    precio: number;
    cantidad: number;
    observacion?: string | null;
  }[];
  subtotal: number;
  descuento: number;
  totalDescuento: number;
  ivaPorc: number;
  totalIva: number;
  total: number;
  simbolo: string;
  sucursalNombre?: string;
}

interface SuccessMsg {
  type: "success";
  total: number;
  simbolo: string;
  sucursalNombre?: string;
}

interface LastItem {
  nombre: string;
  cantidad: number;
  precio: number;
  simbolo: string;
}

export default function VisorClient({
  cajaId,
  logoUrl,
  sucursalNombreInit = "",
}: {
  cajaId: number;
  logoUrl?: string | null;
  sucursalNombreInit?: string;
}) {
  const [visorState, setVisorState]     = useState<VisorState>("idle");
  const [cartData, setCartData]         = useState<CartMsg | null>(null);
  const [successData, setSuccessData]   = useState<SuccessMsg | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState(sucursalNombreInit);
  const [clock, setClock]               = useState("");
  const [connected, setConnected]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastItem, setLastItem]         = useState<LastItem | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const lastItemTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevItemsRef                    = useRef<CartMsg["items"]>([]);
  // Proteger la pantalla de éxito: ignorar "idle" mientras successTimer está activo
  const inSuccessRef                    = useRef(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Reloj en tiempo real
  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // SSE — conexión al stream de la caja
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let successTimer: ReturnType<typeof setTimeout> | null = null;
    // Timeout de vida: si no llega ningún mensaje en 35s → reconectar
    // (detecta conexiones silenciosamente muertas en mobile)
    let aliveTimeout: ReturnType<typeof setTimeout> | null = null;

    function resetAliveTimeout() {
      if (aliveTimeout) clearTimeout(aliveTimeout);
      aliveTimeout = setTimeout(() => {
        // Sin mensajes en 35s — forzar reconexión
        es?.close();
        connect();
      }, 35_000);
    }

    function connect() {
      es = new EventSource(`/api/visor/stream?c=${cajaId}`);

      es.onopen = () => {
        setConnected(true);
        resetAliveTimeout();
      };

      es.onmessage = (e) => {
        resetAliveTimeout(); // cualquier mensaje reinicia el watchdog
        try {
          const msg: VisorMsg & { type: string } = JSON.parse(e.data);
          // Ignorar heartbeats — solo sirven para resetear el watchdog
          if (msg.type === "heartbeat") return;
          if ("sucursalNombre" in msg && msg.sucursalNombre) {
            setSucursalNombre(msg.sucursalNombre as string);
          }
          if (msg.type === "idle") {
            // Si estamos mostrando la pantalla de éxito, ignorar "idle"
            // (evita que el siguiente useEffect del carrito vacío tape el total)
            if (inSuccessRef.current) return;
            if (successTimer) { clearTimeout(successTimer); successTimer = null; }
            prevItemsRef.current = [];
            setLastItem(null);
            setVisorState("idle");
            setCartData(null);
            setSuccessData(null);
          } else if (msg.type === "cart") {
            // Cancelar el timer de success: el nuevo pedido tiene prioridad
            inSuccessRef.current = false;
            if (successTimer) { clearTimeout(successTimer); successTimer = null; }

            // Detectar el último ítem agregado/modificado
            const incoming = (msg as CartMsg).items;
            const prev = prevItemsRef.current;
            let detected: LastItem | null = null;

            // Buscar ítem nuevo o con cantidad aumentada
            for (let i = incoming.length - 1; i >= 0; i--) {
              const cur = incoming[i];
              const old = prev.find((p) => p.id === cur.id && p.tipo === cur.tipo);
              if (!old || cur.cantidad > old.cantidad) {
                detected = {
                  nombre:   cur.nombre,
                  cantidad: cur.cantidad,
                  precio:   cur.precio,
                  simbolo:  (msg as CartMsg).simbolo,
                };
                break;
              }
            }
            prevItemsRef.current = incoming;

            if (detected) {
              setToastVisible(false);
              setLastItem(detected);
              requestAnimationFrame(() => setToastVisible(true));
              if (lastItemTimerRef.current) clearTimeout(lastItemTimerRef.current);
              lastItemTimerRef.current = setTimeout(() => {
                setToastVisible(false);
                setTimeout(() => { setLastItem(null); }, 300);
                lastItemTimerRef.current = null;
              }, 3000);
            }

            setCartData(msg as CartMsg);
            setVisorState("cart");
          } else if (msg.type === "success") {
            if (successTimer) clearTimeout(successTimer);
            prevItemsRef.current = []; // limpiar para el próximo pedido
            inSuccessRef.current = true;
            setSuccessData(msg as SuccessMsg);
            setVisorState("success");
            successTimer = setTimeout(() => {
              successTimer = null;
              inSuccessRef.current = false;
              setVisorState("idle");
              setSuccessData(null);
            }, 7000);
          }
        } catch { /* ignorar JSON malformado */ }
      };

      es.onerror = () => {
        setConnected(false);
        if (aliveTimeout) { clearTimeout(aliveTimeout); aliveTimeout = null; }
        es.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      if (successTimer) clearTimeout(successTimer);
      if (aliveTimeout) clearTimeout(aliveTimeout);
      if (lastItemTimerRef.current) clearTimeout(lastItemTimerRef.current);
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [cajaId]);

  // ── Render ───────────────────────────────────────────────────────────────
  let screen: React.ReactNode;
  if (visorState === "success" && successData) {
    screen = <SuccessScreen data={successData} />;
  } else if (visorState === "cart" && cartData) {
    screen = <CartScreen data={cartData} sucursalNombre={sucursalNombre} />;
  } else {
    screen = (
      <IdleScreen
        clock={clock}
        sucursalNombre={sucursalNombre}
        connected={connected}
        logoUrl={logoUrl ?? null}
      />
    );
  }

  return (
    <div className="relative">
      {screen}

      {/* Toast último producto agregado — centro inferior */}
      {lastItem && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl border border-white/15 bg-[#1e293b]/95 backdrop-blur-md px-6 py-4 shadow-2xl min-w-[320px] max-w-[90vw]"
          style={{
            transition: "opacity 250ms ease, transform 250ms ease",
            opacity: toastVisible ? 1 : 0,
            transform: toastVisible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(16px)",
          }}
        >
          {/* Badge "Agregado" */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 text-2xl font-black">
            +
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-0.5">Agregado</span>
            <span className="text-white font-bold text-lg leading-tight break-words">
              {lastItem.cantidad > 1 && (
                <span className="mr-1.5 text-blue-400 font-black">{lastItem.cantidad}×</span>
              )}
              {lastItem.nombre}
            </span>
            <span className="text-blue-300 text-sm tabular-nums font-semibold mt-0.5">
              {formatCurrency(lastItem.precio * lastItem.cantidad, lastItem.simbolo)}
            </span>
          </div>
        </div>
      )}

      {/* Botón pantalla completa — esquina superior derecha */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        className="fixed top-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/40 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:text-white/80 transition-all active:scale-95"
      >
        {isFullscreen ? (
          // Minimizar
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
        ) : (
          // Expandir
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Idle ─────────────────────────────────────────────────────────────────────

function IdleScreen({
  clock,
  sucursalNombre,
  connected,
  logoUrl,
}: {
  clock: string;
  sucursalNombre: string;
  connected: boolean;
  logoUrl: string | null;
}) {
  return (
    <div className="flex h-screen w-screen bg-[#0f172a] select-none overflow-hidden">
      {/* Fondos de luz ambiental */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-40 h-[600px] w-[600px] rounded-full bg-blue-700/10 blur-[140px]" />
        <div className="absolute -bottom-60 -right-40 h-[600px] w-[600px] rounded-full bg-purple-700/10 blur-[140px]" />
      </div>

      {/* ── Mitad izquierda: LOGO ── */}
      <div className="relative z-10 flex w-1/2 items-center justify-center border-r border-white/8">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={sucursalNombre || "Logo"}
            className="max-h-[55vh] max-w-[80%] object-contain drop-shadow-2xl"
          />
        ) : (
          /* Placeholder si no hay logo: iniciales del nombre */
          <div className="flex h-56 w-56 items-center justify-center rounded-[2.5rem] bg-white/8 border border-white/12 shadow-2xl">
            <span className="text-7xl font-black text-white/60 tracking-tight select-none">
              {sucursalNombre ? sucursalNombre.slice(0, 2).toUpperCase() : "PO"}
            </span>
          </div>
        )}
      </div>

      {/* ── Mitad derecha: BIENVENIDO + HORA ── */}
      <div className="relative z-10 flex w-1/2 flex-col items-center justify-center gap-8 px-10 text-center">
        {sucursalNombre && (
          <p className="text-2xl font-semibold text-white/40 tracking-widest uppercase">
            {sucursalNombre}
          </p>
        )}

        <div className="space-y-3">
          <h1 className="text-7xl font-black text-white tracking-tight leading-none">
            ¡Bienvenido!
          </h1>
          <p className="text-xl text-white/35 font-medium">
            En un momento atendemos tu pedido
          </p>
        </div>

        {clock && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-10 py-5 mt-2">
            <span className="text-6xl font-black text-white/75 tabular-nums tracking-widest">
              {clock}
            </span>
          </div>
        )}
      </div>

      {/* Indicador de conexión */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
        <span className="text-xs text-white/20 font-medium tracking-widest uppercase">
          {connected ? "PandaPOS" : "Conectando…"}
        </span>
      </div>
    </div>
  );
}

// ── Cart ─────────────────────────────────────────────────────────────────────

function CartScreen({ data, sucursalNombre }: { data: CartMsg; sucursalNombre: string }) {
  const showDescuento = data.descuento > 0 && data.totalDescuento > 0;
  const showIva       = data.ivaPorc > 0 && data.totalIva > 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f172a] select-none overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <span className="text-lg font-bold text-white/70">{sucursalNombre || "Tu pedido"}</span>
        </div>
        <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-4 py-1.5 text-sm font-bold text-blue-400">
          {data.items.length} {data.items.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {[...data.items].reverse().map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/5 px-5 py-4"
          >
            {/* Cantidad */}
            <span className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-sm font-black text-blue-400 mt-0.5">
              {item.cantidad}x
            </span>

            {/* Nombre + observación — crece y hace wrap */}
            <div className="flex-1">
              <p className="text-white font-semibold text-base leading-snug break-words">
                {item.nombre}
              </p>
              {item.observacion && (
                <p className="text-white/40 text-xs mt-0.5 break-words">{item.observacion}</p>
              )}
            </div>

            {/* Precio — siempre visible a la derecha */}
            <span className="flex-shrink-0 text-white font-bold text-base tabular-nums text-right mt-0.5">
              {formatCurrency(item.precio * item.cantidad, data.simbolo)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-white/10 bg-[#0d1117] px-6 py-5">
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-white/50 text-sm">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(data.subtotal, data.simbolo)}</span>
          </div>
          {showDescuento && (
            <div className="flex justify-between text-emerald-400 text-sm">
              <span>Descuento ({data.descuento}%)</span>
              <span className="tabular-nums">−{formatCurrency(data.totalDescuento, data.simbolo)}</span>
            </div>
          )}
          {showIva && (
            <div className="flex justify-between text-white/50 text-sm">
              <span>IVA ({data.ivaPorc}%)</span>
              <span className="tabular-nums">+{formatCurrency(data.totalIva, data.simbolo)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-blue-600/20 border border-blue-500/30 px-6 py-4">
          <span className="text-xl font-bold text-white">TOTAL</span>
          <span className="text-4xl font-black text-white tabular-nums">
            {formatCurrency(data.total, data.simbolo)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Success ───────────────────────────────────────────────────────────────────

function SuccessScreen({ data }: { data: SuccessMsg }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-[#0f172a] select-none overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500/20 border-4 border-emerald-400/60 animate-pulse">
          <svg className="h-16 w-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-3">
          <p className="text-emerald-400 font-black text-2xl uppercase tracking-[0.25em]">¡Gracias por su compra!</p>
          <h1 className="text-7xl font-black text-white tabular-nums">{formatCurrency(data.total, data.simbolo)}</h1>
          <p className="text-white/40 text-lg font-medium">Pago recibido correctamente</p>
        </div>
        {data.sucursalNombre && (
          <p className="text-white/25 text-base font-medium">{data.sucursalNombre}</p>
        )}
      </div>
      <p className="absolute bottom-6 text-xs text-white/15 font-medium tracking-widest uppercase">PandaPOS</p>
    </div>
  );
}
