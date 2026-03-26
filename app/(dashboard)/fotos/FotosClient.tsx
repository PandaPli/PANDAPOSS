"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, ImageIcon, Loader2, Search, X } from "lucide-react";

interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  imagen: string | null;
  sucursal: string | null;
}

interface BlobImg {
  url: string;
  pathname: string;
}

export function FotosClient({ productos }: { productos: Producto[] }) {
  const [blobs, setBlobs] = useState<BlobImg[]>([]);
  const [loadingBlobs, setLoadingBlobs] = useState(true);
  const [selectedBlob, setSelectedBlob] = useState<string | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [soloSinFoto, setSoloSinFoto] = useState(true);
  const [localProds, setLocalProds] = useState<Producto[]>(productos);

  useEffect(() => {
    fetch("/api/blob/list")
      .then(r => r.json())
      .then(data => { setBlobs(data); setLoadingBlobs(false); })
      .catch(() => setLoadingBlobs(false));
  }, []);

  const filteredProds = localProds.filter(p => {
    const matchQuery = p.nombre.toLowerCase().includes(query.toLowerCase()) ||
      p.codigo.toLowerCase().includes(query.toLowerCase()) ||
      (p.sucursal ?? "").toLowerCase().includes(query.toLowerCase());
    const matchFoto = soloSinFoto ? !p.imagen : true;
    return matchQuery && matchFoto;
  });

  async function asignar() {
    if (!selectedBlob || !selectedProducto) return;
    setSaving(true);
    try {
      await fetch(`/api/productos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedProducto.id, imagen: selectedBlob }),
      });
      setSavedIds(prev => new Set([...prev, selectedProducto.id]));
      setLocalProds(prev => prev.map(p =>
        p.id === selectedProducto.id ? { ...p, imagen: selectedBlob } : p
      ));
      setSelectedProducto(null);
      setSelectedBlob(null);
    } finally {
      setSaving(false);
    }
  }

  const sinFoto = localProds.filter(p => !p.imagen).length;
  const conFoto = localProds.filter(p => !!p.imagen).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-surface-text">Galería de Fotos</h1>
        <p className="text-sm text-surface-muted mt-1">
          Asigna imágenes del blob a tus productos. {sinFoto} sin foto · {conFoto} con foto
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── COLUMNA IZQUIERDA: Imágenes Blob ── */}
        <div className="rounded-2xl border border-surface-border bg-surface-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-surface-text text-sm">
              📦 Imágenes en Vercel Blob ({blobs.length})
            </h2>
            {selectedBlob && (
              <button onClick={() => setSelectedBlob(null)}
                className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <X size={12} /> Deseleccionar
              </button>
            )}
          </div>

          {loadingBlobs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-surface-muted" />
            </div>
          ) : blobs.length === 0 ? (
            <div className="text-center py-12 text-surface-muted text-sm">
              No hay imágenes en el blob de productos
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[520px] overflow-y-auto pr-1">
              {blobs.map(b => (
                <button key={b.url}
                  onClick={() => setSelectedBlob(b.url === selectedBlob ? null : b.url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedBlob === b.url
                      ? "border-brand-500 ring-2 ring-brand-300 scale-95"
                      : "border-surface-border hover:border-brand-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.url} alt="" className="w-full h-full object-cover" />
                  {selectedBlob === b.url && (
                    <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: Productos ── */}
        <div className="rounded-2xl border border-surface-border bg-surface-card p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-surface-text text-sm">🍽️ Productos</h2>
            <label className="flex items-center gap-1.5 text-xs text-surface-muted cursor-pointer">
              <input type="checkbox" checked={soloSinFoto}
                onChange={e => setSoloSinFoto(e.target.checked)}
                className="rounded border-surface-border" />
              Solo sin foto
            </label>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full border border-surface-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
            {filteredProds.length === 0 && (
              <p className="text-center text-surface-muted text-sm py-8">Sin resultados</p>
            )}
            {filteredProds.map(p => {
              const selected = selectedProducto?.id === p.id;
              const saved = savedIds.has(p.id);
              return (
                <button key={p.id}
                  onClick={() => setSelectedProducto(selected ? null : p)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all border ${
                    selected
                      ? "border-brand-400 bg-brand-50"
                      : "border-transparent hover:bg-surface-bg"
                  }`}
                >
                  {/* Miniatura */}
                  <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-surface-border bg-surface-bg">
                    {p.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagen} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={14} className="text-surface-muted" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-surface-text truncate">{p.nombre}</p>
                    <p className="text-[10px] text-surface-muted">{p.codigo} · {p.sucursal}</p>
                  </div>
                  {saved && <Check size={14} className="text-green-500 shrink-0" />}
                  {p.imagen && !saved && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Tiene foto" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Panel de asignación ── */}
      {selectedBlob && selectedProducto && (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-4 flex items-center gap-4 flex-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedBlob} alt="" className="w-16 h-16 rounded-xl object-cover border border-brand-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-surface-text">Asignar esta foto a:</p>
            <p className="text-sm text-brand-700 font-black truncate">{selectedProducto.nombre}</p>
            <p className="text-xs text-surface-muted">{selectedProducto.codigo}</p>
          </div>
          <button onClick={asignar} disabled={saving}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-all active:scale-95 shrink-0">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? "Guardando..." : "Asignar foto"}
          </button>
        </div>
      )}
      {selectedBlob && !selectedProducto && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          ✅ Foto seleccionada — ahora haz clic en el producto al que quieres asignarla
        </p>
      )}
      {!selectedBlob && selectedProducto && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          ✅ Producto seleccionado — ahora haz clic en la foto que quieres asignarle
        </p>
      )}
    </div>
  );
}
