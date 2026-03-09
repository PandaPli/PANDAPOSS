"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { PrecuentaModal } from "@/components/pos/PrecuentaModal";
import { useCartStore } from "@/stores/cartStore";
import type { ProductoCard } from "@/types";
import { ArrowLeft, AlertTriangle, Wallet, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  productos: ProductoCard[];
  simbolo: string;
  usuarioId: number;
  cajaId?: number;
  cajaNombre?: string;
  meseroNombre?: string;
}

export function NuevaVentaClient({ productos, simbolo, usuarioId, cajaId, cajaNombre, meseroNombre }: Props) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrecuenta, setShowPrecuenta] = useState(false);
  const [ordenLoading, setOrdenLoading] = useState(false);
  const [ordenMsg, setOrdenMsg] = useState("");

  const { items, mesaId, setPedido } = useCartStore();

  async function handleOrden() {
    if (items.length === 0) return;

    setOrdenLoading(true);
    setOrdenMsg("");

    try {
      const body = {
        mesaId: mesaId || null,
        cajaId: cajaId || null,
        tipo: "COCINA",
        items: items.map((i) => ({
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
      setOrdenMsg(`Orden #${pedido.id} enviada a cocina`);

      // Auto-hide message after 4s
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
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0 -m-6">
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-surface-border">
        <Link href="/ventas" className="btn-ghost text-sm">
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1 className="font-bold text-surface-text">Nueva Venta</h1>

        {/* Orden toast */}
        {ordenMsg && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 font-semibold animate-fade-in">
            <CheckCircle2 size={13} />
            {ordenMsg}
          </span>
        )}

        {cajaId ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 font-semibold">
            <Wallet size={13} />
            {cajaNombre ?? "Caja abierta"}
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 font-semibold">
            <AlertTriangle size={13} />
            Sin caja abierta
          </span>
        )}
      </div>

      {/* Layout POS */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden p-4">
          <ProductGrid productos={productos} simbolo={simbolo} />
        </div>
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
          <CartPanel
            simbolo={simbolo}
            onCheckout={() => setShowCheckout(true)}
            onOrden={handleOrden}
            onPrecuenta={() => setShowPrecuenta(true)}
            ordenLoading={ordenLoading}
          />
        </div>
      </div>

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
          onClose={() => setShowPrecuenta(false)}
        />
      )}
    </div>
  );
}
