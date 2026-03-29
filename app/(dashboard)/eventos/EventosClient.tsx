"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CalendarDays,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Ticket,
  ScanLine,
  X,
  Loader2,
} from "lucide-react";

interface Evento {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  lugar: string | null;
  precio: number;
  capacidad: number;
  imagenUrl: string | null;
  activo: boolean;
  sucursalId: number;
  tenantId: string;
  creadoEn: string;
  sucursal: { id: number; nombre: string } | null;
  _count: { tickets: number };
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface Props {
  eventos: Evento[];
  sucursales: Sucursal[];
  rol: string;
  sucursalId: number | null;
}

const emptyForm = {
  nombre: "",
  descripcion: "",
  fecha: "",
  lugar: "",
  precio: "",
  capacidad: "",
  imagenUrl: "",
  sucursalId: "",
};

export function EventosClient({ eventos: initialEventos, sucursales, rol, sucursalId }: Props) {
  const [eventos, setEventos] = useState(initialEventos);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, sucursalId: sucursalId ? String(sucursalId) : "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(ev: Evento) {
    setEditing(ev);
    setForm({
      nombre: ev.nombre,
      descripcion: ev.descripcion ?? "",
      fecha: ev.fecha.slice(0, 16),
      lugar: ev.lugar ?? "",
      precio: String(ev.precio),
      capacidad: String(ev.capacidad),
      imagenUrl: ev.imagenUrl ?? "",
      sucursalId: String(ev.sucursalId),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      fecha: form.fecha,
      lugar: form.lugar || null,
      precio: parseFloat(form.precio),
      capacidad: parseInt(form.capacidad) || 0,
      imagenUrl: form.imagenUrl || null,
      sucursalId: parseInt(form.sucursalId),
    };

    try {
      let res;
      if (editing) {
        res = await fetch(`/api/eventos/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/eventos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
        return;
      }

      // Reload
      const listRes = await fetch("/api/eventos");
      const list = await listRes.json();
      setEventos(list);
      setShowModal(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este evento?")) return;
    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error al eliminar");
        return;
      }
      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert("Error de conexión");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Eventos</h1>
            <p className="mt-1 text-sm text-slate-500">Gestiona eventos y tickets QR.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus size={16} />
            Nuevo Evento
          </button>
        </div>

        {/* List */}
        {eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 shadow-sm">
            <CalendarDays size={48} className="text-violet-200" />
            <p className="mt-4 text-lg font-bold text-slate-400">Sin eventos</p>
            <p className="text-sm text-slate-300">Crea tu primer evento con el botón de arriba.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Evento</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Lugar</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Aforo</th>
                  <th className="px-4 py-3 text-center">Tickets</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventos.map((ev) => (
                  <tr key={ev.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ev.imagenUrl ? (
                          <img src={ev.imagenUrl} alt={ev.nombre} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                            <CalendarDays size={18} className="text-violet-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{ev.nombre}</p>
                          {ev.sucursal && <p className="text-xs text-slate-400">{ev.sucursal.nombre}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(ev.fecha)}</td>
                    <td className="px-4 py-3">
                      {ev.lugar ? (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin size={12} />
                          <span className="text-xs">{ev.lugar}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {formatCurrency(ev.precio)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {ev.capacidad > 0 ? ev.capacidad : "∞"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                        <Ticket size={10} />
                        {ev._count.tickets}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ev.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {ev.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(ev)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-violet-100 hover:text-violet-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <Link
                          href={`/eventos/${ev.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="Ver tickets"
                        >
                          <Ticket size={13} />
                        </Link>
                        <Link
                          href={`/eventos/${ev.id}/validar`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                          title="Escanear QR"
                        >
                          <ScanLine size={13} />
                        </Link>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-800">{editing ? "Editar Evento" : "Nuevo Evento"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Precio *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Lugar</label>
                  <input
                    value={form.lugar}
                    onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Capacidad (0 = ilimitada)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.capacidad}
                    onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">URL de imagen (opcional)</label>
                <input
                  value={form.imagenUrl}
                  onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              {rol === "ADMIN_GENERAL" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Sucursal *</label>
                  <select
                    value={form.sucursalId}
                    onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {editing ? "Guardar cambios" : "Crear evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
