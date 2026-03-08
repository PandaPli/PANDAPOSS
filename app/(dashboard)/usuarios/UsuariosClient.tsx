"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit2, UserCog, X, Loader2, Shield } from "lucide-react";

const ROLES = [
  { value: "ADMIN_GENERAL", label: "Admin General" },
  { value: "ADMIN_SUCURSAL", label: "Admin Sucursal" },
  { value: "SECRETARY", label: "Secretaria" },
  { value: "CASHIER", label: "Cajero/a" },
  { value: "WAITER", label: "Mesero/a" },
  { value: "CHEF", label: "Cocinero/a" },
  { value: "BAR", label: "Bar" },
  { value: "PASTRY", label: "Repostería" },
  { value: "DELIVERY", label: "Repartidor/a" },
];

const roleColors: Record<string, string> = {
  ADMIN_GENERAL: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN_SUCURSAL: "bg-blue-50 text-blue-700 border-blue-200",
  SECRETARY: "bg-pink-50 text-pink-700 border-pink-200",
  CASHIER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WAITER: "bg-amber-50 text-amber-700 border-amber-200",
  CHEF: "bg-orange-50 text-orange-700 border-orange-200",
  BAR: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PASTRY: "bg-rose-50 text-rose-700 border-rose-200",
  DELIVERY: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  email: string | null;
  rol: string;
  status: string;
  sucursalId: number | null;
  sucursal: { nombre: string } | null;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface Props {
  usuarios: Usuario[];
  sucursales: Sucursal[];
}

const emptyForm = {
  nombre: "", usuario: "", password: "", email: "", rolUsuario: "WAITER", sucursalId: "", status: "ACTIVO",
};

export function UsuariosClient({ usuarios: initial, sucursales }: Props) {
  const router = useRouter();
  const [usuarios] = useState(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtrados = useMemo(() => {
    if (!search) return usuarios;
    const q = search.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [usuarios, search]);

  function abrirFormNuevo() {
    setEditando(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function abrirFormEditar(u: Usuario) {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      usuario: u.usuario,
      password: "",
      email: u.email ?? "",
      rolUsuario: u.rol,
      sucursalId: u.sucursalId ? String(u.sucursalId) : "",
      status: u.status,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      ...(editando ? { id: editando.id } : {}),
      nombre: form.nombre,
      usuario: form.usuario,
      email: form.email || null,
      rolUsuario: form.rolUsuario,
      sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
      status: form.status,
    };
    if (form.password) body.password = form.password;

    try {
      const res = await fetch("/api/usuarios", {
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
          <h1 className="text-2xl font-bold text-zinc-900">Usuarios</h1>
          <p className="text-zinc-500 text-sm mt-1">{filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirFormNuevo} className="btn-primary">
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Sucursal</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <UserCog size={32} className="mx-auto text-zinc-200 mb-2" />
                    <p className="text-zinc-400">Sin usuarios</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => {
                  const roleLabel = ROLES.find((r) => r.value === u.rol)?.label ?? u.rol;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-800">{u.nombre}</p>
                            {u.email && <p className="text-xs text-zinc-400">{u.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{u.usuario}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[u.rol] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                          <Shield size={11} />
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{u.sucursal?.nombre ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                          u.status === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {u.status === "ACTIVO" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => abrirFormEditar(u)}
                          className="p-1.5 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-end">
          <div className="bg-white h-full sm:h-auto sm:rounded-l-2xl w-full max-w-md shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900">
                {editando ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="label">Nombre Completo *</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Usuario *</label>
                  <input
                    className="input"
                    value={form.usuario}
                    onChange={(e) => setForm({ ...form, usuario: e.target.value.toUpperCase() })}
                    required
                    placeholder="JPEREZ"
                    disabled={!!editando}
                  />
                </div>
                <div>
                  <label className="label">{editando ? "Nueva Contraseña" : "Contraseña *"}</label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editando}
                    placeholder={editando ? "Dejar vacío para no cambiar" : ""}
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Rol *</label>
                  <select
                    className="input"
                    value={form.rolUsuario}
                    onChange={(e) => setForm({ ...form, rolUsuario: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Sucursal</label>
                  <select
                    className="input"
                    value={form.sucursalId}
                    onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}
                  >
                    <option value="">Sin asignar</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editando && (
                <div>
                  <label className="label">Estado</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              )}
            </form>

            <div className="p-5 border-t border-zinc-100 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button
                onClick={handleSubmit as unknown as React.MouseEventHandler}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {editando ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
