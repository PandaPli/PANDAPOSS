"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Check, Edit2, Images, ImagePlus, Loader2, Package, Pencil, Plus, Search, Trash2, X, ChefHat, Wine, Flame, ShoppingBag, ChevronDown, Wand2, CheckCircle2, AlertCircle, GripVertical } from "lucide-react";
import { formatCurrency, normalize } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Estacion = "COCINA" | "BARRA" | "CUARTO_CALIENTE" | "MOSTRADOR";

const ESTACION_CONFIG: Record<Estacion, { label: string; color: string; icon: React.ReactNode }> = {
  COCINA:          { label: "Cocina",          color: "bg-orange-100 text-orange-700",  icon: <ChefHat size={11} /> },
  BARRA:           { label: "Barra",           color: "bg-blue-100 text-blue-700",      icon: <Wine size={11} /> },
  CUARTO_CALIENTE: { label: "Cuarto Caliente", color: "bg-red-100 text-red-700",        icon: <Flame size={11} /> },
  MOSTRADOR:       { label: "Mostrador",       color: "bg-purple-100 text-purple-700",  icon: <ShoppingBag size={11} /> },
};

interface Categoria { id: number; nombre: string; estacion?: Estacion; orden?: number; enMenu?: boolean; enMenuQR?: boolean; }
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
  enKiosko: boolean;
  ivaActivo: boolean;
  categoriaId: number | null;
  sucursalId: number | null;
  categoria?: { id: number; nombre: string } | undefined;
  sucursal?: { id: number; nombre: string } | undefined;
}

interface VOpcion { _key: string; nombre: string; precio: string; }
interface VGrupo  { _key: string; nombre: string; requerido: boolean; tipo: "radio"|"checkbox"; opciones: VOpcion[]; }

interface Props {
  productos: Producto[];
  categorias: Categoria[];
  sucursales: Sucursal[];
  simbolo: string;
  rol: string;
}

