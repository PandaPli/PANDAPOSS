"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TableMap } from "@/components/pos/TableMap";
import { InactivityScreen } from "@/components/InactivityScreen";
import type { MesaConEstado } from "@/types";
import { X, Maximize, Minimize, LogIn, Trash2, AlertTriangle, History, Printer, Receipt } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";

interface Props {
  mesas: MesaConEstado[];
}

interface ItemPreview {
  nombre: string;
  cantidad: number;
}

interface VentaHistorial {
  id: number;
  numero: string;
  creadoEn: string;
  total: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  metodoPago: string;
  usuario: { nombre: string };
  caja: { sucursal: { simbolo: string; logoUrl: string | null } | null } | null;
  detalles: {
    id: number;
    cantidad: number;
    precio: number;
    subtotal: number;
    descuento: number;
    producto: { nombre: string } | null;
    combo: { nombre: string } | null;
  }[];
  pagos: { metodoPago: string; monto: number }[];
  pedido: { mesa: { nombre: string } | null } | null;
}

const metodoPagoImpresion: Record<string, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia", CREDITO: "Crédito", MIXTO: "Mixto",
};

function reimprimirVenta(venta: VentaHistorial, simboloFallback: string) {
  const sim = venta.caja?.sucursal?.simbolo ?? simboloFallback;
  const logoUrl = venta.caja?.sucursal?.logoUrl ?? null;
  const printableLogoUrl = logoUrl ? new URL(logoUrl, window.location.origin).toString() : null;

  const fecha = new Date(venta.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora  = new Date(venta.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const itemsHtml = venta.detalles
    .map((d, i) => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "Item";
      return `
        <div class="item" style="${i < venta.detalles.length - 1 ? "border-bottom:1px dotted #eee;" : ""}">
          <div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;"><span style="flex:1;">${nombre}</span></div>
          <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#666;margin-top:2px;">
            <span>${d.cantidad} x ${formatCurrency(Number(d.precio), sim)}</span>
            <span style="font-weight:bold;color:#000;">${formatCurrency(Number(d.subtotal), sim)}</span>
          </div>
        </div>`;
    })
    .join("");

  const pagosHtml = venta.pagos
    .map((p) => `<div class="row"><span>${metodoPagoImpresion[p.metodoPago] ?? p.metodoPago}</span><span style="font-weight:bold;color:#000;">${formatCurrency(Number(p.monto), sim)}</span></div>`)
    .join("");

  const mesaLabel = venta.pedido?.mesa?.nombre;

  const html = `
    <div class="ticket">
      <div class="logo-wrap">
        ${printableLogoUrl ? `<img src="${printableLogoUrl}" alt="Logo" class="logo" />` : ""}
        <p class="title">Boleta</p>
        <p class="subtitle">Comprobante de pago</p>
        <p class="subtitle">Venta #${venta.id}</p>
      </div>
      <div class="divider"></div>
      <div class="section-block">
        ${mesaLabel ? `<div class="row"><span>Mesa:</span><span style="font-weight:bold;">${mesaLabel}</span></div>` : ""}
        <div class="row"><span>Vendedor:</span><span>${venta.usuario.nombre}</span></div>
        <div class="row"><span>Fecha:</span><span>${fecha} ${hora}</span></div>
      </div>
      <div class="divider"></div>
      <div>${itemsHtml}</div>
      <div class="divider"></div>
      <div class="section-block">
        <div class="row"><span>Subtotal</span><span>${formatCurrency(Number(venta.subtotal), sim)}</span></div>
        ${Number(venta.descuento) > 0 ? `<div class="row row-green"><span>Descuento</span><span>- ${formatCurrency(Number(venta.descuento), sim)}</span></div>` : ""}
        ${Number(venta.impuesto) > 0 ? `<div class="row"><span>Impuesto</span><span>${formatCurrency(Number(venta.impuesto), sim)}</span></div>` : ""}
        <div class="divider divider-tight"></div>
        <div class="total-box">
          <div class="total-row"><span>TOTAL PAGADO</span><span>${formatCurrency(Number(venta.total), sim)}</span></div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="section-block">
        <p class="section-title">Detalle de pago</p>
        ${pagosHtml}
      </div>
      <div class="footer-note">Gracias por tu visita</div>
      <div class="document-note">Documento no fiscal · Reimpresión</div>
    </div>`;

  const printWindow = window.open("", "_blank", "width=360,height=820");
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Boleta #${venta.id}</title><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    @page{size:80mm auto;margin:0;}
    body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:10px;color:#111;background:#fff;}
    .ticket{width:100%}.logo-wrap{text-align:center;margin-bottom:8px;}
    .logo{width:72px;height:72px;object-fit:contain;display:block;margin:0 auto 6px;}
    .title{text-align:center;font-weight:bold;font-size:14px;}.subtitle{text-align:center;font-size:11px;color:#666;}
    .divider{border-top:1px dashed #ccc;margin:8px 0;}.divider-tight{margin:6px 0;}
    .section-block{font-size:12px;}.section-title{text-align:center;font-size:11px;font-weight:bold;color:#444;margin-bottom:6px;text-transform:uppercase;}
    .row{display:flex;justify-content:space-between;gap:8px;padding:2px 0;}.row-green{color:#059669;}
    .item{padding:4px 0;}.total-box{margin-top:6px;border:1px dashed #2563eb;border-radius:8px;padding:8px;background:#eff6ff;}
    .total-row{display:flex;justify-content:space-between;gap:8px;font-size:16px;font-weight:bold;color:#1d4ed8;}
    .footer-note{margin-top:12px;text-align:center;font-size:11px;color:#374151;}
    .document-note{margin-top:4px;text-align:center;font-size:10px;color:#6b7280;}
  </style></head><body>${html}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

export function MesasClient({ mesas }: Props) {
  const router = useRouter();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConEstado | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [itemsPreview, setItemsPreview] = useState<ItemPreview[]>([]);
  const [loadingBorrar, setLoadingBorrar] = useState(false);
  const [liberando, setLiberando] = useState(false);
  const [historialVentas, setHistorialVentas] = useState<VentaHistorial[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  async function cargarHistorial(mesaId: number) {
    setLoadingHistorial(true);
    try {
      const res = await fetch(`/api/mesas/${mesaId}/ventas`);
      const data = await res.json();
      if (res.ok) {
        setHistorialVentas(data);
        setShowHistorial(true);
        setMesaSeleccionada(null);
      }
    } finally {
      setLoadingHistorial(false);
    }
  }

  async function cambiarEstado(id: number, estado: string) {
    await fetch("/api/mesas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    router.refresh();
    setMesaSeleccionada(null);
  }

  async function handleBorrarMesa() {
    if (!mesaSeleccionada) return;
    setLoadingBorrar(true);
    try {
      const res = await fetch(`/api/mesas/${mesaSeleccionada.id}`);
      const data = await res.json();
      setItemsPreview(data.items ?? []);
      setShowConfirmar(true);
    } finally {
      setLoadingBorrar(false);
    }
  }

  async function confirmarLiberar() {
    if (!mesaSeleccionada) return;
    setLiberando(true);
    try {
      await fetch(`/api/mesas/${mesaSeleccionada.id}`, { method: "DELETE" });
      setShowConfirmar(false);
      setMesaSeleccionada(null);
      router.refresh();
    } finally {
      setLiberando(false);
    }
  }

  return (
    <InactivityScreen>
      {/* Encabezado con botón fullscreen */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Atención</h1>
          <p className="text-surface-muted text-sm mt-1">Puntos de atención y estado de mesas</p>
        </div>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-medium text-surface-muted shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span className="hidden sm:inline">{isFullscreen ? "Salir" : "Pantalla completa"}</span>
        </button>
      </div>

      <TableMap mesas={mesas} onSelectMesa={setMesaSeleccionada} />

      {/* Modal detalle mesa */}
      {mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-bold text-surface-text text-lg">{mesaSeleccionada.nombre}</h2>
                <p className="text-sm text-surface-muted">{mesaSeleccionada.sala.nombre}</p>
              </div>
              <button
                onClick={() => setMesaSeleccionada(null)}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {mesaSeleccionada.pedidoActivo ? (
                <div className="space-y-3">
                  <div className="bg-surface-bg rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Pedido activo:</span>
                      <span className="font-medium">#{mesaSeleccionada.pedidoActivo.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Productos:</span>
                      <span className="font-medium">{mesaSeleccionada.pedidoActivo._count.detalles}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Desde:</span>
                      <span className="font-medium">{formatDateTime(mesaSeleccionada.pedidoActivo.creadoEn)}</span>
                    </div>
                  </div>

                  {/* Entrar a la Mesa — acción principal */}
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
                  >
                    <LogIn size={17} />
                    Entrar a la Mesa
                  </a>

                  {/* Borrar y Liberar Mesa */}
                  <button
                    onClick={handleBorrarMesa}
                    disabled={loadingBorrar}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    {loadingBorrar ? "Cargando..." : "Borrar y Liberar Mesa"}
                  </button>

                  {/* Ver historial */}
                  <button
                    onClick={() => cargarHistorial(mesaSeleccionada.id)}
                    disabled={loadingHistorial}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border px-4 py-2.5 text-sm font-medium text-surface-muted transition-colors hover:bg-surface-bg disabled:opacity-50"
                  >
                    <History size={15} />
                    {loadingHistorial ? "Cargando..." : "Ver historial de ventas"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-surface-muted text-sm text-center py-2">Mesa disponible</p>
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
                  >
                    <LogIn size={17} />
                    Entrar a la Mesa
                  </a>
                  <button
                    onClick={() => cambiarEstado(mesaSeleccionada.id, "RESERVADA")}
                    className="btn-secondary w-full justify-center"
                  >
                    Marcar como Reservada
                  </button>
                  {/* Ver historial */}
                  <button
                    onClick={() => cargarHistorial(mesaSeleccionada.id)}
                    disabled={loadingHistorial}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border px-4 py-2.5 text-sm font-medium text-surface-muted transition-colors hover:bg-surface-bg disabled:opacity-50"
                  >
                    <History size={15} />
                    {loadingHistorial ? "Cargando..." : "Ver historial de ventas"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación — Borrar y Liberar Mesa */}
      {showConfirmar && mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-surface-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-surface-text">Borrar y Liberar Mesa</h3>
                <p className="text-sm text-surface-muted">{mesaSeleccionada.nombre}</p>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-surface-muted">
                Se eliminarán los siguientes productos del pedido activo:
              </p>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-surface-border divide-y divide-surface-border">
                {itemsPreview.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-surface-muted text-center">Sin productos</p>
                ) : (
                  itemsPreview.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-surface-text">{item.nombre}</span>
                      <span className="text-sm font-medium text-surface-muted">×{item.cantidad}</span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-red-500 font-medium">
                Esta acción no se puede deshacer. La mesa quedará libre.
              </p>
            </div>

            {/* Botones */}
            <div className="grid grid-cols-2 gap-3 p-5 pt-0">
              <button
                onClick={() => setShowConfirmar(false)}
                disabled={liberando}
                className="btn-secondary justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarLiberar}
                disabled={liberando}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {liberando ? "Liberando..." : "Sí, Borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal historial de ventas */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                  <History size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-surface-text">Historial de ventas</h3>
                  <p className="text-xs text-surface-muted">Últimas {historialVentas.length} ventas de esta mesa</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistorial(false)}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historialVentas.length === 0 ? (
                <p className="text-center text-surface-muted text-sm py-8">Sin ventas registradas para esta mesa</p>
              ) : (
                historialVentas.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border border-surface-border p-3 bg-white hover:bg-surface-bg transition-colors">
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-600 shrink-0">
                      <Receipt size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-bold text-surface-text">{v.numero}</p>
                      <p className="text-xs text-surface-muted">{formatDateTime(new Date(v.creadoEn))} · {v.usuario.nombre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand-600">
                        {formatCurrency(Number(v.total), v.caja?.sucursal?.simbolo ?? "$")}
                      </p>
                      <p className="text-xs text-surface-muted">{v.detalles.length} item{v.detalles.length !== 1 ? "s" : ""}</p>
                    </div>
                    <button
                      onClick={() => reimprimirVenta(v, v.caja?.sucursal?.simbolo ?? "$")}
                      className="p-2 rounded-lg text-surface-muted hover:text-brand-600 hover:bg-brand-50 transition-colors shrink-0"
                      title="Reimprimir boleta"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </InactivityScreen>
  );
}



