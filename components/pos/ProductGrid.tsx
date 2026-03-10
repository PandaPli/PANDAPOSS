"use client";

import { useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
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
      const matchSearch =
        !search ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase());
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
      seccion: p.seccion ?? null,
    });
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Busqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Filtro categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoriaFiltro(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            !categoriaFiltro
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-white border border-surface-border text-surface-muted hover:bg-brand-50 hover:text-brand-600"
          }`}
        >
          Todos
        </button>
        {categorias.map(([id, nombre]) => (
          <button
            key={id}
            onClick={() => setCategoriaFiltro(id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              categoriaFiltro === id
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white border border-surface-border text-surface-muted hover:bg-brand-50 hover:text-brand-600"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      {/* Grid productos */}
      <div className="flex-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-muted">
            <Package size={36} className="mb-2 opacity-40" />
            <p className="text-sm">Sin productos encontrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                className="group card p-3 text-left hover:border-brand-300 hover:shadow-elevated active:scale-[0.97] transition-all"
              >
                <div className="w-full aspect-square bg-surface-bg rounded-xl mb-2.5 overflow-hidden flex items-center justify-center">
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={28} className="text-surface-muted opacity-30" />
                  )}
                </div>

                <p className="text-sm font-semibold text-surface-text leading-tight line-clamp-2">
                  {p.nombre}
                </p>
                <p className="text-xs text-surface-muted mt-0.5">{p.codigo}</p>
                <p className="text-brand-500 font-bold text-sm mt-1.5">
                  {formatCurrency(p.precio, simbolo)}
                </p>

                {p.stock <= 5 && p.stock > 0 && (
                  <p className="text-amber-500 text-xs mt-0.5">Stock: {p.stock}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
