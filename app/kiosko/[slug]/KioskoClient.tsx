"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronRight, Minus, Plus, ShoppingBag, Trash2, X, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface VOpcion { id: number; nombre: string; precio: number; }
interface VGrupo  { id: number; nombre: string; requerido: boolean; tipo: string; opciones: VOpcion[]; }
interface Producto {
  id: number; nombre: string; descripcion: string | null;
  precio: number; imagen: string | null; variantes: VGrupo[];
}
interface Categoria { id: number; nombre: string; productos: Producto[]; }
interface CartOpcion { grupoId: number; grupoNombre: string; opcionId: number; opcionNombre: string; precio: number; }
interface CartItem {
  cartKey: string; productoId: number; nombre: string;
  precio: number; imagen: string | null; cantidad: number;
  opciones: CartOpcion[];
}
type Pantalla = "idle" | "menu" | "cart" | "tipo" | "nombre" | "pago" | "confirming" | "pagando" | "success";
type MetodoPagoKiosko = "caja" | "mercadopago";

interface Props {
  sucursal: { id: number; nombre: string; logoUrl: string | null; simbolo: string; cartaBg: string | null; };
  categorias: Categoria[];
  mpEnabled?: boolean;
}

const IDLE_TIMEOUT = 90_000; // 90s sin interacción → volver a idle

