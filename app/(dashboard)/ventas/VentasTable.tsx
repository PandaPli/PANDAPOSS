"use client";

import { useState } from "react";
import { Eye, X, Package, Loader2, Receipt, Printer, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { THERMAL_CSS } from "@/lib/print";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VentaRow {
  id: number;
  numero: string;
  creadoEn: string;
  estado: string;
  metodoPago: string;
  total: number;
  boletaEmitida: boolean;
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

interface PagoDetalle {
  metodoPago: string;
  monto: number;
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
  boletaEmitida: boolean;
  observacion: string | null;
  cliente:  { nombre: string; telefono?: string | null } | null;
  usuario:  { nombre: string };
  caja:     { nombre: string; sucursal: { nombre: string; simbolo: string; logoUrl: string | null } | null } | null;
  detalles: DetalleDetalle[];
  pagos:    PagoDetalle[];
  pedido:   { mesa: { nombre: string } | null } | null;
}

interface Props {
  ventas:  VentaRow[];
  simbolo: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Métodos que requieren emisión manual de boleta
const METODOS_MANUALES = new Set(["EFECTIVO", "TRANSFERENCIA", "CREDITO", "MIXTO"]);

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
const metodoPagoImpresion: Record<string, string> = { ...metodoPagoLabel };

function reimprimir(venta: VentaDetalle, simbolo: string) {
  const sim = venta.caja?.sucursal?.simbolo ?? simbolo;
  const logoUrl = venta.caja?.sucursal?.logoUrl ?? null;
  const printableLogoUrl = logoUrl ? new URL(logoUrl, window.location.origin).toString() : null;

  const fecha = new Date(venta.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora  = new Date(venta.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const itemsHtml = venta.detalles
    .map((d, i) => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "Item";
      return `
        <div class="item"${i < venta.detalles.length - 1 ? ' style="border-bottom:1px dotted #000;"' : ""}>
          <div class="iname">${nombre}</div>
          <div class="idetail"><span>${d.cantidad} x ${formatCurrency(Number(d.precio), sim)}</span><span>${formatCurrency(Number(d.subtotal), sim)}</span></div>
        </div>`;
    })
    .join("");

  const pagosHtml = venta.pagos
    .map((p) => `<div class="row"><span>${metodoPagoImpresion[p.metodoPago] ?? p.metodoPago}</span><span><b>${formatCurrency(Number(p.monto), sim)}</b></span></div>`)
    .join("");

  const mesaLabel = venta.pedido?.mesa?.nombre;

  const html = `
    <div class="ticket">
      <div class="hdr">
        ${printableLogoUrl ? `<img src="${printableLogoUrl}" class="logo" alt="Logo"/>` : ""}
        <p class="type">Boleta</p>
        <p class="num">Comprobante de pago · N° ${venta.id}</p>
      </div>
      <hr class="cut"/>
      <div class="meta">
        ${mesaLabel ? `<div class="row"><span>Mesa</span><span><b>${mesaLabel}</b></span></div>` : ""}
        <div class="row"><span>Atendió</span><span>${venta.usuario.nombre}</span></div>
        <div class="row"><span>Fecha</span><span>${fecha} ${hora}</span></div>
      </div>
      <hr class="cut"/>
      ${itemsHtml}
      <hr class="cut"/>
      <div class="meta">
        <div class="row"><span>Subtotal</span><span>${formatCurrency(Number(venta.subtotal), sim)}</span></div>
        ${Number(venta.descuento) > 0 ? `<div class="row"><span>Descuento</span><span>- ${formatCurrency(Number(venta.descuento), sim)}</span></div>` : ""}
        ${Number(venta.impuesto) > 0 ? `<div class="row"><span>Impuesto</span><span>${formatCurrency(Number(venta.impuesto), sim)}</span></div>` : ""}
      </div>
      <hr class="cut2"/>
      <div class="row total"><span>TOTAL PAGADO</span><span>${formatCurrency(Number(venta.total), sim)}</span></div>
      <hr class="cut"/>
      <p class="sec-title">Forma de pago</p>
      ${pagosHtml}
      <p class="footer">Gracias por tu visita</p>
      <p class="footer-sub">Documento no fiscal · Reimpresión</p>
    </div>`;

  const win = window.open("", "_blank", "width=360,height=820");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Boleta #${venta.id}</title><style>${THERMAL_CSS}</style></head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

// ─── Boleta badge (tabla) ─────────────────────────────────────────────────────

function BoletaBadge({
  metodoPago,
  boletaEmitida,
  ventaId,
  onChange,
}: {
  metodoPago: string;
  boletaEmitida: boolean;
  ventaId: number;
  onChange: (id: number, val: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  // TARJETA → auto, no se puede tocar
  if (!METODOS_MANUALES.has(metodoPago)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
        <CheckCircle2 size={11} />
        Auto
      </span>
    );
  }

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/ventas/${ventaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "TOGGLE_BOLETA" }),
      });
      const data = await res.json();
      if (res.ok) onChange(ventaId, data.boletaEmitida);
    } finally {
      setLoading(false);
    }
  }

  if (boletaEmitida) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title="Boleta emitida — clic para desmarcar"
        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
        Emitida
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title="Boleta pendiente — clic para marcar como emitida"
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />}
      Pendiente
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function VentaModal({
  venta: initial,
  simbolo,
  onClose,
  onBoletaChange,
}: {
  venta: VentaDetalle;
  simbolo: string;
  onClose: () => void;
  onBoletaChange: (id: number, val: boolean) => void;
}) {
  const [venta, setVenta] = useState(initial);
  const [toggling, setToggling] = useState(false);
  const esManual = METODOS_MANUALES.has(venta.metodoPago);

  async function toggleBoleta() {
    setToggling(true);
    try {
      const res = await fetch(`/api/ventas/${venta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "TOGGLE_BOLETA" }),
      });
      const data = await res.json();
      if (res.ok) {
        setVenta((v) => ({ ...v, boletaEmitida: data.boletaEmitida }));
        onBoletaChange(venta.id, data.boletaEmitida);
      }
    } finally {
      setToggling(false);
    }
  }

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
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${estadoBadge[venta.estado] ?? ""}`}>
              {estadoLabel[venta.estado] ?? venta.estado}
            </span>
            <button
              onClick={() => reimprimir(venta, simbolo)}
              className="flex items-center gap-1.5 rounded-xl border border-surface-border px-2.5 sm:px-3 py-1.5 text-xs font-medium text-surface-muted hover:bg-brand-50 hover:text-brand-600 transition-colors"
              title="Reimprimir boleta"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Reimprimir</span>
            </button>
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

          {/* Boleta emitida — solo métodos manuales */}
          {esManual && (
            <div className={`mx-4 mt-4 flex items-center justify-between rounded-xl border px-4 py-3 ${
              venta.boletaEmitida
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-300 bg-amber-50"
            }`}>
              <div className="flex items-center gap-2">
                {venta.boletaEmitida
                  ? <CheckCircle2 size={16} className="text-emerald-600" />
                  : <AlertCircle size={16} className="text-amber-600" />
                }
                <div>
                  <p className={`text-sm font-semibold ${venta.boletaEmitida ? "text-emerald-700" : "text-amber-700"}`}>
                    {venta.boletaEmitida ? "Boleta emitida" : "Boleta pendiente"}
                  </p>
                  <p className="text-xs text-surface-muted">
                    {venta.boletaEmitida
                      ? "Esta venta ya tiene boleta en tu sistema externo."
                      : "Recuerda emitir la boleta en tu sistema externo."}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleBoleta}
                disabled={toggling}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  venta.boletaEmitida
                    ? "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {toggling
                  ? <Loader2 size={12} className="animate-spin" />
                  : venta.boletaEmitida ? <X size={12} /> : <CheckCircle2 size={12} />
                }
                {venta.boletaEmitida ? "Desmarcar" : "Marcar como emitida"}
              </button>
            </div>
          )}

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

export function VentasTable({ ventas: initialVentas, simbolo }: Props) {
  const [ventas, setVentas] = useState(initialVentas);
  const [detalle, setDetalle]   = useState<VentaDetalle | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Actualizar boletaEmitida en la lista sin recargar página
  function handleBoletaChange(id: number, val: boolean) {
    setVentas((prev) => prev.map((v) => v.id === id ? { ...v, boletaEmitida: val } : v));
    if (detalle?.id === id) setDetalle((d) => d ? { ...d, boletaEmitida: val } : d);
  }

  // Pendientes de boleta hoy (métodos manuales, no emitidas, no anuladas)
  const pendientes = ventas.filter(
    (v) => METODOS_MANUALES.has(v.metodoPago) && !v.boletaEmitida && v.estado !== "ANULADA"
  );

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
      {/* Alerta boletas pendientes */}
      {pendientes.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{pendientes.length} venta{pendientes.length > 1 ? "s" : ""} sin boleta emitida</span>
            {" "}— revisa los pagos en Efectivo o Transferencia y marca cada boleta en tu sistema externo.
          </p>
        </div>
      )}

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
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Boleta</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-surface-muted">
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
                      <BoletaBadge
                        metodoPago={v.metodoPago}
                        boletaEmitida={v.boletaEmitida}
                        ventaId={v.id}
                        onChange={handleBoletaChange}
                      />
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
          onBoletaChange={handleBoletaChange}
        />
      )}
    </>
  );
}
