"use client";

import { useState, useMemo } from "react";
import { Star, Search, CheckCircle2, X, Loader2, Store, ToggleLeft, ToggleRight, Pencil, Package, Image as ImageIcon } from "lucide-react";
import { formatCurrency, normalize, cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ProductoResumen {
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  codigo: string | null;
  categoria: string | null;
}

interface SucursalData {
  id: number;
  nombre: string;
  productoMesActivo: boolean;
  productoMesId: number | null;
  productoMesTitulo: string | null;
  productoMes: {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    codigo: string | null;
  } | null;
}

interface Props {
  sucursales: SucursalData[];
  productos: ProductoResumen[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function ProductoCard({ p, selected, onClick }: { p: ProductoResumen; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]",
        selected
          ? "border-violet-400 bg-violet-50"
          : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white"
      )}
    >
      {p.imagen ? (
        <img src={p.imagen} alt={p.nombre} className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-stone-200">
          <Package size={14} className="text-stone-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-800">{p.nombre}</p>
        {p.categoria && <p className="text-[10px] text-stone-400">{p.categoria}</p>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="text-sm font-black text-violet-600">{formatCurrency(p.precio, "$")}</span>
        {selected && <CheckCircle2 size={15} className="text-violet-500" />}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WIDGET POR SUCURSAL
═══════════════════════════════════════════════════════════════════════════ */
function SucursalWidget({
  suc,
  productos,
  onSaved,
}: {
  suc: SucursalData;
  productos: ProductoResumen[];
  onSaved: (updated: SucursalData) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [seleccionado, setSeleccionado] = useState<ProductoResumen | null>(
    suc.productoMes
      ? {
          id: suc.productoMes.id,
          nombre: suc.productoMes.nombre,
          precio: suc.productoMes.precio,
          imagen: suc.productoMes.imagen,
          codigo: suc.productoMes.codigo,
          categoria: null,
        }
      : null
  );
  const [titulo, setTitulo] = useState(suc.productoMesTitulo ?? "");
  const [activo, setActivo] = useState(suc.productoMesActivo);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const productosFiltrados = useMemo(() => {
    const q = normalize(searchQ.trim());
    if (!q) return productos.slice(0, 30);
    return productos
      .filter((p) => normalize(p.nombre).includes(q) || normalize(p.codigo ?? "").includes(q))
      .slice(0, 30);
  }, [productos, searchQ]);

  async function guardar() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/producto-del-mes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId: suc.id,
          productoMesId: seleccionado?.id ?? null,
          productoMesTitulo: titulo.trim() || null,
          productoMesActivo: activo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMsg("ok");
      setEditando(false);
      onSaved({
        ...suc,
        productoMesActivo: data.productoMesActivo,
        productoMesId: data.productoMesId,
        productoMesTitulo: data.productoMesTitulo,
        productoMes: data.productoMes,
      });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo() {
    const nuevoActivo = !activo;
    setActivo(nuevoActivo);
    setSaving(true);
    try {
      const res = await fetch("/api/producto-del-mes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId: suc.id, productoMesActivo: nuevoActivo }),
      });
      if (!res.ok) setActivo(!nuevoActivo);
    } finally {
      setSaving(false);
    }
  }

  const currentProd = suc.productoMes;

  return (
    <div className="rounded-2xl border border-surface-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500 shadow shadow-violet-200">
            <Store size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-stone-800">{suc.nombre}</p>
            <p className="text-xs text-stone-400">
              {currentProd ? `Destacado: ${currentProd.nombre}` : "Sin producto seleccionado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle activo */}
          <button
            onClick={toggleActivo}
            disabled={saving || !currentProd}
            title={activo ? "Desactivar" : "Activar"}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-40",
              activo
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
            )}
          >
            {activo
              ? <ToggleRight size={14} className="text-emerald-500" />
              : <ToggleLeft size={14} className="text-stone-400" />
            }
            {activo ? "Activo" : "Inactivo"}
          </button>
          {/* Editar */}
          <button
            onClick={() => setEditando((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all",
              editando
                ? "border-violet-400 bg-violet-50 text-violet-700"
                : "border-stone-200 bg-stone-50 text-stone-500 hover:border-violet-300 hover:text-violet-600"
            )}
          >
            <Pencil size={13} />
            {editando ? "Cancelar" : "Editar"}
          </button>
        </div>
      </div>

      {/* Producto actual */}
      {currentProd && !editando && (
        <div className="flex items-center gap-4 px-5 py-4">
          {currentProd.imagen ? (
            <img src={currentProd.imagen} alt={currentProd.nombre} className="h-20 w-20 rounded-2xl object-cover shadow-sm flex-shrink-0" />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-50 border-2 border-dashed border-violet-200">
              <ImageIcon size={24} className="text-violet-300" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {suc.productoMesTitulo && (
              <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-violet-500">{suc.productoMesTitulo}</p>
            )}
            <p className="text-lg font-black text-stone-800 leading-tight">{currentProd.nombre}</p>
            {currentProd.descripcion && (
              <p className="mt-1 text-xs text-stone-400 line-clamp-2">{currentProd.descripcion}</p>
            )}
            <p className="mt-2 text-base font-black text-violet-600">{formatCurrency(currentProd.precio, "$")}</p>
          </div>
          <div className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide",
            activo ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"
          )}>
            {activo ? "✦ Activo" : "Inactivo"}
          </div>
        </div>
      )}

      {!currentProd && !editando && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
            <Star size={20} className="text-stone-300" />
          </div>
          <p className="text-sm font-semibold text-stone-400">Sin producto del mes</p>
          <button
            onClick={() => setEditando(true)}
            className="mt-1 rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
          >
            Seleccionar producto
          </button>
        </div>
      )}

      {/* Panel de edición */}
      {editando && (
        <div className="p-4 space-y-4 bg-stone-50/60 border-t border-surface-border/60">

          {/* Tagline */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-stone-500">
              Título promocional <span className="font-normal normal-case text-stone-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder='Ej: "Clásico de la casa", "El favorito de agosto"'
              maxLength={100}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:font-normal placeholder:text-stone-300"
            />
          </div>

          {/* Seleccionado actualmente */}
          {seleccionado && (
            <div className="flex items-center gap-3 rounded-xl border-2 border-violet-300 bg-violet-50 px-3 py-2.5">
              {seleccionado.imagen ? (
                <img src={seleccionado.imagen} alt={seleccionado.nombre} className="h-8 w-8 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <Package size={13} className="text-violet-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-violet-800">{seleccionado.nombre}</p>
                <p className="text-xs text-violet-500">{formatCurrency(seleccionado.precio, "$")}</p>
              </div>
              <button
                onClick={() => setSeleccionado(null)}
                className="flex-shrink-0 rounded-lg p-1 hover:bg-violet-100 transition"
              >
                <X size={13} className="text-violet-400" />
              </button>
            </div>
          )}

          {/* Búsqueda de productos */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-stone-500">
              {seleccionado ? "Cambiar producto" : "Buscar producto"}
            </label>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Nombre o código..."
                className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto">
              {productosFiltrados.map((p) => (
                <ProductoCard
                  key={p.id}
                  p={p}
                  selected={seleccionado?.id === p.id}
                  onClick={() => setSeleccionado(p)}
                />
              ))}
              {productosFiltrados.length === 0 && (
                <p className="py-4 text-center text-sm text-stone-400">Sin resultados</p>
              )}
            </div>
          </div>

          {/* Feedback */}
          {msg && msg !== "ok" && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{msg}</p>
          )}
          {msg === "ok" && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Guardado correctamente
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={guardar}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Guardar
            </button>
            {(suc.productoMesId) && (
              <button
                onClick={async () => {
                  setSeleccionado(null);
                  setSaving(true);
                  try {
                    await fetch("/api/producto-del-mes", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sucursalId: suc.id, productoMesId: null, productoMesActivo: false }),
                    });
                    onSaved({ ...suc, productoMes: null, productoMesId: null, productoMesActivo: false, productoMesTitulo: null });
                    setActivo(false);
                    setTitulo("");
                    setEditando(false);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-100"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE CLIENT
═══════════════════════════════════════════════════════════════════════════ */
export function ProductoDelMesClient({ sucursales: initial, productos }: Props) {
  const [sucursales, setSucursales] = useState<SucursalData[]>(initial);

  function handleSaved(updated: SucursalData) {
    setSucursales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  const activos = sucursales.filter((s) => s.productoMesActivo && s.productoMes).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500 shadow shadow-violet-200">
            <Star size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-800">Producto del Mes</h1>
            <p className="text-xs text-stone-400">
              Destacá un producto por sucursal en el menú QR y carta digital
            </p>
          </div>
        </div>
        {activos > 0 && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-center">
            <p className="text-xl font-black text-emerald-700">{activos}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              {activos === 1 ? "Activo" : "Activos"}
            </p>
          </div>
        )}
      </div>

      {/* ── Widgets por sucursal ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {sucursales.map((suc) => (
          <SucursalWidget
            key={suc.id}
            suc={suc}
            productos={productos}
            onSaved={handleSaved}
          />
        ))}
      </div>

      {sucursales.length === 0 && (
        <div className="rounded-2xl border border-surface-border bg-white p-12 text-center">
          <Store size={32} className="mx-auto mb-3 text-stone-200" />
          <p className="text-sm font-semibold text-stone-400">No hay sucursales activas</p>
        </div>
      )}
    </div>
  );
}