// ── Variantes modal ────────────────────────────────────────────────────────
function VariantesModal({
  producto, simbolo, onConfirm, onClose,
}: { producto: Producto; simbolo: string; onConfirm: (opciones: CartOpcion[], qty: number) => void; onClose: () => void; }) {
  const [sel, setSel] = useState<Record<number, number[]>>(() => {
    const init: Record<number, number[]> = {};
    for (const g of producto.variantes) {
      if (g.requerido && g.tipo === "radio" && g.opciones.length > 0) init[g.id] = [g.opciones[0].id];
      else init[g.id] = [];
    }
    return init;
  });
  const [qty, setQty] = useState(1);

  function toggle(g: VGrupo, opId: number) {
    setSel(prev => ({
      ...prev,
      [g.id]: g.tipo === "radio"
        ? [opId]
        : prev[g.id]?.includes(opId) ? prev[g.id].filter(i => i !== opId) : [...(prev[g.id] ?? []), opId],
    }));
  }

  const missingRequired = producto.variantes.some(g => g.requerido && !(sel[g.id]?.length));
  const selectedOpciones: CartOpcion[] = producto.variantes.flatMap(g =>
    (sel[g.id] ?? []).map(opId => {
      const op = g.opciones.find(o => o.id === opId)!;
      return { grupoId: g.id, grupoNombre: g.nombre, opcionId: op.id, opcionNombre: op.nombre, precio: op.precio };
    })
  );
  const unitPrice = producto.precio + selectedOpciones.reduce((s, o) => s + o.precio, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-t-[2rem] bg-[#1a1a2e] p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-black text-white">{producto.nombre}</h3>
            <p className="text-amber-400 font-black text-lg mt-0.5">{formatCurrency(unitPrice * qty, simbolo)}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-5 max-h-[45vh] overflow-y-auto">
          {producto.variantes.map(g => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-bold text-white">{g.nombre}</p>
                {g.requerido && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black">REQUERIDO</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.opciones.map(op => {
                  const active = sel[g.id]?.includes(op.id);
                  return (
                    <button key={op.id} onClick={() => toggle(g, op.id)}
                      className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                        active ? "border-amber-400 bg-amber-400/20" : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <span className="font-semibold text-white">{op.nombre}</span>
                      {op.precio > 0 && <span className="text-xs text-amber-400">+{formatCurrency(op.precio, simbolo)}</span>}
                      {active && <Check size={16} className="text-amber-400 ml-2 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-white"><Minus size={18} /></button>
            <span className="text-xl font-black text-white w-6 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="text-white"><Plus size={18} /></button>
          </div>
          <button
            disabled={missingRequired}
            onClick={() => { onConfirm(selectedOpciones, qty); onClose(); }}
            className="flex-1 rounded-2xl bg-amber-400 py-4 text-center font-black text-black text-lg disabled:opacity-40 hover:bg-amber-300 transition-all active:scale-95"
          >
            Agregar · {formatCurrency(unitPrice * qty, simbolo)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Kiosko Client ─────────────────────────────────────────────────────
export function KioskoClient({ sucursal, categorias, mpEnabled }: Props) {
  const [pantalla, setPantalla] = useState<Pantalla>("idle");
  const [catActiva, setCatActiva] = useState(categorias[0]?.id ?? 0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [variantesModal, setVariantesModal] = useState<Producto | null>(null);
  const [tipoConsumo, setTipoConsumo] = useState<"aqui" | "llevar">("aqui");
  const [nombreCliente, setNombreCliente] = useState("");
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [pedidoNumero, setPedidoNumero] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoKiosko>("caja");
  const [mpInitPoint, setMpInitPoint] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalItems = cart.reduce((a, i) => a + i.cantidad, 0);
  const subtotal = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);

  // ── Idle timeout ──────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (pantalla !== "idle" && pantalla !== "success" && pantalla !== "pagando") {
      idleTimer.current = setTimeout(() => {
        resetKiosko();
      }, IDLE_TIMEOUT);
    }
  }, [pantalla]);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [resetIdleTimer]);

  useEffect(() => {
    window.addEventListener("touchstart", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);
    return () => {
      window.removeEventListener("touchstart", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
    };
  }, [resetIdleTimer]);

  // Auto-reset desde success
  useEffect(() => {
    if (pantalla === "success") {
      const t = setTimeout(resetKiosko, 8000);
      return () => clearTimeout(t);
    }
  }, [pantalla]);

  function resetKiosko() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setCart([]);
    setNombreCliente("");
    setPedidoId(null);
    setPedidoNumero(null);
    setMpInitPoint(null);
    setMetodoPago("caja");
    setError("");
    setPantalla("idle");
  }

  function addToCart(producto: Producto, opciones: CartOpcion[] = [], qty = 1) {
    const opKey = opciones.map(o => o.opcionId).sort().join("-");
    const cartKey = `${producto.id}-${opKey}`;
    const precioOpciones = opciones.reduce((s, o) => s + o.precio, 0);
    const precio = producto.precio + precioOpciones;
    for (let i = 0; i < qty; i++) {
      setCart(prev => {
        const existing = prev.find(item => item.cartKey === cartKey);
        if (existing) return prev.map(item => item.cartKey === cartKey ? { ...item, cantidad: item.cantidad + 1 } : item);
        return [...prev, { cartKey, productoId: producto.id, nombre: producto.nombre, precio, imagen: producto.imagen, cantidad: 1, opciones }];
      });
    }
  }

  function removeFromCart(cartKey: string) {
    setCart(prev => {
      const item = prev.find(i => i.cartKey === cartKey);
      if (!item) return prev;
      if (item.cantidad === 1) return prev.filter(i => i.cartKey !== cartKey);
      return prev.map(i => i.cartKey === cartKey ? { ...i, cantidad: i.cantidad - 1 } : i);
    });
  }

  function handleProductoTap(producto: Producto) {
    if (producto.variantes.length > 0) {
      setVariantesModal(producto);
    } else {
      addToCart(producto);
    }
  }

  async function confirmarPedido(metodo: MetodoPagoKiosko = "caja") {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/kiosko/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId: sucursal.id,
          tipoConsumo,
          nombreCliente: nombreCliente.trim() || null,
          // metodoPago se pasa al API para que, si es "mercadopago", marque
          // el pedido como pending_payment y NO aparezca en KDS hasta que
          // el webhook de MP confirme el cobro.
          metodoPago: metodo,
          items: cart.map(i => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            observacion: i.opciones.map(o => o.opcionNombre).join(", ") || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear pedido");
      setPedidoId(data.id);
      setPedidoNumero(data.numero);

      // Si eligió Mercado Pago, crear preferencia y mostrar pantalla de pago QR
      if (metodo === "mercadopago") {
        const mpRes = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: data.id, sucursalId: sucursal.id }),
        });
        const mpData = await mpRes.json().catch(() => ({}));
        if (!mpRes.ok || !mpData.initPoint) {
          console.error("[MP] fallo create-preference", { status: mpRes.status, mpData });
          throw new Error(
            mpData.error ??
            `Mercado Pago no respondio (${mpRes.status}). Pedido #${data.numero} creado pero no se pudo iniciar el pago.`
          );
        }
        setMpInitPoint(mpData.initPoint);
        setPantalla("pagando");
        startPaymentPolling(data.id);
        return;
      }

      setPantalla("success");
    } catch (e) {
      setError((e as Error).message);
      // Volver a la pantalla de metodo de pago para que el cliente vea el error
      // (sino queda colgado en "confirming" sin feedback)
      setPantalla("pago");
    } finally {
      setSubmitting(false);
    }
  }

  function startPaymentPolling(pId: number) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/status?pedidoId=${pId}`);
        const data = await res.json();
        if (data.status === "approved") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setPantalla("success");
        }
      } catch { /* seguir polling */ }
    }, 3000);
  }

  const productos = categorias.find(c => c.id === catActiva)?.productos ?? [];

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (pantalla === "idle") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden text-white select-none"
        style={sucursal.cartaBg
          ? { backgroundImage: `url(${sucursal.cartaBg})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg,#0f0c29 0%,#1a1a2e 50%,#16213e 100%)" }
        }
        onClick={() => setPantalla("menu")}
      >
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
          {sucursal.logoUrl
            ? <img src={sucursal.logoUrl} alt={sucursal.nombre} className="h-40 w-auto object-contain drop-shadow-2xl" />
            : <h1 className="text-6xl font-black tracking-tight drop-shadow-2xl">{sucursal.nombre}</h1>
          }
          <div className="mt-4">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-amber-400 bg-amber-400/20 px-10 py-5 backdrop-blur-sm animate-pulse">
              <span className="text-2xl font-black text-amber-300 tracking-wide">TOCA PARA COMENZAR</span>
            </div>
          </div>
          <p className="text-white/40 text-sm mt-4">Autoservicio · {sucursal.nombre}</p>
        </div>
      </div>
    );
  }

  // ── PAGO (selección de método) ────────────────────────────────────────────
  if (pantalla === "pago") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white select-none px-8">
        <button onClick={() => setPantalla("nombre")} className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold">
          <ArrowLeft size={18} /> Volver
        </button>
        <h2 className="text-4xl font-black text-center mb-4">¿Cómo quieres pagar?</h2>
        <p className="text-white/40 mb-10">Selecciona tu método de pago</p>

        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
          <button
            onClick={() => { setMetodoPago("caja"); setPantalla("confirming"); confirmarPedido("caja"); }}
            disabled={submitting}
            className="flex flex-col items-center gap-4 rounded-3xl border-2 border-white/10 bg-white/5 p-8 transition-all hover:scale-105 hover:border-amber-400/50 active:scale-95"
          >
            <span className="text-6xl">💳</span>
            <div className="text-center">
              <p className="text-xl font-black">Pago en Caja</p>
              <p className="text-sm text-white/40 mt-1">Tarjeta o efectivo</p>
            </div>
          </button>

          <button
            onClick={() => { setMetodoPago("mercadopago"); setPantalla("confirming"); confirmarPedido("mercadopago"); }}
            disabled={submitting}
            className="flex flex-col items-center gap-4 rounded-3xl border-2 border-white/10 bg-white/5 p-8 transition-all hover:scale-105 hover:border-blue-400/50 active:scale-95"
          >
            <span className="text-6xl">📱</span>
            <div className="text-center">
              <p className="text-xl font-black">Mercado Pago</p>
              <p className="text-sm text-white/40 mt-1">Escanea QR con tu app</p>
            </div>
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center">
          <p className="text-white/40 text-sm">Total</p>
          <p className="text-3xl font-black text-amber-400">{formatCurrency(subtotal, sucursal.simbolo)}</p>
        </div>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  // ── CONFIRMING (procesando creacion de pedido / preferencia MP) ──────────
  if (pantalla === "confirming") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white select-none px-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto h-20 w-20 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
          <div>
            <p className="text-amber-400 font-black text-2xl uppercase tracking-[0.2em]">Procesando</p>
            <p className="text-white/50 text-sm mt-2">
              {metodoPago === "mercadopago"
                ? "Generando codigo de pago Mercado Pago..."
                : "Confirmando tu pedido..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── PAGANDO (QR Mercado Pago) ─────────────────────────────────────────────
  if (pantalla === "pagando") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white select-none px-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 border-2 border-blue-400">
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-blue-400">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
              <rect x="19" y="14" width="2" height="2" /><rect x="14" y="19" width="2" height="2" />
              <rect x="19" y="19" width="2" height="2" />
            </svg>
          </div>

          <div>
            <p className="text-blue-400 font-black text-xl uppercase tracking-[0.2em]">Escanea para pagar</p>
            <p className="text-white/50 text-sm mt-2">Abre tu app de Mercado Pago y escanea el codigo QR</p>
          </div>

          {/* QR Code generado con la URL de MP */}
          {mpInitPoint && (
            <div className="mx-auto rounded-3xl bg-white p-6 shadow-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(mpInitPoint)}`}
                alt="QR Mercado Pago"
                width={280}
                height={280}
                className="rounded-xl"
              />
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
            <p className="text-white/40 text-sm">Total a pagar</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{formatCurrency(subtotal, sucursal.simbolo)}</p>
            <p className="text-white/30 text-xs mt-2">Pedido #{pedidoNumero || pedidoId}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/40">
            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-sm">Esperando confirmacion de pago...</p>
          </div>

          <button
            onClick={() => {
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
              setPantalla("success");
            }}
            className="rounded-2xl border border-white/20 px-8 py-3 text-sm font-semibold text-white/50 hover:bg-white/5 transition-all"
          >
            Continuar sin pago online
          </button>
        </div>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (pantalla === "success") {
    const esPagoCaja = metodoPago === "caja";
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white select-none">
        <div className="text-center space-y-6 px-8 max-w-lg">
          {esPagoCaja ? (
            <>
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-amber-500/20 border-4 border-amber-400">
                <span className="text-5xl">💳</span>
              </div>
              <div>
                <p className="text-amber-400 font-black text-2xl uppercase tracking-[0.2em]">Pasar a Caja</p>
                <p className="text-amber-400/60 font-bold text-lg uppercase tracking-[0.15em] mt-1">para confirmar</p>
                <p className="text-8xl font-black text-white mt-4">#{pedidoNumero || pedidoId}</p>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-8 py-5">
                <p className="text-amber-300 font-bold text-lg">Presenta este numero en caja</p>
                <p className="text-white/50 text-sm mt-1">Tu pedido sera preparado una vez confirmado el pago</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm text-white/60">
                <p className="text-white/40 text-xs">Total a pagar</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(subtotal, sucursal.simbolo)}</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/20 border-4 border-emerald-400">
                <Check size={56} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-black text-xl uppercase tracking-[0.3em]">¡Pago Confirmado!</p>
                <p className="text-8xl font-black text-white mt-3">#{pedidoNumero || pedidoId}</p>
                <p className="text-white/50 text-lg mt-2">Tu pedido esta siendo preparado</p>
              </div>
            </>
          )}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm text-white/60">
            {tipoConsumo === "aqui" ? "🍽️ Comer aquí" : "🥡 Para llevar"}
            {nombreCliente && ` · 👤 ${nombreCliente}`}
          </div>
          <p className="text-white/30 text-sm">Volviendo al inicio en unos segundos...</p>
          <button onClick={resetKiosko} className="rounded-2xl bg-amber-400 px-10 py-4 font-black text-black text-lg hover:bg-amber-300 transition-all">
            Nuevo pedido
          </button>
        </div>
      </div>
    );
  }

  // ── TIPO DE CONSUMO ───────────────────────────────────────────────────────
  if (pantalla === "tipo") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white select-none px-8">
        <button onClick={() => setPantalla("cart")} className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold">
          <ArrowLeft size={18} /> Volver
        </button>
        <h2 className="text-4xl font-black text-center mb-12">¿Cómo lo prefieres?</h2>
        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
          {[
            { key: "aqui", emoji: "🍽️", label: "Comer aquí", sub: "Te traemos tu pedido" },
            { key: "llevar", emoji: "🥡", label: "Para llevar", sub: "Empacado para ir" },
          ].map(opt => (
            <button key={opt.key}
              onClick={() => { setTipoConsumo(opt.key as "aqui" | "llevar"); setPantalla("nombre"); }}
              className={`flex flex-col items-center gap-4 rounded-3xl border-2 p-8 transition-all hover:scale-105 active:scale-95 ${
                tipoConsumo === opt.key ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-white/5 hover:border-white/30"
              }`}
            >
              <span className="text-6xl">{opt.emoji}</span>
              <div className="text-center">
                <p className="text-xl font-black">{opt.label}</p>
                <p className="text-sm text-white/40 mt-1">{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── NOMBRE ────────────────────────────────────────────────────────────────
  if (pantalla === "nombre") {
    const keys = ["1","2","3","4","5","6","7","8","9","0","Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Z","X","C","V","B","N","M"," ","⌫"];
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white select-none px-6">
        <button onClick={() => setPantalla("tipo")} className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold">
          <ArrowLeft size={18} /> Volver
        </button>
        <h2 className="text-3xl font-black text-center mb-2">¿Cuál es tu nombre?</h2>
        <p className="text-white/40 mb-8">Para llamarte cuando esté listo</p>
        <div className="w-full max-w-md mb-6 rounded-2xl border-2 border-white/20 bg-white/5 px-6 py-4 text-3xl font-black text-center min-h-[64px] tracking-widest">
          {nombreCliente || <span className="text-white/20">Tu nombre</span>}
        </div>
        <div className="grid grid-cols-10 gap-2 w-full max-w-xl">
          {keys.map(k => (
            <button key={k}
              onClick={() => {
                if (k === "⌫") setNombreCliente(n => n.slice(0, -1));
                else if (nombreCliente.length < 20) setNombreCliente(n => n + k);
              }}
              className={`rounded-xl py-3 font-bold text-sm transition-all active:scale-90 ${
                k === " " ? "col-span-4 bg-white/10 text-white/50" :
                k === "⌫" ? "col-span-2 bg-red-500/20 text-red-300" :
                "bg-white/10 hover:bg-white/20"
              }`}
            >
              {k === " " ? "ESPACIO" : k}
            </button>
          ))}
        </div>
        <div className="mt-6 flex gap-4 w-full max-w-xl">
          <button onClick={() => { setNombreCliente(""); mpEnabled ? setPantalla("pago") : (setPantalla("confirming"), confirmarPedido()); }}
            className="flex-1 rounded-2xl border border-white/20 py-4 font-bold text-white/60 hover:bg-white/5"
          >
            Saltar
          </button>
          <button onClick={() => { mpEnabled ? setPantalla("pago") : (setPantalla("confirming"), confirmarPedido()); }}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-amber-400 py-4 font-black text-black text-lg hover:bg-amber-300 transition-all disabled:opacity-50"
          >
            Continuar →
          </button>
        </div>
        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  // ── CART ──────────────────────────────────────────────────────────────────
  if (pantalla === "cart") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0d1117] text-white select-none">
        <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
          <button onClick={() => setPantalla("menu")} className="rounded-full bg-white/10 p-3 hover:bg-white/20">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black">Tu pedido</h2>
          <span className="ml-auto text-white/40 text-sm">{totalItems} producto{totalItems !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4">
              <ShoppingBag size={48} />
              <p className="text-lg">Tu pedido está vacío</p>
            </div>
          ) : cart.map(item => (
            <div key={item.cartKey} className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 p-4">
              {item.imagen
                ? <img src={item.imagen} alt={item.nombre} className="h-16 w-16 rounded-xl object-cover" />
                : <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl">🍽️</div>
              }
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate">{item.nombre}</p>
                {item.opciones.length > 0 && (
                  <p className="text-xs text-white/40 mt-0.5">{item.opciones.map(o => o.opcionNombre).join(", ")}</p>
                )}
                <p className="text-amber-400 font-bold mt-1">{formatCurrency(item.precio * item.cantidad, sucursal.simbolo)}</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2">
                <button onClick={() => removeFromCart(item.cartKey)} className="text-white/60 hover:text-white">
                  {item.cantidad === 1 ? <Trash2 size={16} className="text-red-400" /> : <Minus size={16} />}
                </button>
                <span className="font-black text-lg w-5 text-center">{item.cantidad}</span>
                <button onClick={() => setCart(prev => prev.map(i => i.cartKey === item.cartKey ? { ...i, cantidad: i.cantidad + 1 } : i))}
                  className="text-white/60 hover:text-white">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-white/60">Total</span>
              <span className="text-2xl font-black text-amber-400">{formatCurrency(subtotal, sucursal.simbolo)}</span>
            </div>
            <button onClick={() => setPantalla("tipo")}
              className="flex w-full items-center justify-between rounded-2xl bg-amber-400 px-6 py-5 font-black text-black text-lg hover:bg-amber-300 transition-all active:scale-95"
            >
              <span>Continuar</span>
              <ChevronRight size={22} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── MENU ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-[#0d1117] text-white select-none overflow-hidden">
      {/* Variantes modal */}
      {variantesModal && (
        <VariantesModal
          producto={variantesModal}
          simbolo={sucursal.simbolo}
          onConfirm={(opciones, qty) => addToCart(variantesModal, opciones, qty)}
          onClose={() => setVariantesModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          {sucursal.logoUrl
            ? <img src={sucursal.logoUrl} alt={sucursal.nombre} className="h-10 w-auto object-contain" />
            : <span className="text-lg font-black">{sucursal.nombre}</span>
          }
        </div>
        <button
          onClick={() => cart.length > 0 && setPantalla("cart")}
          disabled={cart.length === 0}
          className={`flex items-center gap-3 rounded-2xl px-5 py-3 transition-all font-black ${
            cart.length > 0
              ? "bg-amber-400 text-black hover:bg-amber-300 active:scale-95"
              : "bg-white/10 text-white/30 cursor-default"
          }`}
        >
          <ShoppingBag size={20} />
          {totalItems > 0 && <span className="text-lg">{totalItems}</span>}
          {subtotal > 0 && <span>{formatCurrency(subtotal, sucursal.simbolo)}</span>}
        </button>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide shrink-0 border-b border-white/5">
        {categorias.map(c => (
          <button key={c.id} onClick={() => setCatActiva(c.id)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-black transition-all ${
              catActiva === c.id
                ? "bg-amber-400 text-black scale-105 shadow-lg"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Productos grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map(p => {
            const en_cart = cart.filter(i => i.productoId === p.id).reduce((s, i) => s + i.cantidad, 0);
            return (
              <button key={p.id} onClick={() => handleProductoTap(p)}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white/5 border border-white/10 text-left transition-all hover:border-amber-400/50 hover:scale-[1.02] active:scale-95"
              >
                <div className="aspect-square w-full overflow-hidden bg-white/5">
                  {p.imagen
                    ? <img src={p.imagen} alt={p.nombre} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    : <div className="flex h-full items-center justify-center text-5xl opacity-30">🍽️</div>
                  }
                  {en_cart > 0 && (
                    <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black font-black text-sm">
                      {en_cart}
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="font-black text-white text-sm leading-tight line-clamp-2 flex-1">{p.nombre}</p>
                  {p.descripcion && <p className="text-white/40 text-xs mt-1 line-clamp-2 leading-snug">{p.descripcion}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-black text-amber-400 text-base">{formatCurrency(p.precio, sucursal.simbolo)}</p>
                    {p.variantes.length > 0 && <span className="text-[10px] text-white/30 font-semibold">+opciones</span>}
                  </div>
                </div>
                {/* Plus overlay */}
                <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-black opacity-0 group-hover:opacity-100 shadow-lg transition-all">
                  <Plus size={18} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      {cart.length > 0 && (
        <div className="shrink-0 border-t border-white/10 bg-[#0d1117] px-6 py-4">
          <button onClick={() => setPantalla("cart")}
            className="flex w-full items-center justify-between rounded-2xl bg-amber-400 px-6 py-4 font-black text-black text-lg hover:bg-amber-300 transition-all active:scale-95"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={20} />
              Ver pedido · {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            <span>{formatCurrency(subtotal, sucursal.simbolo)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
