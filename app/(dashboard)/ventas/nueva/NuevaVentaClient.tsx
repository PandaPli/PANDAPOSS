"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { PrecuentaModal } from "@/components/pos/PrecuentaModal";
import { useCartStore } from "@/stores/cartStore";
import type { ProductoCard, CartItem } from "@/types";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Wallet, CheckCircle2, ShoppingCart, UtensilsCrossed, Printer, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CANCEL_ROLES = ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "SECRETARY", "WAITER"];

// Qué estaciones puede ver cada rol en el POS (undefined = ve todo)
const ROL_ESTACIONES: Record<string, string[]> = {
  CHEF:   ["COCINA", "CUARTO_CALIENTE"],
  BAR:    ["BARRA"],
};

const ESTACION_LABELS: Record<string, string> = {
  COCINA:          "🍳 Cocina",
  BARRA:           "🍹 Barra",
  CUARTO_CALIENTE: "🔥 Cuarto Caliente",
  MOSTRADOR:       "🧁 Mostrador",
};

interface Props {
  productos: ProductoCard[];
  simbolo: string;
  usuarioId: number;
  userRol?: string;
  cajaId?: number;
  cajaNombre?: string;
  meseroNombre?: string;
  initialOrder?: { id: number; mesaId: number | null; items: CartItem[] } | null;
  initialMesaId?: number | null;
  logoUrl?: string | null;
  mesaNombre?: string;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  sucursalRut?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalGiroComercial?: string | null;
  puntosConfig?: { activo: boolean; puntosPorMil: number; valorPunto: number };
}

