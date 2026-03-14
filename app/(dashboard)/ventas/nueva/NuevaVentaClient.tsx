"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { PrecuentaModal } from "@/components/pos/PrecuentaModal";
import { useCartStore } from "@/stores/cartStore";
import type { ProductoCard, CartItem } from "@/types";
import { ArrowLeft, AlertTriangle, Wallet, CheckCircle2, ShoppingCart, UtensilsCrossed } from "lucide-react";
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
}: Props) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrecuenta, setShowPrecuenta] = useState(false);
  const [ordenLoading, setOrdenLoading] = useState(false);
  const [ordenMsg, setOrdenMsg] = useState("");
  const [mobileTab, setMobileTab] = useState<"menu" | "carrito">("menu");

  const { items, mesaId, pedidoId, setPedido, total, setInitialState, markAsSaved } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  // Hidratar estado inicial
  useEffect(() => {
    if (initialOrder && items.length === 0 && !pedidoId) {
      setInitialState(initialOrder.items, initialOrder.id, initialOrder.mesaId);
    }
  }, [initialOrder, items.length, pedidoId, setInitialState]);

  async function handleVolver() {
    const unsaved = items.filter((i) => !i.guardado);
    if (unsaved.length > 0) {
      await handleOrden();
    }
    router.push("/mesas");
  }

  async function handleOrden() {
    // Filtrar solo items que NO están guardados en la BD
    const nuevosItems = items.filter((i) => !i.guardado);
    
    if (nuevosItems.length === 0) {
      setOrdenMsg("No hay productos nuevos para enviar");
      setTimeout(() => setOrdenMsg(""), 3000);
      return;
    }

    setOrdenLoading(true);
    setOrdenMsg("");

    try {
      const isUpdate = !!pedidoId;
      const url = isUpdate ? `/api/pedidos/${pedidoId}` : "/api/pedidos";
      const method = isUpdate ? "PATCH" : "POST";

      const body = isUpdate
        ? {
            nuevosItems: nuevosItems.map((i) => ({
              productoId: i.tipo === "producto" ? i.id : null,
              comboId: i.tipo === "combo" ? i.id : null,
              cantidad: i.cantidad,
              observacion: i.observacion || null,
            })),
          }
        : {
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error al enviar orden");
      }

      const pedido = await res.json();
      if (!isUpdate) setPedido(pedido.id);
      
      // Marcar los nuevos items como guardados localmente
      markAsSaved();

      setOrdenMsg(isUpdate ? "Orden actualizada" : `Orden #${pedido.id} enviada`);
      setTimeout(() => setOrdenMsg(""), 4000);
    } catch (e) {
      setOrdenMsg((e as Error).message);
    } finally {
      setOrdenLoading(false);
    }
  }

  function handleSuccess(ventaId: number) {
    router.push(`/ventas?nueva=${ventaId}`);
  }

  return (
    <div className="h-[calc(100vh-52px)] flex flex-col gap-0 -m-6">
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-border flex-shrink-0">
        <button onClick={handleVolver} className="btn-ghost text-sm">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Volver</span>
        </button>
        <h1 className="font-bold text-surface-text text-sm sm:text-base">Nueva Orden</h1>

        {/* Orden toast */}
        {ordenMsg && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1.5 font-semibold animate-fade-in">
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">{ordenMsg}</span>
            <span className="sm:hidden">Enviado</span>
          </span>
        )}

        <div className="ml-auto">
          {cajaId ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1.5 font-semibold">
              <Wallet size={13} />
              <span className="hidden sm:inline">{cajaNombre ?? "Caja abierta"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1.5 font-semibold">
              <AlertTriangle size={13} />
              <span className="hidden sm:inline">Sin caja</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs móvil */}
      <div className="md:hidden flex border-b border-surface-border bg-white flex-shrink-0">
        <button
          onClick={() => setMobileTab("menu")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2",
            mobileTab === "menu"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-surface-muted"
          )}
        >
          <UtensilsCrossed size={16} />
          Menú
        </button>
        <button
          onClick={() => setMobileTab("carrito")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2",
            mobileTab === "carrito"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-surface-muted"
          )}
        >
          <ShoppingCart size={16} />
          Carrito
          {totalItems > 0 && (
            <span className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Layout POS */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel productos */}
        <div className={cn(
          "flex-1 overflow-hidden p-3 sm:p-4",
          mobileTab === "carrito" ? "hidden md:block" : "block"
        )}>
          <ProductGrid productos={productos} simbolo={simbolo} />
        </div>

        {/* Panel carrito */}
        <div className={cn(
          "flex-shrink-0 overflow-hidden",
          // Desktop: columna fija
          "md:w-72 xl:w-80 md:block",
          // Móvil: pantalla completa cuando está activo
          mobileTab === "carrito" ? "block w-full" : "hidden md:block"
        )}>
          <CartPanel
            simbolo={simbolo}
            onCheckout={() => setShowCheckout(true)}
            onOrden={handleOrden}
            onPrecuenta={() => setShowPrecuenta(true)}
            ordenLoading={ordenLoading}
            canCancelItems={userRol ? CANCEL_ROLES.includes(userRol) : false}
          />
        </div>
      </div>

      {/* Botón flotante carrito (móvil, cuando se está en menú y hay items) */}
      {mobileTab === "menu" && totalItems > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setMobileTab("carrito")}
            className="w-full flex items-center justify-between bg-brand-600 hover:bg-brand-700 text-white rounded-2xl px-5 py-4 shadow-2xl font-semibold transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Ver pedido
            </span>
            <span className="flex items-center gap-3">
              <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-sm font-bold">
                {totalItems}
              </span>
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
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showPrecuenta && (
        <PrecuentaModal
          simbolo={simbolo}
          meseroNombre={meseroNombre}
          mesaNombre={mesaId ? `Mesa ${mesaId}` : undefined}
          onClose={() => setShowPrecuenta(false)}
        />
      )}
    </div>
  );
}
