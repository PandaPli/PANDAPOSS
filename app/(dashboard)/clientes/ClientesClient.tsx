"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit2, Users, X, Loader2, Phone, Mail, MapPin } from "lucide-react";

interface Cliente {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

interface Props {
  clientes: Cliente[];
}

const emptyForm = {
  nombre: "", email: "", telefono: "", direccion: "",
};

export function ClientesClient({ clientes: initial }: Props) {
  const router = useRouter();
  const [clientes] = useState(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtrados = useMemo(() => {
    if (!search) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.includes(q))
    );
  }, [clientes, search]);

  function abrirFormNuevo() {
    setEditando(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function abrirFormEditar(c: Cliente) {
    setEditando(c);
    setForm({
      nombre: c.nombre,
      email: c.email ?? "",
      telefono: c.telefono ?? "",
      direccion: c.direccion ?? "",
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      ...(editando ? { id: editando.id } : {}),
      nombre: form.nombre,
      email: form.email || null,
      telefono: form.telefono || null,
      direccion: form.direccion || null,
    };

    try {
      const res = await fetch("/api/clientes", {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Clientes</h1>
          <p className="text-surface-muted text-sm mt-1">{filtrados.length} cliente{filtrados.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirFormNuevo} className="btn-primary">
          <Plus size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-bg">
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Email</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-surface-muted">Dirección</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Users size={32} className="mx-auto text-surface-muted mb-2" />
                    <p className="text-surface-muted">Sin clientes</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-bg transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-text">{c.nombre}</td>
                    <td className="px-4 py-3 text-surface-muted">
                      {c.email ? (
                        <span className="flex items-center gap-1"><Mail size={13} />{c.email}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">
                      {c.telefono ? (
                        <span className="flex items-center gap-1"><Phone size={13} />{c.telefono}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-surface-muted max-w-48 truncate">
                      {c.direccion ? (
                        <span className="flex items-center gap-1"><MapPin size={13} />{c.direccion}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => abrirFormEditar(c)}
                        className="p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
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

      {/* Drawer formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-end">
          <div className="bg-white h-full sm:h-auto sm:rounded-l-2xl w-full max-w-md shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-bold text-surface-text">
                {editando ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Nombre completo o razón social"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="label">Dirección</label>
                <input
                  className="input"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Calle, número, ciudad"
                />
              </div>
            </form>

            <div className="p-5 border-t border-surface-border flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button
                onClick={handleSubmit as unknown as React.MouseEventHandler}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {editando ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
