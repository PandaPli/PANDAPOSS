"use client";

import { useEffect, useState, useRef } from "react";
import { Check, ImageIcon, Loader2, Search, X, Upload, ZapIcon } from "lucide-react";

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
  const [queryProd, setQueryProd] = useState("");
  const [queryBlob, setQueryBlob] = useState("");
  const [soloSinFoto, setSoloSinFoto] = useState(true);
  const [localProds, setLocalProds] = useState<Producto[]>(productos);
  const [uploading, setUploading] = useState(false);
  const [sucursalFiltro, setSucursalFiltro] = useState<string>("todas");
  const [lastAssigned, setLastAssigned] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/blob/list")
      .then(r => r.json())
      .then(data => { setBlobs(data); setLoadingBlobs(false); })
      .catch(() => setLoadingBlobs(false));
  }, []);

  const sucursales = ["todas", ...Array.from(new Set(localProds.map(p => p.sucursal ?? "Sin sucursal")))];

  const filteredProds = localProds.filter(p => {
    const matchQuery = p.nombre.toLowerCase().includes(queryProd.toLowerCase()) ||
      p.codigo.toLowerCase().includes(queryProd.toLowerCase());
    const matchFoto = soloSinFoto ? !p.imagen : true;
    const matchSuc = sucursalFiltro === "todas" || (p.sucursal ?? "Sin sucursal") === sucursalFiltro;
    return matchQuery && matchFoto && matchSuc;
  });

  const filteredBlobs = blobs.filter(b =>
    b.pathname.toLowerCase().includes(queryBlob.toLowerCase())
  );

  const sinFoto = localProds.filter(p => !p.imagen).length;
  const conFoto = localProds.filter(p => !!p.imagen).length;
  const pct = localProds.length > 0 ? Math.round((conFoto / localProds.length) * 100) : 0;

  async function asignar(blobUrl: string, prod: Producto) {
    setSaving(true);
    try {
      await fetch(`/api/productos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prod.id, imagen: blobUrl }),
      });
      setSavedIds(prev => new Set([...prev, prod.id]));
      setLocalProds(prev => prev.map(p =>
        p.id === prod.id ? { ...p, imagen: blobUrl } : p
      ));
      setLastAssigned(`✅ "${prod.nombre}" actualizado`);
      setTimeout(() => setLastAssigned(null), 2500);
      // Auto-select next product without foto
      const idx = filteredProds.findIndex(p => p.id === prod.id);
      const next = filteredProds.find((p, i) => i > idx && !p.imagen);
      setSelectedProducto(next ?? null);
      setSelectedBlob(null);
    } finally {
      setSaving(false);
    }
  }

  // Al hacer clic en blob: si hay producto seleccionado → asignar directo
  function handleBlobClick(url: string) {
    if (selectedProducto) {
      asignar(url, selectedProducto);
    } else {
      setSelectedBlob(url === selectedBlob ? null : url);
    }
  }

  // Al hacer clic en producto: si hay blob seleccionado → asignar directo
  function handleProdClick(p: Producto) {
    if (selectedBlob) {
      asignar(selectedBlob, p);
    } else {
      setSelectedProducto(selectedProducto?.id === p.id ? null : p);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) setBlobs(prev => [{ url: data.url, pathname: file.name }, ...prev]);
      }
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  const hasBothSelected = selectedBlob && selectedProducto;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-surface-text">Galería de Fotos</h1>
          <p className="text-sm text-surface-muted mt-0.5">
            {sinFoto} sin foto · {conFoto} con foto · {localProds.length} total
          </p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-surface-muted">Cobertura</p>
            <p className="text-lg font-black text-surface-text">{pct}%</p>
          </div>
          <div className="w-32 h-3 rounded-full bg-surface-border overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: pct + "%" }} />
          </div>
        </div>
      </div>

      {/* ── Tip de flujo ── */}
      {!hasBothSelected && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700 flex items-center gap-2">
          <ZapIcon size={15} className="shrink-0" />
          {selectedProducto
            ? <span>Producto <strong>{selectedProducto.nombre}</strong> seleccionado — haz clic en la imagen para asignar</span>
            : selectedBlob
            ? <span>Imagen seleccionada — haz clic en el producto para asignar</span>
            : <span>Selecciona un <strong>producto</strong> y luego una <strong>imagen</strong> (o viceversa) para asignar</span>
          }
        </div>
      )}

      {/* ── Toast último asignado ── */}
      {lastAssigned && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 flex items-center gap-2 animate-pulse">
          <Check size={15} /> {lastAssigned}
        </div>
      )}

      {/* ── Confirm banner si ambos seleccionados ── */}
      {hasBothSelected && (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-3 flex items-center gap-3 flex-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedBlob} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-brand-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-surface-muted">Asignando a:</p>
            <p className="text-sm font-black text-brand-700 truncate">{selectedProducto.nombre}</p>
            <p className="text-xs text-surface-muted">{selectedProducto.codigo}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setSelectedBlob(null); setSelectedProducto(null); }}
              className="px-3 py-2 rounded-xl border border-surface-border text-sm text-surface-muted hover:bg-surface-bg">
              Cancelar
            </button>
            <button onClick={() => asignar(selectedBlob, selectedProducto!)} disabled={saving}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-60 transition-all active:scale-95">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? "Guardando..." : "Asignar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Columnas principales ── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 flex-1 min-h-0">

        {/* ── IZQUIERDA: Imágenes Blob ── */}
        <div className="rounded-2xl border border-surface-border bg-surface-card flex flex-col overflow-hidden">
          {/* Header panel */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border bg-white">
            <h2 className="font-bold text-surface-text text-sm shrink-0">
              📦 Imágenes en Blob ({filteredBlobs.length})
            </h2>
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input value={queryBlob} onChange={e => setQueryBlob(e.target.value)}
                placeholder="Filtrar imágenes..."
                className="w-full border border-surface-border rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedBlob && (
                <button onClick={() => setSelectedBlob(null)}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1 whitespace-nowrap">
                  <X size={12} /> Deseleccionar
                </button>
              )}
              <input ref={uploadRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
              <button onClick={() => uploadRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-600 disabled:opacity-60">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Subir
              </button>
            </div>
          </div>

          {/* Grid imágenes */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingBlobs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-surface-muted" />
              </div>
            ) : filteredBlobs.length === 0 ? (
              <div className="text-center py-16 text-surface-muted text-sm">No hay imágenes</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {filteredBlobs.map(b => {
                  const isSelected = selectedBlob === b.url;
                  const hasProduct = !!selectedProducto;
                  return (
                    <button key={b.url} onClick={() => handleBlobClick(b.url)}
                      title={b.pathname}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                        isSelected
                          ? "border-brand-500 ring-2 ring-brand-300 scale-95"
                          : hasProduct
                          ? "border-emerald-400 hover:scale-95 hover:border-emerald-500 cursor-pointer"
                          : "border-surface-border hover:border-brand-300 hover:scale-95"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.url} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-brand-500/25 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shadow-lg">
                            <Check size={15} className="text-white" />
                          </div>
                        </div>
                      )}
                      {hasProduct && !isSelected && (
                        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                            <ZapIcon size={13} className="text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── DERECHA: Productos ── */}
        <div className="rounded-2xl border border-surface-border bg-surface-card flex flex-col overflow-hidden">
          {/* Header panel */}
          <div className="px-4 py-3 border-b border-surface-border bg-white space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-surface-text text-sm">🍽️ Productos ({filteredProds.length})</h2>
              <label className="flex items-center gap-1.5 text-xs text-surface-muted cursor-pointer">
                <input type="checkbox" checked={soloSinFoto}
                  onChange={e => setSoloSinFoto(e.target.checked)}
                  className="rounded border-surface-border accent-brand-500" />
                Solo sin foto
              </label>
            </div>
            {/* Buscador */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input value={queryProd} onChange={e => setQueryProd(e.target.value)}
                placeholder="Buscar producto o código..."
                className="w-full border border-surface-border rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            {/* Filtro sucursal */}
            {sucursales.length > 2 && (
              <select value={sucursalFiltro} onChange={e => setSucursalFiltro(e.target.value)}
                className="w-full border border-surface-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white">
                {sucursales.map(s => <option key={s} value={s}>{s === "todas" ? "Todas las sucursales" : s}</option>)}
              </select>
            )}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-border/50">
            {filteredProds.length === 0 && (
              <p className="text-center text-surface-muted text-sm py-10">Sin resultados</p>
            )}
            {filteredProds.map(p => {
              const selected = selectedProducto?.id === p.id;
              const saved = savedIds.has(p.id);
              const hasBlob = !!selectedBlob;
              return (
                <button key={p.id} onClick={() => handleProdClick(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all group ${
                    selected
                      ? "bg-brand-50 border-l-2 border-brand-500"
                      : hasBlob
                      ? "hover:bg-emerald-50 cursor-pointer"
                      : "hover:bg-surface-bg"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`w-11 h-11 shrink-0 rounded-lg overflow-hidden border ${selected ? "border-brand-300" : "border-surface-border"} bg-surface-bg`}>
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
                    <p className="text-xs font-bold text-surface-text truncate leading-tight">{p.nombre}</p>
                    <p className="text-[10px] text-surface-muted truncate">{p.codigo}</p>
                    {p.sucursal && <p className="text-[10px] text-brand-500 font-medium truncate">{p.sucursal}</p>}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {saved ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    ) : hasBlob && !selected ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZapIcon size={11} className="text-emerald-600" />
                      </div>
                    ) : p.imagen ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" title="Tiene foto" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
