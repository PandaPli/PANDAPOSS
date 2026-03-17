"use client";

import { useState, useMemo } from "react";
import { Eye, X, Package, Loader2, Receipt, Search } from "lucide-react";
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
  PAGADA:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  ANULADA:   "bg-red-50 text-red-700 border-red-200",
};
const estadoLabel: Record<string, string> = {
  PAGADA: "Pagada", PENDIENTE: "Pendiente", ANULADA: "Anulada",
};

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia", CREDITO: "Crédito", MIXTO: "Mixto",
};
const metodoBadge: Record<string, string> = {
  EFECTIVO:      "bg-emerald-50 text-emerald-700",
  TARJETA:       "bg-blue-50 text-blue-700",
  TRANSFERENCIA: "bg-purple-50 text-purple-700",
  CREDITO:       "bg-amber-50 text-amber-700",
  MIXTO:         "bg-slate-50 text-slate-600",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(dateStr: string): string {
  const date = new Date(dateStr);
  const now   = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `Hoy ${date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer ${date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  }) + ` ${date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
}

function shortNumero(numero: string): string {
  // VTA-MMQH7U43ZDC0 → muestra solo últimos 8 chars
  return numero.length > 10 ? "…" + numero.slice(-8) : numero;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function VentaModal({ venta, simbolo, onClose }: { venta: VentaDetalle; simbolo: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
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
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoBadge[venta.estado] ?? ""}`}>
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

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-px border-b border-surface-border bg-surface-border">
            {[
              { label: "Cliente",  value: venta.cliente?.nombre ?? "Consumidor Final" },
              { label: "Vendedor", value: venta.usuario.nombre },
              { label: "Método",   value: metodoPagoLabel[venta.metodoPago] ?? venta.metodoPago },
              { label: "Caja",     value: venta.caja?.nombre ?? "—" },
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
            <div className="space-y-1">
              {venta.detalles.map((d) => {
                const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "Item";
                return (
                  <div key={d.id} className="flex items-center gap-3 py-2 rounded-xl hover:bg-surface-bg px-2 transition-colors">
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
            <div className="flex justify-between text-base font-bold text-surface-text pt-1.5 border-t border-surface-border">
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
  const [detalle, setDetalle]     = useState<VentaDetalle | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [query, setQuery]         = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ventas;
    return ventas.filter((v) =>
      v.numero.toLowerCase().includes(q) ||
      (v.cliente?.nombre ?? "consumidor final").toLowerCase().includes(q) ||
      v.usuario.nombre.toLowerCase().includes(q) ||
      (metodoPagoLabel[v.metodoPago] ?? v.metodoPago).toLowerCase().includes(q)
    );
  }, [ventas, query]);

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

        {/* Table header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-surface-text">Historial de ventas</h3>
            <p className="text-xs text-surface-muted mt-0.5">
              {filtered.length} de {ventas.length} registros
            </p>
          </div>
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por N°, cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-bg py-2 pl-8 pr-3 text-sm text-surface-text placeholder:text-surface-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="text-left px-5 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide">N°</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide hidden md:table-cell">Vendedor</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide">Método</th>
                <th className="text-right px-4 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted text-xs uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-surface-muted">
                      <Search size={22} className="opacity-40" />
                      <p className="text-sm">
                        {query ? `Sin resultados para "${query}"` : "Sin ventas registradas"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-surface-bg transition-colors cursor-pointer group"
                    onClick={() => verDetalle(v.id)}
                  >
                    <td className="px-5 py-3">
                      <span
                        className="font-mono text-xs font-semibold text-surface-muted bg-surface-bg px-2 py-1 rounded-md"
                        title={v.numero}
                      >
                        {shortNumero(v.numero)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-muted whitespace-nowrap">
                      {formatFecha(v.creadoEn)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-surface-text">
                      {v.cliente?.nombre ?? (
                        <span className="text-surface-muted italic">Consumidor Final</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-muted hidden md:table-cell">
                      {v.usuario.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${metodoBadge[v.metodoPago] ?? "bg-surface-bg text-surface-muted"}`}>
                        {metodoPagoLabel[v.metodoPago] ?? v.metodoPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-600 whitespace-nowrap">
                      {formatCurrency(v.total, simbolo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoBadge[v.estado] ?? ""}`}>
                        {estadoLabel[v.estado] ?? v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); verDetalle(v.id); }}
                        disabled={loadingId === v.id}
                        className="p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
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
