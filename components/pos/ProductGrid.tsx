"use client";

import { useState, useMemo } from "react";
import { Search, Package, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency, normalize } from "@/lib/utils";
import type { ProductoCard } from "@/types";

interface Props {
  productos: ProductoCard[];
  simbolo?: string;
}

export function ProductGrid({ productos, simbolo = "$" }: Props) {
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);

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
    </div>
  );
}
