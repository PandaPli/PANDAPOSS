"use client";

import { useState, useMemo } from "react";
import { ArrowLeftRight, Banknote, CheckCircle2, CreditCard, Loader2, Plus, Printer, Trash2, X, Users } from "lucide-react";
import { useCartStore, getGrupoColor } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import { openPrintWindow, THERMAL_CSS } from "@/lib/print";
import type { CartItem, MetodoPago, PagoItem } from "@/types";

interface ReceiptItem {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface CompletedSale {
  ventaId: number;
  items: ReceiptItem[];
  subtotal: number;
  descuentoMonto: number;
  descuentoPorcentaje: number;
  impuestoMonto: number;
  impuestoPorcentaje: number;
  total: number;
  pagos: PagoItem[];
  mesaLabel?: string;
  grupoNombre?: string;
}

interface Props {
  simbolo?: string;
  cajaId?: number;
  usuarioId: number;
  logoUrl?: string | null;
  meseroNombre?: string;
  mesaNombre?: string;
  onClose: () => void;
  onSuccess: () => void;
  /** Grupo que se está cobrando (modo división de cuenta) */
  grupoNombre?: string;
  /** Ítems del grupo a cobrar */
  grupoItems?: CartItem[];
}

const metodos: { key: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { key: "EFECTIVO", label: "Efectivo", icon: <Banknote size={16} /> },
  { key: "TARJETA", label: "Tarjeta", icon: <CreditCard size={16} /> },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: <ArrowLeftRight size={16} /> },
];

