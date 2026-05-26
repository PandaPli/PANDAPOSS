"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, Edit3, UserX, UserCheck, Loader2,
  X, ChevronDown, Shield, Store,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Rol = "RESTAURANTE" | "SECRETARY" | "CASHIER" | "WAITER" | "CHEF" | "BAR" | "DELIVERY";
type EstadoUsuario = "ACTIVO" | "INACTIVO";

interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  email: string | null;
  rol: Rol;
  status: EstadoUsuario;
  sucursalId: number | null;
  creadoEn: string;
  sucursal: { nombre: string } | null;
}

const ROLES: { key: Rol; label: string }[] = [
  { key: "RESTAURANTE", label: "Restaurante" },
  { key: "SECRETARY",   label: "Secretaria" },
  { key: "CASHIER",     label: "Cajero" },
  { key: "WAITER",      label: "Mesero" },
  { key: "CHEF",        label: "Chef" },
  { key: "BAR",         label: "Bar" },
  { key: "DELIVERY",    label: "Delivery" },
];

const ROL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  RESTAURANTE: { bg: "bg-brand-500/10",   text: "text-brand-700",   border: "border-brand-300/30" },
  SECRETARY:   { bg: "bg-violet-500/10",   text: "text-violet-700",  border: "border-violet-300/30" },
  CASHIER:     { bg: "bg-emerald-500/10",  text: "text-emerald-700", border: "border-emerald-300/30" },
  WAITER:      { bg: "bg-amber-500/10",    text: "text-amber-700",   border: "border-amber-300/30" },
  CHEF:        { bg: "bg-orange-500/10",   text: "text-orange-700",  border: "border-orange-300/30" },
  BAR:         { bg: "bg-cyan-500/10",     text: "text-cyan-700",    border: "border-cyan-300/30" },
  DELIVERY:    { bg: "bg-blue-500/10",     text: "text-blue-700",    border: "border-blue-300/30" },
};

interface Props {
  sucursales: { id: number; nombre: string }[];
}

