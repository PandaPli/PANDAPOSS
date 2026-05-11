"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// ── Rellenos estándar — los mismos para TODOS los tipos de roll ────────────
const FILLINGS = [
  { num: 1, label: "Kanikama" },
  { num: 2, label: "Palmito" },
  { num: 3, label: "Champiñón" },
  { num: 4, label: "Pollo" },
  { num: 5, label: "Camarón" },
  { num: 6, label: "Salmón" },
  { num: 7, label: "Atún" },
];

// ── Tipo de roll → prefijo de código KDS ──────────────────────────────────
const CAT_PREFIX: Record<string, string> = {
  avocado:          "A",
  california:       "C",
  "cheese cream":   "Q",
  "chesse creame":  "Q",
  futomaki:         "F",
  hotrolls:         "H",
  "hot rolls":      "H",
  "hot":            "H",
  hosomaki:         "HO",
  temaki:           "T",
  sake:             "S",
};

function getPrefix(cat: string): string {
  return CAT_PREFIX[cat.toLowerCase()] ?? cat.substring(0, 1).toUpperCase();
}

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string | null;
  codigo?: string | null;
  categoria?: { nombre: string } | null;
}

export interface RollPayload {
  code: string;       // e.g. "A5"
  nombre: string;     // e.g. "Avocado Camarón"
  precio: number;     // del producto en BD o 0
  productoId?: number;
}

interface Props {
  productos: Producto[];
  /** Códigos ya en el carrito (para mostrar contador por código) */
  cartCodes: string[];
  onAddRoll: (roll: RollPayload) => void;
  /** Wizard mode: forza una categoría específica */
  forcedCategory?: string | null;
}

export function RollBuilder({ productos, cartCodes, onAddRoll, forcedCategory }: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Categorías disponibles en la BD (para el picker libre)
  const cats = useMemo(() => {
    const seen = new Set<string>();
    for (const p of productos) {
      const cat = p.categoria?.nombre;
      if (cat) seen.add(cat);
    }
    return Array.from(seen).sort();
  }, [productos]);

  // Categoría activa: wizard fuerza una, libre usa la seleccionada o primera
  const currentCat = forcedCategory
    ? (cats.find(c => c.toLowerCase() === forcedCategory.toLowerCase()) ?? forcedCategory)
    : (activeCat ?? cats[0] ?? null);

  // Busca el producto en BD para obtener el precio del roll
  function findRollProduct(cat: string): Producto | undefined {
    const lower = cat.toLowerCase();
    return (
      productos.find(p => p.categoria?.nombre.toLowerCase() === lower) ??
      productos.find(p => p.nombre.toLowerCase().includes(lower))
    );
  }

  function handleSelect(filling: { num: number; label: string }) {
    if (!currentCat) return;
    const prefix = getPrefix(currentCat);
    const code = `${prefix}${filling.num}`;
    const rollProduct = findRollProduct(currentCat);
    onAddRoll({
      code,
      nombre: `${currentCat} ${filling.label}`,
      precio: rollProduct ? Number(rollProduct.precio) : 0,
      productoId: rollProduct?.id,
    });
    setFlash(code);
    setTimeout(() => setFlash(null), 650);
  }

  const codeCount = (code: string) => cartCodes.filter(c => c === code).length;

  return (
    <div className="space-y-3">

      {/* Categorías (solo en modo libre) */}
      {!forcedCategory && cats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95",
                currentCat === cat
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-stone-200 bg-stone-50 text-stone-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid de rellenos */}
      {currentCat ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FILLINGS.map((f) => {
            const prefix = getPrefix(currentCat);
            const code = `${prefix}${f.num}`;
            const count = codeCount(code);
            const isFlash = flash === code;
            return (
              <button
                key={f.num}
                onClick={() => handleSelect(f)}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-150 active:scale-[0.96] select-none",
                  isFlash
                    ? "border-emerald-400 bg-emerald-50"
                    : count > 0
                    ? "border-brand-200 bg-brand-50/60"
                    : "border-stone-100 bg-white hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-sm"
                )}
              >
                <span className={cn(
                  "font-mono text-[11px] font-black rounded-md px-1.5 py-0.5",
                  isFlash ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500"
                )}>
                  {code}
                </span>
                <span className={cn(
                  "text-sm font-bold leading-tight",
                  isFlash ? "text-emerald-800" : "text-stone-800"
                )}>
                  {f.label}
                </span>
                {isFlash ? (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                ) : count > 0 ? (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-black text-white">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-stone-400">
          Selecciona un tipo de roll
        </p>
      )}
    </div>
  );
}
