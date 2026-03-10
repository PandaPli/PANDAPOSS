"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, X, Printer, Loader2 } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface DetalleVenta {
  id: number;
  cantidad: number;
  precio: string | number;
  subtotal: string | number;
  producto: { nombre: string } | null;
  combo: { nombre: string } | null;
}

interface VentaDetalle {
  id: number;
  numero: string;
  total: string | number;
  subtotal: string | number;
  descuento: string | number;
  impuesto: string | number;
  metodoPago: string;
  estado: string;
  creadoEn: string;
  cliente: { nombre: string } | null;
  usuario: { nombre: string };
  detalles: DetalleVenta[];
  pagos: { metodoPago: string; monto: string | number }[];
}

interface VentaRow {
  id: number;
  numero: string;
  creadoEn: string | Date;
  cliente: { nombre: string } | null;
  usuario: { nombre: string };
  metodoPago: string;
  total: string | number;
  estado: string;
  _count: { detalles: number };
}

interface Props {
  ventas: VentaRow[];
  simbolo: string;
  autoOpenId?: number | null;
}

const estadoBadge: Record<string, string> = {
  PAGADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  ANULADA: "bg-red-50 text-red-700 border-red-200",
};

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
  MIXTO: "Mixto",
};

export function VentasClient({ ventas, simbolo, autoOpenId }: Props) {
  const router = useRouter();
  const [boleta, setBoleta] = useState<VentaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function abrirBoleta(id: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ventas/${id}`);
      if (!res.ok) throw new Error("No se pudo cargar la venta");
      const data = await res.json();
      setBoleta(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function cerrarBoleta() {
    setBoleta(null);
    // Limpiar el param ?nueva de la URL sin recargar la página
    router.replace("/ventas", { scroll: false });
  }

  function imprimirBoleta() {
    if (!boleta) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;

    const fecha = new Date(boleta.creadoEn).toLocaleString("es-CL");
    const lineas = boleta.detalles
      .map(
        (d) =>
          `<tr>
            <td style="padding:2px 4px">${d.producto?.nombre ?? d.combo?.nombre ?? "-"}</td>
            <td style="padding:2px 4px;text-align:center">${d.cantidad}</td>
            <td style="padding:2px 4px;text-align:right">${formatCurrency(Number(d.subtotal), simbolo)}</td>
          </tr>`
      )
      .join("");

    const descuento = Number(boleta.descuento);
    const impuesto = Number(boleta.impuesto);

    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Boleta ${boleta.numero}</title>
      <style>
        body{font-family:monospace;font-size:13px;margin:0;padding:16px;color:#111}
        h2{text-align:center;margin:0 0 4px}
        .center{text-align:center}
        .sep{border:none;border-top:1px dashed #999;margin:8px 0}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;border-bottom:1px solid #ccc;padding:2px 4px;font-size:11px;color:#555}
        .total{font-weight:bold;font-size:15px}
      </style>
      </head><body>
      <h2>PandaPoss</h2>
      <p class="center" style="margin:0;font-size:12px;color:#555">Boleta N° ${boleta.numero}</p>
      <p class="center" style="margin:4px 0 0;font-size:11px;color:#888">${fecha}</p>
      ${boleta.cliente ? `<p class="center" style="font-size:11px;color:#555;margin:2px 0">Cliente: ${boleta.cliente.nombre}</p>` : ""}
      <hr class="sep"/>
      <table>
        <thead><tr>
          <th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio</th>
        </tr></thead>
        <tbody>${lineas}</tbody>
      </table>
      <hr class="sep"/>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(Number(boleta.subtotal), simbolo)}</td></tr>
        ${descuento > 0 ? `<tr><td>Descuento</td><td style="text-align:right">- ${formatCurrency(descuento, simbolo)}</td></tr>` : ""}
        ${impuesto > 0 ? `<tr><td>IVA</td><td style="text-align:right">${formatCurrency(impuesto, simbolo)}</td></tr>` : ""}
        <tr class="total"><td>TOTAL</td><td style="text-align:right">${formatCurrency(Number(boleta.total), simbolo)}</td></tr>
      </table>
      <hr class="sep"/>
      <p class="center" style="font-size:11px;color:#888;margin-top:8px">¡Gracias por su compra!</p>
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  }

  // Auto-abrir boleta si viene ?nueva=ID
  useEffect(() => {
    if (autoOpenId) {
      abrirBoleta(autoOpenId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenId]);

  return (
    <>
      {/* Tabla de ventas */}
      <div className="card overflow-hidden">
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
                    <td className="px-4 py-3 font-mono font-medium text-surface-text">
                      {v.numero}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">
                      {formatDateTime(v.creadoEn)}
                    </td>
                    <td className="px-4 py-3 text-surface-text">
                      {v.cliente?.nombre ?? "Consumidor Final"}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">{v.usuario.nombre}</td>
                    <td className="px-4 py-3 text-surface-muted">
                      {metodoPagoLabel[v.metodoPago] ?? v.metodoPago}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">{v._count.detalles}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-500">
                      {formatCurrency(Number(v.total), simbolo)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                          estadoBadge[v.estado] ?? ""
                        }`}
                      >
                        {v.estado === "PAGADA" ? "Pagada" : v.estado === "ANULADA" ? "Anulada" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => abrirBoleta(v.id)}
                        className="p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Ver boleta"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-brand-500" />
            <span className="text-sm font-medium">Cargando boleta...</span>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Modal boleta */}
      {boleta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-bold text-surface-text text-lg">Boleta {boleta.numero}</h2>
                <p className="text-xs text-surface-muted mt-0.5">{new Date(boleta.creadoEn).toLocaleString("es-CL")}</p>
              </div>
              <button
                onClick={cerrarBoleta}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info cliente / vendedor */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-surface-muted text-xs">Cliente</span>
                  <p className="font-medium text-surface-text">{boleta.cliente?.nombre ?? "Consumidor Final"}</p>
                </div>
                <div>
                  <span className="text-surface-muted text-xs">Vendedor</span>
                  <p className="font-medium text-surface-text">{boleta.usuario.nombre}</p>
                </div>
              </div>

              {/* Detalle items */}
              <div className="border border-surface-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-bg border-b border-surface-border">
                      <th className="text-left px-3 py-2 text-xs font-medium text-surface-muted">Producto</th>
                      <th className="text-center px-3 py-2 text-xs font-medium text-surface-muted">Cant.</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-surface-muted">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {boleta.detalles.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2 text-surface-text">
                          {d.producto?.nombre ?? d.combo?.nombre ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-center text-surface-muted">{d.cantidad}</td>
                        <td className="px-3 py-2 text-right text-surface-text">
                          {formatCurrency(Number(d.subtotal), simbolo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="bg-surface-bg rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-surface-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(boleta.subtotal), simbolo)}</span>
                </div>
                {Number(boleta.descuento) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento</span>
                    <span>- {formatCurrency(Number(boleta.descuento), simbolo)}</span>
                  </div>
                )}
                {Number(boleta.impuesto) > 0 && (
                  <div className="flex justify-between text-surface-muted">
                    <span>IVA</span>
                    <span>{formatCurrency(Number(boleta.impuesto), simbolo)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-surface-text text-base border-t border-surface-border pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-brand-500">{formatCurrency(Number(boleta.total), simbolo)}</span>
                </div>
                <div className="flex justify-between text-surface-muted text-xs">
                  <span>Método de pago</span>
                  <span>{metodoPagoLabel[boleta.metodoPago] ?? boleta.metodoPago}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={imprimirBoleta}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  Imprimir boleta
                </button>
                <button
                  onClick={cerrarBoleta}
                  className="flex-1 py-2 rounded-xl border border-surface-border text-surface-muted hover:bg-surface-bg font-semibold text-sm transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
