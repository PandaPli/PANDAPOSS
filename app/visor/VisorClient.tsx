"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

// ── Tipos de mensajes ────────────────────────────────────────────────────────

interface VisorCartMsg {
  type: "cart";
  items: CartItem[];
  subtotal: number;
  descuento: number;
  totalDescuento: number;
  ivaPorc: number;
  totalIva: number;
  total: number;
  simbolo: string;
  sucursalNombre?: string;
}

interface VisorSuccessMsg {
  type: "success";
  total: number;
  simbolo: string;
  sucursalNombre?: string;
}

interface VisorIdleMsg {
  type: "idle";
  sucursalNombre?: string;
}

type VisorMsg = VisorCartMsg | VisorSuccessMsg | VisorIdleMsg;
type VisorState = "idle" | "cart" | "success";

// ── Componente principal ─────────────────────────────────────────────────────

export default function VisorClient() {
  const [visorState, setVisorState] = useState<VisorState>("idle");
  const [cartData, setCartData] = useState<VisorCartMsg | null>(null);
  const [successData, setSuccessData] = useState<VisorSuccessMsg | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState<string>("");
  const [clock, setClock] = useState("");

  // Reloj en tiempo real
  useEffect(() => {
    function tick() {
      setClock(
        new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
      );
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // BroadcastChannel — escucha mensajes del POS
  useEffect(() => {
    if (typeof window === "undefined") return;
    const channel = new BroadcastChannel("pandapos-visor");

    channel.onmessage = (e: MessageEvent<VisorMsg>) => {
      const msg = e.data;

      if (msg.sucursalNombre) setSucursalNombre(msg.sucursalNombre);

      if (msg.type === "idle") {
        setVisorState("idle");
        setCartData(null);
        setSuccessData(null);
      } else if (msg.type === "cart") {
        setCartData(msg);
        setVisorState("cart");
      } else if (msg.type === "success") {
        setSuccessData(msg);
        setVisorState("success");
        // Volver a idle automáticamente tras 7 segundos
        setTimeout(() => {
          setVisorState("idle");
          setSuccessData(null);
        }, 7000);
      }
    };

    return () => channel.close();
  }, []);

  // ── Render según estado ──────────────────────────────────────────────────
  if (visorState === "success" && successData) {
    return <SuccessScreen data={successData} />;
  }
  if (visorState === "cart" && cartData) {
    return <CartScreen data={cartData} sucursalNombre={sucursalNombre} />;
  }
  return <IdleScreen clock={clock} sucursalNombre={sucursalNombre} />;
}

// ── Pantalla de espera ───────────────────────────────────────────────────────

function IdleScreen({ clock, sucursalNombre }: { clock: string; sucursalNombre: string }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-[#0f172a] select-none overflow-hidden">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
        {/* Logo / Icono */}
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-600/20 border border-brand-500/30 text-5xl">
          🐼
        </div>

        {sucursalNombre && (
          <p className="text-2xl font-bold text-white/80 tracking-wide">
            {sucursalNombre}
          </p>
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

      {/* Marca inferior */}
      <p className="absolute bottom-6 text-xs text-white/15 font-medium tracking-widest uppercase">
        PandaPOS
      </p>
    </div>
  );
}

// ── Pantalla de carrito activo ───────────────────────────────────────────────

function CartScreen({ data, sucursalNombre }: { data: VisorCartMsg; sucursalNombre: string }) {
  const activeItems = data.items.filter((i) => !i.cancelado && !i.pagado);
  const showDescuento = data.descuento > 0 && data.totalDescuento > 0;
  const showIva = data.ivaPorc > 0 && data.totalIva > 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f172a] select-none overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <span className="text-lg font-bold text-white/80">
            {sucursalNombre || "Tu pedido"}
          </span>
        </div>
        <span className="rounded-full bg-brand-600/20 border border-brand-500/30 px-4 py-1.5 text-sm font-bold text-brand-400">
          {activeItems.length} {activeItems.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      {/* Lista de ítems */}
      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-2">
        {activeItems.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-white/30 text-xl font-medium">Carrito vacío</p>
          </div>
        ) : (
          activeItems.map((item, idx) => (
            <div
              key={`${item.id}-${item.tipo}-${idx}`}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-6 py-4 gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20 text-sm font-black text-brand-400">
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
          ))
        )}
      </div>

      {/* Panel de totales */}
      <div className="flex-shrink-0 border-t border-white/10 bg-[#0d1117] px-8 py-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-white/50 text-sm">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(data.subtotal, data.simbolo)}</span>
          </div>

          {showDescuento && (
            <div className="flex justify-between text-emerald-400 text-sm">
              <span>Descuento ({data.descuento}%)</span>
              <span className="tabular-nums">-{formatCurrency(data.totalDescuento, data.simbolo)}</span>
            </div>
          )}

          {showIva && (
            <div className="flex justify-between text-white/50 text-sm">
              <span>IVA ({data.ivaPorc}%)</span>
              <span className="tabular-nums">+{formatCurrency(data.totalIva, data.simbolo)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-brand-600/20 border border-brand-500/30 px-6 py-4">
          <span className="text-xl font-bold text-white">TOTAL</span>
          <span className="text-4xl font-black text-white tabular-nums">
            {formatCurrency(data.total, data.simbolo)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de pago exitoso ─────────────────────────────────────────────────

function SuccessScreen({ data }: { data: VisorSuccessMsg }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-[#0f172a] select-none overflow-hidden">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        {/* Ícono de éxito */}
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

      {/* Marca inferior */}
      <p className="absolute bottom-6 text-xs text-white/15 font-medium tracking-widest uppercase">
        PandaPOS
      </p>
    </div>
  );
}
