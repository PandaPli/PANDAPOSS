"use client";

import { useState, useRef } from "react";
import { Plus, Building2, ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableSucursalCard } from "./SortableSucursalCard";

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  simbolo: string;
  activa: boolean;
  plan: "BASICO" | "PRO" | "PRIME" | "DEMO";
  logoUrl: string | null;
  creadoEn: string | Date;
  _count: { usuarios: number; cajas: number };
}

const emptyForm = { nombre: "", direccion: "", telefono: "", email: "", simbolo: "$", plan: "BASICO" as "BASICO" | "PRO" | "PRIME" | "DEMO", logoUrl: null as string | null };

export function SucursalesClient({ sucursales: initial }: { sucursales: Sucursal[] }) {
  const [sucursales, setSucursales] = useState<Sucursal[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoLoading, setLogoLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(s: Sucursal) {
    setEditing(s);
    setForm({
      nombre: s.nombre,
      direccion: s.direccion ?? "",
      telefono: s.telefono ?? "",
      email: s.email ?? "",
      simbolo: s.simbolo,
      plan: s.plan,
      logoUrl: s.logoUrl ?? null,
    });
    setError("");
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir imagen");
      setForm((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir logo");
    } finally {
      setLogoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editing) {
        // Editar
        const res = await fetch(`/api/sucursales/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, logoUrl: form.logoUrl ?? null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar");
        setSucursales((prev) =>
          prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s))
        );
      } else {
        // Crear
        const res = await fetch("/api/sucursales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear");
        setSucursales((prev) => [...prev, { ...data, _count: { usuarios: 0, cajas: 0 } }]);
      }
      closeDrawer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActiva(s: Sucursal) {
    const res = await fetch(`/api/sucursales/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !s.activa }),
    });
    if (res.ok) {
      const data = await res.json();
      setSucursales((prev) => prev.map((x) => (x.id === s.id ? { ...x, activa: data.activa } : x)));
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSucursales((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        
        const newArray = arrayMove(items, oldIndex, newIndex);
        
        // Disparar red HTTP para persistir
        const orderIds = newArray.map((s) => s.id);
        fetch("/api/sucursales/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds }),
        }).catch((err) => console.error("Fallo reorden :(", err));

        return newArray;
      });
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Sucursales</h1>
          <p className="text-sm text-surface-muted mt-0.5">
            Gestión de locales y restaurantes ({sucursales.length} registradas)
          </p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary"
        >
          <Plus size={16} />
          Nueva Sucursal
        </button>
      </div>

      {/* Grid de Sucursales Sortable */}
      {sucursales.length === 0 ? (
        <div className="text-center py-16 text-surface-muted">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No hay sucursales registradas</p>
          <p className="text-sm">Crea la primera sucursal para comenzar</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sucursales.map(s => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sucursales.map((s) => (
                <SortableSucursalCard
                  key={s.id}
                  s={s}
                  onEdit={openEdit}
                  onToggleActiva={toggleActiva}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Drawer lateral */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-semibold text-surface-text">
                  {editing ? "Editar Sucursal" : "Nueva Sucursal"}
                </h2>
                <p className="text-xs text-surface-text-muted mt-0.5">
                  {editing ? `Modificando: ${editing.nombre}` : "Completa los datos del local"}
                </p>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded hover:bg-surface-bg transition-colors">
                <X size={18} className="text-surface-text-muted" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              {/* Logo */}
              <div>
                <label className="label">Logo de Sucursal</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-surface-border flex items-center justify-center bg-surface-bg flex-shrink-0 overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon size={24} className="text-surface-muted opacity-40" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={logoLoading}
                      className="btn-secondary text-xs"
                    >
                      {logoLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {form.logoUrl ? "Cambiar" : "Subir logo"}
                    </button>
                    {form.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, logoUrl: null }))}
                        className="btn-secondary text-xs"
                      >
                        <X size={12} />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Ej: Casa Matriz, Sucursal Norte"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Av. Principal 123, Ciudad"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Suscripción</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value as "BASICO" | "PRO" | "PRIME" })}
                    className="input"
                  >
                    <option value="BASICO">INICIAL</option>
                    <option value="PRO">PRO</option>
                    <option value="PRIME">👑 PRIME</option>
                    <option value="DEMO">🧪 DEMO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sucursal@pandaposs.com"
                  className="input"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-5 border-t border-surface-border flex gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                className="btn-secondary flex-1 justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {editing ? "Guardar cambios" : "Crear sucursal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
