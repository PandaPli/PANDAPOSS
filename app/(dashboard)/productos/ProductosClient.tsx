"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit2, Package, X, Loader2, Upload, ImageOff, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Rol } from "@/types";

const MAX_MB = 2;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface Categoria { id: number; nombre: string; }
interface Sucursal { id: number; nombre: string; }
interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  activo: boolean;
  enMenu: boolean;
  ivaActivo: boolean;
  categoriaId: number | null;
  categoria?: { id: number; nombre: string } | undefined;
}

interface Props {
  productos: Producto[];
  categorias: Categoria[];
  sucursales: Sucursal[];
  rol: Rol;
  simbolo: string;
}

const emptyForm = {
  codigo: "", nombre: "", precio: "", categoriaId: "",
  ivaActivo: false, ivaPorc: "0", enMenu: true,
  sucursalId: "", imagen: "",
};

export function ProductosClient({ productos: initial, categorias, sucursales, rol, simbolo }: Props) {
  const router = useRouter();
  const [productos] = useState(initial);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminGeneral = rol === "ADMIN_GENERAL";

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = !search
        || p.nombre.toLowerCase().includes(search.toLowerCase())
        || p.codigo.toLowerCase().includes(search.toLowerCase());
      const matchCat = !catFiltro || p.categoriaId === catFiltro;
      return matchSearch && matchCat;
    });
  }, [productos, search, catFiltro]);

  function abrirFormNuevo() {
    setEditando(null);
    setForm(emptyForm);
    setError("");
    setUploadError("");
    setImgPreview(null);
    setShowForm(true);
  }

  function abrirFormEditar(p: Producto) {
    setEditando(p);
    setForm({
      codigo: p.codigo, nombre: p.nombre, precio: String(p.precio),
      categoriaId: p.categoriaId ? String(p.categoriaId) : "",
      ivaActivo: p.ivaActivo, ivaPorc: "0", enMenu: p.enMenu,
      sucursalId: "", imagen: p.imagen ?? "",
    });
    setImgPreview(p.imagen ?? null);
    setError("");
    setUploadError("");
    setShowForm(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (file.size > MAX_BYTES) {
      setUploadError(`El archivo supera el límite de ${MAX_MB} MB`);
      e.target.value = "";
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setUploadError("Formato no permitido. Use JPG, PNG, WEBP o GIF");
      e.target.value = "";
      return;
    }

    // Preview local inmediato
    setImgPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir imagen");
      setForm((f) => ({ ...f, imagen: data.url }));
    } catch (err) {
      setUploadError((err as Error).message);
      setImgPreview(editando?.imagen ?? null);
      setForm((f) => ({ ...f, imagen: editando?.imagen ?? "" }));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function quitarImagen() {
    setImgPreview(null);
    setForm((f) => ({ ...f, imagen: "" }));
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      ...(editando ? { id: editando.id } : {}),
      codigo: form.codigo,
      nombre: form.nombre,
      precio: Number(form.precio),
      categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
      ivaActivo: form.ivaActivo,
      ivaPorc: Number(form.ivaPorc),
      enMenu: form.enMenu,
      imagen: form.imagen || null,
    };

    if (isAdminGeneral && form.sucursalId) {
      body.sucursalId = Number(form.sucursalId);
    }

    try {
      const res = await fetch("/api/productos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error");
      }
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Productos</h1>
          <p className="text-surface-muted text-sm mt-1">{filtrados.length} producto{filtrados.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirFormNuevo} className="btn-primary">
          <Plus size={16} />
          Nuevo Producto
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input type="text" placeholder="Buscar por nombre o código..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={catFiltro ?? ""} onChange={(e) => setCatFiltro(e.target.value ? Number(e.target.value) : null)} className="input w-auto">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Foto</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Código</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-surface-muted">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package size={32} className="mx-auto text-surface-muted mb-2" />
                    <p className="text-surface-muted">Sin productos</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-bg transition-colors">
                    <td className="px-4 py-3">
                      {p.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen} alt={p.nombre} className="w-9 h-9 rounded-lg object-cover border border-surface-border" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center">
                          <ImageOff size={14} className="text-surface-muted" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-surface-muted">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-surface-text">{p.nombre}</td>
                    <td className="px-4 py-3 text-surface-muted">{p.categoria?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-surface-text">
                      {formatCurrency(p.precio, simbolo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        p.enMenu ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-surface-bg text-surface-muted border-surface-border"
                      }`}>{p.enMenu ? "En menú" : "Oculto"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirFormEditar(p)}
                        className="p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-end">
          <div className="bg-white h-full sm:h-auto sm:rounded-l-2xl w-full max-w-md shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-bold text-surface-text">{editando ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              {/* Sucursal — solo ADMIN_GENERAL */}
              {isAdminGeneral && (
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg">
                  <label className="flex items-center gap-1.5 label text-brand-700 mb-1.5">
                    <Building2 size={13} />
                    Sucursal
                    <span className="text-xs font-normal text-brand-500">(opcional — global si vacío)</span>
                  </label>
                  <select
                    className="input"
                    value={form.sucursalId}
                    onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}
                  >
                    <option value="">Global (todas las sucursales)</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Código *</label>
                  <input className="input" value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    required placeholder="P001" />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.categoriaId}
                    onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required placeholder="Nombre del producto" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Precio Venta *</label>
                  <input type="number" className="input" value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    required min={0} step={0.01} />
                </div>
                <div>
                  <label className="label">IVA (%)</label>
                  <input type="number" className="input" value={form.ivaPorc}
                    onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })}
                    min={0} max={100} />
                </div>
              </div>

              {/* Fotografía del producto */}
              <div>
                <label className="label">Fotografía del producto</label>
                <div className="space-y-2">
                  {imgPreview ? (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-surface-border bg-surface-bg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgPreview} alt="Preview" className="w-full h-full object-contain" />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 size={22} className="animate-spin text-brand-500" />
                        </div>
                      )}
                      {!uploading && (
                        <button
                          type="button"
                          onClick={quitarImagen}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-surface-muted hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-20 border-2 border-dashed border-surface-border rounded-xl flex flex-col items-center justify-center gap-1.5 text-surface-muted hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                    >
                      <Upload size={18} />
                      <span className="text-xs">Subir foto — máx. {MAX_MB} MB</span>
                      <span className="text-[10px] text-surface-muted">JPG, PNG, WEBP, GIF</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {uploadError && (
                    <p className="text-xs text-red-600">{uploadError}</p>
                  )}
                  {imgPreview && !uploading && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Cambiar foto
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-surface-text cursor-pointer">
                  <input type="checkbox" checked={form.enMenu}
                    onChange={(e) => setForm({ ...form, enMenu: e.target.checked })} className="rounded" />
                  Visible en menú
                </label>
                <label className="flex items-center gap-2 text-sm text-surface-text cursor-pointer">
                  <input type="checkbox" checked={form.ivaActivo}
                    onChange={(e) => setForm({ ...form, ivaActivo: e.target.checked })} className="rounded" />
                  Aplica IVA
                </label>
              </div>
            </form>

            <div className="p-5 border-t border-surface-border flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={loading || uploading} className="btn-primary flex-1 justify-center">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {editando ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
