"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface VOpcion { id: number; nombre: string; precio: number; }
interface VGrupo  { id: number; nombre: string; requerido: boolean; tipo: string; opciones: VOpcion[]; }

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  variantes: VGrupo[];
}

interface Props {
  productos: Producto[];
  initialIndex: number;
  simbolo: string;
  getQuantity: (id: number) => number;
  onAdd: (p: Producto) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

export default function ProductoViewer({
  productos,
  initialIndex,
  simbolo,
  getQuantity,
  onAdd,
  onRemove,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [qty, setQtyLocal] = useState(1);
  const producto = productos[index];
  const cartQty = getQuantity(producto.id);

  // Reset cantidad local cuando cambia producto
  useEffect(() => { setQtyLocal(1); }, [index]);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  }

  function goPrev() { setIndex((i) => (i > 0 ? i - 1 : productos.length - 1)); }
  function goNext() { setIndex((i) => (i < productos.length - 1 ? i + 1 : 0)); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleAgregar() {
    for (let i = 0; i < qty; i++) onAdd(producto);
  }
  function handleQuitar() {
    for (let i = 0; i < qty; i++) onRemove(producto.id);
  }

  const total = formatCurrency(producto.precio * qty, simbolo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl"
        style={{ maxHeight: "96dvh" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── IMAGEN HERO ── */}
        <div className="relative shrink-0 bg-stone-100" style={{ height: "52vw", maxHeight: 300 }}>
          {producto.imagen ? (
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-amber-50 text-6xl">🍽️</div>
          )}

          {/* Cerrar */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition active:scale-90"
          >
            <X size={20} className="text-stone-800" />
          </button>

          {/* Indicadores */}
          {productos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {productos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── CONTENIDO ── */}
        <div className="flex flex-col gap-3 overflow-y-auto px-6 py-5">
          {/* Nombre */}
          <h2 className="text-2xl font-black leading-tight text-stone-900">{producto.nombre}</h2>

          {/* Descripción */}
          {producto.descripcion && (
            <p className="text-sm leading-relaxed text-stone-500">{producto.descripcion}</p>
          )}

          {/* Precio */}
          <p className="text-2xl font-black text-stone-900">
            {formatCurrency(producto.precio, simbolo)}
          </p>

          {/* Hint swipe */}
          {productos.length > 1 && (
            <p className="text-center text-xs text-stone-400">
              ← Desliza para ver más productos →
            </p>
          )}

          {/* Spacer para que el bottom bar no tape */}
          <div className="h-20" />
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-white px-5 pb-6 pt-3 shadow-[0_-1px_12px_rgba(0,0,0,0.08)]">
          {/* Selector cantidad */}
          <div className="flex items-center gap-2 rounded-2xl bg-stone-900 px-2 py-2">
            <button
              onClick={() => setQtyLocal((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition active:scale-90"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-[1.5rem] text-center text-base font-black text-white">{qty}</span>
            <button
              onClick={() => setQtyLocal((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition active:scale-90"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Botón agregar */}
          {cartQty > 0 ? (
            <div className="flex flex-1 gap-2">
              <button
                onClick={handleQuitar}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 py-3.5 text-sm font-bold text-stone-700 transition active:scale-95"
              >
                Quitar {qty}
              </button>
              <button
                onClick={handleAgregar}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-sm font-black text-stone-900 transition active:scale-95"
              >
                <ShoppingBag size={16} />
                Agregar · {total}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAgregar}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 font-black text-stone-900 transition active:scale-95 hover:bg-amber-500"
            >
              <ShoppingBag size={18} />
              Agregar · {total}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
