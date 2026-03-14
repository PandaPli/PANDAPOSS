"use client";

import { useState } from "react";
import { Eye, X, Package, Loader2, Receipt } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VentaRow {
  id: number;
  numero: string;
  creadoEn: string;
  estado: string;
  metodoPago: string;
  total: number;
  cliente: { nombre: string } | null;
  usuario: { nombre: string };
  _count: { detalles: number };
}

interface DetalleDetalle {
  id: number;
  cantidad: number;
  precio: number;
  descuento: number;
  subtotal: number;
  producto: { nombre: string; imagen: string | null } | null;
  combo:    { nombre: string } | null;
}

interface VentaDetalle {
  id: number;
  numero: string;
  creadoEn: string;
  estado: string;
  metodoPago: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observacion: string | null;
  cliente:  { nombre: string; telefono?: string | null } | null;
  usuario:  { nombre: string };
  caja:     { nombre: string; sucursal: { nombre: string } | null } | null;
  detalles: DetalleDetalle[];
}

interface Props {
  ventas:  VentaRow[];
  simbolo: string;
}

// ─── Static maps ─────────────────────────────────────────────────────────────

const estadoBadge: Record<string, string> = {
  PAGADA:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDIENTE:"bg-amber-50 text-amber-700 border-amber-200",
  ANULADA:  "bg-red-50 text-red-700 border-red-200",
};
const estadoLabel: Record<string, string> = {
  PAGADA: "Pagada", PENDIENTE: "Pendiente", ANULADA: "Anulada",
};
const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia", CREDITO: "Crédito", MIXTO: "Mixto",
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function VentaModal({ venta, simbolo, onClose }: { venta: VentaDetalle; simbolo: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Receipt size={18} />
            </div>
            <div>
              <p className="font-bold text-surface-text font-mono text-sm">{venta.numero}</p>
              <p className="text-xs text-surface-muted">{formatDateTime(new Date(venta.creadoEn))}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${estadoBadge[venta.estado] ?? ""}`}>
              {estadoLabel[venta.estado] ?? venta.estado}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-surface-muted hover:bg-surface-bg hover:text-surface-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Info */}
          <div className="grid grid-cols-2 gap-px border-b border-surface-border bg-surface-border">
            {[
              { label: "Cliente",    value: venta.cliente?.nombre ?? "Consumidor Final" },
              { label: "Vendedor",   value: venta.usuario.nombre },
              { label: "Método",     value: metodoPagoLabel[venta.metodoPago] ?? venta.metodoPago },
              { label: "Caja",       value: venta.caja?.nombre ?? "—" },
            ].map((item) => (
              <div key={item.label} className="bg-white px-4 py-3">
                <p className="text-xs text-surface-muted">{item.label}</p>
                <p className="text-sm font-medium text-surface-text truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-surface-muted uppercase tracking-wide mb-3">
              Productos ({venta.detalles.length})
            </p>
            <div className="space-y-2">
              {venta.detalles.map((d) => {
                const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "Item";
                return (
                  <div key={d.id} className="flex items-center gap-3 py-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface-bg overflow-hidden">
                      {d.producto?.imagen ? (
                        <img src={d.producto.imagen} alt={nombre} className="h-full w-full object-cover" />
                      ) : (
                        <Package size={14} className="text-surface-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-text truncate">{nombre}</p>
                      <p className="text-xs text-surface-muted">
                        {d.cantidad} × {formatCurrency(Number(d.precio), simbolo)}
                        {Number(d.descuento) > 0 && (
                          <span className="ml-1 text-red-500">
                            − {formatCurrency(Number(d.descuento), simbolo)}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-surface-text shrink-0">
                      {formatCurrency(Number(d.subtotal), simbolo)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-surface-border mx-4 pt-3 pb-4 space-y-1.5">
            <div className="flex justify-between text-sm text-surface-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(venta.subtotal), simbolo)}</span>
            </div>
            {Number(venta.descuento) > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Descuento</span>
                <span>− {formatCurrency(Number(venta.descuento), simbolo)}</span>
              </div>
            )}
            {Number(venta.impuesto) > 0 && (
              <div className="flex justify-between text-sm text-surface-muted">
                <span>Impuesto</span>
                <span>{formatCurrency(Number(venta.impuesto), simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-surface-text pt-1 border-t border-surface-border">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(Number(venta.total), simbolo)}</span>
            </div>
          </div>

          {venta.observacion && (
            <div className="mx-4 mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <span className="font-semibold">Observación: </span>{venta.observacion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VentasTable({ ventas, simbolo }: Props) {
  const [detalle, setDetalle]   = useState<VentaDetalle | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function verDetalle(id: number) {
    setLoadingId(id);
    try {
      const res  = await fetch(`/api/ventas/${id}`);
      const data = await res.json();
      if (res.ok) setDetalle(data);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-surface-text">Últimas 50 ventas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="text-left px-4 py-3 font-medium text-surface-muted">N°</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Vendedor</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Método</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Items</th>
                <th className="text-right px-4 py-3 font-medium text-surface-muted">Total</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-surface-muted">
                    Sin ventas registradas
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-bg transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-surface-text">{v.numero}</td>
                    <td className="px-4 py-3 text-surface-muted">{formatDateTime(new Date(v.creadoEn))}</td>
                    <td className="px-4 py-3 text-surface-text">{v.cliente?.nombre ?? "Consumidor Final"}</td>
                    <td className="px-4 py-3 text-surface-muted">{v.usuario.nombre}</td>
                    <td className="px-4 py-3 text-surface-muted">{metodoPagoLabel[v.metodoPago] ?? v.metodoPago}</td>
                    <td className="px-4 py-3 text-surface-muted">{v._count.detalles}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-500">
                      {formatCurrency(Number(v.total), simbolo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge[v.estado] ?? ""}`}>
                        {estadoLabel[v.estado] ?? v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => verDetalle(v.id)}
                        disabled={loadingId === v.id}
                        className="p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Ver detalle"
                      >
                        {loadingId === v.id
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Eye size={15} />
                        }
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detalle && (
        <VentaModal
          venta={detalle}
          simbolo={simbolo}
          onClose={() => setDetalle(null)}
        />
      )}
    </>
  );
}
