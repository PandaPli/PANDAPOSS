"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { PrecuentaModal } from "@/components/pos/PrecuentaModal";
import { useCartStore } from "@/stores/cartStore";
import type { ProductoCard, CartItem } from "@/types";
import { ArrowLeft, AlertTriangle, Wallet, CheckCircle2, ShoppingCart, UtensilsCrossed, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CANCEL_ROLES = ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "SECRETARY", "WAITER"];

interface Props {
  productos: ProductoCard[];
  simbolo: string;
  usuarioId: number;
  userRol?: string;
  cajaId?: number;
  cajaNombre?: string;
  meseroNombre?: string;
  initialOrder?: { id: number; mesaId: number | null; items: CartItem[] } | null;
  logoUrl?: string | null;
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
  logoUrl,
}: Props) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrecuenta, setShowPrecuenta] = useState(false);
  const [ordenLoading, setOrdenLoading] = useState(false);
  const [ordenMsg, setOrdenMsg] = useState("");
  const [mobileTab, setMobileTab] = useState<"menu" | "carrito">("menu");

  const { items, mesaId, pedidoId, setPedido, total, setInitialState, markAsSaved, getItemsByGrupo } = useCartStore();

  const [checkoutGrupo, setCheckoutGrupo] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{
    pedidoNum: number;
    mesa: string | null;
    items: CartItem[];
  } | null>(null);
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  useEffect(() => {
    if (!initialOrder) return;

    const shouldHydrate = pedidoId !== initialOrder.id || mesaId !== (initialOrder.mesaId ?? null) || items.length === 0;
    if (shouldHydrate) {
      setInitialState(initialOrder.items, initialOrder.id, initialOrder.mesaId);
    }
  }, [initialOrder, items.length, mesaId, pedidoId, setInitialState]);

  useEffect(() => {
    if (!initialOrder && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mesaParam = urlParams.get("mesa");
      if (mesaParam && !isNaN(Number(mesaParam))) {
        useCartStore.getState().setMesa(Number(mesaParam));
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
        mesa: mesaId ? `Mesa ${mesaId}` : null,
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

  function printKitchenTicket(data: { pedidoNum: number; mesa: string | null; items: CartItem[] }) {
    const pw = window.open("", "_blank", "width=400,height=700");
    if (!pw) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const itemsHtml = data.items
      .map(
        (item) => `
        <div class="item">
          <span class="qty">${item.cantidad}x</span>
          <div class="item-info">
            <span class="nombre">${item.nombre.toUpperCase()}</span>
            ${item.observacion ? `<div class="obs-box">★ NOTA: ${item.observacion.toUpperCase()}</div>` : ""}
          </div>
        </div>`
      )
      .join('<div class="sep"></div>');
    pw.document.write(`<!DOCTYPE html><html><head><title>Ticket Cocina</title>
    <meta charset="UTF-8">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{
        font-family:'Courier New',Courier,monospace;
        font-size:16px;
        width:76mm;
        max-width:76mm;
        padding:4mm 3mm;
        background:#fff;
        color:#000;
      }
      .header{
        text-align:center;
        padding-bottom:6px;
        margin-bottom:6px;
        border-bottom:3px dashed #000;
      }
      .title{
        font-size:26px;
        font-weight:900;
        letter-spacing:4px;
        line-height:1.1;
      }
      .mesa-row{
        font-size:20px;
        font-weight:bold;
        margin-top:4px;
        letter-spacing:1px;
      }
      .orden-num{
        font-size:15px;
        margin-top:2px;
        color:#000;
      }
      .meta{
        font-size:13px;
        margin:6px 0 8px;
        border-bottom:1px dashed #000;
        padding-bottom:6px;
      }
      .items{
        margin:6px 0;
        border-bottom:2px dashed #000;
        padding-bottom:8px;
      }
      .item{
        display:flex;
        gap:8px;
        margin:10px 0;
        align-items:flex-start;
      }
      .qty{
        font-size:28px;
        font-weight:900;
        min-width:38px;
        line-height:1;
      }
      .item-info{flex:1;}
      .nombre{
        font-size:18px;
        font-weight:900;
        display:block;
        line-height:1.2;
        letter-spacing:0.5px;
      }
      .obs-box{
        margin-top:4px;
        font-size:14px;
        font-weight:bold;
        background:#000;
        color:#fff;
        padding:3px 6px;
        display:inline-block;
        letter-spacing:0.5px;
      }
      .sep{
        border-top:1px dashed #aaa;
        margin:4px 0;
      }
      .footer{
        text-align:center;
        font-size:11px;
        margin-top:8px;
        color:#666;
      }
      @media print{
        @page{margin:0;size:80mm auto;}
        body{width:76mm;padding:4mm 3mm;}
      }
    </style></head><body>
      <div class="header">
        <div class="title">ORDEN COCINA</div>
        <div class="mesa-row">${data.mesa ?? "SIN MESA"}</div>
        <div class="orden-num">Orden #${data.pedidoNum}</div>
      </div>
      <div class="meta">${dateStr} &nbsp;&nbsp; <strong>${timeStr}</strong></div>
      <div class="items">${itemsHtml}</div>
      <div class="footer">— PandaPoss —</div>
      <script>window.onload=function(){window.print();window.close();}<\/script>
    </body></html>`);
    pw.document.close();
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-52px)] flex-col gap-0">
      {/* Barra superior */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-surface-border bg-white px-4 py-3">
        <button onClick={handleVolver} className="btn-ghost text-sm">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Volver</span>
        </button>
        <h1 className="text-sm font-bold text-surface-text sm:text-base">Nueva Orden</h1>

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
          <ProductGrid productos={productos} simbolo={simbolo} />
        </div>

        <div className={cn("flex-shrink-0 overflow-hidden", "md:block md:w-72 xl:w-80", mobileTab === "carrito" ? "block w-full" : "hidden md:block")}>
          <CartPanel
            simbolo={simbolo}
            onCheckout={() => { setCheckoutGrupo(null); setShowCheckout(true); }}
            onCheckoutGrupo={(grupo) => { setCheckoutGrupo(grupo); setShowCheckout(true); }}
            onOrden={handleOrden}
            onPrecuenta={handleOpenPrecuenta}
            onVolverMesas={() => router.push("/mesas")}
            ordenLoading={ordenLoading}
            canCancelItems={userRol ? CANCEL_ROLES.includes(userRol) : false}
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
          mesaNombre={mesaId ? `Mesa ${mesaId}` : undefined}
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
          mesaNombre={mesaId ? `Mesa ${mesaId}` : undefined}
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

            <div className="text-xs text-surface-muted border border-surface-border rounded-lg px-3 py-2 max-h-28 overflow-y-auto space-y-0.5">
              {ticketData.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="font-bold w-5 text-right flex-shrink-0">{item.cantidad}x</span>
                  <span>{item.nombre}{item.observacion ? ` — ${item.observacion}` : ""}</span>
                </div>
              ))}
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