export function AdminUsuarios({ sucursales }: Props) {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState<string>("");
  const [filterSucursal, setFilterSucursal] = useState<string>("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nombre: "", usuario: "", password: "", email: "",
    rolUsuario: "WAITER" as Rol, sucursalId: "" as string,
  });

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", email: "", rolUsuario: "" as Rol, sucursalId: "" as string });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error();
      const data: Usuario[] = await res.json();
      setUsuarios(data);
    } catch {
      toast("error", "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  // Filtered list
  const filtered = usuarios.filter(u => {
    if (search && !u.nombre.toLowerCase().includes(search.toLowerCase()) && !u.usuario.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRol && u.rol !== filterRol) return false;
    if (filterSucursal && String(u.sucursalId) !== filterSucursal) return false;
    return true;
  });

  async function handleCreate() {
    if (!form.nombre || !form.usuario || !form.password) {
      toast("error", "Nombre, usuario y contrasena son requeridos");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error || "Error al crear usuario");
        return;
      }
      toast("ok", "Usuario creado correctamente");
      setForm({ nombre: "", usuario: "", password: "", email: "", rolUsuario: "WAITER", sucursalId: "" });
      setShowCreate(false);
      fetchUsuarios();
    } catch {
      toast("error", "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(u: Usuario) {
    const newStatus = u.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x));
      toast("ok", `Usuario ${newStatus === "ACTIVO" ? "activado" : "desactivado"}`);
    } catch {
      toast("error", "Error al cambiar estado");
    }
  }

  function startEdit(u: Usuario) {
    setEditingId(u.id);
    setEditForm({
      nombre: u.nombre,
      email: u.email ?? "",
      rolUsuario: u.rol,
      sucursalId: u.sucursalId ? String(u.sucursalId) : "",
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          nombre: editForm.nombre,
          email: editForm.email || null,
          rolUsuario: editForm.rolUsuario,
          sucursalId: editForm.sucursalId ? Number(editForm.sucursalId) : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast("ok", "Usuario actualizado");
      setEditingId(null);
      fetchUsuarios();
    } catch {
      toast("error", "Error al actualizar usuario");
    } finally {
      setSavingEdit(false);
    }
  }

  const activos = usuarios.filter(u => u.status === "ACTIVO").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/10 flex items-center justify-center">
              <Users size={15} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-text leading-none">Usuarios</h2>
              <p className="text-[10px] text-surface-muted mt-0.5">
                {usuarios.length} registrados · {activos} activos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
              showCreate
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "border-white/60 bg-white/40 backdrop-blur-sm text-surface-muted hover:text-brand-600 hover:bg-brand-500/10"
            }`}
          >
            {showCreate ? <X size={11} /> : <Plus size={11} />}
            {showCreate ? "Cancelar" : "Nuevo"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-brand-200/30 p-4 mb-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text" placeholder="Nombre completo" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text placeholder:text-surface-muted"
              />
              <input
                type="text" placeholder="Usuario (login)" value={form.usuario}
                onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                className="text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text placeholder:text-surface-muted"
              />
              <input
                type="password" placeholder="Contrasena" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text placeholder:text-surface-muted"
              />
              <input
                type="email" placeholder="Email (opcional)" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text placeholder:text-surface-muted"
              />
              <div className="relative">
                <select
                  value={form.rolUsuario}
                  onChange={e => setForm(f => ({ ...f, rolUsuario: e.target.value as Rol }))}
                  className="w-full text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text appearance-none"
                >
                  {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={form.sucursalId}
                  onChange={e => setForm(f => ({ ...f, sucursalId: e.target.value }))}
                  className="w-full text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text appearance-none"
                >
                  <option value="">Sin sucursal</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 text-[11px] font-bold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all disabled:opacity-50 shadow-sm"
              >
                {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Crear Usuario
              </button>
            </div>
          </div>
        )}

        {/* Search & filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-white/40 border border-white/60 rounded-xl pl-8 pr-3 py-2 focus:ring-1 focus:ring-brand-300 focus:border-brand-300 text-surface-text placeholder:text-surface-muted backdrop-blur-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filterRol}
              onChange={e => setFilterRol(e.target.value)}
              className="text-[10px] font-bold bg-white/40 border border-white/60 rounded-xl px-3 py-2 text-surface-muted focus:ring-1 focus:ring-brand-300 appearance-none pr-7 backdrop-blur-sm"
            >
              <option value="">Todos los roles</option>
              {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterSucursal}
              onChange={e => setFilterSucursal(e.target.value)}
              className="text-[10px] font-bold bg-white/40 border border-white/60 rounded-xl px-3 py-2 text-surface-muted focus:ring-1 focus:ring-brand-300 appearance-none pr-7 backdrop-blur-sm"
            >
              <option value="">Todas</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="text-brand-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-12 text-center text-surface-muted text-sm">
          {search || filterRol || filterSucursal ? "Sin resultados con los filtros actuales" : "No hay usuarios registrados"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const rolCfg = ROL_COLORS[u.rol] ?? ROL_COLORS.WAITER;
            const isEditing = editingId === u.id;

            return (
              <div
                key={u.id}
                className={`rounded-2xl border backdrop-blur-xl transition-all ${
                  u.status === "INACTIVO"
                    ? "border-red-200/30 bg-red-500/3 opacity-60"
                    : "border-white/50 bg-white/50 hover:bg-white/70"
                } shadow-[0_2px_12px_rgba(0,0,0,0.03)]`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${rolCfg.bg} ${rolCfg.text}`}>
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-surface-text truncate">{u.nombre}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${rolCfg.bg} ${rolCfg.text} ${rolCfg.border}`}>
                        {u.rol}
                      </span>
                      {u.status === "INACTIVO" && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 border border-red-300/30">
                          INACTIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-surface-muted font-medium">@{u.usuario}</span>
                      {u.sucursal && (
                        <span className="flex items-center gap-0.5 text-[10px] text-surface-muted">
                          <Store size={8} /> {u.sucursal.nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(u)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isEditing
                          ? "text-brand-600 bg-brand-500/10"
                          : "text-surface-muted hover:text-brand-600 hover:bg-brand-500/10"
                      }`}
                      title="Editar"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`p-1.5 rounded-lg transition-all ${
                        u.status === "ACTIVO"
                          ? "text-surface-muted hover:text-red-600 hover:bg-red-500/10"
                          : "text-emerald-600 hover:bg-emerald-500/10"
                      }`}
                      title={u.status === "ACTIVO" ? "Desactivar" : "Activar"}
                    >
                      {u.status === "ACTIVO" ? <UserX size={12} /> : <UserCheck size={12} />}
                    </button>
                  </div>
                </div>

                {/* Edit form inline */}
                {isEditing && (
                  <div className="mx-4 mb-3 rounded-xl bg-white/50 backdrop-blur-sm border border-brand-200/30 p-3 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Nombre" value={editForm.nombre}
                        onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                        className="text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 text-surface-text"
                      />
                      <input
                        type="email" placeholder="Email" value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 text-surface-text"
                      />
                      <div className="relative">
                        <select
                          value={editForm.rolUsuario}
                          onChange={e => setEditForm(f => ({ ...f, rolUsuario: e.target.value as Rol }))}
                          className="w-full text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 text-surface-text appearance-none"
                        >
                          {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select
                          value={editForm.sucursalId}
                          onChange={e => setEditForm(f => ({ ...f, sucursalId: e.target.value }))}
                          className="w-full text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-300 text-surface-text appearance-none"
                        >
                          <option value="">Sin sucursal</option>
                          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-xl text-surface-muted hover:bg-slate-500/10 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all disabled:opacity-50 shadow-sm"
                      >
                        {savingEdit ? <Loader2 size={10} className="animate-spin" /> : <Shield size={10} />}
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
