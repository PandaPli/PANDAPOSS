"use client";

import { useState } from "react";
import { X, CheckCircle2, Circle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductoCard, OpcionSeleccionada } from "@/types";

interface Props {
  producto: ProductoCard;
  simbolo?: string;
  onClose: () => void;
  onConfirm: (opciones: OpcionSeleccionada[], precioFinal: number) => void;
}

export function VariantModal({ producto, simbolo = "$", onClose, onConfirm }: Props) {
  const variantes = producto.variantes ?? [];

  // radio: grupoId → opcionId | checkbox: grupoId → Set<opcionId>
  const [radioSel, setRadioSel] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    variantes.forEach((g) => {
      if (g.tipo === "radio" && g.opciones.length > 0) {
        init[g.id] = g.opciones[0].id;
      }
    });
    return init;
  });
  const [checkSel, setCheckSel] = useState<Record<number, Set<number>>>({});

  function toggleCheck(grupoId: number, opcionId: number) {
    setCheckSel((prev) => {
      const cur = new Set(prev[grupoId] ?? []);
      if (cur.has(opcionId)) cur.delete(opcionId);
      else cur.add(opcionId);
      return { ...prev, [grupoId]: cur };
    });
  }

  function buildOpciones(): OpcionSeleccionada[] {
    const result: OpcionSeleccionada[] = [];
    variantes.forEach((g) => {
      if (g.tipo === "radio") {
        const opId = radioSel[g.id];
        const op = g.opciones.find((o) => o.id === opId);
        if (op) result.push({ grupoId: g.id, grupoNombre: g.nombre, opcionId: op.id, opcionNombre: op.nombre, precio: op.precio });
      } else {
        const ids = checkSel[g.id] ?? new Set<number>();
        ids.forEach((opId) => {
          const op = g.opciones.find((o) => o.id === opId);
          if (op) result.push({ grupoId: g.id, grupoNombre: g.nombre, opcionId: op.id, opcionNombre: op.nombre, precio: op.precio });
        });
      }
    });
    return result;
  }

  function isValid(): boolean {
    return variantes.every((g) => {
      if (!g.requerido) return true;
      if (g.tipo === "radio") return radioSel[g.id] != null;
      return (checkSel[g.id]?.size ?? 0) > 0;
    });
  }

  const opciones = buildOpciones();
  const extraPrice = opciones.reduce((s, o) => s + o.precio, 0);
  const precioFinal = producto.precio + extraPrice;

  function handleConfirm() {
    if (!isValid()) return;
    onConfirm(opciones, precioFinal);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-0.5">Personalizar</p>
            <p className="text-lg font-black text-surface-text leading-tight">{producto.nombre}</p>
            <p className="text-sm font-bold text-surface-muted mt-0.5">{formatCurrency(producto.precio, simbolo)}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-bg text-surface-muted hover:bg-surface-border transition">
            <X size={16} />
          </button>
        </div>

        {/* Grupos de variantes */}
        <div className="px-5 pb-2 max-h-[55vh] overflow-y-auto space-y-4">
          {variantes.map((grupo) => (
            <div key={grupo.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-black text-surface-text">{grupo.nombre}</p>
                {grupo.requerido && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 uppercase">Requerido</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {grupo.opciones.map((op) => {
                  const isRadio = grupo.tipo === "radio";
                  const selected = isRadio
                    ? radioSel[grupo.id] === op.id
                    : (checkSel[grupo.id]?.has(op.id) ?? false);

                  return (
                    <button
                      key={op.id}
                      onClick={() => {
                        if (isRadio) setRadioSel((prev) => ({ ...prev, [grupo.id]: op.id }));
                        else toggleCheck(grupo.id, op.id);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98]",
                        selected
                          ? "border-brand-400 bg-brand-50"
                          : "border-surface-border bg-surface-bg hover:border-brand-200"
                      )}
                    >
                      <span className={cn("shrink-0", selected ? "text-brand-500" : "text-surface-muted/40")}>
                        {selected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </span>
                      <span className={cn("flex-1 text-sm font-semibold", selected ? "text-brand-700" : "text-surface-text")}>
                        {op.nombre}
                      </span>
                      {op.precio > 0 && (
                        <span className={cn("text-xs font-bold shrink-0", selected ? "text-brand-600" : "text-surface-muted")}>
                          +{formatCurrency(op.precio, simbolo)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface-border bg-surface-bg/50">
          <button
            onClick={handleConfirm}
            disabled={!isValid()}
            className="w-full rounded-2xl bg-brand-500 py-4 text-base font-black text-white shadow-sm transition active:scale-[0.97] hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Agregar al carrito · {formatCurrency(precioFinal, simbolo)}
          </button>
        </div>
      </div>
    </div>
  );
}
