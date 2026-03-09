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

  // Categorías únicas
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
    <div className="flex flex-col h-full gap-3">
      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Filtro categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoriaFiltro(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            !categoriaFiltro
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Todos
        </button>
        {categorias.map(([id, nombre]) => (
          <button
            key={id}
            onClick={() => setCategoriaFiltro(id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              categoriaFiltro === id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      {/* Grid productos */}
      <div className="flex-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-300">
            <Package size={36} className="mb-2" />
            <p className="text-sm">Sin productos encontrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                className="group card p-3 text-left hover:border-brand-300 hover:shadow-md active:scale-95 transition-all"
              >
                {/* Imagen o placeholder */}
                <div className="w-full aspect-square bg-zinc-100 rounded-lg mb-2.5 overflow-hidden flex items-center justify-center">
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={28} className="text-zinc-300" />
                  )}
                </div>

                <p className="text-sm font-semibold text-zinc-800 leading-tight line-clamp-2">
                  {p.nombre}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{p.codigo}</p>
                <p className="text-brand-600 font-bold text-sm mt-1.5">
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
