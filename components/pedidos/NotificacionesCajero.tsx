"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

interface PedidoListo {
  id: number;
  numero: number;
  clienteNombre: string | null;
}

export function NotificacionesCajero() {
  const [pedidos, setPedidos] = useState<PedidoListo[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/pedidos/cajero-listos");
        if (res.ok) {
          const data: PedidoListo[] = await res.json();
          setPedidos(data);
        }
      } catch {}
    }
    fetch_();
    const interval = setInterval(fetch_, 15000);
    return () => clearInterval(interval);
  }, []);

  const visibles = pedidos.filter((p) => !dismissed.has(p.id));
  if (visibles.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {visibles.map((p) => (
        <div
          key={p.id}
          className="flex items-start gap-3 rounded-xl bg-purple-600 text-white px-4 py-3 shadow-lg"
        >
          <Bell size={16} className="mt-0.5 animate-bounce shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wide">Listo para Cajero</p>
            <p className="text-sm font-semibold mt-0.5">
              Pedido #{p.numero}{p.clienteNombre ? ` — ${p.clienteNombre}` : ""}
            </p>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, p.id]))}
            className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
