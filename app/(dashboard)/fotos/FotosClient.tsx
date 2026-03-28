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
  const [soloNoAsignadas, setSoloNoAsignadas] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/blob/list")
      .then(r => r.json())
      .then(data => { setBlobs(data); setLoadingBlobs(false); })
      .catch(() => setLoadingBlobs(false));
  }, []);

  const sucursales = ["todas", ...Array.from(new Set(localProds.map(p => p.sucursal ?? "Sin sucursal")))];

  const filteredProds = localProds.filter(p => {
    const q = queryProd.toLowerCase();
    const matchQ = p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
    const matchFoto = soloSinFoto ? !p.imagen : true;
    const matchSuc = sucursalFiltro === "todas" || (p.sucursal ?? "Sin sucursal") === sucursalFiltro;
    return matchQ && matchFoto && matchSuc;
  });

  // Set de URLs ya asignadas a algún producto
  const assignedUrls = new Set(localProds.map(p => p.imagen).filter(Boolean) as string[]);

  const filteredBlobs = blobs.filter(b => {
    const matchQ = b.pathname.toLowerCase().includes(queryBlob.toLowerCase());
    const matchAsig = soloNoAsignadas ? !assignedUrls.has(b.url) : true;
    return matchQ && matchAsig;
  });

  const noAsignadasCount = blobs.filter(b => !assignedUrls.has(b.url)).length;

  const sinFoto = localProds.filter(p => !p.imagen).length;
  const conFoto = localProds.filter(p => !!p.imagen).length;
  const pct = localProds.length > 0 ? Math.round((conFoto / localProds.length) * 100) : 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

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
      showToast(`✅ "${prod.nombre}" actualizado`);
      const idx = filteredProds.findIndex(p => p.id === prod.id);
      const next = filteredProds.find((p, i) => i > idx && !p.imagen);
      setSelectedProducto(next ?? null);
      setSelectedBlob(null);
    } finally {
      setSaving(false);
    }
  }

  function handleBlobClick(url: string) {
    if (selectedProducto) {
      asignar(url, selectedProducto);
    } else {
      setSelectedBlob(url === selectedBlob ? null : url);
    }
  }

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

  const hasBlob = !!selectedBlob;
  const hasProd = !!selectedProducto;

  return (
    // Ocupa exactamente el alto disponible en el dashboard (100vh - navbar - padding)
    <div className="flex flex-col gap-3 overflow-hidden" style={{ height: "calc(100vh - 7.5rem)" }}>

      {/* ── Barra superior compacta ── */}
      <div className="flex items-center gap-4 flex-wrap shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-surface-text leading-tight">Galería de Fotos</h1>
          <p className="text-xs text-surface-muted">{sinFoto} sin foto · {conFoto} con foto</p>
        </div>

        {/* Progreso */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black text-surface-text">{pct}%</span>
          <div className="w-28 h-2 rounded-full bg-surface-border overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: pct + "%" }} />
          </div>
        </div>

        {/* Toast inline */}
        {toast && (
          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
            {toast}
          </span>
        )}

        {/* Instrucción/estado */}
        <span className={`text-xs px-3 py-1 rounded-full shrink-0 ${
          hasProd && hasBlob ? "bg-brand-50 text-brand-700 border border-brand-200" :
          hasProd ? "bg-amber-50 text-amber-700 border border-amber-200" :
          hasBlob ? "bg-amber-50 text-amber-700 border border-amber-200" :
          "bg-surface-bg text-surface-muted border border-surface-border"
        }`}>
          {hasProd && hasBlob
            ? `⚡ Confirma para asignar`
            : hasProd
            ? `🖼️ Ahora clic en imagen`
            : hasBlob
            ? `🍽️ Ahora clic en producto`
            : "Selecciona producto → imagen"}
        </span>
      </div>

      {/* ── Confirm bar (solo si ambos seleccionados) ── */}
      {hasProd && hasBlob && (
        <div className="shrink-0 rounded-xl border-2 border-brand-400 bg-brand-50 p-2.5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedBlob!} alt="" className="w-12 h-12 rounded-lg object-cover border border-brand-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-700 truncate">{selectedProducto!.nombre}</p>
            <p className="text-[10px] text-surface-muted">{selectedProducto!.codigo}</p>
          </div>
          <button onClick={() => { setSelectedBlob(null); setSelectedProducto(null); }}
            className="text-xs text-surface-muted hover:text-red-500 px-2 shrink-0">
            <X size={14} />
          </button>
          <button onClick={() => asignar(selectedBlob!, selectedProducto!)} disabled={saving}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-60 transition-all active:scale-95 shrink-0">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {saving ? "Guardando..." : "Asignar"}
          </button>
        </div>
      )}

      {/* ── Columnas principales: flex-1 para ocupar el resto del alto ── */}
      <div className="grid grid-cols-[1fr_320px] gap-3 flex-1 min-h-0 overflow-hidden">

        {/* ── IZQUIERDA: Imágenes Blob ── */}
        <div className="rounded-2xl border border-surface-border bg-surface-card flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-white shrink-0 flex-wrap">
            <span className="text-xs font-bold text-surface-text shrink-0">
              📦 Blob ({filteredBlobs.length})
            </span>
            <div className="relative flex-1 min-w-[120px]">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input value={queryBlob} onChange={e => setQueryBlob(e.target.value)}
                placeholder="Filtrar por nombre..."
                className="w-full border border-surface-border rounded-lg pl-6 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            {/* Toggle no asignadas */}
            <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0 select-none">
              <input type="checkbox" checked={soloNoAsignadas}
                onChange={e => setSoloNoAsignadas(e.target.checked)}
                className="rounded accent-brand-500" />
              <span className={soloNoAsignadas ? "text-brand-600 font-bold" : "text-surface-muted"}>
                No asignadas ({noAsignadasCount})
              </span>
            </label>
            {selectedBlob && (
              <button onClick={() => setSelectedBlob(null)}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5 shrink-0">
                <X size={11} /> Quitar
              </button>
            )}
            <input ref={uploadRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
            <button onClick={() => uploadRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-brand-600 disabled:opacity-60 shrink-0">
              {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              Subir
            </button>
          </div>

          {/* Grid scrollable */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingBlobs ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={22} className="animate-spin text-surface-muted" />
              </div>
            ) : filteredBlobs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-surface-muted">No hay imágenes</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-7 gap-1.5">
                {filteredBlobs.map(b => {
                  const isSel = selectedBlob === b.url;
                  const isAsigned = assignedUrls.has(b.url);
                  return (
                    <button key={b.url} onClick={() => handleBlobClick(b.url)} title={b.pathname}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                        isSel
                          ? "border-brand-500 ring-2 ring-brand-300 scale-95"
                          : hasProd
                          ? "border-emerald-300 hover:scale-95 hover:border-emerald-500"
                          : isAsigned
                          ? "border-emerald-400/60 hover:border-brand-300 hover:scale-95"
                          : "border-surface-border hover:border-brand-300 hover:scale-95"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.url} alt="" className="w-full h-full object-cover" />

                      {/* Indicador: ya asignada */}
                      {isAsigned && !isSel && (
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                          <Check size={9} className="text-white" />
                        </div>
                      )}

                      {isSel && (
                        <div className="absolute inset-0 bg-brand-500/25 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shadow">
                            <Check size={13} className="text-white" />
                          </div>
                        </div>
                      )}
                      {hasProd && !isSel && (
                        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ZapIcon size={16} className="text-white drop-shadow" />
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
          {/* Header fijo */}
          <div className="px-3 py-2 border-b border-surface-border bg-white space-y-1.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-surface-text">🍽️ Productos ({filteredProds.length})</span>
              <label className="flex items-center gap-1 text-[11px] text-surface-muted cursor-pointer">
                <input type="checkbox" checked={soloSinFoto}
                  onChange={e => setSoloSinFoto(e.target.checked)}
                  className="rounded accent-brand-500" />
                Sin foto
              </label>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input value={queryProd} onChange={e => setQueryProd(e.target.value)}
                placeholder="Buscar..."
                className="w-full border border-surface-border rounded-lg pl-6 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            {sucursales.length > 2 && (
              <select value={sucursalFiltro} onChange={e => setSucursalFiltro(e.target.value)}
                className="w-full border border-surface-border rounded-lg px-2 py-1 text-[11px] focus:outline-none bg-white">
                {sucursales.map(s => <option key={s} value={s}>{s === "todas" ? "Todas las sucursales" : s}</option>)}
              </select>
            )}
          </div>

          {/* Lista scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-border/40">
            {filteredProds.length === 0 && (
              <p className="text-center text-surface-muted text-xs py-8">Sin resultados</p>
            )}
            {filteredProds.map(p => {
              const selected = selectedProducto?.id === p.id;
              const saved = savedIds.has(p.id);
              return (
                <button key={p.id} onClick={() => handleProdClick(p)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-left transition-all group ${
                    selected
                      ? "bg-brand-50 border-l-[3px] border-brand-500"
                      : hasBlob
                      ? "hover:bg-emerald-50"
                      : "hover:bg-surface-bg"
                  }`}
                >
                  {/* Thumb */}
                  <div className={`w-9 h-9 shrink-0 rounded-lg overflow-hidden border ${selected ? "border-brand-300" : "border-surface-border"} bg-surface-bg`}>
                    {p.imagen
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imagen} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={12} className="text-surface-muted" />
                        </div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-surface-text truncate leading-tight">{p.nombre}</p>
                    <p className="text-[10px] text-surface-muted truncate">{p.codigo}{p.sucursal ? ` · ${p.sucursal}` : ""}</p>
                  </div>
                  <div className="shrink-0">
                    {saved ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    ) : hasBlob && !selected ? (
                      <ZapIcon size={12} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : p.imagen ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