// ── Sortable card para drag & drop de categorías ─────────────────────────────
function SortableCatCard({
  cat,
  savingEstacion,
  onCambiarEstacion,
  onRename,
  onToggleVisibilidad,
}: {
  cat: Categoria;
  savingEstacion: number | null;
  onCambiarEstacion: (id: number, est: Estacion) => void;
  onRename: (id: number, nombre: string) => void;
  onToggleVisibilidad: (id: number, field: "enMenu" | "enMenuQR", value: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const est = (cat.estacion ?? "COCINA") as Estacion;
  const cfg = ESTACION_CONFIG[est];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(cat.nombre);
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() { setDraft(cat.nombre); setEditing(true); setTimeout(() => inputRef.current?.select(), 30); }
  function cancel()    { setEditing(false); setDraft(cat.nombre); }

  async function save() {
    const nombre = draft.trim();
    if (!nombre || nombre === cat.nombre) { cancel(); return; }
    setSaving(true);
    await fetch(`/api/categorias/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    onRename(cat.id, nombre);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-1 rounded-xl border border-surface-border p-2 bg-white ${isDragging ? "opacity-50 shadow-lg z-50" : ""}`}
    >
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-surface-muted hover:text-surface-text touch-none"
          title="Arrastrar para reordenar"
        >
          <GripVertical size={13} />
        </button>

        {editing ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              className="flex-1 min-w-0 rounded border border-brand-500 px-1.5 py-0.5 text-xs font-medium text-surface-text outline-none"
              disabled={saving}
            />
            <button onClick={save} disabled={saving} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-40" title="Guardar">
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            </button>
            <button onClick={cancel} className="text-surface-muted hover:text-red-500" title="Cancelar">
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="group flex flex-1 items-center gap-1 min-w-0 text-left"
            title="Clic para renombrar"
          >
            <span className="text-xs font-medium text-surface-text truncate flex-1">{cat.nombre}</span>
            <Pencil size={10} className="flex-shrink-0 text-surface-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
        {savingEstacion === cat.id && <Loader2 size={10} className="animate-spin text-surface-muted" />}
      </div>
      <select
        value={est}
        onChange={(e) => onCambiarEstacion(cat.id, e.target.value as Estacion)}
        className="mt-1 rounded-lg border border-surface-border bg-white px-2 py-1 text-xs text-surface-text"
        disabled={savingEstacion === cat.id}
      >
        <option value="COCINA">🍳 Cocina</option>
        <option value="BARRA">🍹 Barra</option>
        <option value="CUARTO_CALIENTE">🔥 Cuarto Caliente</option>
        <option value="MOSTRADOR">🧁 Mostrador</option>
      </select>
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => onToggleVisibilidad(cat.id, "enMenu", !(cat.enMenu !== false))}
          className={`flex-1 rounded py-0.5 text-[10px] font-semibold border transition-colors ${cat.enMenu !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
          title="Visible en POS / pedidos internos"
        >
          {cat.enMenu !== false ? "✓ POS" : "✗ POS"}
        </button>
        <button
          onClick={() => onToggleVisibilidad(cat.id, "enMenuQR", !(cat.enMenuQR !== false))}
          className={`flex-1 rounded py-0.5 text-[10px] font-semibold border transition-colors ${cat.enMenuQR !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
          title="Visible en carta QR pública"
        >
          {cat.enMenuQR !== false ? "✓ QR" : "✗ QR"}
        </button>
      </div>
    </div>
  );
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
  enKiosko: true,
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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categoriasState, setCategoriasState] = useState(categorias);
  const [showEstaciones, setShowEstaciones] = useState(false);
  const [savingEstacion, setSavingEstacion] = useState<number | null>(null);
  const [showNuevaCat, setShowNuevaCat] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [nuevaCatEstacion, setNuevaCatEstacion] = useState<Estacion>("COCINA");
  const [savingNuevaCat, setSavingNuevaCat] = useState(false);
  const [nuevaCatError, setNuevaCatError] = useState("");
  const [variantesLocal, setVariantesLocal] = useState<VGrupo[]>([]);
  const [variantesLoading, setVariantesLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryBlobs, setGalleryBlobs] = useState<{ url: string; pathname: string }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState("");
  const PLANTILLAS_KEY = "pp_variant_plantillas";
  const [plantillas, setPlantillas] = useState<VGrupo[]>(() => {
    try { return JSON.parse(localStorage.getItem(PLANTILLAS_KEY) ?? "[]"); } catch { return []; }
  });
  const [showPlantillas, setShowPlantillas] = useState(false);

  // ── Drag & drop de categorías ─────────────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategoriasState((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Guardar en BD en background
      fetch("/api/categorias/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((c, i) => ({ id: c.id, orden: i })) }),
      });
      return reordered;
    });
  }, []);

  // ── Importar Carta ────────────────────────────────────────────────────────
  const [showImportar, setShowImportar] = useState(false);
  const [importTab, setImportTab] = useState<"link" | "texto">("link");
  const [importUrl, setImportUrl] = useState("");
  const [importTexto, setImportTexto] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importFetchLoading, setImportFetchLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importInstrucciones, setImportInstrucciones] = useState(false);
  const [importPreview, setImportPreview] = useState<{ nombre: string; precio: number; categoria?: string; descripcion?: string }[]>([]);
  const [importCreando, setImportCreando] = useState(false);
  const [importDone, setImportDone] = useState<{ creados: number } | null>(null);

  async function handleFetchUrl() {
    if (!importUrl.trim()) return;
    setImportFetchLoading(true);
    setImportError("");
    setImportInstrucciones(false);
    try {
      const res = await fetch("/api/productos/importar-carta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch-url", url: importUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "No se pudo leer la página");
        setImportInstrucciones(data.instrucciones ?? false);
        return;
      }
      // Éxito: pasar texto al tab "Pegar Texto" y mostrarlo para que lo revisen
      setImportTexto(data.texto ?? "");
      setImportTab("texto");
    } catch {
      setImportError("Error de conexión al servidor");
    } finally {
      setImportFetchLoading(false);
    }
  }

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
    setImportTab("link");
    setImportUrl("");
    setImportTexto("");
    setImportPreview([]);
    setImportError("");
    setImportInstrucciones(false);
    setImportDone(null);
  }

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const q = normalize(search);
      const matchSearch = !search
        || normalize(p.nombre).includes(q)
        || normalize(p.codigo).includes(q)
        || normalize(p.categoria?.nombre ?? "").includes(q);
      const matchCat = !catFiltro || p.categoriaId === catFiltro;
      const matchSuc = !sucFiltro || p.sucursalId === sucFiltro;
      return matchSearch && matchCat && matchSuc;
    });
  }, [productos, search, catFiltro, sucFiltro]);

  function renombrarCategoria(id: number, nombre: string) {
    setCategoriasState((prev) => prev.map((c) => c.id === id ? { ...c, nombre } : c));
  }

  function guardarPlantilla(grupo: VGrupo) {
    const nueva = { ...grupo, _key: Math.random().toString(36).slice(2) };
    setPlantillas((prev) => {
      // reemplazar si ya existe con el mismo nombre
      const filtradas = prev.filter((p) => p.nombre !== grupo.nombre);
      const updated = [...filtradas, nueva];
      localStorage.setItem(PLANTILLAS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function importarPlantilla(plantilla: VGrupo) {
    setVariantesLocal((prev) => [...prev, {
      ...plantilla,
      _key: Math.random().toString(36).slice(2),
      opciones: plantilla.opciones.map((o) => ({ ...o, _key: Math.random().toString(36).slice(2) })),
    }]);
    setShowPlantillas(false);
  }

  function eliminarPlantilla(nombre: string) {
    setPlantillas((prev) => {
      const updated = prev.filter((p) => p.nombre !== nombre);
      localStorage.setItem(PLANTILLAS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  async function toggleVisibilidadCategoria(categoriaId: number, field: "enMenu" | "enMenuQR", value: boolean) {
    setCategoriasState((prev) =>
      prev.map((c) => c.id === categoriaId ? { ...c, [field]: value } : c)
    );
    await fetch(`/api/categorias/${categoriaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

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

  async function crearCategoria() {
    const nombre = nuevaCatNombre.trim();
    if (!nombre) { setNuevaCatError("Escribe un nombre"); return; }
    setSavingNuevaCat(true);
    setNuevaCatError("");
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, estacion: nuevaCatEstacion }),
      });
      const data = await res.json();
      if (!res.ok) { setNuevaCatError(data.error ?? "Error al crear"); return; }
      setCategoriasState((prev) => [...prev, { id: data.id, nombre: data.nombre, estacion: data.estacion, orden: data.orden, enMenu: true, enMenuQR: true }]);
      setNuevaCatNombre("");
      setNuevaCatEstacion("COCINA");
      setShowNuevaCat(false);
    } catch {
      setNuevaCatError("Error de conexión");
    } finally {
      setSavingNuevaCat(false);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditando(null);
    setForm(emptyForm);
    setError("");
    setVariantesLocal([]);
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
      enKiosko: p.enKiosko ?? true,
    });
    setError("");
    setVariantesLocal([]);
    setVariantesLoading(true);
    setShowForm(true);
    // Load variantes async
    fetch(`/api/productos/${p.id}/variantes`)
      .then(r => r.json())
      .then((grupos: { _key?: string; nombre: string; requerido: boolean; tipo: string; opciones: { _key?: string; nombre: string; precio: number }[] }[]) => {
        setVariantesLocal(grupos.map(g => ({
          _key: Math.random().toString(36).slice(2),
          nombre: g.nombre,
          requerido: g.requerido,
          tipo: (g.tipo === "checkbox" ? "checkbox" : "radio") as "radio"|"checkbox",
          opciones: g.opciones.map(o => ({
            _key: Math.random().toString(36).slice(2),
            nombre: o.nombre,
            precio: String(o.precio),
          })),
        })));
      })
      .catch(() => {})
      .finally(() => setVariantesLoading(false));
  }

  // Paso 1: usuario elige archivo → abrir modal de crop
  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Paso 2: usuario confirma crop → preview inmediato + subir blob recortado
  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null);
    setUploadingImage(true);
    setError("");
    // Preview local optimista mientras sube (evita pantalla en blanco)
    const localUrl = URL.createObjectURL(blob);
    setForm((current) => ({ ...current, imagen: localUrl }));
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "foto.webp", { type: "image/webp" }));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al subir imagen");
      }
      const data = await res.json();
      // Reemplazar URL local por la URL definitiva de Vercel Blob
      setForm((current) => ({ ...current, imagen: data.url }));
      URL.revokeObjectURL(localUrl);
    } catch (uploadError) {
      // Si falla, quitar el preview local
      setForm((current) => ({ ...current, imagen: "" }));
      URL.revokeObjectURL(localUrl);
      setError((uploadError as Error).message);
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage() {
    setForm((current) => ({ ...current, imagen: "" }));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function openGallery() {
    setShowGallery(true);
    setGalleryQuery("");
    if (galleryBlobs.length > 0) return; // ya cargadas
    setGalleryLoading(true);
    try {
      const res = await fetch("/api/blob/list");
      const data = await res.json();
      setGalleryBlobs(data);
    } finally {
      setGalleryLoading(false);
    }
  }

  function selectFromGallery(url: string) {
    setForm((current) => ({ ...current, imagen: url }));
    setShowGallery(false);
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
      enKiosko: form.enKiosko,
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
      const savedData = await res.json();
      // Save variantes
      const savedId = editando?.id ?? savedData?.id;
      if (savedId && variantesLocal.length > 0) {
        await fetch(`/api/productos/${savedId}/variantes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grupos: variantesLocal.map(g => ({
              nombre: g.nombre,
              requerido: g.requerido,
              tipo: g.tipo,
              opciones: g.opciones.map(o => ({ nombre: o.nombre, precio: Number(o.precio) || 0 })),
            })),
          }),
        });
      } else if (savedId && variantesLocal.length === 0 && editando) {
        // Clear variantes if user removed all
        await fetch(`/api/productos/${savedId}/variantes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grupos: [] }),
        });
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
      {/* Modal de recorte de imagen */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={1}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); URL.revokeObjectURL(cropSrc); }}
        />
      )}

      {/* ── Picker de galería blob ── */}
      {showGallery && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-surface-text">Seleccionar imagen</h3>
                <p className="text-xs text-surface-muted">Haz clic en la foto para usarla</p>
              </div>
              <button onClick={() => setShowGallery(false)} className="text-surface-muted hover:text-surface-text">
                <X size={20} />
              </button>
            </div>
            {/* Buscador */}
            <div className="px-4 py-3 border-b border-surface-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input value={galleryQuery} onChange={e => setGalleryQuery(e.target.value)}
                  placeholder="Filtrar por nombre..."
                  className="w-full border border-surface-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
            </div>
            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {galleryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-surface-muted" />
                </div>
              ) : galleryBlobs.length === 0 ? (
                <p className="text-center text-surface-muted text-sm py-16">No hay imágenes en la galería</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {galleryBlobs
                    .filter(b => b.pathname.toLowerCase().includes(galleryQuery.toLowerCase()))
                    .map(b => (
                      <button key={b.url} onClick={() => selectFromGallery(b.url)} title={b.pathname}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-95 hover:border-brand-400 ${
                          form.imagen === b.url ? "border-brand-500 ring-2 ring-brand-300" : "border-surface-border"
                        }`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.url} alt="" className="w-full h-full object-cover" />
                        {form.imagen === b.url && (
                          <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                              <Check size={13} className="text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowEstaciones((v) => !v)}
            className="flex flex-1 items-center gap-2 text-sm font-semibold text-surface-text"
          >
            <ChefHat size={15} className="text-orange-500" />
            Estaciones por Categoría
            <ChevronDown size={15} className={`text-surface-muted transition-transform ${showEstaciones ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => { setShowEstaciones(true); setShowNuevaCat((v) => !v); setNuevaCatError(""); }}
            className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <Plus size={13} /> Nueva Categoría
          </button>
        </div>
        {showEstaciones && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categoriasState.map((c) => c.id)} strategy={rectSortingStrategy}>
              <div className="border-t border-surface-border p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {categoriasState.map((cat) => (
                  <SortableCatCard
                    key={cat.id}
                    cat={cat}
                    savingEstacion={savingEstacion}
                    onCambiarEstacion={cambiarEstacion}
                    onRename={renombrarCategoria}
                    onToggleVisibilidad={toggleVisibilidadCategoria}
                  />
                ))}
                {showNuevaCat && (
                  <div className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 p-3">
                    <span className="text-xs font-semibold text-brand-600">Nueva categoría</span>
                    <input
                      autoFocus
                      value={nuevaCatNombre}
                      onChange={(e) => { setNuevaCatNombre(e.target.value); setNuevaCatError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") crearCategoria(); if (e.key === "Escape") { setShowNuevaCat(false); setNuevaCatNombre(""); } }}
                      placeholder="Nombre de la categoría"
                      className="rounded border border-brand-300 px-2 py-1 text-xs outline-none focus:border-brand-500"
                    />
                    <select
                      value={nuevaCatEstacion}
                      onChange={(e) => setNuevaCatEstacion(e.target.value as Estacion)}
                      className="rounded border border-surface-border bg-white px-2 py-1 text-xs"
                    >
                      <option value="COCINA">🍳 Cocina</option>
                      <option value="BARRA">🍹 Barra</option>
                      <option value="CUARTO_CALIENTE">🔥 Cuarto Caliente</option>
                      <option value="MOSTRADOR">🧁 Mostrador</option>
                    </select>
                    {nuevaCatError && <p className="text-[10px] text-red-500">{nuevaCatError}</p>}
                    <div className="flex gap-1">
                      <button
                        onClick={crearCategoria}
                        disabled={savingNuevaCat}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-brand-500 py-1 text-[11px] font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        {savingNuevaCat ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Crear
                      </button>
                      <button
                        onClick={() => { setShowNuevaCat(false); setNuevaCatNombre(""); setNuevaCatError(""); }}
                        className="rounded bg-surface-bg px-2 py-1 text-[11px] text-surface-muted hover:text-red-500"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
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
                /* ── Tabs: Desde Link / Pegar Texto ── */
                <>
                  {/* Tab switcher */}
                  <div className="flex rounded-xl border border-surface-border overflow-hidden text-sm font-medium">
                    <button
                      onClick={() => { setImportTab("link"); setImportError(""); setImportInstrucciones(false); }}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${importTab === "link" ? "bg-violet-600 text-white" : "bg-surface-bg text-surface-muted hover:text-surface-text"}`}
                    >
                      🔗 Desde Link
                    </button>
                    <button
                      onClick={() => { setImportTab("texto"); setImportError(""); setImportInstrucciones(false); }}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${importTab === "texto" ? "bg-violet-600 text-white" : "bg-surface-bg text-surface-muted hover:text-surface-text"}`}
                    >
                      📋 Pegar Texto
                    </button>
                  </div>

                  {/* ── Tab: Desde Link ── */}
                  {importTab === "link" && (
                    <div className="space-y-4">
                      {/* Compatibilidad de links */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
                          <p className="text-emerald-700 font-semibold">✅ PDF</p>
                          <p className="text-emerald-600">Link directo a PDF</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
                          <p className="text-emerald-700 font-semibold">✅ Sitio Web</p>
                          <p className="text-emerald-600">Página oficial del restaurante</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-surface-text">Link de tu carta</label>
                        <p className="text-xs text-surface-muted">
                          Pega el link de tu menú en PDF o página web.
                        </p>
                        <input
                          type="url"
                          value={importUrl}
                          onChange={(e) => { setImportUrl(e.target.value); setImportError(""); setImportInstrucciones(false); }}
                          placeholder="https://turestaurante.com/carta.pdf"
                          className="w-full rounded-xl border border-surface-border bg-surface-bg px-4 py-3 text-sm text-surface-text placeholder:text-surface-muted focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                      </div>

                      {importError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <AlertCircle size={15} /> {importError}
                          </p>
                          {importInstrucciones && (
                            <div className="space-y-2 pt-1">
                              <p className="text-xs text-red-600 font-medium">Alternativa — copia el texto manualmente:</p>
                              <ol className="text-xs text-red-600 space-y-1 list-decimal list-inside">
                                <li>Abre el link en tu celular o PC</li>
                                <li>Selecciona y copia el texto (nombre + precio de cada producto)</li>
                                <li>Pégalo en <strong>"Pegar Texto"</strong></li>
                              </ol>
                              <button
                                onClick={() => setImportTab("texto")}
                                className="text-xs text-violet-600 font-semibold underline"
                              >
                                → Ir a Pegar Texto
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleFetchUrl}
                        disabled={importFetchLoading || !importUrl.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                      >
                        {importFetchLoading ? <Loader2 size={16} className="animate-spin" /> : <span>🔍</span>}
                        {importFetchLoading ? "Leyendo carta..." : "Leer Carta desde Link"}
                      </button>
                    </div>
                  )}

                  {/* ── Tab: Pegar Texto ── */}
                  {importTab === "texto" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-surface-text">Pega aquí el texto de tu carta</label>
                          <button
                            type="button"
                            onClick={() => setImportTexto(`🍣 ROLLS\nCalifornia Roll  5990\nRoll Acevichado  6990\nRoll Spicy Tuna  7490\n\n🍕 PIZZAS\nMargherita  8990\nPepperoni  9490\n\n🥤 BEBIDAS\nCoca Cola 350cc  1500\nAgua sin gas  990\nCerveza artesanal  3200\n\n🍖 CARNES\nLomo vetado  14990\nPollo a la plancha  9990`)}
                            className="text-xs text-violet-600 hover:text-violet-800 font-medium underline"
                          >
                            📋 Ver plantilla de ejemplo
                          </button>
                        </div>
                        <p className="text-xs text-surface-muted">
                          Copia el texto de tu carta (PDF, Google Docs, menú digital) y Claude AI detecta productos y precios automáticamente.
                        </p>
                        <textarea
                          value={importTexto}
                          onChange={(e) => setImportTexto(e.target.value)}
                          placeholder={"Pega aquí tu carta...\n\nEjemplo:\n🍣 Rolls\nCalifornia Roll  5.990\nRoll Acevichado  6.990\n\n🥤 Bebidas\nCoca Cola  1.500"}
                          rows={11}
                          className="w-full rounded-xl border border-surface-border bg-surface-bg px-4 py-3 text-sm font-mono text-surface-text placeholder:text-surface-muted focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                        />
                        {importTexto.trim() && (
                          <button type="button" onClick={() => setImportTexto("")} className="text-xs text-surface-muted hover:text-red-500 underline">
                            Limpiar
                          </button>
                        )}
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
                        {importLoading ? "Analizando con IA..." : "Analizar Carta con IA"}
                      </button>
                    </div>
                  )}
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
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white border border-surface-border px-3 py-1.5 text-xs font-medium text-surface-text hover:bg-surface-bg transition-colors">
                        {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                        {uploadingImage ? "Subiendo..." : form.imagen ? "Cambiar" : "Cargar foto"}
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                      <button type="button" onClick={openGallery}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                        <Images size={13} /> Usar foto existente
                      </button>
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
                  { key: "enKiosko",  label: "Visible en Kiosko",      desc: "Aparece en el kiosko de autoatención" },
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

              {/* Separador */}
              <div className="mx-6 my-5 border-t border-surface-border" />

              {/* Sección: Variantes / Opcionales */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">Variantes / Opcionales</p>
                  {editando && variantesLoading && <Loader2 size={13} className="animate-spin text-surface-muted" />}
                </div>
                <p className="text-xs text-surface-muted -mt-1">Ej: Tamaño, Tipo de masa, Nivel de picante. El cliente elige antes de agregar al carrito.</p>

                {variantesLocal.map((grupo, gi) => (
                  <div key={grupo._key} className="rounded-xl border border-surface-border bg-surface-bg/40 p-3 space-y-2">
                    {/* Grupo header */}
                    <div className="flex items-center gap-2">
                      <input
                        className="input flex-1 text-sm font-semibold py-1.5"
                        placeholder="Ej: TAMAÑO, TIPO DE MASA"
                        value={grupo.nombre}
                        onChange={e => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, nombre: e.target.value } : g))}
                      />
                      <select
                        className="input w-auto text-xs py-1.5"
                        value={grupo.tipo}
                        onChange={e => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, tipo: e.target.value as "radio"|"checkbox" } : g))}
                      >
                        <option value="radio">Una opción</option>
                        <option value="checkbox">Varias opciones</option>
                      </select>
                      <button
                        type="button"
                        title="Guardar como plantilla"
                        onClick={() => guardarPlantilla(grupo)}
                        className={`p-1.5 rounded-lg transition-colors ${plantillas.some(p => p.nombre === grupo.nombre) ? "text-amber-500 hover:text-amber-600" : "text-surface-muted hover:bg-amber-50 hover:text-amber-500"}`}
                      >
                        {plantillas.some(p => p.nombre === grupo.nombre) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVariantesLocal(prev => prev.filter((_, i) => i !== gi))}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Requerido toggle */}
                    <label className="flex items-center gap-2 text-xs text-surface-muted cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grupo.requerido}
                        onChange={e => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, requerido: e.target.checked } : g))}
                        className="rounded"
                      />
                      Selección requerida
                    </label>

                    {/* Opciones */}
                    <div className="space-y-1.5 pl-1">
                      {grupo.opciones.map((op, oi) => (
                        <div key={op._key} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-surface-border shrink-0" />
                          <input
                            className="input flex-1 text-sm py-1"
                            placeholder="Ej: Individual, Familiar"
                            value={op.nombre}
                            onChange={e => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, opciones: g.opciones.map((o, j) => j === oi ? { ...o, nombre: e.target.value } : o) } : g))}
                          />
                          <div className="relative w-24 shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-surface-muted">{simbolo}</span>
                            <input
                              type="number"
                              className="input pl-5 text-sm py-1 text-right"
                              placeholder="0"
                              min={0}
                              value={op.precio}
                              onChange={e => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, opciones: g.opciones.map((o, j) => j === oi ? { ...o, precio: e.target.value } : o) } : g))}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, opciones: g.opciones.filter((_, j) => j !== oi) } : g))}
                            className="p-1 rounded text-surface-muted hover:text-red-500 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVariantesLocal(prev => prev.map((g, i) => i === gi ? { ...g, opciones: [...g.opciones, { _key: Math.random().toString(36).slice(2), nombre: "", precio: "0" }] } : g))}
                        className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium py-0.5"
                      >
                        <Plus size={12} /> Agregar opción
                      </button>
                    </div>
                  </div>
                ))}

                {/* Plantillas guardadas */}
                {plantillas.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowPlantillas(v => !v)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><BookmarkCheck size={13} /> Importar desde plantilla ({plantillas.length})</span>
                      <ChevronDown size={13} className={`transition-transform ${showPlantillas ? "rotate-180" : ""}`} />
                    </button>
                    {showPlantillas && (
                      <div className="mt-1 rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
                        {plantillas.map((p) => (
                          <div key={p._key} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-bg border-b border-surface-border last:border-b-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-surface-text truncate">{p.nombre}</p>
                              <p className="text-[10px] text-surface-muted">{p.opciones.length} opciones · {p.tipo === "radio" ? "Una opción" : "Varias"}{p.requerido ? " · Requerido" : ""}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => importarPlantilla(p)}
                              className="shrink-0 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-700 transition-colors"
                            >
                              Agregar
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarPlantilla(p.nombre)}
                              className="shrink-0 p-1 text-surface-muted hover:text-red-500 transition-colors"
                              title="Eliminar plantilla"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setVariantesLocal(prev => [...prev, { _key: Math.random().toString(36).slice(2), nombre: "", requerido: false, tipo: "radio", opciones: [] }])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border py-2.5 text-sm font-medium text-surface-muted hover:border-brand-300 hover:text-brand-500 transition-colors"
                >
                  <Plus size={15} /> Agregar grupo de opciones
                </button>
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
