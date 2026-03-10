"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Truck, Clock, CheckCircle2, Package, AlertCircle, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type EstadoPedido = "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO";

interface DetallePedido {
  id: number;
  cantidad: number;
  observacion: string | null;
  nombre: string;
}

interface PedidoDelivery {
  id: number;
  numero: number;
  estado: EstadoPedido;
  observacion: string | null;
  creadoEn: string;
  usuario: string;
  detalles: DetallePedido[];
}

interface Props {
  pedidos: PedidoDelivery[];
  simbolo: string;
}

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; color: string; icon: React.ReactNode }> = {
  PENDIENTE:   { label: "Pendiente",   color: "bg-yellow-50 text-yellow-700 border-yellow-200",  icon: <Clock size={14} /> },
  EN_PROCESO:  { label: "En proceso",  color: "bg-blue-50 text-blue-700 border-blue-200",         icon: <Loader2 size={14} className="animate-spin" /> },
  LISTO:       { label: "Listo",       color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Package size={14} /> },
  ENTREGADO:   { label: "Entregado",   color: "bg-gray-50 text-gray-500 border-gray-200",          icon: <CheckCircle2 size={14} /> },
  CANCELADO:   { label: "Cancelado",   color: "bg-red-50 text-red-600 border-red-200",             icon: <AlertCircle size={14} /> },
};

const PROXIMOS_ESTADOS: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE:  "EN_PROCESO",
  EN_PROCESO: "LISTO",
  LISTO:      "ENTREGADO",
};

const BOTON_LABEL: Partial<Record<EstadoPedido, string>> = {
  PENDIENTE:  "Iniciar",
  EN_PROCESO: "Marcar listo",
  LISTO:      "Entregar",
};

export function DeliveryClient({ pedidos: initial }: Props) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(initial);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | "TODOS">("TODOS");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtrados = useMemo(() => {
    return pedidos.filter((p) => {
      const matchSearch =
        !search ||
        String(p.numero).includes(search) ||
        p.usuario.toLowerCase().includes(search.toLowerCase()) ||
        (p.observacion ?? "").toLowerCase().includes(search.toLowerCase());
      const matchEstado = filtroEstado === "TODOS" || p.estado === filtroEstado;
      return matchSearch && matchEstado;
    });
  }, [pedidos, search, filtroEstado]);

  async function avanzarEstado(pedido: PedidoDelivery) {
    const siguiente = PROXIMOS_ESTADOS[pedido.estado];
    if (!siguiente) return;
    setLoadingId(pedido.id);
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: siguiente }),
      });
      if (res.ok) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedido.id ? { ...p, estado: siguiente } : p))
        );
        if (siguiente === "ENTREGADO") router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  function formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  }

  const contadores = useMemo(() => ({
    PENDIENTE:  pedidos.filter((p) => p.estado === "PENDIENTE").length,
    EN_PROCESO: pedidos.filter((p) => p.estado === "EN_PROCESO").length,
    LISTO:      pedidos.filter((p) => p.estado === "LISTO").length,
  }), [pedidos]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text flex items-center gap-2">
            <Truck size={24} className="text-violet-500" />
            Delivery
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} activo{pedidos.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Contadores rápidos */}
        <div className="hidden sm:flex gap-3">
          {(["PENDIENTE", "EN_PROCESO", "LISTO"] as EstadoPedido[]).map((e) => (
            <div key={e} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium", ESTADO_CONFIG[e].color)}>
              {ESTADO_CONFIG[e].icon}
              <span>{contadores[e as keyof typeof contadores]}</span>
              <span className="hidden md:inline">{ESTADO_CONFIG[e].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input
            type="text"
            placeholder="Buscar por N°, cliente u observación…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoPedido | "TODOS")}
          className="input w-auto"
        >
          <option value="TODOS">Todos los estados</option>
          {(Object.keys(ESTADO_CONFIG) as EstadoPedido[]).map((e) => (
            <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Truck size={40} className="text-surface-muted mb-3" />
          <p className="text-surface-muted font-medium">Sin pedidos delivery activos</p>
          <p className="text-surface-muted text-sm mt-1">Los pedidos tipo DELIVERY aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((pedido) => {
            const cfg = ESTADO_CONFIG[pedido.estado];
            const siguienteLabel = BOTON_LABEL[pedido.estado];
            const isLoading = loadingId === pedido.id;

            return (
              <div key={pedido.id} className="card flex flex-col gap-3">
                {/* Header tarjeta */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-surface-text text-lg">#{pedido.numero}</span>
                    <span className="text-surface-muted text-xs ml-2">{formatHora(pedido.creadoEn)}</span>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", cfg.color)}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Repartidor */}
                <p className="text-sm text-surface-muted">
                  <span className="font-medium text-surface-text">Asignado a:</span> {pedido.usuario}
                </p>

                {/* Observación */}
                {pedido.observacion && (
                  <p className="text-sm text-surface-muted bg-surface-bg rounded-lg px-3 py-2 border border-surface-border">
                    {pedido.observacion}
                  </p>
                )}

                {/* Detalles */}
                <div className="space-y-1">
                  {pedido.detalles.map((d) => (
                    <div key={d.id} className="flex justify-between text-sm">
                      <span className="text-surface-text">{d.nombre}</span>
                      <span className="text-surface-muted font-medium">×{d.cantidad}</span>
                    </div>
                  ))}
                </div>

                {/* Acción */}
                {siguienteLabel && (
                  <button
                    onClick={() => avanzarEstado(pedido)}
                    disabled={isLoading}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all",
                      pedido.estado === "PENDIENTE"
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : pedido.estado === "EN_PROCESO"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-violet-500 hover:bg-violet-600 text-white"
                    )}
                  >
                    {isLoading
                      ? <Loader2 size={15} className="animate-spin" />
                      : <CheckCircle2 size={15} />
                    }
                    {siguienteLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
