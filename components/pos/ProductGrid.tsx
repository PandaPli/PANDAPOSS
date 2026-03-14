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
    });
  }

  return (
    <div className="flex h-full flex-col gap-3">
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

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoriaFiltro(null)}
          className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
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
            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
              categoriaFiltro === id
                ? "bg-brand-500 text-white shadow-sm"
                : "border border-surface-border bg-white text-surface-muted hover:bg-brand-50 hover:text-brand-600"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-surface-muted">
            <Package size={36} className="mb-2 opacity-40" />
            <p className="text-sm">Sin productos encontrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                className="group rounded-2xl border border-surface-border bg-white p-2 text-left transition-all hover:border-brand-300 hover:shadow-elevated active:scale-[0.98]"
              >
                <div className="mb-2 flex aspect-[1/0.82] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-bg">
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt={p.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <Package size={22} className="text-surface-muted opacity-30" />
                  )}
                </div>

                <p className="line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-tight text-surface-text">
                  {p.nombre}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-surface-muted">{p.codigo}</p>
                <p className="mt-1 text-[12px] font-bold text-brand-500">{formatCurrency(p.precio, simbolo)}</p>

                {p.stock <= 5 && p.stock > 0 && (
                  <p className="mt-0.5 text-[10px] text-amber-500">Stock: {p.stock}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
