"use client";

import { useCallback, useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, Receipt, Send, FileText, Loader2, Ban, Check, Users, X, Scissors, Clock } from "lucide-react";
import { useCartStore, getGrupoColor } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import type { CartItem, RondaPedido } from "@/types";

interface Props {
  simbolo?: string;
  onCheckout: () => void;
  onCheckoutGrupo?: (grupo: string) => void;
  onOrden: () => void;
  onPrecuenta: () => void;
  ordenLoading?: boolean;
  canCancelItems?: boolean;
  rondas?: RondaPedido[];
}

const GRUPOS_DISPONIBLES = ["A", "B", "C", "D", "E"];

/** Llama al API para persistir el cambio de un detalle en DB → KDS lo verá en próximo poll.
 *  Retorna true si tuvo éxito, false si falló. */
async function syncDetalle(detalleId: number, patch: { cancelado?: boolean; cantidad?: number; observacion?: string | null; grupo?: string | null }): Promise<boolean> {
  try {
    const res = await fetch(`/api/pedidos/detalles/${detalleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface SplitState {
  item: CartItem;
  cantidades: Record<string, number>;
}

export function CartPanel({ simbolo = "$", onCheckout, onCheckoutGrupo, onOrden, onPrecuenta, ordenLoading, canCancelItems = false, rondas = [] }: Props) {
  const {
    items, removeItem, updateCantidad, updateObservacion, cancelItem,
    subtotal, totalDescuento, totalIva, total, descuento, ivaPorc, pedidoId,
    setItemGrupo, splitItemGrupos, getGrupos, getItemsByGrupo, getSubtotalGrupo,
  } = useCartStore();

  const [dirtyObs, setDirtyObs] = useState<Record<string, string>>({});
  const [modoGrupos, setModoGrupos] = useState(false);
  // Auto-activar modo cuentas cuando hay ítems con grupo asignado
  const hayCuentas = items.some((i) => i.grupo && !i.cancelado && !i.pagado);
  const [splitDialog, setSplitDialog] = useState<SplitState | null>(null);

  const sub  = subtotal();
  const desc = totalDescuento();
  const iva  = totalIva();
  const tot  = total();

  const itemKey = (item: CartItem) =>
    item.detalleId ? `d-${item.detalleId}` : `${item.tipo}-${item.id}`;

  const grupos = getGrupos();

  /** Anular / reactivar ítem guardado → sincroniza con KDS; hace rollback local si falla */
  const handleCancel = useCallback(async (item: CartItem) => {
    const newCancelado = !item.cancelado;
    // Usar detalleId para cancelar SOLO este ítem (no todos los del mismo producto)
    cancelItem(item.id, item.tipo, item.detalleId);
    if (item.detalleId) {
      const ok = await syncDetalle(item.detalleId, { cancelado: newCancelado });
      if (!ok) {
        // Rollback: revertir solo este ítem
        cancelItem(item.id, item.tipo, item.detalleId);
      }
    }
  }, [cancelItem]);

  /** Guardar cambio de observación de ítem ya enviado a cocina */
  const handleSaveObs = useCallback(async (item: CartItem) => {
    const key = itemKey(item);
    const nuevaObs = dirtyObs[key] ?? item.observacion ?? "";
    updateObservacion(item.id, item.tipo, nuevaObs);
    setDirtyObs((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (item.detalleId) {
      await syncDetalle(item.detalleId, { observacion: nuevaObs || null });
    }
  }, [dirtyObs, updateObservacion]);

  /** Asignar grupo a un ítem */
  const handleSetGrupo = useCallback(async (item: CartItem, grupo: string | null) => {
    if (!item.detalleId) return;
    setItemGrupo(item.detalleId, grupo);
    await syncDetalle(item.detalleId, { grupo });
  }, [setItemGrupo]);

  /** Abrir diálogo de división de cantidades */
  const handleOpenSplit = (item: CartItem) => {
    const init: Record<string, number> = {};
    if (item.grupo) init[item.grupo] = item.cantidad;
    setSplitDialog({ item, cantidades: init });
  };

  /** Confirmar división — crea nuevos DetallePedido en DB para cada grupo */
  const handleConfirmSplit = async () => {
    if (!splitDialog || !splitDialog.item.detalleId) return;
    const { item, cantidades } = splitDialog;
    const totalAsignado = Object.values(cantidades).reduce((a, b) => a + b, 0);
    if (totalAsignado !== item.cantidad) return;

    const gruposUsados = Object.entries(cantidades).filter(([, c]) => c > 0);
    if (gruposUsados.length < 2) return;

    // Llamar al endpoint para crear registros reales en DB
    try {
      const res = await fetch(`/api/pedidos/detalles/${item.detalleId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splits: gruposUsados.map(([grupo, cantidad]) => ({ grupo, cantidad })),
        }),
      });

      if (!res.ok) {
        console.error("Error al dividir el detalle:", await res.text());
        return;
      }

      const data = await res.json() as {
        splits: { grupo: string; cantidad: number; detalleId: number }[];
      };

      // Dividir localmente en el store usando los detalleIds reales de la DB
      splitItemGrupos(item.detalleId!, data.splits.map((s) => ({
        grupo: s.grupo,
        cantidad: s.cantidad,
        newDetalleId: s.detalleId,
      })));
    } catch (err) {
      console.error("Error al dividir:", err);
      return;
    }

    setSplitDialog(null);
  };

  const renderItem = (item: CartItem, showGrupoSelector = false) => {
    const key = itemKey(item);
    const obsValue = dirtyObs[key] ?? item.observacion ?? "";
    const obsDirty = key in dirtyObs && dirtyObs[key] !== (item.observacion ?? "");

    return (
      <div
        key={key}
        className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
          item.cancelado ? "bg-gray-100 opacity-60" :
          item.pagado ? "bg-green-50 opacity-60" :
          "bg-surface-bg"
        }`}
      >
        {/* Indicador de grupo (punto de color) en modo grupos */}
        {modoGrupos && item.grupo && !item.cancelado && !item.pagado && (
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: getGrupoColor(item.grupo) }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold truncate ${item.cancelado ? "line-through text-gray-400" : item.pagado ? "text-gray-400" : "text-surface-text"}`}>
              {item.nombre}
            </p>
            {item.cancelado ? (
              <span className="bg-red-100 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold">ANULADO</span>
            ) : item.pagado ? (
              <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded font-bold">PAGADO</span>
            ) : item.guardado ? (
              <span title="Enviado a cocina" className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">ENVIADO</span>
            ) : null}
          </div>

          <p className={`text-xs font-medium mt-0.5 ${item.cancelado || item.pagado ? "line-through text-gray-400" : "text-brand-500"}`}>
            {formatCurrency(item.precio * item.cantidad, simbolo)}
            {item.cantidad > 1 && <span className="ml-1 text-surface-muted">({item.cantidad}x)</span>}
          </p>

          {/* Selector de grupo en modo grupos */}
          {modoGrupos && !item.cancelado && !item.pagado && item.detalleId && (
            <div className="mt-1.5 flex items-center gap-1 flex-wrap">
              {GRUPOS_DISPONIBLES.map((g) => {
                const enEsteGrupo = items.filter((i) => i.grupo === g && !i.cancelado && !i.pagado).length;
                const esMio = item.grupo === g;
                return (
                  <button
                    key={g}
                    onClick={() => handleSetGrupo(item, esMio ? null : g)}
                    title={enEsteGrupo > 0 ? `Grupo ${g} — ${enEsteGrupo} ítem(s)` : `Asignar al Grupo ${g}`}
                    className="relative w-6 h-6 rounded-full text-[11px] font-black border-2 transition-all flex items-center justify-center"
                    style={{
                      backgroundColor: esMio ? getGrupoColor(g) : enEsteGrupo > 0 ? `${getGrupoColor(g)}22` : "transparent",
                      borderColor: getGrupoColor(g),
                      color: esMio ? "white" : getGrupoColor(g),
                    }}
                  >
                    {g}
                    {enEsteGrupo > 0 && !esMio && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[8px] font-black flex items-center justify-center text-white"
                        style={{ backgroundColor: getGrupoColor(g) }}>
                        {enEsteGrupo}
                      </span>
                    )}
                  </button>
                );
              })}
              {/* Botón dividir — solo si cantidad > 1 y está guardado */}
              {item.cantidad > 1 && item.guardado && (
                <button
                  onClick={() => handleOpenSplit(item)}
                  title="Dividir entre grupos"
                  className="w-6 h-6 rounded-full border-2 border-surface-border text-surface-muted hover:border-brand-400 hover:text-brand-500 transition-all flex items-center justify-center"
                >
                  <Scissors size={10} />
                </button>
              )}
            </div>
          )}

          {!item.cancelado && !item.pagado && (
            <div className="mt-1.5 flex items-center gap-1">
              <input
                type="text"
                value={obsValue}
                onChange={(e) => {
                  if (item.guardado) {
                    setDirtyObs((prev) => ({ ...prev, [key]: e.target.value }));
                  } else {
                    updateObservacion(item.id, item.tipo, e.target.value);
                  }
                }}
                placeholder="Nota: sin sal, poco hielo..."
                className="flex-1 text-xs px-2 py-1 rounded-lg border border-surface-border bg-white text-surface-text placeholder:text-surface-muted focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
              />
              {item.guardado && obsDirty && (
                <button
                  onClick={() => handleSaveObs(item)}
                  title="Enviar nota a cocina"
                  className="w-6 h-6 rounded-md bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-all flex-shrink-0"
                >
                  <Check size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!item.guardado && !item.cancelado && !item.pagado && (
            <>
              <button
                onClick={() => updateCantidad(item.id, item.tipo, item.cantidad - 1, item.detalleId)}
                className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-brand-50 hover:border-brand-200 transition-all"
              >
                <Minus size={12} />
              </button>
              <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
              <button
                onClick={() => updateCantidad(item.id, item.tipo, item.cantidad + 1, item.detalleId)}
                className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-brand-50 hover:border-brand-200 transition-all"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={() => removeItem(item.id, item.tipo, item.detalleId)}
                className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-all ml-1"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}

          {item.guardado && canCancelItems && !item.pagado && (
            <button
              onClick={() => handleCancel(item)}
              title={item.cancelado ? "Reactivar producto" : "Anular producto"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ml-1 ${
                item.cancelado
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  : "text-red-400 hover:bg-red-50"
              }`}
            >
              <Ban size={12} />
            </button>
          )}

          {item.guardado && !canCancelItems && !item.cancelado && !item.pagado && (
            <span className="w-5 text-center text-sm font-bold text-surface-muted">{item.cantidad}</span>
          )}
        </div>
      </div>
    );
  };

  // Ítems sin grupo asignado
  const modoCuentas = modoGrupos || hayCuentas;
  const itemsSinGrupo = modoCuentas
    ? items.filter((i) => !i.grupo && !i.cancelado && !i.pagado)
    : [];

  // Separación nuevo / enviado (para vista normal, sin grupos)
  const itemsNuevos    = items.filter((i) => !i.guardado && !i.cancelado && !i.pagado);
  const itemsEnviados  = items.filter((i) =>  i.guardado);
  const hayAmbos       = itemsNuevos.length > 0 && itemsEnviados.length > 0;

  /** Formatea hora de una ronda de forma discreta */
  function formatRondaHora(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-surface-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
        <ShoppingCart size={16} className="text-brand-500" />
        <h2 className="text-sm font-bold text-surface-text">Carrito</h2>
        {items.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
            {items.filter((i) => !i.cancelado && !i.pagado).length}
          </span>
        )}
        {/* Toggle modo grupos — solo si hay ítems guardados */}
        {(items.some((i) => i.guardado && !i.cancelado) || hayCuentas) && (
          <button
            onClick={() => setModoGrupos((v) => !v)}
            title={modoCuentas ? "Ver todo junto" : "Dividir por cuentas"}
            className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              modoCuentas
                ? "bg-brand-500 text-white"
                : "bg-surface-bg border border-surface-border text-surface-muted hover:border-brand-300 hover:text-brand-500"
            }`}
          >
            <Users size={12} />
            {modoCuentas ? "Cuentas" : "Dividir"}
          </button>
        )}
      </div>


      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {items.length === 0 && rondas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-muted">
            <ShoppingCart size={32} className="mb-2 opacity-20" />
            <p className="text-sm font-medium">El carrito esta vacio</p>
            <p className="text-xs mt-1 opacity-60">Selecciona productos del menu</p>
          </div>
        ) : modoCuentas ? (
          <>
            {/* Modo grupos: ítems agrupados por grupo */}
            {grupos.map((grupo) => {
              const grupoItems = getItemsByGrupo(grupo);
              const grupoSub = getSubtotalGrupo(grupo);
              const color = getGrupoColor(grupo);
              return (
                <div key={grupo}>
                  {/* Encabezado de grupo */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold text-surface-text" style={{ color }}>
                      Grupo {grupo}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-surface-muted">
                      {formatCurrency(grupoSub, simbolo)}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-1 border-l-2 rounded" style={{ borderColor: color }}>
                    {grupoItems.map((item) => renderItem(item, true))}
                  </div>
                </div>
              );
            })}

            {/* Ítems cancelados/pagados al final */}
            {items.filter((i) => i.cancelado || i.pagado).map((item) => renderItem(item, false))}

            {/* Ítems sin grupo */}
            {itemsSinGrupo.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-3 h-3 rounded-full bg-surface-muted flex-shrink-0" />
                  <span className="text-xs font-bold text-surface-muted">Sin grupo</span>
                </div>
                <div className="space-y-1.5 pl-1 border-l-2 border-dashed border-surface-border">
                  {itemsSinGrupo.map((item) => renderItem(item, true))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Ítems nuevos (aún no enviados a cocina) */}
            {itemsNuevos.length > 0 && (
              <div>
                {(rondas.length > 0 || itemsEnviados.length > 0) && (
                  <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wide px-1 mb-1.5">
                    Por enviar
                  </p>
                )}
                <div className="space-y-2">
                  {itemsNuevos.map((item) => renderItem(item, false))}
                </div>
              </div>
            )}

            {/* Historial de rondas */}
            {rondas.length > 0 && (
              <div className="space-y-3 mt-1">
                {rondas.map((ronda) => (
                  <div key={ronda.pedidoId}>
                    {/* Encabezado de ronda */}
                    <div className="flex items-center gap-1.5 px-1 mb-1.5">
                      <Send size={10} className="text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                        Ronda {ronda.numero}
                      </p>
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-surface-muted">
                        <Clock size={9} />
                        {formatRondaHora(ronda.creadoEn)} hrs
                      </span>
                    </div>
                    {/* Productos de la ronda — sin agrupación */}
                    <div className="space-y-1 pl-2 border-l-2 border-amber-200 rounded">
                      {ronda.items.map((d, i) => (
                        <div
                          key={i}
                          className={`flex items-baseline gap-2 px-2 py-1 rounded-lg text-sm ${
                            d.cancelado ? "opacity-50" : "bg-surface-bg"
                          }`}
                        >
                          <span className={`font-bold text-brand-500 flex-shrink-0 text-xs ${d.cancelado ? "line-through text-gray-400" : ""}`}>
                            {d.cantidad}x
                          </span>
                          <span className={`flex-1 text-xs font-semibold ${d.cancelado ? "line-through text-gray-400" : "text-surface-text"}`}>
                            {d.nombre}
                          </span>
                          {d.cancelado && (
                            <span className="text-[9px] font-bold text-red-400 bg-red-50 px-1 rounded">ANULADO</span>
                          )}
                        </div>
                      ))}
                      {/* Observaciones por ítem (discretas) */}
                      {ronda.items.filter((d) => d.observacion && !d.cancelado).map((d, i) => (
                        <p key={`obs-${i}`} className="text-[10px] text-surface-muted italic pl-7">
                          ↳ {d.observacion}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fallback: ítems enviados sin rondas (caso sin mesa) */}
            {rondas.length === 0 && itemsEnviados.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 mb-1.5">
                  <Send size={11} className="text-amber-500" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                    {pedidoId ? `Último pedido #${pedidoId}` : "Último pedido enviado"}
                  </p>
                </div>
                <div className="space-y-2 pl-1 border-l-2 border-amber-200 rounded">
                  {itemsEnviados.map((item) => renderItem(item, false))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diálogo de división de cantidades */}
      {splitDialog && (
        <div className="mx-3 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-blue-700">
              Dividir: {splitDialog.item.nombre} ({splitDialog.item.cantidad}x)
            </p>
            <button onClick={() => setSplitDialog(null)} className="text-blue-400 hover:text-blue-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {GRUPOS_DISPONIBLES.map((g) => {
              const color = getGrupoColor(g);
              const val = splitDialog.cantidades[g] ?? 0;
              return (
                <div key={g} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: color }}>
                    {g}
                  </div>
                  <span className="text-xs text-surface-text w-14">Grupo {g}</span>
                  <button onClick={() => setSplitDialog((s) => s ? { ...s, cantidades: { ...s.cantidades, [g]: Math.max(0, val - 1) } } : s)}
                    className="w-5 h-5 rounded border border-surface-border flex items-center justify-center hover:bg-white text-xs">-</button>
                  <span className="w-4 text-center text-xs font-bold">{val}</span>
                  <button onClick={() => setSplitDialog((s) => s ? { ...s, cantidades: { ...s.cantidades, [g]: val + 1 } } : s)}
                    className="w-5 h-5 rounded border border-surface-border flex items-center justify-center hover:bg-white text-xs">+</button>
                </div>
              );
            })}
          </div>
          {/* Total asignado */}
          {(() => {
            const asignado = Object.values(splitDialog.cantidades).reduce((a, b) => a + b, 0);
            const ok = asignado === splitDialog.item.cantidad;
            return (
              <div className={`flex items-center justify-between text-xs ${ok ? "text-green-600" : "text-amber-600"}`}>
                <span>{ok ? "✓ Listo para dividir" : `Asignado: ${asignado} / ${splitDialog.item.cantidad}`}</span>
                <button
                  onClick={handleConfirmSplit}
                  disabled={!ok}
                  className="px-2 py-1 rounded-lg bg-blue-500 text-white font-semibold disabled:opacity-40 hover:bg-blue-600 transition-all"
                >
                  Confirmar
                </button>
              </div>
            );
          })()}
        </div>
      )}


      {/* Totales + Botones */}
      {items.length > 0 && (
        <div className="border-t border-surface-border p-3 space-y-2.5">
          {modoCuentas && grupos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-surface-muted">Cobrar por cuenta:</p>
              {grupos.map((grupo) => {
                const grupoSub = getSubtotalGrupo(grupo);
                const color = getGrupoColor(grupo);
                return (
                  <button
                    key={grupo}
                    onClick={() => onCheckoutGrupo?.(grupo)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-all hover:opacity-80"
                    style={{ borderColor: color, color, backgroundColor: `${color}15` }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full text-white text-[11px] font-black flex items-center justify-center" style={{ backgroundColor: color }}>{grupo}</span>
                      Cuenta {grupo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Receipt size={12} />
                      {formatCurrency(grupoSub, simbolo)}
                    </span>
                  </button>
                );
              })}
              {itemsSinGrupo.length > 0 && (
                <button onClick={onCheckout} className="btn-primary w-full justify-center text-sm py-2">
                  <Receipt size={14} /> Cobrar Todo
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Totales compactos */}
              <div className="rounded-xl bg-surface-bg px-3 py-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-surface-muted">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(sub, simbolo)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento ({descuento}%)</span>
                    <span>− {formatCurrency(desc, simbolo)}</span>
                  </div>
                )}
                {ivaPorc > 0 && (
                  <div className="flex justify-between text-surface-muted">
                    <span>IVA ({ivaPorc}%)</span>
                    <span>{formatCurrency(iva, simbolo)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-surface-border pt-1.5 font-black text-sm text-surface-text">
                  <span>Total</span>
                  <span className="text-brand-500">{formatCurrency(tot, simbolo)}</span>
                </div>
              </div>

              {/* Acciones secundarias */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onOrden}
                  disabled={ordenLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  {ordenLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Enviar cocina
                </button>
                <button
                  onClick={onPrecuenta}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-xs font-semibold text-surface-text transition hover:bg-white hover:border-brand-200"
                >
                  <FileText size={13} />
                  Precuenta
                </button>
              </div>

              {/* Cobrar principal */}
              <button
                onClick={onCheckout}
                className="flex w-full items-center justify-between rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Receipt size={16} />
                  Cobrar
                </span>
                <span className="text-base font-black">{formatCurrency(tot, simbolo)}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