export function NuevaVentaClient({
  productos,
  simbolo,
  usuarioId,
  userRol,
  cajaId,
  cajaNombre,
  meseroNombre,
  initialOrder,
  initialMesaId,
  logoUrl,
  mesaNombre,
  sucursalId,
  sucursalNombre,
  sucursalRut,
  sucursalTelefono,
  sucursalDireccion,
  sucursalGiroComercial,
  puntosConfig,
}: Props) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrecuenta, setShowPrecuenta] = useState(false);
  const [ordenLoading, setOrdenLoading] = useState(false);
  const [ordenMsg, setOrdenMsg] = useState("");
  const [mobileTab, setMobileTab] = useState<"menu" | "carrito">("menu");

  const { items, mesaId, pedidoId, setPedido, total, setInitialState, markAsSaved, getItemsByGrupo, setMesaFresh } = useCartStore();

  // Filtrar productos según el rol del usuario
  const productosFiltrados = useMemo(() => {
    const estaciones = ROL_ESTACIONES[userRol ?? ""];
    if (!estaciones) return productos;
    return productos.filter(
      (p) => !p.categoria?.estacion || estaciones.includes(p.categoria.estacion)
    );
  }, [productos, userRol]);

  const [checkoutGrupo, setCheckoutGrupo] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{
    pedidoNum: number;
    mesa: string | null;
    items: CartItem[];
  } | null>(null);
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  // Ref para saber si ya hicimos la hidratación inicial en este montaje
  const hydrated = useRef(false);

  useEffect(() => {
    if (!initialOrder) return;

    // En el primer montaje siempre cargar desde el servidor (tiene TODOS los pedidos de la mesa)
    if (!hydrated.current) {
      hydrated.current = true;
      setInitialState(initialOrder.items, initialOrder.id, initialOrder.mesaId);
      return;
    }

    // Después del montaje: solo re-hidratar si cambió de mesa
    if (mesaId !== (initialOrder.mesaId ?? null)) {
      setInitialState(initialOrder.items, initialOrder.id, initialOrder.mesaId);
    }
  }, [initialOrder, mesaId, setInitialState]);

  useEffect(() => {
    if (!initialOrder && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mesaParam = urlParams.get("mesa");
      if (mesaParam && !isNaN(Number(mesaParam))) {
        const newMesaId = Number(mesaParam);
        const store = useCartStore.getState();
        // Si la mesa cambió → limpiar carrito completamente (evita mezclar ítems de otras mesas)
        if (store.mesaId !== newMesaId) {
          store.setMesaFresh(newMesaId);
        } else {
          store.setMesa(newMesaId);
        }
      }
    }
  }, [initialOrder]);

  async function handleOpenPrecuenta() {
    if (mesaId) {
      try {
        await fetch("/api/mesas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: mesaId, estado: "CUENTA" }),
        });
      } catch {
        // Si falla el cambio visual, igual abrimos la precuenta para no bloquear la operacion.
      }
    }

    setShowPrecuenta(true);
  }

  async function handleVolver() {
    const unsaved = items.filter((i) => !i.guardado);
    if (unsaved.length > 0) {
      await handleOrden();
    }
    router.push("/mesas");
  }

  async function handleOrden() {
    const nuevosItems = items.filter((i) => !i.guardado);

    if (nuevosItems.length === 0) {
      setOrdenMsg("No hay productos nuevos para enviar");
      setTimeout(() => setOrdenMsg(""), 3000);
      return;
    }

    setOrdenLoading(true);
    setOrdenMsg("");

    try {
      // Siempre crear un NUEVO pedido por cada envío → cola individual en KDS
      const body = {
        mesaId: mesaId || null,
        cajaId: cajaId || null,
        tipo: "COCINA",
        items: nuevosItems.map((i) => ({
          productoId: i.tipo === "producto" ? i.id : null,
          comboId: i.tipo === "combo" ? i.id : null,
          cantidad: i.cantidad,
          observacion: i.observacion || null,
          opciones: i.opciones && i.opciones.length > 0 ? i.opciones : null,
          precio: i.opciones && i.opciones.length > 0 ? i.precio : undefined,
        })),
      };

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error al enviar orden");
      }

      const pedido = await res.json();
      setPedido(pedido.id);
      markAsSaved();

      setOrdenMsg(`Orden #${pedido.id} enviada al KDS`);
      setTimeout(() => setOrdenMsg(""), 4000);
      setTicketData({
        pedidoNum: pedido.id,
        mesa: mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : null),
        items: nuevosItems,
      });
    } catch (e) {
      setOrdenMsg((e as Error).message);
    } finally {
      setOrdenLoading(false);
    }
  }

  function handleSuccess() {
    router.push("/mesas");
  }

  function printTicketEstacion(estacion: string, items: CartItem[], pedidoNum: number, mesa: string | null) {
    const pw = window.open("", "_blank", "width=380,height=600");
    if (!pw) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const titulo = estacion === "BARRA" ? "ORDEN BARRA"
      : estacion === "CUARTO_CALIENTE" ? "CUARTO CALIENTE"
      : estacion === "MOSTRADOR" ? "MOSTRADOR"
      : "ORDEN COCINA";
    const itemsHtml = items
      .map((item) => `
        <div class="item">
          <span class="qty">${item.cantidad}x</span>
          <div class="item-info">
            <span class="nombre">${item.nombre}</span>
            ${item.observacion ? `<span class="obs">* ${item.observacion}</span>` : ""}
          </div>
        </div>`)
      .join("");
    pw.document.write(`<!DOCTYPE html><html><head><title>${titulo}</title><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      @page{size:80mm auto;margin:0;}
      html,body{height:fit-content;min-height:0;}
      body{font-family:monospace;font-size:14px;width:80mm;padding:6px 8px 2px 8px;}
      .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px;}
      .title{font-size:20px;font-weight:bold;letter-spacing:3px;}
      .subtitle{font-size:13px;margin-top:3px;}
      .meta{font-size:12px;margin:6px 0;color:#333;}
      .items{margin:8px 0;border-bottom:1px dashed #000;padding-bottom:6px;}
      .item{display:flex;gap:10px;margin:8px 0;align-items:flex-start;}
      .qty{font-size:20px;font-weight:bold;min-width:30px;}
      .item-info{flex:1;}
      .nombre{font-size:15px;font-weight:bold;display:block;}
      .obs{font-size:12px;color:#555;display:block;font-style:italic;margin-top:2px;}
      .footer{text-align:center;font-size:11px;margin-top:4px;color:#666;}
      .cut-feed{height:3mm;}
    </style></head><body>
      <div class="header">
        <div class="title">${titulo}</div>
        <div class="subtitle">${mesa ?? "Sin mesa"} &nbsp;|&nbsp; Orden #${pedidoNum}</div>
      </div>
      <div class="meta">${dateStr} &nbsp;&nbsp; <strong>${timeStr}</strong></div>
      <div class="items">${itemsHtml}</div>
      <div class="footer">— PandaPoss —</div>
      <div class="cut-feed"></div>
      <script>window.onload=function(){window.print();window.close();}<\/script>
    </body></html>`);
    pw.document.close();
  }

  function printKitchenTicket(data: { pedidoNum: number; mesa: string | null; items: CartItem[] }) {
    // Mapear item.id → estacion usando el array de productos del POS
    const prodMap = new Map(productos.map((p) => [p.id, p.categoria?.estacion ?? "COCINA"]));

    // Agrupar ítems por estación
    const groups = new Map<string, CartItem[]>();
    for (const item of data.items) {
      const estacion = item.tipo === "producto"
        ? (prodMap.get(item.id) ?? "COCINA")
        : "COCINA"; // combos → cocina por defecto
      if (!groups.has(estacion)) groups.set(estacion, []);
      groups.get(estacion)!.push(item);
    }

    // Imprimir un ticket por cada estación con ítems
    for (const [estacion, items] of groups.entries()) {
      printTicketEstacion(estacion, items, data.pedidoNum, data.mesa);
    }
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-52px)] flex-col gap-0">
      {/* Barra superior */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-surface-border bg-white px-4 py-3">
        <button onClick={handleVolver} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-95 transition-all">
          <ArrowLeft size={15} />
          <span>Volver a Mesas</span>
        </button>
        <h1 className="text-sm font-bold text-surface-text sm:text-base">Nueva Orden</h1>
        <Link
          href="/ventas/nueva?modo=express"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm hover:bg-amber-100 active:scale-95 transition-all"
          title="Modo Express — venta rápida sin mesa"
        >
          <Zap size={14} className="fill-amber-400 text-amber-500" />
          <span className="hidden sm:inline">Express</span>
        </Link>

        {ordenMsg && (
          <span className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">{ordenMsg}</span>
            <span className="sm:hidden">Enviado</span>
          </span>
        )}

        <div className="ml-auto">
          {cajaId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
              <Wallet size={13} />
              <span className="hidden sm:inline">{cajaNombre ?? "Caja abierta"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle size={13} />
              <span className="hidden sm:inline">Sin caja</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 border-b border-surface-border bg-white md:hidden">
        <button
          onClick={() => setMobileTab("menu")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors",
            mobileTab === "menu" ? "border-brand-500 text-brand-600" : "border-transparent text-surface-muted"
          )}
        >
          <UtensilsCrossed size={16} />
          Menu
        </button>
        <button
          onClick={() => setMobileTab("carrito")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors",
            mobileTab === "carrito" ? "border-brand-500 text-brand-600" : "border-transparent text-surface-muted"
          )}
        >
          <ShoppingCart size={16} />
          Carrito
          {totalItems > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold leading-none text-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 overflow-hidden p-3 sm:p-4", mobileTab === "carrito" ? "hidden md:block" : "block")}>
          <ProductGrid productos={productosFiltrados} simbolo={simbolo} />
        </div>

        <div className={cn("flex-shrink-0 overflow-hidden", "md:block md:w-72 xl:w-80", mobileTab === "carrito" ? "block w-full" : "hidden md:block")}>
          <CartPanel
            simbolo={simbolo}
            onCheckout={() => { setCheckoutGrupo(null); setShowCheckout(true); }}
            onCheckoutGrupo={(grupo) => { setCheckoutGrupo(grupo); setShowCheckout(true); }}
            onOrden={handleOrden}
            onPrecuenta={handleOpenPrecuenta}
            ordenLoading={ordenLoading}
            canCancelItems={userRol ? CANCEL_ROLES.includes(userRol) : false}
            productos={productosFiltrados.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              precio: p.precio,
              codigo: p.codigo,
              imagen: p.imagen,
            }))}
            puntosConfig={puntosConfig}
          />
        </div>
      </div>

      {mobileTab === "menu" && totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <button
            onClick={() => setMobileTab("carrito")}
            className="flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 font-semibold text-white shadow-2xl transition-all active:scale-[0.98] hover:bg-brand-700"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Ver pedido
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-bold">{totalItems}</span>
              <span>{formatCurrency(total(), simbolo)}</span>
            </span>
          </button>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          simbolo={simbolo}
          cajaId={cajaId}
          usuarioId={usuarioId}
          meseroNombre={meseroNombre}
          mesaNombre={mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : undefined)}
          logoUrl={logoUrl}
          onClose={() => { setShowCheckout(false); setCheckoutGrupo(null); }}
          onSuccess={handleSuccess}
          grupoNombre={checkoutGrupo ?? undefined}
          grupoItems={checkoutGrupo ? getItemsByGrupo(checkoutGrupo) : undefined}
        />
      )}

      {showPrecuenta && (
        <PrecuentaModal
          simbolo={simbolo}
          meseroNombre={meseroNombre}
          mesaNombre={mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : undefined)}
          logoUrl={logoUrl}
          onClose={() => setShowPrecuenta(false)}
        />
      )}

      {ticketData && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 sm:items-center bg-black/40 animate-fade-in">
          <div className="mx-4 w-full max-w-xs rounded-2xl bg-white shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Printer size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-surface-text">
                  Orden #{ticketData.pedidoNum} enviada
                  {ticketData.mesa ? ` · ${ticketData.mesa}` : ""}
                </p>
                <p className="mt-0.5 text-sm text-surface-muted">
                  ¿Imprimir ticket de barra / cocina?
                </p>
              </div>
            </div>

            <div className="text-xs border border-surface-border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
              {(() => {
                const prodMap = new Map(productos.map((p) => [p.id, p.categoria?.estacion ?? "COCINA"]));
                const groups = new Map<string, CartItem[]>();
                for (const item of ticketData.items) {
                  const est = item.tipo === "producto" ? (prodMap.get(item.id) ?? "COCINA") : "COCINA";
                  if (!groups.has(est)) groups.set(est, []);
                  groups.get(est)!.push(item);
                }
                return Array.from(groups.entries()).map(([est, its]) => (
                  <div key={est}>
                    <div className="bg-surface-bg px-3 py-1 font-semibold text-surface-muted text-[10px] uppercase tracking-wider">
                      {ESTACION_LABELS[est] ?? est}
                    </div>
                    {its.map((item, i) => (
                      <div key={i} className="flex gap-2 px-3 py-1.5 text-surface-text">
                        <span className="font-bold w-5 text-right flex-shrink-0">{item.cantidad}x</span>
                        <span>{item.nombre}{item.observacion ? ` — ${item.observacion}` : ""}</span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { printKitchenTicket(ticketData); setTicketData(null); }}
                className="btn-primary flex-1 justify-center py-2.5 text-sm"
              >
                <Printer size={15} />
                Sí, imprimir
              </button>
              <button
                onClick={() => setTicketData(null)}
                className="flex-1 rounded-xl border border-surface-border bg-white py-2.5 text-sm font-medium text-surface-muted hover:bg-surface-bg transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
