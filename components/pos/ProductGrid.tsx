"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Package, Plus, ShoppingCart, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency, normalize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProductoCard } from "@/types";

interface Props {
  productos: ProductoCard[];
  simbolo?: string;
  activeGrupo?: string | null;
}

interface ToastItem {
  producto: ProductoCard;
  qty: number;
  key: number;
}

// Paleta de colores para categorías sin imagen
const CAT_COLORS = [
  "from-violet-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-pink-400 to-rose-500",
  "from-teal-400 to-emerald-600",
  "from-blue-400 to-indigo-500",
  "from-yellow-400 to-amber-500",
  "from-purple-400 to-violet-500",
];

export function ProductGrid({ productos, simbolo = "$", activeGrupo }: Props) {
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const searchRef = useRef<HTMLInputElement>(null);

  // Toast del último producto agregado
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      requestAnimationFrame(() => setToastVisible(true));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => setToast(null), 300);
      }, 2500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  const categorias = useMemo(() => {
    const map = new Map<number, string>();
    productos.forEach((p) => {
      if (p.categoriaId && p.categoria) {
        map.set(p.categoriaId, p.categoria.nombre);
      }
    });
    return Array.from(map.entries());
  }, [productos]);

  // Mapa color por categoría
  const catColorMap = useMemo(() => {
    const m = new Map<number, string>();
    categorias.forEach(([id], i) => {
      m.set(id, CAT_COLORS[i % CAT_COLORS.length]);
    });
    return m;
  }, [categorias]);

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const q = normalize(search);
      const matchSearch =
        !search ||
        normalize(p.nombre).includes(q) ||
        normalize(p.codigo).includes(q) ||
        normalize(p.categoria?.nombre ?? "").includes(q);
      const matchCat = !categoriaFiltro || p.categoriaId === categoriaFiltro;
      return matchSearch && matchCat;
    });
  }, [productos, search, categoriaFiltro]);

  function handleAdd(p: ProductoCard) {
    addItem({
      id: p.id,
      tipo: "producto",
      codigo: p.codigo,
      nombre: p.nombre,
      precio: p.precio,
      imagen: p.imagen ?? undefined,
      grupo: activeGrupo ?? undefined,
    });
    const storeItems = useCartStore.getState().items;
    const found = storeItems.find((i) => i.id === p.id && i.tipo === "producto" && !i.guardado);
    const qty = found?.cantidad ?? 1;
    setToastVisible(false);
    setToast({ producto: p, qty, key: Date.now() });
  }

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-surface-border bg-white shadow-sm">

      {/* ── Sidebar categorías ─────────────────────────────────── */}
      <div className="flex w-[120px] shrink-0 flex-col overflow-y-auto border-r border-surface-border bg-surface-bg/60 p-1.5 gap-1">
        <button
          onClick={() => setCategoriaFiltro(null)}
          className={cn(
            "w-full rounded-xl px-2 py-3 text-left text-[11px] font-bold leading-tight transition-all active:scale-95",
            !categoriaFiltro
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-white text-surface-muted hover:bg-brand-50 hover:text-brand-600 border border-surface-border"
          )}
        >
          🔹 Todos
          <span className="block text-[10px] font-normal opacity-70">{productos.length} items</span>
        </button>

        {categorias.map(([id, nombre]) => {
          const count = productos.filter((p) => p.categoriaId === id).length;
          return (
            <button
              key={id}
              onClick={() => setCategoriaFiltro(id)}
              className={cn(
                "w-full rounded-xl px-2 py-3 text-left text-[11px] font-bold leading-tight transition-all active:scale-95",
                categoriaFiltro === id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white text-surface-muted hover:bg-brand-50 hover:text-brand-600 border border-surface-border"
              )}
            >
              {nombre}
              <span className="block text-[10px] font-normal opacity-70">{count} items</span>
            </button>
          );
        })}
      </div>

      {/* ── Área principal ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Búsqueda */}
        <div className="flex items-center gap-2 border-b border-surface-border bg-white px-3 py-2.5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input h-10 w-full pl-9 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-surface-muted hover:bg-surface-border transition"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {/* Contador */}
          <span className="shrink-0 rounded-full bg-surface-bg px-2.5 py-1 text-[11px] font-bold text-surface-muted">
            {filtrados.length}
          </span>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtrados.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-surface-muted">
              <Package size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Sin productos encontrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filtrados.map((p) => {
                const gradient = catColorMap.get(p.categoriaId ?? 0) ?? "from-slate-400 to-slate-500";
                const initials = p.nombre.slice(0, 2).toUpperCase();
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAdd(p)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md active:scale-[0.96]"
                  >
                    {/* Imagen compacta o gradiente con iniciales */}
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
                      {p.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", gradient)}>
                          <span className="text-2xl font-black text-white/90 drop-shadow-sm">{initials}</span>
                        </div>
                      )}

                      {/* Badge stock bajo */}
                      {p.stock <= 5 && p.stock > 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          {p.stock} restantes
                        </span>
                      )}

                      {/* Botón + al hover */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 opacity-0 shadow-lg transition-all group-hover:opacity-100 group-active:scale-90">
                          <Plus size={18} />
                        </div>
                      </div>
                    </div>

                    {/* Texto */}
                    <div className="flex flex-1 flex-col justify-between p-2">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-surface-text">
                        {p.nombre}
                      </p>
                      <p className="mt-1 text-xs font-black text-brand-500">
                        {formatCurrency(p.precio, simbolo)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast — último producto agregado */}
      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 left-6 z-[200] flex items-center gap-3 rounded-2xl border-2 border-brand-400 bg-white px-4 py-3 shadow-2xl"
          style={{
            transition: "opacity 250ms ease, transform 250ms ease",
            opacity: toastVisible ? 1 : 0,
            transform: toastVisible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-surface-border bg-surface-bg">
            {toast.producto.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toast.producto.imagen} alt={toast.producto.nombre} className="h-full w-full object-cover" />
            ) : (
              <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", catColorMap.get(toast.producto.categoriaId ?? 0) ?? "from-slate-400 to-slate-500")}>
                <span className="text-sm font-black text-white">{toast.producto.nombre.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 max-w-[180px]">
            <p className="truncate text-sm font-bold text-surface-text">{toast.producto.nombre}</p>
            <p className="text-xs font-semibold text-brand-500">{formatCurrency(toast.producto.precio, simbolo)}</p>
            {toast.producto.categoria && (
              <p className="text-[10px] text-surface-muted">{toast.producto.categoria.nombre}</p>
            )}
          </div>
          <div className="ml-1 flex shrink-0 flex-col items-center gap-0.5">
            <ShoppingCart size={12} className="text-brand-400" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-black text-white shadow">
              {toast.qty}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