export function CheckoutModal({
  simbolo = "$",
  cajaId,
  usuarioId,
  logoUrl,
  meseroNombre,
  mesaNombre,
  onClose,
  onSuccess,
  grupoNombre,
  grupoItems,
}: Props) {
  const {
    items: cartItems,
    total: cartTotal,
    subtotal: cartSubtotal,
    totalDescuento: cartTotalDescuento,
    totalIva: cartTotalIva,
    descuento,
    setDescuento,
    ivaPorc,
    setIva,
    mesaId,
    clienteId,
    pedidoId,
    clear,
    markGrupoPagado,
  } = useCartStore();

  // En modo grupo, usar grupoItems; si no, usar todos los ítems no cancelados/pagados
  const modoGrupo = !!grupoNombre && !!grupoItems;
  const items = modoGrupo ? grupoItems! : cartItems.filter((i) => !i.cancelado && !i.pagado);

  // Calcular totales según modo
  const subtotalValue = useMemo(() => {
    if (modoGrupo) return grupoItems!.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    return cartSubtotal();
  }, [modoGrupo, grupoItems, cartSubtotal]);

  const descuentoMonto = modoGrupo ? 0 : cartTotalDescuento();
  const impuestoMonto  = modoGrupo ? 0 : cartTotalIva();
  const totalValue     = modoGrupo ? subtotalValue : cartTotal();

  const [pagos, setPagos] = useState<PagoItem[]>([]);
  const [metodoActual, setMetodoActual] = useState<MetodoPago>("EFECTIVO");
  const [montoActual, setMontoActual] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vueltoFinal, setVueltoFinal] = useState(0);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

  const sumaPagos = pagos.reduce((acc, p) => acc + p.monto, 0);
  const pendiente = Math.max(0, totalValue - sumaPagos);
  const sobrepago = Math.max(0, sumaPagos - totalValue);

  function handleAgregarPago() {
    setError("");
    const monto = Number(montoActual);
    if (!montoActual || isNaN(monto) || monto <= 0) {
      setError("Ingrese un monto valido");
      return;
    }

    setPagos([...pagos, { metodoPago: metodoActual, monto }]);
    setMontoActual("");
  }

  function handlePagoTotal() {
    if (pendiente <= 0) return;
    setPagos([...pagos, { metodoPago: metodoActual, monto: pendiente }]);
    setMontoActual("");
  }

  function handleEliminarPago(index: number) {
    setPagos(pagos.filter((_, i) => i !== index));
  }

  function finalizeFlow() {
    onSuccess();
  }

  function handleImprimirBoleta() {
    if (!completedSale) return;

    const now = new Date();
    const fecha = now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const printableLogoUrl = logoUrl ? new URL(logoUrl, window.location.origin).toString() : null;

    const itemsHtml = completedSale.items
      .map((item, i) => `
        <div class="item"${i < completedSale.items.length - 1 ? ' style="border-bottom:1px dotted #000;"' : ""}>
          <div class="iname">${item.nombre}</div>
          <div class="idetail"><span>${item.cantidad} x ${formatCurrency(item.precio, simbolo)}</span><span>${formatCurrency(item.precio * item.cantidad, simbolo)}</span></div>
        </div>`)
      .join("");

    const pagosHtml = completedSale.pagos
      .map((p) => {
        const label = metodos.find((m) => m.key === p.metodoPago)?.label ?? p.metodoPago;
        return `<div class="row"><span>${label}</span><span><b>${formatCurrency(p.monto, simbolo)}</b></span></div>`;
      })
      .join("");

    const tip10 = completedSale.total * 1.1;
    const tip15 = completedSale.total * 1.15;
    const tip20 = completedSale.total * 1.2;

    const html = `
      <div class="ticket">
        <div class="hdr">
          ${printableLogoUrl ? `<img src="${printableLogoUrl}" class="logo" alt="Logo"/>` : ""}
          <p class="type">Boleta</p>
          <p class="num">Comprobante de pago · N° ${completedSale.ventaId}</p>
        </div>
        <hr class="cut"/>
        <div class="meta">
          ${completedSale.mesaLabel ? `<div class="row"><span>Mesa</span><span><b>${completedSale.mesaLabel}</b></span></div>` : ""}
          ${completedSale.grupoNombre ? `<div class="row"><span>Cuenta</span><span><b>${completedSale.grupoNombre}</b></span></div>` : ""}
          ${meseroNombre ? `<div class="row"><span>Atendió</span><span>${meseroNombre}</span></div>` : ""}
          <div class="row"><span>Fecha</span><span>${fecha} ${hora}</span></div>
        </div>
        <hr class="cut"/>
        ${itemsHtml}
        <hr class="cut"/>
        <div class="meta">
          <div class="row"><span>Subtotal</span><span>${formatCurrency(completedSale.subtotal, simbolo)}</span></div>
          ${completedSale.descuentoMonto > 0 ? `<div class="row"><span>Descuento (${completedSale.descuentoPorcentaje}%)</span><span>- ${formatCurrency(completedSale.descuentoMonto, simbolo)}</span></div>` : ""}
          ${completedSale.impuestoMonto > 0 ? `<div class="row"><span>IVA (${completedSale.impuestoPorcentaje}%)</span><span>${formatCurrency(completedSale.impuestoMonto, simbolo)}</span></div>` : ""}
        </div>
        <hr class="cut2"/>
        <div class="row total"><span>TOTAL PAGADO</span><span>${formatCurrency(completedSale.total, simbolo)}</span></div>
        <hr class="cut"/>
        <p class="sec-title">Propina sugerida</p>
        <div class="row"><span>10%</span><span><b>${formatCurrency(tip10, simbolo)}</b></span></div>
        <div class="row"><span>15%</span><span><b>${formatCurrency(tip15, simbolo)}</b></span></div>
        <div class="row"><span>20%</span><span><b>${formatCurrency(tip20, simbolo)}</b></span></div>
        <hr class="cut"/>
        <p class="sec-title">Forma de pago</p>
        ${pagosHtml}
        ${vueltoFinal > 0 ? `<div class="row"><span>Vuelto</span><span><b>${formatCurrency(vueltoFinal, simbolo)}</b></span></div>` : ""}
        <p class="footer">Gracias por tu visita</p>
        <p class="footer-sub">Documento no fiscal</p>
      </div>`;

    const win = window.open("", "_blank", "width=360,height=820");
    if (!win) { finalizeFlow(); return; }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Boleta</title><style>${THERMAL_CSS}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();

    finalizeFlow();
  }

  async function handleConfirmar() {
    if (items.length === 0) return;

    if (pagos.length === 0) {
      setError("Agregue al menos un metodo de pago");
      return;
    }

    if (sumaPagos < totalValue) {
      setError(`Falta ${formatCurrency(pendiente, simbolo)} por cubrir`);
      return;
    }

    setLoading(true);
    setError("");

    const metodoPagoFinal: MetodoPago = pagos.length > 1 ? "MIXTO" : pagos[0].metodoPago;
    const snapshotItems = items.map((item) => ({
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
    }));

    const body: Record<string, unknown> = {
      cajaId,
      clienteId,
      usuarioId,
      mesaId,
      metodoPago: metodoPagoFinal,
      subtotal: subtotalValue,
      descuento: descuentoMonto,
      impuesto: impuestoMonto,
      total: totalValue,
      pagos: pagos.map((p) => ({
        metodoPago: p.metodoPago,
        monto: p.monto,
        referencia: p.referencia,
      })),
      items: items.map((i) => ({
        productoId: i.tipo === "producto" ? i.id : null,
        comboId: i.tipo === "combo" ? i.id : null,
        cantidad: i.cantidad,
        precio: i.precio,
        subtotal: i.precio * i.cantidad,
      })),
    };

    if (modoGrupo) {
      // Modo grupo: no vincular pedidoId, enviar detalleIds para marcarlos como pagados
      body.modoGrupo = true;
      body.detalleIds = grupoItems!
        .map((i) => i.detalleId)
        .filter((id): id is number => id !== undefined);
    } else {
      // Modo normal: vincular pedidoId
      body.pedidoId = pedidoId || undefined;
    }

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errorMsg = "Error al registrar la venta";
        try {
          const d = await res.json();
          errorMsg = d.error ?? errorMsg;
        } catch {
          // respuesta no JSON
        }
        throw new Error(errorMsg);
      }

      const venta = await res.json();
      const tieneEfectivo = pagos.some((p) => p.metodoPago === "EFECTIVO");
      if (tieneEfectivo && sobrepago > 0) {
        setVueltoFinal(sobrepago);
      }

      setCompletedSale({
        ventaId: venta.id,
        items: snapshotItems,
        subtotal: subtotalValue,
        descuentoMonto,
        descuentoPorcentaje: descuento,
        impuestoMonto,
        impuestoPorcentaje: ivaPorc,
        total: totalValue,
        pagos: [...pagos],
        mesaLabel: mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : undefined),
        grupoNombre,
      });

      if (modoGrupo && grupoNombre) {
        // Marcar ítems del grupo como pagados en el store (no limpiar todo el carrito)
        markGrupoPagado(grupoNombre);
      } else {
        clear();
      }
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (completedSale) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl animate-scale-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="mb-1 text-xl font-bold text-surface-text">
            {modoGrupo ? `Grupo ${completedSale.grupoNombre} cobrado` : "Venta completada"}
          </h2>
          <p className="text-sm text-surface-muted">Total cobrado: {formatCurrency(completedSale.total, simbolo)}</p>
          {vueltoFinal > 0 && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-700">
              Vuelto: {formatCurrency(vueltoFinal, simbolo)}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-surface-border bg-surface-bg p-4 text-left">
            <p className="text-sm font-semibold text-surface-text">Impresion de boleta</p>
            <p className="mt-1 text-sm text-surface-muted">Deseas imprimir la boleta antes de continuar?</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={finalizeFlow} className="btn-secondary justify-center">
              No
            </button>
            <button onClick={handleImprimirBoleta} className="btn-primary justify-center">
              <Printer size={16} />
              Si, imprimir
            </button>
          </div>
        </div>
      </div>
    );
  }

  const grupoColor = grupoNombre ? getGrupoColor(grupoNombre) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-surface-border bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-surface-text">
              {modoGrupo ? `Cobrar Grupo ${grupoNombre}` : "Confirmar Pago"}
            </h2>
            {modoGrupo && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: grupoColor }} />
                <span className="text-xs text-surface-muted">{items.length} producto{items.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-surface-muted transition-all hover:bg-surface-bg hover:text-surface-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Resumen de ítems en modo grupo */}
          {modoGrupo && (
            <div className="rounded-xl border-2 p-3 space-y-1.5" style={{ borderColor: grupoColor, backgroundColor: `${grupoColor}10` }}>
              {items.map((item) => (
                <div key={item.detalleId ?? `${item.tipo}-${item.id}`} className="flex justify-between text-sm">
                  <span className="text-surface-text">{item.cantidad}x {item.nombre}</span>
                  <span className="font-semibold" style={{ color: grupoColor }}>{formatCurrency(item.precio * item.cantidad, simbolo)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 rounded-xl bg-surface-bg p-4 text-sm">
            {!modoGrupo && (
              <div className="flex justify-between text-surface-muted">
                <span>Subtotal ({items.length} productos)</span>
                <span>{formatCurrency(subtotalValue, simbolo)}</span>
              </div>
            )}
            {!modoGrupo && descuento > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento</span>
                <span>- {formatCurrency(descuentoMonto, simbolo)}</span>
              </div>
            )}
            {!modoGrupo && ivaPorc > 0 && (
              <div className="flex justify-between text-surface-muted">
                <span>IVA ({ivaPorc}%)</span>
                <span>{formatCurrency(impuestoMonto, simbolo)}</span>
              </div>
            )}
            <div className={`flex justify-between border-t border-surface-border pt-2 text-base font-bold text-surface-text ${modoGrupo ? "" : "mt-2"}`}>
              <span>Total</span>
              <span className="text-brand-500">{formatCurrency(totalValue, simbolo)}</span>
            </div>
          </div>

          {!modoGrupo && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Descuento (%)</label>
                <input type="number" min={0} max={100} value={descuento} onChange={(e) => setDescuento(Number(e.target.value))} className="input" />
              </div>
              <div>
                <label className="label">IVA (%)</label>
                <input type="number" min={0} max={100} value={ivaPorc} onChange={(e) => setIva(Number(e.target.value))} className="input" />
              </div>
            </div>
          )}

          {pagos.length > 0 && (
            <div>
              <label className="label">Pagos agregados</label>
              <div className="space-y-2">
                {pagos.map((pago, i) => {
                  const metodo = metodos.find((m) => m.key === pago.metodoPago);
                  return (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">{metodo?.icon}</span>
                        <span className="text-sm font-semibold text-emerald-700">{metodo?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-700">{formatCurrency(pago.monto, simbolo)}</span>
                        <button onClick={() => handleEliminarPago(i)} className="flex h-6 w-6 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-100">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className={`flex justify-between px-1 text-sm font-semibold ${pendiente > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  <span>{pendiente > 0 ? "Pendiente" : "Cubierto"}</span>
                  <span>
                    {pendiente > 0
                      ? formatCurrency(pendiente, simbolo)
                      : sobrepago > 0
                      ? `Vuelto: ${formatCurrency(sobrepago, simbolo)}`
                      : formatCurrency(0, simbolo)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {pendiente > 0 && (
            <div className="space-y-3">
              <label className="label">Agregar pago</label>
              <div className="grid grid-cols-3 gap-2">
                {metodos.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetodoActual(m.key)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-xs font-semibold transition-all ${
                      metodoActual === m.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-border text-surface-muted hover:bg-surface-bg"
                    }`}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Monto (pendiente: ${formatCurrency(pendiente, simbolo)})`}
                  value={montoActual}
                  onChange={(e) => setMontoActual(e.target.value)}
                  className="input flex-1 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregarPago()}
                />
                <button onClick={handleAgregarPago} className="flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600">
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={handlePagoTotal}
                className="w-full rounded-xl border-2 border-dashed border-surface-border py-2 text-sm font-medium text-surface-muted transition-all hover:border-brand-300 hover:text-brand-600"
              >
                Pagar {formatCurrency(pendiente, simbolo)} con {metodos.find((m) => m.key === metodoActual)?.label}
              </button>
            </div>
          )}

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button
            onClick={handleConfirmar}
            disabled={loading || items.length === 0 || pagos.length === 0 || sumaPagos < totalValue}
            className="btn-primary w-full py-3 text-base"
            style={grupoColor ? { backgroundColor: grupoColor, borderColor: grupoColor } : undefined}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : modoGrupo ? <Users size={18} /> : <CheckCircle2 size={18} />}
            {loading ? "Registrando..." : `Cobrar ${modoGrupo ? `Grupo ${grupoNombre} ` : ""}${formatCurrency(totalValue, simbolo)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
