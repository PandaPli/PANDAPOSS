"use client";

import { useEffect, useState } from "react";
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

export default function VisorClient({ sucursalId }: { sucursalId: number }) {
  const [visorState, setVisorState] = useState<VisorState>("idle");
  const [cartData, setCartData]     = useState<CartMsg | null>(null);
  const [successData, setSuccessData] = useState<SuccessMsg | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [clock, setClock] = useState("");
  const [connected, setConnected] = useState(false);

  // Reloj en tiempo real
  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // SSE — escucha actualizaciones del servidor
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource(`/api/visor/stream?s=${sucursalId}`);

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const msg: VisorMsg = JSON.parse(e.data);
          if (msg.sucursalNombre) setSucursalNombre(msg.sucursalNombre);

          if (msg.type === "idle") {
            setVisorState("idle");
            setCartData(null);
            setSuccessData(null);
          } else if (msg.type === "cart") {
            setCartData(msg as CartMsg);
            setVisorState("cart");
          } else if (msg.type === "success") {
            setSuccessData(msg as SuccessMsg);
            setVisorState("success");
            setTimeout(() => {
              setVisorState("idle");
              setSuccessData(null);
            }, 7000);
          }
        } catch {
          /* JSON malformado — ignorar */
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconectar tras 3 segundos
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [sucursalId]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (visorState === "success" && successData) {
    return <SuccessScreen data={successData} />;
  }
  if (visorState === "cart" && cartData) {
    return <CartScreen data={cartData} sucursalNombre={sucursalNombre} />;
  }
  return <IdleScreen clock={clock} sucursalNombre={sucursalNombre} connected={connected} />;
}

// ── Idle ─────────────────────────────────────────────────────────────────────

function IdleScreen({
  clock,
  sucursalNombre,
  connected,
}: {
  clock: string;
  sucursalNombre: string;
  connected: boolean;
}) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-[#0f172a] select-none overflow-hidden">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600/20 border border-blue-500/30 text-5xl">
          🐼
        </div>

        {sucursalNombre && (
          <p className="text-2xl font-bold text-white/70 tracking-wide">{sucursalNombre}</p>
        )}

        <h1 className="text-6xl font-black text-white tracking-tight leading-tight">
          ¡Bienvenido!
        </h1>

        <p className="text-xl text-white/40 font-medium">
          En un momento atendemos tu pedido
        </p>

        {clock && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-4">
            <span className="text-5xl font-black text-white/70 tabular-nums tracking-widest">
              {clock}
            </span>
          </div>
        )}
      </div>

      {/* Indicador de conexión */}
      <div className="absolute bottom-6 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
        />
        <span className="text-xs text-white/20 font-medium tracking-widest uppercase">
          {connected ? "PandaPOS" : "Conectando…"}
        </span>
      </div>
    </div>
  );
}

// ── Cart ─────────────────────────────────────────────────────────────────────

function CartScreen({
  data,
  sucursalNombre,
}: {
  data: CartMsg;
  sucursalNombre: string;
}) {
  const showDescuento = data.descuento > 0 && data.totalDescuento > 0;
  const showIva       = data.ivaPorc > 0 && data.totalIva > 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f172a] select-none overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <span className="text-lg font-bold text-white/70">
            {sucursalNombre || "Tu pedido"}
          </span>
        </div>
        <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-4 py-1.5 text-sm font-bold text-blue-400">
          {data.items.length} {data.items.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {data.items.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-5 py-4 gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-sm font-black text-blue-400">
                {item.cantidad}x
              </span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-base truncate">{item.nombre}</p>
                {item.observacion && (
                  <p className="text-white/40 text-xs truncate">{item.observacion}</p>
                )}
              </div>
            </div>
            <span className="flex-shrink-0 text-white font-bold text-base tabular-nums">
              {formatCurrency(item.precio * item.cantidad, data.simbolo)}
            </span>
          </div>
        ))}
      </div>

      {/* Totales */}
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
          <p className="text-emerald-400 font-black text-2xl uppercase tracking-[0.25em]">
            ¡Gracias por su compra!
          </p>
          <h1 className="text-7xl font-black text-white tabular-nums">
            {formatCurrency(data.total, data.simbolo)}
          </h1>
          <p className="text-white/40 text-lg font-medium">Pago recibido correctamente</p>
        </div>

        {data.sucursalNombre && (
          <p className="text-white/25 text-base font-medium">{data.sucursalNombre}</p>
        )}
      </div>

      <p className="absolute bottom-6 text-xs text-white/15 font-medium tracking-widest uppercase">
        PandaPOS
      </p>
    </div>
  );
}
