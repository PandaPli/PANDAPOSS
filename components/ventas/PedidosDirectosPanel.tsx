"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ShoppingBag, Bike, Store, Monitor, CreditCard, Clock, ChefHat } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PedidoDirecto {
  id: number;
  numero: number;
  origen: "KIOSKO" | "DELIVERY" | "RETIRO";
  estado: string;
  clienteNombre: string | null;
  telefono: string | null;
  metodoPago: string;
  pagoMP: boolean;
  total: number;
  creadoEn: string;
}

const ORIGEN_CONFIG = {
  KIOSKO:   { label: "Kiosko",   icon: Monitor, color: "bg-violet-100 text-violet-700 border-violet-200" },
  DELIVERY: { label: "Delivery", icon: Bike,    color: "bg-sky-100 text-sky-700 border-sky-200" },
  RETIRO:   { label: "Retiro",   icon: Store,   color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",    color: "bg-orange-50 text-orange-700 border-orange-200" },
  EN_PROCESO: { label: "En cocina",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  LISTO:      { label: "Listo",        color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ENTREGADO:  { label: "Entregado",    color: "bg-slate-100 text-slate-500 border-slate-200" },
  CANCELADO:  { label: "Cancelado",    color: "bg-red-50 text-red-500 border-red-200" },
};

const METODO_LABEL: Record<string, string> = {
  EFECTIVO:      "Efectivo",
  TARJETA:       "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  MERCADOPAGO:   "Mercado Pago",
  mercadopago:   "Mercado Pago",
};

export function PedidosDirectosPanel({ simbolo }: { simbolo: string }) {
  const [pedidos, setPedidos] = useState<PedidoDirecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await fetch("/api/pedidos/directos");
      if (res.ok) {
        const data: PedidoDirecto[] = await res.json();
        setPedidos(data);
        setLastUpdate(new Date());
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 30_000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  const activos   = pedidos.filter(p => !["ENTREGADO","CANCELADO"].includes(p.estado));
  const cerrados  = pedidos.filter(p =>  ["ENTREGADO","CANCELADO"].includes(p.estado));

  if (loading) {
    return (
      <div className="card p-6 flex items-center justify-center gap-2 text-surface-muted">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-sm">Cargando pedidos directos…</span>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <ShoppingBag size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-text">Pedidos Directos</h3>
            <p className="text-xs text-surface-muted">Kiosko · Delivery · Retiro — hoy</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-surface-muted">
            {lastUpdate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={fetchPedidos}
            className="p-1.5 rounded-lg text-surface-muted hover:bg-surface-bg hover:text-brand-600 transition"
            title="Actualizar"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-full bg-surface-bg">
            <ShoppingBag size={20} className="text-surface-muted" />
          </div>
          <p className="text-sm text-surface-muted">Sin pedidos directos hoy</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-border">

          {/* Activos */}
          {activos.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-surface-bg flex items-center gap-1.5">
                <ChefHat size={12} className="text-surface-muted" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">
                  En curso ({activos.length})
                </span>
              </div>
              {activos.map(p => <PedidoRow key={p.id} pedido={p} simbolo={simbolo} />)}
            </div>
          )}

          {/* Cerrados */}
          {cerrados.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-surface-bg flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">
                  Completados hoy ({cerrados.length})
                </span>
              </div>
              {cerrados.slice(0, 10).map(p => <PedidoRow key={p.id} pedido={p} simbolo={simbolo} dimmed />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PedidoRow({ pedido, simbolo, dimmed = false }: { pedido: PedidoDirecto; simbolo: string; dimmed?: boolean }) {
  const origen     = ORIGEN_CONFIG[pedido.origen];
  const estado     = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, color: "bg-slate-100 text-slate-600 border-slate-200" };
  const OrigenIcon = origen.icon;

  return (
    <div className={cn(
      "px-4 py-3 transition-colors hover:bg-surface-bg/50",
      dimmed && "opacity-60"
    )}>

      {/* Fila 1: origen + número/cliente + total */}
      <div className="flex items-center gap-2">
        <span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shrink-0", origen.color)}>
          <OrigenIcon size={10} />
          {origen.label}
        </span>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-black text-surface-text shrink-0">#{pedido.numero}</span>
          {pedido.clienteNombre && (
            <span className="text-xs text-surface-muted truncate">{pedido.clienteNombre}</span>
          )}
        </div>
        <span className="text-sm font-black text-surface-text shrink-0 pl-2">
          {formatCurrency(pedido.total, simbolo)}
        </span>
      </div>

      {/* Fila 2: estado + método + tiempo */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold shrink-0", estado.color)}>
          {estado.label}
        </span>
        {pedido.pagoMP ? (
          <span className="flex items-center gap-1 rounded-full bg-blue-500 text-white px-2 py-0.5 text-[11px] font-bold shrink-0">
            <CreditCard size={10} />
            Mercado Pago
          </span>
        ) : (
          <span className="text-[11px] text-surface-muted shrink-0">
            {METODO_LABEL[pedido.metodoPago] ?? pedido.metodoPago}
          </span>
        )}
        <div className="flex items-center gap-1 text-[11px] text-surface-muted ml-auto shrink-0">
          <Clock size={10} />
          {timeAgo(pedido.creadoEn)}
        </div>
      </div>
    </div>
  );
}
