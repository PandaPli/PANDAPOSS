"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Package, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency, normalize } from "@/lib/utils";
import type { ProductoCard } from "@/types";

interface Props {
  productos: ProductoCard[];
  simbolo?: string;
}

interface ToastItem {
  producto: ProductoCard;
  qty: number;
  key: number;
}

export function ProductGrid({ productos, simbolo = "$" }: Props) {
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  // Toast del último producto agregado
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      // Forzar re-paint antes de activar la transición de entrada
      requestAnimationFrame(() => setToastVisible(true));
      // Iniciar cuenta regresiva de salida
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setToastVisible(false);
        // Esperar que termine la animación de salida antes de desmontar
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
    });
    // Leer la cantidad actualizada del store (addItem es síncrono)
    const storeItems = useCartStore.getState().items;
    const found = storeItems.find((i) => i.id === p.id && i.tipo === "producto" && !i.guardado);
    const qty = found?.cantidad ?? 1;

    setToastVisible(false);
    setToast({ producto: p, qty, key: Date.now() });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input h-10 pl-9 text-sm"
        />
      </div>

      {/* Categorías */}
      <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          onClick={() => setCategoriaFiltro(null)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
            !categoriaFiltro
              ? "bg-brand-500 text-white shadow-sm"
              : "border border-surface-border bg-white text-surface-muted hover:bg-brand-50 hover:text-brand-600"
          }`}
        >
          Todos
        </button>
        {categorias.map(([id, nombre]) => (
          <button
            key={id}
            onClick={() => setCategoriaFiltro(id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              categoriaFiltro === id
                ? "bg-brand-500 text-white shadow-sm"
                : "border border-surface-border bg-white text-surface-muted hover:bg-brand-50 hover:text-brand-600"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-surface-muted">
            <Package size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Sin productos encontrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                className="group relative overflow-hidden rounded-2xl border border-surface-border bg-white text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md active:scale-[0.97]"
              >
                {/* Imagen */}
                <div className="relative aspect-square w-full overflow-hidden bg-surface-bg">
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package size={24} className="text-surface-muted opacity-25" />
                    </div>
                  )}

                  {/* Badge stock bajo */}
                  {p.stock <= 5 && p.stock > 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {p.stock} restantes
                    </span>
                  )}

                  {/* Overlay + botón al hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-brand-600/0 transition-all group-hover:bg-brand-600/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 group-active:scale-90">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="line-clamp-2 min-h-[2.2rem] text-[11px] font-semibold leading-tight text-surface-text">
                    {p.nombre}
                  </p>
                  <p className="mt-1 text-xs font-black text-brand-500">
                    {formatCurrency(p.precio, simbolo)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
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
          {/* Imagen del producto */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-bg border border-surface-border">
            {toast.producto.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={toast.producto.imagen}
                alt={toast.producto.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package size={20} className="text-surface-muted opacity-30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 max-w-[180px]">
            <p className="truncate text-sm font-bold text-surface-text">{toast.producto.nombre}</p>
            <p className="text-xs font-semibold text-brand-500">{formatCurrency(toast.producto.precio, simbolo)}</p>
            {toast.producto.categoria && (
              <p className="text-[10px] text-surface-muted">{toast.producto.categoria.nombre}</p>
            )}
          </div>

          {/* Badge cantidad */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 ml-1">
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
