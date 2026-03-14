"use client";

import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit2, ImagePlus, Loader2, Package, Plus, Search, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Categoria { id: number; nombre: string; }
interface Sucursal { id: number; nombre: string; }
interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  activo: boolean;
  enMenu: boolean;
  enMenuQR: boolean;
  ivaActivo: boolean;
  categoriaId: number | null;
  sucursalId: number | null;
  categoria?: { id: number; nombre: string } | undefined;
  sucursal?: { id: number; nombre: string } | undefined;
}

interface Props {
  productos: Producto[];
  categorias: Categoria[];
  sucursales: Sucursal[];
  simbolo: string;
  rol: string;
}

const emptyForm = {
  codigo: "",
  nombre: "",
  descripcion: "",
  precio: "",
  categoriaId: "",
  sucursalId: "",
  imagen: "",
  ivaActivo: false,
  ivaPorc: "0",
  enMenu: true,
  enMenuQR: true,
};

export function ProductosClient({ productos: initial, categorias, sucursales, simbolo, rol }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [productos] = useState(initial);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState<number | null>(null);
  const [sucFiltro, setSucFiltro] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = !search
        || p.nombre.toLowerCase().includes(search.toLowerCase())
        || p.codigo.toLowerCase().includes(search.toLowerCase());
      const matchCat = !catFiltro || p.categoriaId === catFiltro;
      const matchSuc = !sucFiltro || p.sucursalId === sucFiltro;
      return matchSearch && matchCat && matchSuc;
    });
  }, [productos, search, catFiltro, sucFiltro]);

  function closeForm() {
    setShowForm(false);
    setEditando(null);
    setForm(emptyForm);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function abrirFormNuevo() {
    setEditando(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function abrirFormEditar(p: Producto) {
    setEditando(p);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precio: String(p.precio),
      categoriaId: p.categoriaId ? String(p.categoriaId) : "",
      sucursalId: p.sucursalId ? String(p.sucursalId) : "",
      imagen: p.imagen ?? "",
      ivaActivo: p.ivaActivo,
      ivaPorc: "0",
      enMenu: p.enMenu,
      enMenuQR: p.enMenuQR,
    });
    setError("");
    setShowForm(true);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir imagen");

      setForm((current) => ({ ...current, imagen: data.url }));
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage() {
    setForm((current) => ({ ...current, imagen: "" }));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      ...(editando ? { id: editando.id } : {}),
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
      sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
      imagen: form.imagen || null,
      ivaActivo: form.ivaActivo,
      ivaPorc: Number(form.ivaPorc),
      enMenu: form.enMenu,
      enMenuQR: form.enMenuQR,
    };

    try {
      const res = await fetch("/api/productos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error");
      }
      closeForm();
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Productos</h1>
          <p className="mt-1 text-sm text-surface-muted">{filtrados.length} producto{filtrados.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirFormNuevo} className="btn-primary">
          <Plus size={16} />
          Nuevo Producto
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={catFiltro ?? ""} onChange={(e) => setCatFiltro(e.target.value ? Number(e.target.value) : null)} className="input w-auto">
          <option value="">Todas las categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        {rol === "ADMIN_GENERAL" && (
          <select value={sucFiltro ?? ""} onChange={(e) => setSucFiltro(e.target.value ? Number(e.target.value) : null)} className="input w-auto">
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Codigo</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Producto</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Sucursal</th>
                <th className="px-4 py-3 text-right font-medium text-surface-muted">Precio</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package size={32} className="mx-auto mb-2 text-surface-muted" />
                    <p className="text-surface-muted">Sin productos</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-bg">
                    <td className="px-4 py-3 font-mono text-xs text-surface-muted">{p.codigo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-bg">
                          {p.imagen ? (
                            <img src={p.imagen} alt={p.nombre} className="h-full w-full object-cover" />
                          ) : (
                            <Package size={16} className="text-surface-muted" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-surface-text">{p.nombre}</p>
                          <p className="text-xs text-surface-muted">{p.descripcion?.slice(0, 56) || "Sin imagen ni descripcion adicional"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-muted">{p.categoria?.nombre ?? "-"}</td>
                    <td className="px-4 py-3">
                      {p.sucursal ? (
                        <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {p.sucursal.nombre}
                        </span>
                      ) : (
                        <span className="text-surface-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-surface-text">{formatCurrency(p.precio, simbolo)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        p.enMenu ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-surface-border bg-surface-bg text-surface-muted"
                      }`}>
                        {p.enMenu ? "En menu" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => abrirFormEditar(p)}
                        className="rounded-lg p-1.5 text-surface-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
                      >
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
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in sm:h-auto sm:rounded-l-2xl">
            <div className="flex items-center justify-between border-b border-surface-border p-5">
              <h2 className="font-bold text-surface-text">{editando ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={closeForm} className="rounded-lg p-2 text-surface-muted transition-colors hover:bg-surface-bg hover:text-surface-text">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Codigo *</label>
                  <input
                    className="input"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    required
                    placeholder="P001"
                  />
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                    <option value="">Sin categoria</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="label">Imagen del producto</label>
                <div className="rounded-2xl border border-dashed border-surface-border bg-surface-bg/60 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-surface-border bg-white">
                      {form.imagen ? (
                        <img src={form.imagen} alt="Vista previa" className="h-full w-full object-cover" />
                      ) : (
                        <div className="px-3 text-center text-xs text-surface-muted">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm text-surface-muted">Sube una foto para que el producto se vea mejor en menu, ventas y carta QR.</p>
                      <div className="flex flex-wrap gap-2">
                        <label className="btn-secondary cursor-pointer">
                          {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                          {uploadingImage ? "Subiendo..." : form.imagen ? "Cambiar imagen" : "Cargar imagen"}
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        {form.imagen && (
                          <button type="button" onClick={removeImage} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
                            <Trash2 size={16} />
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Ingredientes / Detalles (Para Carta QR)</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Aros de cebolla con salsa BBQ..."
                />
              </div>

              {rol === "ADMIN_GENERAL" && (
                <div>
                  <label className="label">Sucursal</label>
                  <select className="input" value={form.sucursalId} onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}>
                    <option value="">Global (Todas las sucursales)</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Precio Venta *</label>
                  <input
                    type="number"
                    className="input"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    required
                    min={0}
                    step={0.01}
                  />
                </div>
                <div>
                  <label className="label">IVA (%)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.ivaPorc}
                    onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-text">
                  <input
                    type="checkbox"
                    checked={form.enMenu}
                    onChange={(e) => setForm({ ...form, enMenu: e.target.checked })}
                    className="rounded"
                  />
                  Visible en POS/App
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-text">
                  <input
                    type="checkbox"
                    checked={form.enMenuQR}
                    onChange={(e) => setForm({ ...form, enMenuQR: e.target.checked })}
                    className="rounded"
                  />
                  Visible en Carta QR
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-text">
                  <input
                    type="checkbox"
                    checked={form.ivaActivo}
                    onChange={(e) => setForm({ ...form, ivaActivo: e.target.checked })}
                    className="rounded"
                  />
                  Aplica IVA
                </label>
              </div>
            </form>

            <div className="flex gap-3 border-t border-surface-border p-5">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button type="button" onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={loading || uploadingImage} className="btn-primary flex-1 justify-center">
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
