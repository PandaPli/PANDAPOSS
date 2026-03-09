"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import type { ProductoCard } from "@/types";
import { ArrowLeft, AlertTriangle, Wallet } from "lucide-react";
import Link from "next/link";

interface Props {
  productos: ProductoCard[];
  simbolo: string;
  usuarioId: number;
  cajaId?: number;
  cajaNombre?: string;
}

export function NuevaVentaClient({ productos, simbolo, usuarioId, cajaId, cajaNombre }: Props) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);

  function handleSuccess(ventaId: number) {
    router.push(`/ventas?nueva=${ventaId}`);
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0 -m-6">
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-zinc-200">
        <Link href="/ventas" className="btn-ghost text-sm">
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1 className="font-bold text-zinc-900">Nueva Venta</h1>
        {cajaId ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <Wallet size={12} />
            {cajaNombre ?? "Caja abierta"}
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            <AlertTriangle size={12} />
            Sin caja abierta — las ventas se guardarán sin caja
          </span>
        )}
      </div>

      {/* Layout POS: productos izquierda, carrito derecha */}
      <div className="flex flex-1 overflow-hidden">
        {/* Productos */}
        <div className="flex-1 overflow-hidden p-4">
          <ProductGrid productos={productos} simbolo={simbolo} />
        </div>

        {/* Carrito */}
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
          <CartPanel
            simbolo={simbolo}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>

      {/* Modal checkout */}
      {showCheckout && (
        <CheckoutModal
          simbolo={simbolo}
          cajaId={cajaId}
          usuarioId={usuarioId}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
