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
          <h1 className="text-2xl font-bold text-odoo-text">Sucursales</h1>
          <p className="text-sm text-odoo-text-muted mt-0.5">
            Gestión de locales y restaurantes ({sucursales.length} registradas)
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-odoo-purple text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          Nueva Sucursal
        </button>
      </div>

      {/* Grid de Sucursales */}
      {sucursales.length === 0 ? (
        <div className="text-center py-16 text-odoo-text-muted">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No hay sucursales registradas</p>
          <p className="text-sm">Crea la primera sucursal para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sucursales.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                s.activa ? "border-odoo-border" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${s.activa ? "bg-odoo-purple" : "bg-gray-400"}`}>
                    {s.simbolo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-odoo-text">{s.nombre}</h3>
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
                  className="p-1.5 rounded hover:bg-odoo-hover text-odoo-text-muted hover:text-odoo-text transition-colors"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
              </div>

              {/* Info */}
              <div className="space-y-1.5 text-sm text-odoo-text-muted mb-4">
                {s.direccion && <p className="truncate">📍 {s.direccion}</p>}
                {s.telefono && <p>📞 {s.telefono}</p>}
                {s.email && <p className="truncate">✉️ {s.email}</p>}
                {!s.direccion && !s.telefono && !s.email && (
                  <p className="italic text-xs">Sin información de contacto</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-odoo-border text-xs text-odoo-text-muted">
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
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-5 border-b border-odoo-border">
              <div>
                <h2 className="font-semibold text-odoo-text">
                  {editing ? "Editar Sucursal" : "Nueva Sucursal"}
                </h2>
                <p className="text-xs text-odoo-text-muted mt-0.5">
                  {editing ? `Modificando: ${editing.nombre}` : "Completa los datos del local"}
                </p>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded hover:bg-odoo-hover transition-colors">
                <X size={18} className="text-odoo-text-muted" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-odoo-text mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Ej: Casa Matriz, Sucursal Norte"
                  className="w-full px-3 py-2 border border-odoo-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-odoo-text mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Av. Principal 123, Ciudad"
                  className="w-full px-3 py-2 border border-odoo-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-odoo-text mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 border border-odoo-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-odoo-text mb-1">Símbolo moneda</label>
                  <input
                    type="text"
                    value={form.simbolo}
                    onChange={(e) => setForm({ ...form, simbolo: e.target.value })}
                    maxLength={5}
                    placeholder="$"
                    className="w-full px-3 py-2 border border-odoo-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-odoo-text mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sucursal@pandaposs.com"
                  className="w-full px-3 py-2 border border-odoo-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-5 border-t border-odoo-border flex gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                className="flex-1 px-4 py-2.5 border border-odoo-border text-odoo-text rounded-lg hover:bg-odoo-hover transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-odoo-purple text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors text-sm font-medium flex items-center justify-center gap-2"
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
