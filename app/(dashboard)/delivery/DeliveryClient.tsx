"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, MapPin, Phone, Clock, CheckCircle2, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Detalle { id: number; cantidad: number; producto: { nombre: string } | null; }
interface Repartidor { id: number; nombre: string; }
interface Pedido {
  id: number;
  estado: "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO";
  observacion: string | null;
  direccionEntrega: string | null;
  telefonoCliente: string | null;
  repartidorId: number | null;
  creadoEn: string;
  usuario: { nombre: string } | null;
  repartidor: { nombre: string } | null;
  detalles: Detalle[];
}

interface Props {
  pedidos: Pedido[];
  repartidores: Repartidor[];
  rol: string;
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En camino",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
};

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  EN_PROCESO: "bg-blue-50 text-blue-700 border-blue-200",
  LISTO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ENTREGADO: "bg-gray-50 text-gray-500 border-gray-200",
};

export function DeliveryClient({ pedidos: initial, repartidores, rol }: Props) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(initial);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const isAdmin = rol === "ADMIN_GENERAL" || rol === "ADMIN_SUCURSAL";
  const activos = pedidos.filter((p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO");
  const entregados = pedidos.filter((p) => p.estado === "ENTREGADO");

  async function cambiarEstado(id: number, estado: string) {
    setLoadingId(id);
    try {
      await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function asignarRepartidor(id: number, repartidorId: string) {
    setLoadingId(id);
    try {
      await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, repartidorId: repartidorId ? Number(repartidorId) : null }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  function PedidoCard({ p }: { p: Pedido }) {
    const hora = new Date(p.creadoEn).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    const loading = loadingId === p.id;

    return (
      <div className="card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-surface-muted">#{p.id}</span>
            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium border", ESTADO_COLOR[p.estado])}>
              {ESTADO_LABEL[p.estado] ?? p.estado}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-surface-muted">
            <Clock size={12} /> {hora}
          </span>
        </div>

        {/* Productos */}
        <div className="text-sm text-surface-text space-y-0.5">
          {p.detalles.map((d) => (
            <div key={d.id} className="flex gap-2">
              <span className="font-semibold text-brand-600 w-5 shrink-0">{d.cantidad}x</span>
              <span>{d.producto?.nombre ?? "—"}</span>
            </div>
          ))}
        </div>

        {/* Dirección */}
        {p.direccionEntrega && (
          <div className="flex items-start gap-2 text-sm text-surface-muted">
            <MapPin size={14} className="mt-0.5 shrink-0 text-orange-500" />
            <span>{p.direccionEntrega}</span>
          </div>
        )}
        {p.telefonoCliente && (
          <div className="flex items-center gap-2 text-sm text-surface-muted">
            <Phone size={14} className="shrink-0 text-blue-500" />
            <span>{p.telefonoCliente}</span>
          </div>
        )}

        {/* Repartidor */}
        {p.repartidor && (
          <div className="flex items-center gap-2 text-sm text-surface-muted">
            <Bike size={14} className="shrink-0 text-brand-500" />
            <span>{p.repartidor.nombre}</span>
          </div>
        )}

        {/* Admin: asignar repartidor */}
        {isAdmin && repartidores.length > 0 && p.estado !== "ENTREGADO" && (
          <select
            className="input text-sm"
            value={p.repartidorId ?? ""}
            onChange={(e) => asignarRepartidor(p.id, e.target.value)}
            disabled={loading}
          >
            <option value="">Sin repartidor</option>
            {repartidores.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        )}

        {/* Acciones */}
        {p.estado !== "ENTREGADO" && (
          <div className="flex gap-2 pt-1">
            {p.estado === "PENDIENTE" && (
              <button
                onClick={() => cambiarEstado(p.id, "EN_PROCESO")}
                disabled={loading}
                className="btn-primary flex-1 justify-center text-sm py-1.5"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Bike size={14} />}
                En camino
              </button>
            )}
            {(p.estado === "EN_PROCESO" || p.estado === "LISTO") && (
              <button
                onClick={() => cambiarEstado(p.id, "ENTREGADO")}
                disabled={loading}
                className="btn-primary flex-1 justify-center text-sm py-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Entregado
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {activos.length === 0 && entregados.length === 0 ? (
        <div className="card p-12 text-center">
          <Bike size={40} className="mx-auto text-surface-muted mb-3" />
          <p className="text-surface-muted">No hay pedidos de delivery activos</p>
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                Activos ({activos.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activos.map((p) => <PedidoCard key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {entregados.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                Entregados hoy ({entregados.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {entregados.map((p) => <PedidoCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
