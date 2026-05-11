"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string | null;
  codigo?: string | null;
  categoria?: { nombre: string } | null;
}

// Tabla category name → product code prefix
const CAT_PREFIX: Record<string, string> = {
  avocado:      "A",
  california:   "C",
  "cheese cream": "Q",
  "chesse creame": "Q",
  futomaki:     "F",
  hotrolls:     "H",
  "hot rolls":  "H",
  hosomaki:     "HO",
  temaki:       "T",
  sake:         "S",
};

interface Props {
  productos: Producto[];
  cartCounts: Record<number, number>; // productoId → qty in cart
  onAdd: (p: Producto) => void;
  /** Wizard mode: lock to a single category */
  forcedCategory?: string | null;
}

export function RollBuilder({ productos, cartCounts, onAdd, forcedCategory }: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [flash, setFlash] = useState<number | null>(null);

  // Group products by categoria.nombre
  const byCategory = useMemo(() => {
    const map = new Map<string, Producto[]>();
    for (const p of productos) {
      const cat = p.categoria?.nombre ?? "Otros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [productos]);

  const cats = Array.from(byCategory.keys());

  // Resolve forced category: exact → case-insensitive → code prefix → null
  const resolvedForcedCat = useMemo(() => {
    if (!forcedCategory) return null;
    // 1. Exact match
    if (byCategory.has(forcedCategory)) return forcedCategory;
    // 2. Case-insensitive match
    const ci = cats.find(c => c.toLowerCase() === forcedCategory.toLowerCase());
    if (ci) return ci;
    // 3. Code-prefix fallback: filter products directly (returns null = use prefix filtering)
    return "__prefix__";
  }, [forcedCategory, byCategory, cats]);

  const currentCat = forcedCategory ? resolvedForcedCat : (activeCat ?? cats[0] ?? null);

  // Products to show in the variant grid
  const variants = useMemo(() => {
    if (!currentCat) return [];
    if (currentCat === "__prefix__" && forcedCategory) {
      // Match by code prefix from CAT_PREFIX map
      const prefix = CAT_PREFIX[forcedCategory.toLowerCase()];
      if (prefix) {
        const filtered = productos.filter(p =>
          p.codigo?.toUpperCase().startsWith(prefix.toUpperCase())
        );
        // If HotRolls (H), exclude HO codes (Hosomaki)
        if (prefix === "H") return filtered.filter(p => !p.codigo?.toUpperCase().startsWith("HO"));
        return filtered;
      }
      // Last resort: show all products
      return productos;
    }
    return byCategory.get(currentCat) ?? [];
  }, [currentCat, byCategory, forcedCategory, productos]);

  function handleAdd(p: Producto) {
    onAdd(p);
    setFlash(p.id);
    setTimeout(() => setFlash(null), 650);
  }

  // Strip the category prefix from product nombre to get the variant label
  // e.g. "Avocado Camarón" with cat "Avocado" → "Camarón"
  function variantLabel(p: Producto) {
    const cat = p.categoria?.nombre ?? "";
    if (!cat) return p.nombre;
    const stripped = p.nombre.replace(new RegExp(`^${cat}\\s+`, "i"), "").trim();
    return stripped || p.nombre;
  }

  return (
    <div className="space-y-3">
      {/* Category pills — hidden in wizard (forced) mode */}
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

      {/* Variants grid */}
      {currentCat && variants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {variants.map((p) => {
            const count = cartCounts[p.id] ?? 0;
            const isFlash = flash === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-150 active:scale-[0.96] select-none",
                  isFlash
                    ? "border-emerald-400 bg-emerald-50"
                    : count > 0
                    ? "border-brand-200 bg-brand-50/60"
                    : "border-stone-100 bg-white hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-sm"
                )}
              >
                {/* Code badge */}
                <span className={cn(
                  "font-mono text-[11px] font-black rounded-md px-1.5 py-0.5",
                  isFlash
                    ? "bg-emerald-500 text-white"
                    : "bg-stone-100 text-stone-500"
                )}>
                  {p.codigo ?? "—"}
                </span>

                {/* Variant name */}
                <span className={cn(
                  "text-sm font-bold leading-tight",
                  isFlash ? "text-emerald-800" : "text-stone-800"
                )}>
                  {variantLabel(p)}
                </span>

                {/* Badges (check or count) */}
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
      )}

      {currentCat && variants.length === 0 && (
        <p className="py-4 text-center text-sm text-stone-400">
          No hay productos en esta categoría
        </p>
      )}
    </div>
  );
}
