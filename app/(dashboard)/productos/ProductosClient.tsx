"use client";

import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit2, ImagePlus, Loader2, Package, Plus, Search, Trash2, X, ChefHat, Wine, Flame, ShoppingBag, ChevronDown, Wand2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Estacion = "COCINA" | "BARRA" | "CUARTO_CALIENTE" | "MOSTRADOR";

const ESTACION_CONFIG: Record<Estacion, { label: string; color: string; icon: React.ReactNode }> = {
  COCINA:          { label: "Cocina",          color: "bg-orange-100 text-orange-700",  icon: <ChefHat size={11} /> },
  BARRA:           { label: "Barra",           color: "bg-blue-100 text-blue-700",      icon: <Wine size={11} /> },
  CUARTO_CALIENTE: { label: "Cuarto Caliente", color: "bg-red-100 text-red-700",        icon: <Flame size={11} /> },
  MOSTRADOR:       { label: "Mostrador",       color: "bg-purple-100 text-purple-700",  icon: <ShoppingBag size={11} /> },
};

interface Categoria { id: number; nombre: string; estacion?: Estacion; }
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
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categoriasState, setCategoriasState] = useState(categorias);
  const [showEstaciones, setShowEstaciones] = useState(false);
  const [savingEstacion, setSavingEstacion] = useState<number | null>(null);

  // ── Importar Carta ────────────────────────────────────────────────────────
  const [showImportar, setShowImportar] = useState(false);
  const [importTexto, setImportTexto] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importPreview, setImportPreview] = useState<{ nombre: string; precio: number; categoria?: string; descripcion?: string }[]>([]);
  const [importCreando, setImportCreando] = useState(false);
  const [importDone, setImportDone] = useState<{ creados: number } | null>(null);

  async function handleAnalizarCarta() {
    if (!importTexto.trim()) return;
    setImportLoading(true);
    setImportError("");
    setImportPreview([]);
    setImportDone(null);
    try {
      const res = await fetch("/api/productos/importar-carta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", texto: importTexto }),
      });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error ?? "Error al analizar"); return; }
      setImportPreview(data.productos ?? []);
    } catch {
      setImportError("Error de conexión");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleCrearProductos() {
    if (!importPreview.length) return;
    setImportCreando(true);
    setImportError("");
    try {
      const res = await fetch("/api/productos/importar-carta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crear", productos: importPreview }),
      });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error ?? "Error al crear"); return; }
      setImportDone({ creados: data.creados });
      router.refresh();
    } catch {
      setImportError("Error de conexión");
    } finally {
      setImportCreando(false);
    }
  }

  function cerrarImportar() {
    setShowImportar(false);
    setImportTexto("");
    setImportPreview([]);
    setImportError("");
    setImportDone(null);
  }

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

  async function cambiarEstacion(categoriaId: number, estacion: Estacion) {
    setSavingEstacion(categoriaId);
    try {
      await fetch(`/api/categorias/${categoriaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estacion }),
      });
      setCategoriasState((prev) =>
        prev.map((c) => c.id === categoriaId ? { ...c, estacion } : c)
      );
    } finally {
      setSavingEstacion(null);
    }
  }

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

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/productos?id=${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al eliminar");
      }
      setConfirmDelete(null);
      router.refresh();
    } catch (deleteError) {
      setError((deleteError as Error).message);
      setConfirmDelete(null);
    } finally {
      setDeleteLoading(false);
    }
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportar(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors"
          >
            <Wand2 size={15} />
            Importar Carta
          </button>
          <button onClick={abrirFormNuevo} className="btn-primary">
            <Plus size={16} />
            Nuevo Producto
          </button>
        </div>
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

      {/* Panel de estaciones por categoría */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowEstaciones((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-surface-text hover:bg-surface-bg transition-colors"
        >
          <span className="flex items-center gap-2">
            <ChefHat size={15} className="text-orange-500" />
            Estaciones por Categoría
          </span>
          <ChevronDown size={15} className={`text-surface-muted transition-transform ${showEstaciones ? "rotate-180" : ""}`} />
        </button>
        {showEstaciones && (
          <div className="border-t border-surface-border p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categoriasState.map((cat) => {
              const est = (cat.estacion ?? "COCINA") as Estacion;
              const cfg = ESTACION_CONFIG[est];
              return (
                <div key={cat.id} className="flex flex-col gap-1 rounded-xl border border-surface-border p-2">
                  <span className="text-xs font-medium text-surface-text truncate">{cat.nombre}</span>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {savingEstacion === cat.id && <Loader2 size={10} className="animate-spin text-surface-muted" />}
                  </div>
                  <select
                    value={est}
                    onChange={(e) => cambiarEstacion(cat.id, e.target.value as Estacion)}
                    className="mt-1 rounded-lg border border-surface-border bg-white px-2 py-1 text-xs text-surface-text"
                    disabled={savingEstacion === cat.id}
                  >
                    <option value="COCINA">🍳 Cocina</option>
                    <option value="BARRA">🍹 Barra</option>
                    <option value="CUARTO_CALIENTE">🔥 Cuarto Caliente</option>
                    <option value="MOSTRADOR">🧁 Mostrador</option>
                  </select>
                </div>
              );
            })}
          </div>
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
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-surface-muted">{p.categoria?.nombre ?? "-"}</span>
                        {p.categoria && (() => {
                          const catData = categoriasState.find(c => c.id === p.categoriaId);
                          const est = (catData?.estacion ?? "COCINA") as Estacion;
                          const cfg = ESTACION_CONFIG[est];
                          return (
                            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => abrirFormEditar(p)}
                          className="rounded-lg p-1.5 text-surface-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="rounded-lg p-1.5 text-surface-muted transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Importar Carta ─────────────────────────────────────────── */}
      {showImportar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                  <Wand2 size={18} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-surface-text">Importar Carta Automáticamente</h2>
                  <p className="text-xs text-surface-muted">Pega el texto de tu menú y PandaPoss crea los productos por ti</p>
                </div>
              </div>
              <button onClick={cerrarImportar} className="p-2 rounded-xl hover:bg-surface-bg text-surface-muted hover:text-surface-text transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Éxito */}
              {importDone ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-surface-text">¡Carta importada!</p>
                    <p className="text-surface-muted mt-1">Se crearon <span className="font-semibold text-emerald-600">{importDone.creados} productos</span> en tu catálogo.</p>
                  </div>
                  <button onClick={cerrarImportar} className="btn-primary px-8">
                    Ver Productos
                  </button>
                </div>
              ) : importPreview.length > 0 ? (
                /* Preview tabla */
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-surface-text">
                      {importPreview.length} productos detectados
                    </p>
                    <button
                      onClick={() => { setImportPreview([]); setImportDone(null); }}
                      className="text-xs text-surface-muted hover:text-surface-text underline"
                    >
                      Volver a editar texto
                    </button>
                  </div>
                  <div className="rounded-xl border border-surface-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-bg border-b border-surface-border">
                          <th className="text-left px-4 py-2.5 text-surface-muted font-medium">Producto</th>
                          <th className="text-left px-4 py-2.5 text-surface-muted font-medium">Categoría</th>
                          <th className="text-right px-4 py-2.5 text-surface-muted font-medium">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {importPreview.map((p, i) => (
                          <tr key={i} className="hover:bg-surface-bg/50">
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-surface-text">{p.nombre}</p>
                              {p.descripcion && <p className="text-xs text-surface-muted truncate max-w-xs">{p.descripcion}</p>}
                            </td>
                            <td className="px-4 py-2.5 text-surface-muted">{p.categoria ?? "—"}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-brand-500">
                              {simbolo}{p.precio.toLocaleString("es-CL")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                      <AlertCircle size={15} /> {importError}
                    </div>
                  )}
                  <button
                    onClick={handleCrearProductos}
                    disabled={importCreando}
                    className="btn-primary w-full justify-center py-3 text-base"
                  >
                    {importCreando ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {importCreando ? "Creando productos..." : `Crear ${importPreview.length} productos`}
                  </button>
                </>
              ) : (
                /* Input de texto */
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-text">Pega aquí el texto de tu carta</label>
                    <p className="text-xs text-surface-muted">
                      Puedes pegar texto copiado de WhatsApp, PDF, Google Docs, o cualquier menú. PandaPoss detecta los productos y precios automáticamente.
                    </p>
                    <textarea
                      value={importTexto}
                      onChange={(e) => setImportTexto(e.target.value)}
                      placeholder={"Ejemplo:\n🍣 Rolls\nCalifornia Roll  $5.990\nRoll Acevichado  $6.990\n\n🥤 Bebidas\nCoca Cola  $1.500\nAgua  $990"}
                      rows={12}
                      className="w-full rounded-xl border border-surface-border bg-surface-bg px-4 py-3 text-sm font-mono text-surface-text placeholder:text-surface-muted focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                    />
                  </div>
                  {importError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                      <AlertCircle size={15} /> {importError}
                    </div>
                  )}
                  <button
                    onClick={handleAnalizarCarta}
                    disabled={importLoading || !importTexto.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                  >
                    {importLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {importLoading ? "Analizando con IA..." : "Analizar Carta"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-surface-text">¿Eliminar producto?</h3>
            <p className="mt-1 text-sm text-surface-muted">
              <span className="font-medium text-surface-text">{confirmDelete.nombre}</span> será desactivado y no aparecerá en el menú ni en ventas. El historial de ventas previas se conserva.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
                className="btn-secondary flex-1 justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
                  <Package size={18} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="font-bold text-surface-text leading-tight">
                    {editando ? "Editar Producto" : "Nuevo Producto"}
                  </h2>
                  {editando && (
                    <p className="text-xs text-surface-muted font-mono">{editando.codigo}</p>
                  )}
                </div>
              </div>
              <button onClick={closeForm} className="rounded-xl p-2 text-surface-muted transition-colors hover:bg-surface-bg hover:text-surface-text">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">

              {error && (
                <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
              )}

              {/* Imagen prominente */}
              <div className="px-6 pt-5">
                <label className="label mb-2">Imagen</label>
                <div className="relative flex items-center gap-4 rounded-2xl border-2 border-dashed border-surface-border bg-surface-bg/50 p-4 transition-colors hover:border-brand-300">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-surface-border bg-white shadow-sm">
                    {form.imagen ? (
                      <img src={form.imagen} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus size={22} className="text-surface-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-text">
                      {form.imagen ? "Imagen cargada" : "Sin imagen"}
                    </p>
                    <p className="mt-0.5 text-xs text-surface-muted">JPG, PNG o WebP. Aparece en menú y carta QR.</p>
                    <div className="mt-2 flex gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white border border-surface-border px-3 py-1.5 text-xs font-medium text-surface-text hover:bg-surface-bg transition-colors">
                        {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                        {uploadingImage ? "Subiendo..." : form.imagen ? "Cambiar" : "Cargar foto"}
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                      {form.imagen && (
                        <button type="button" onClick={removeImage} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Info básica */}
              <div className="px-6 pt-5 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">Información básica</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Código *</label>
                    <input
                      className="input font-mono"
                      value={form.codigo}
                      onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                      required
                      placeholder="CF-001"
                    />
                  </div>
                  <div>
                    <label className="label">Categoría</label>
                    <select className="input" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                      <option value="">Sin categoría</option>
                      {categoriasState.map((c) => {
                        const est = (c.estacion ?? "COCINA") as Estacion;
                        const cfg = ESTACION_CONFIG[est];
                        return <option key={c.id} value={c.id}>{c.nombre}</option>;
                      })}
                    </select>
                    {form.categoriaId && (() => {
                      const cat = categoriasState.find(c => c.id === Number(form.categoriaId));
                      if (!cat) return null;
                      const est = (cat.estacion ?? "COCINA") as Estacion;
                      const cfg = ESTACION_CONFIG[est];
                      return (
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="label">Nombre *</label>
                  <input
                    className="input text-base font-medium"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <label className="label">Descripción / Ingredientes <span className="text-surface-muted font-normal">(Carta QR)</span></label>
                  <textarea
                    className="input min-h-[72px] resize-none"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Ej: Aros de cebolla con salsa BBQ..."
                  />
                </div>

                {rol === "ADMIN_GENERAL" && (
                  <div>
                    <label className="label">Sucursal</label>
                    <select className="input" value={form.sucursalId} onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}>
                      <option value="">Global (todas las sucursales)</option>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="mx-6 my-5 border-t border-surface-border" />

              {/* Sección: Precio */}
              <div className="px-6 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">Precio y tributos</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Precio de venta *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-surface-muted">{simbolo}</span>
                      <input
                        type="number"
                        className="input pl-8 text-lg font-bold"
                        value={form.precio}
                        onChange={(e) => setForm({ ...form, precio: e.target.value })}
                        required min={0} step={0.01}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">IVA (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="input pr-8"
                        value={form.ivaPorc}
                        onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })}
                        min={0} max={100}
                        disabled={!form.ivaActivo}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-muted">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="mx-6 my-5 border-t border-surface-border" />

              {/* Sección: Visibilidad — toggles */}
              <div className="px-6 pb-6 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">Visibilidad</p>

                {[
                  { key: "enMenu",    label: "Visible en POS / App",  desc: "Aparece en ventas y punto de venta" },
                  { key: "enMenuQR",  label: "Visible en Carta QR",    desc: "Aparece en el menú digital para clientes" },
                  { key: "ivaActivo", label: "Aplica IVA",             desc: "Agrega el porcentaje de IVA al precio" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-surface-border bg-surface-bg/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-surface-text">{label}</p>
                      <p className="text-xs text-surface-muted">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [key]: !form[key as keyof typeof form] })}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        form[key as keyof typeof form] ? "bg-brand-500" : "bg-surface-border"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form[key as keyof typeof form] ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </form>

            {/* Footer */}
            <div className="flex gap-3 border-t border-surface-border bg-white px-6 py-4">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit as unknown as React.MouseEventHandler}
                disabled={loading || uploadingImage}
                className="btn-primary flex-1 justify-center"
              >
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
