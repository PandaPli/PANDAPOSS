"use client";

import { useState } from "react";
import { Plus, Pencil, Building2, Users, Wallet, CheckCircle2, XCircle, X, Loader2 } from "lucide-react";

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  simbolo: string;
  activa: boolean;
  creadoEn: string | Date;
  _count: { usuarios: number; cajas: number };
}

const emptyForm = { nombre: "", direccion: "", telefono: "", email: "", simbolo: "$" };

export function SucursalesClient({ sucursales: initial }: { sucursales: Sucursal[] }) {
  const [sucursales, setSucursales] = useState<Sucursal[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    });
    setError("");
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
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
          body: JSON.stringify(form),
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

      {/* Grid de Sucursales */}
      {sucursales.length === 0 ? (
        <div className="text-center py-16 text-surface-muted">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No hay sucursales registradas</p>
          <p className="text-sm">Crea la primera sucursal para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sucursales.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-card p-5 transition-all ${
                s.activa ? "border-surface-border" : "border-surface-border opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg ${s.activa ? "bg-brand-500" : "bg-surface-muted"}`}>
                    {s.simbolo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-text">{s.nombre}</h3>
                    {s.activa ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 size={12} /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                        <XCircle size={12} /> Inactiva
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded hover:bg-surface-bg text-surface-text-muted hover:text-surface-text transition-colors"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
              </div>

              {/* Info */}
              <div className="space-y-1.5 text-sm text-surface-text-muted mb-4">
                {s.direccion && <p className="truncate">📍 {s.direccion}</p>}
                {s.telefono && <p>📞 {s.telefono}</p>}
                {s.email && <p className="truncate">✉️ {s.email}</p>}
                {!s.direccion && !s.telefono && !s.email && (
                  <p className="italic text-xs">Sin información de contacto</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-surface-border text-xs text-surface-text-muted">
                <span className="flex items-center gap-1">
                  <Users size={13} /> {s._count.usuarios} usuarios
                </span>
                <span className="flex items-center gap-1">
                  <Wallet size={13} /> {s._count.cajas} cajas
                </span>
              </div>

              {/* Toggle activa */}
              <button
                onClick={() => toggleActiva(s)}
                className={`mt-3 w-full text-xs py-1.5 rounded-lg border transition-colors font-medium ${
                  s.activa
                    ? "border-red-200 text-red-500 hover:bg-red-50"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {s.activa ? "Desactivar sucursal" : "Activar sucursal"}
              </button>
            </div>
          ))}
        </div>
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
                  <label className="label">Símbolo moneda</label>
                  <input
                    type="text"
                    value={form.simbolo}
                    onChange={(e) => setForm({ ...form, simbolo: e.target.value })}
                    maxLength={5}
                    placeholder="$"
                    className="input"
                  />
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
