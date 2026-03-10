"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, UtensilsCrossed, Package, ChevronRight } from "lucide-react";

interface Categoria { id: number; nombre: string; icono: string | null; }
interface ItemMenu {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen: string | null;
  categoriaId: number | null;
  tipo: "producto" | "combo";
  ivaActivo?: boolean;
  ivaPorc?: number;
}
interface Negocio {
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  simbolo: string;
}

interface Props {
  categorias: Categoria[];
  items: ItemMenu[];
  negocio: Negocio;
}

function formatPrice(precio: number, simbolo: string) {
  return `${simbolo}${precio.toLocaleString("es-CL")}`;
}

function ItemCard({ item, simbolo }: { item: ItemMenu; simbolo: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden flex flex-col hover:shadow-elevated transition-shadow duration-200">
      {/* Imagen */}
      <div className="relative w-full h-40 bg-brand-50 flex items-center justify-center overflow-hidden">
        {item.imagen && !imgError ? (
          <Image
            src={item.imagen}
            alt={item.nombre}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-brand-300">
            {item.tipo === "combo" ? (
              <Package className="w-10 h-10" />
            ) : (
              <UtensilsCrossed className="w-10 h-10" />
            )}
            <span className="text-xs text-brand-400 font-medium">
              {item.tipo === "combo" ? "Combo" : "Plato"}
            </span>
          </div>
        )}
        {item.tipo === "combo" && (
          <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            COMBO
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="font-semibold text-surface-text text-sm leading-tight line-clamp-2">
          {item.nombre}
        </p>
        {item.descripcion && (
          <p className="text-xs text-surface-muted line-clamp-2 leading-relaxed">
            {item.descripcion}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-brand-600 font-bold text-base">
            {formatPrice(item.precio, simbolo)}
          </span>
          {item.ivaActivo && (
            <span className="text-xs text-surface-muted bg-gray-100 px-1.5 py-0.5 rounded">
              +IVA
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuClient({ categorias, items, negocio }: Props) {
  const [search, setSearch] = useState("");
  const [catActiva, setCatActiva] = useState<number | null>(null);

  const itemsFiltrados = useMemo(() => {
    return items.filter((i) => {
      const matchCat = catActiva === null || i.categoriaId === catActiva;
      const matchSearch =
        !search || i.nombre.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, catActiva, search]);

  // Agrupar por categoría para la vista sin filtro activo
  const grupos = useMemo(() => {
    if (catActiva !== null || search) {
      return null; // mostrar lista plana
    }
    const map = new Map<number | null, ItemMenu[]>();
    for (const item of items) {
      const key = item.categoriaId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items, catActiva, search]);

  const getCatNombre = (id: number | null) =>
    id === null
      ? "Sin categoría"
      : categorias.find((c) => c.id === id)?.nombre ?? "Sin categoría";

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Header */}
      <header className="bg-brand-700 text-white sticky top-0 z-20 shadow-elevated">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">{negocio.nombre}</h1>
              {negocio.direccion && (
                <p className="text-brand-200 text-xs mt-0.5">{negocio.direccion}</p>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
            <input
              type="search"
              placeholder="Buscar en el menú…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-brand-300 focus:outline-none focus:bg-white/20 transition"
            />
          </div>
        </div>

        {/* Tabs de categorías */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 pb-3 min-w-max">
            <button
              onClick={() => setCatActiva(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                catActiva === null
                  ? "bg-white text-brand-700"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Todo
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatActiva(cat.id === catActiva ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  catActiva === cat.id
                    ? "bg-white text-brand-700"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {cat.icono ? `${cat.icono} ` : ""}{cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Vista filtrada (búsqueda o categoría) */}
        {(catActiva !== null || search) ? (
          <section>
            {catActiva !== null && (
              <h2 className="text-lg font-bold text-surface-text mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-brand-500" />
                {getCatNombre(catActiva)}
              </h2>
            )}
            {search && (
              <p className="text-sm text-surface-muted mb-4">
                {itemsFiltrados.length} resultado{itemsFiltrados.length !== 1 ? "s" : ""} para &quot;{search}&quot;
              </p>
            )}
            {itemsFiltrados.length === 0 ? (
              <div className="text-center py-16 text-surface-muted">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {itemsFiltrados.map((item) => (
                  <ItemCard key={`${item.tipo}-${item.id}`} item={item} simbolo={negocio.simbolo} />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Vista por categorías */
          grupos && Array.from(grupos.entries()).map(([catId, catItems]) => (
            <section key={catId ?? "sin-cat"}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-surface-text flex items-center gap-2">
                  <span className="w-1 h-5 bg-brand-500 rounded-full inline-block" />
                  {getCatNombre(catId)}
                </h2>
                <span className="text-xs text-surface-muted bg-surface-border px-2 py-0.5 rounded-full">
                  {catItems.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {catItems.map((item) => (
                  <ItemCard key={`${item.tipo}-${item.id}`} item={item} simbolo={negocio.simbolo} />
                ))}
              </div>
            </section>
          ))
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-surface-muted py-4 border-t border-surface-border">
          {negocio.telefono && (
            <a href={`tel:${negocio.telefono}`} className="text-brand-500 font-medium hover:underline">
              {negocio.telefono}
            </a>
          )}
          <p className="mt-1">Powered by <span className="font-semibold text-brand-600">PandaPoss</span></p>
        </footer>
      </main>
    </div>
  );
}
