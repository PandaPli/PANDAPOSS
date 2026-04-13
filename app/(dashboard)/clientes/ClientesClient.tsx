"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Edit2, Users, X, Loader2,
  Phone, Mail, MapPin, Cake, Gift, UserRound,
  Ban, Trash2, ShieldCheck, AlertTriangle, Eye, Star,
} from "lucide-react";
import { normalize } from "@/lib/utils";

interface Cliente {
  id: number;
  rut?: string | null;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  genero: string | null;
  fechaNacimiento: string | null;
  codigoCumple?: string | null;
  activo: boolean;
  sucursalId: number | null;
  puntos: number;
  sucursal?: { id: number; nombre: string };
}

interface Sucursal { id: number; nombre: string; }

interface Props {
  clientes: Cliente[];
  sucursales: Sucursal[];
  rol: string;
  sucursalIdSesion: number | null;
}

const emptyForm = {
  nombre: "", email: "", telefono: "", direccion: "",
  genero: "", fechaNacimiento: "", sucursalId: "",
};

// Calcula edad en años a partir de ISO string
function calcularEdad(fechaIso: string | null): number | null {
  if (!fechaIso) return null;
  const hoy = new Date();
  const nac = new Date(fechaIso);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Verifica si el cumpleaños es hoy o en los próximos 7 días
function estadoCumple(fechaIso: string | null): "hoy" | "pronto" | null {
  if (!fechaIso) return null;
  const hoy = new Date();
  const nac = new Date(fechaIso);
  const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
  // Si ya pasó este año, calcular para el próximo
  if (cumple < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
    cumple.setFullYear(hoy.getFullYear() + 1);
  }
  const diff = Math.round((cumple.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86400000);
  if (diff === 0) return "hoy";
  if (diff <= 7) return "pronto";
  return null;
}

function generoLabel(g: string | null) {
  if (g === "M") return "Masculino";
  if (g === "F") return "Femenino";
  if (g === "O") return "Otro";
  return "No especificado";
}

function generoColor(g: string | null) {
  if (g === "M") return "border-blue-200 bg-blue-50 text-blue-700";
  if (g === "F") return "border-pink-200 bg-pink-50 text-pink-700";
  return "border-surface-border bg-surface-bg text-surface-muted";
}

function generoIcon(g: string | null) {
  if (g === "M") return "👨";
  if (g === "F") return "👩";
  return "👤";
}

type OrdenKey = "nombre" | "edad_asc" | "edad_desc" | "cumple";
type FiltroGenero = "todos" | "M" | "F" | "O" | "N";

export function ClientesClient({ clientes: initial, sucursales, rol, sucursalIdSesion }: Props) {
  const router = useRouter();
  const [clientes] = useState(initial);
  const [search, setSearch] = useState("");
  const [sucFiltro, setSucFiltro] = useState<number | null>(null);
  const [filtroGenero, setFiltroGenero] = useState<FiltroGenero>("todos");
  const [orden, setOrden] = useState<OrdenKey>("nombre");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmEliminar, setConfirmEliminar] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarBloqueados, setMostrarBloqueados] = useState(false);

  const isPandaAdmin = rol === "ADMIN_GENERAL";

  // Estadísticas rápidas (solo activos)
  const stats = useMemo(() => {
    const activos = clientes.filter(c => c.activo);
    const total = activos.length;
    const bloqueados = clientes.filter(c => !c.activo).length;
    const hombres = activos.filter(c => c.genero === "M").length;
    const mujeres = activos.filter(c => c.genero === "F").length;
    const cumpleHoy = activos.filter(c => estadoCumple(c.fechaNacimiento) === "hoy").length;
    const cumpleProximo = activos.filter(c => estadoCumple(c.fechaNacimiento) === "pronto").length;
    const totalPuntos = activos.reduce((sum, c) => sum + (c.puntos ?? 0), 0);
    return { total, bloqueados, hombres, mujeres, cumpleHoy, cumpleProximo, totalPuntos };
  }, [clientes]);

  async function handleBloquear(c: Cliente) {
    const res = await fetch("/api/clientes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, activo: !c.activo }),
    });
    if (res.ok) router.refresh();
  }

  async function handleEliminar(c: Cliente) {
    setEliminando(true);
    const res = await fetch(`/api/clientes?id=${c.id}`, { method: "DELETE" });
    setEliminando(false);
    setConfirmEliminar(null);
    if (res.ok) router.refresh();
  }

  const filtrados = useMemo(() => {
    let list = clientes.filter((c) => {
      const q = normalize(search);
      const matchSearch = !search || (
        normalize(c.nombre).includes(q) ||
        normalize(c.email ?? "").includes(q) ||
        (c.telefono ?? "").includes(search.trim())
      );
      const matchSuc = !sucFiltro || c.sucursalId === sucFiltro;
      const matchGenero = filtroGenero === "todos"
        || (filtroGenero === "N" ? !c.genero : c.genero === filtroGenero);
      const matchActivo = mostrarBloqueados ? !c.activo : c.activo;
      return matchSearch && matchSuc && matchGenero && matchActivo;
    });

    // Ordenamiento
    list = [...list].sort((a, b) => {
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      if (orden === "edad_asc") {
        const ea = calcularEdad(a.fechaNacimiento) ?? 999;
        const eb = calcularEdad(b.fechaNacimiento) ?? 999;
        return ea - eb;
      }
      if (orden === "edad_desc") {
        const ea = calcularEdad(a.fechaNacimiento) ?? -1;
        const eb = calcularEdad(b.fechaNacimiento) ?? -1;
        return eb - ea;
      }
      if (orden === "cumple") {
        // Cumpleaños más próximos primero
        const hoy = new Date();
        const diasHasta = (f: string | null) => {
          if (!f) return 999;
          const nac = new Date(f);
          const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
          if (cumple < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
            cumple.setFullYear(hoy.getFullYear() + 1);
          return Math.round((cumple.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86400000);
        };
        return diasHasta(a.fechaNacimiento) - diasHasta(b.fechaNacimiento);
      }
      return 0;
    });

    return list;
  }, [clientes, search, sucFiltro, filtroGenero, orden]);

  // Agrupados por género para vista inteligente
  const grupos = useMemo(() => {
    if (filtroGenero !== "todos") return null; // ya filtrado, no agrupar
    const map = new Map<string, { label: string; icon: string; color: string; clientes: typeof filtrados }>();
    const orden_grupos = ["F", "M", "O", ""];
    for (const clave of orden_grupos) {
      const label = generoLabel(clave || null);
      const lista = filtrados.filter(c => (c.genero ?? "") === clave);
      if (lista.length > 0) {
        map.set(clave, { label, icon: generoIcon(clave || null), color: generoColor(clave || null), clientes: lista });
      }
    }
    return Array.from(map.values());
  }, [filtrados, filtroGenero]);

  function abrirFormNuevo() {
    setEditando(null);
    setForm({ ...emptyForm, sucursalId: isPandaAdmin ? "" : String(sucursalIdSesion ?? "") });
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
      genero: c.genero ?? "",
      fechaNacimiento: c.fechaNacimiento ? c.fechaNacimiento.slice(0, 10) : "",
      sucursalId: c.sucursalId ? String(c.sucursalId) : "",
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
      genero: form.genero || null,
      fechaNacimiento: form.fechaNacimiento || null,
      sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
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

  function FilaCliente({ c }: { c: Cliente }) {
    const edad = calcularEdad(c.fechaNacimiento);
    const cumple = estadoCumple(c.fechaNacimiento);
    return (
      <tr className={`hover:bg-surface-bg transition-colors ${!c.activo ? "opacity-60 bg-red-50/30" : ""}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{generoIcon(c.genero)}</span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-medium ${c.activo ? "text-surface-text" : "text-red-500 line-through"}`}>{c.nombre}</span>
                {!c.activo && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                    <Ban size={10} /> Bloqueado
                  </span>
                )}
                {c.activo && cumple === "hoy" && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                    <Gift size={11} /> ¡Cumpleaños!
                  </span>
                )}
                {c.activo && cumple === "pronto" && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200">
                    <Cake size={11} /> Pronto
                  </span>
                )}
              </div>
              {edad !== null && (
                <span className="text-xs text-surface-muted">{edad} años</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-surface-muted text-sm">
          {c.email ? <span className="flex items-center gap-1"><Mail size={13} />{c.email}</span> : "—"}
        </td>
        <td className="px-4 py-3 text-surface-muted text-sm">
          {c.telefono ? <span className="flex items-center gap-1"><Phone size={13} />{c.telefono}</span> : "—"}
        </td>
        <td className="px-4 py-3 text-surface-muted text-sm max-w-36 truncate">
          {c.direccion ? <span className="flex items-center gap-1"><MapPin size={13} />{c.direccion}</span> : "—"}
        </td>
        <td className="px-4 py-3">
          {c.puntos > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
              <Star size={10} />
              {c.puntos} pts
            </span>
          ) : (
            <span className="text-xs text-surface-muted">—</span>
          )}
        </td>
        {isPandaAdmin && (
          <td className="px-4 py-3">
            {c.sucursal ? (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                {c.sucursal.nombre}
              </span>
            ) : <span className="text-surface-muted">—</span>}
          </td>
        )}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Link
              href={`/clientes/${c.id}`}
              className="p-1.5 text-surface-muted hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Ver perfil"
            >
              <Eye size={15} />
            </Link>
            {c.activo && (
              <button
                onClick={() => abrirFormEditar(c)}
                className="p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 size={15} />
              </button>
            )}
            <button
              onClick={() => handleBloquear(c)}
              className={`p-1.5 rounded-lg transition-colors ${c.activo
                ? "text-surface-muted hover:text-amber-600 hover:bg-amber-50"
                : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
              title={c.activo ? "Bloquear cliente" : "Desbloquear cliente"}
            >
              {c.activo ? <Ban size={15} /> : <ShieldCheck size={15} />}
            </button>
            <button
              onClick={() => setConfirmEliminar(c)}
              className="p-1.5 text-surface-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar cliente"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const colSpan = isPandaAdmin ? 6 : 5;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Clientes</h1>
          <p className="text-surface-muted text-sm mt-1">
          {filtrados.length} de {mostrarBloqueados ? stats.bloqueados : stats.total} {mostrarBloqueados ? "bloqueados" : "clientes"}
        </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.bloqueados > 0 && (
            <button
              onClick={() => setMostrarBloqueados(!mostrarBloqueados)}
              className={`btn-secondary text-sm gap-1.5 ${mostrarBloqueados ? "border-red-300 text-red-600 bg-red-50" : ""}`}
            >
              <Ban size={15} />
              {mostrarBloqueados ? "Ver activos" : `Bloqueados (${stats.bloqueados})`}
            </button>
          )}
          {!mostrarBloqueados && (
            <button onClick={abrirFormNuevo} className="btn-primary">
              <Plus size={16} /> Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-lg">👨</div>
          <div>
            <p className="text-xl font-bold text-surface-text">{stats.hombres}</p>
            <p className="text-xs text-surface-muted">Masculino</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center text-lg">👩</div>
          <div>
            <p className="text-xl font-bold text-surface-text">{stats.mujeres}</p>
            <p className="text-xs text-surface-muted">Femenino</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
            <Gift size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-text">{stats.cumpleHoy}</p>
            <p className="text-xs text-surface-muted">Cumpleaños hoy</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center">
            <Cake size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-text">{stats.cumpleProximo}</p>
            <p className="text-xs text-surface-muted">Próximos 7 días</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
            <Star size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-text">{stats.totalPuntos.toLocaleString("es-CL")}</p>
            <p className="text-xs text-surface-muted">Puntos totales</p>
          </div>
        </div>
      </div>

      {/* Filtros y orden */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={filtroGenero}
          onChange={(e) => setFiltroGenero(e.target.value as FiltroGenero)}
          className="input w-auto"
        >
          <option value="todos">Todos los géneros</option>
          <option value="F">👩 Femenino</option>
          <option value="M">👨 Masculino</option>
          <option value="O">👤 Otro</option>
          <option value="N">Sin especificar</option>
        </select>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as OrdenKey)}
          className="input w-auto"
        >
          <option value="nombre">Ordenar: A→Z</option>
          <option value="edad_asc">Ordenar: Más joven</option>
          <option value="edad_desc">Ordenar: Mayor edad</option>
          <option value="cumple">Ordenar: Próx. cumpleaños</option>
        </select>
        {isPandaAdmin && (
          <select
            value={sucFiltro ?? ""}
            onChange={(e) => setSucFiltro(e.target.value ? Number(e.target.value) : null)}
            className="input w-auto"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
          </select>
        )}
      </div>

      {/* Tabla — agrupada por género o plana si hay filtro activo */}
      {grupos ? (
        grupos.length === 0 ? (
          <div className="card px-4 py-12 text-center">
            <Users size={32} className="mx-auto text-surface-muted mb-2" />
            <p className="text-surface-muted">Sin clientes</p>
          </div>
        ) : (
          grupos.map((grupo) => (
            <div key={grupo.label} className="card overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-surface-border text-sm font-semibold ${grupo.color}`}>
                <span className="text-base">{grupo.icon}</span>
                {grupo.label}
                <span className="ml-auto font-normal opacity-70">{grupo.clientes.length} cliente{grupo.clientes.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-surface-border">
                    {grupo.clientes.map((c) => <FilaCliente key={c.id} c={c} />)}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-surface-border">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-12 text-center">
                      <Users size={32} className="mx-auto text-surface-muted mb-2" />
                      <p className="text-surface-muted">Sin clientes</p>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => <FilaCliente key={c.id} c={c} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-surface-text">Eliminar cliente</h3>
                <p className="text-sm text-surface-muted">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
              <p className="font-semibold">{confirmEliminar.nombre}</p>
              <p>Se eliminará el cliente y <strong>todo su historial de compras</strong> permanentemente.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="btn-secondary flex-1 justify-center"
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(confirmEliminar)}
                disabled={eliminando}
                className="flex-1 btn-primary justify-center !bg-red-600 hover:!bg-red-700 !border-red-600"
              >
                {eliminando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-end">
          <div className="bg-white h-full sm:h-auto sm:rounded-l-2xl w-full max-w-md shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-bold text-surface-text">{editando ? "Editar Cliente" : "Nuevo Cliente"}</h2>
                {!editando && (
                  <p className="text-xs text-surface-muted mt-0.5">
                    Agrega fecha de cumpleaños para activar el regalo 🎁
                  </p>
                )}
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Nombre completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Género</label>
                  <select
                    className="input"
                    value={form.genero}
                    onChange={(e) => setForm({ ...form, genero: e.target.value })}
                  >
                    <option value="">Sin especificar</option>
                    <option value="F">👩 Femenino</option>
                    <option value="M">👨 Masculino</option>
                    <option value="O">👤 Otro</option>
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1">
                    <Cake size={13} className="text-amber-500" />
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={form.fechaNacimiento}
                    onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>

              {/* Banner motivacional para cumpleaños */}
              {!form.fechaNacimiento && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  <Gift size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Al agregar la fecha de nacimiento, el sistema detectará automáticamente el cumpleaños del cliente para que puedas ofrecerle un regalo especial 🎁
                  </span>
                </div>
              )}
              {form.fechaNacimiento && (() => {
                const edad = calcularEdad(form.fechaNacimiento);
                const cumple = estadoCumple(form.fechaNacimiento);
                return (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium border ${
                    cumple === "hoy" ? "bg-amber-50 border-amber-300 text-amber-700" :
                    cumple === "pronto" ? "bg-violet-50 border-violet-200 text-violet-700" :
                    "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    {cumple === "hoy" ? <><Gift size={13} /> ¡Hoy es su cumpleaños! {edad !== null ? `• ${edad} años` : ""}</> :
                     cumple === "pronto" ? <><Cake size={13} /> Cumpleaños en los próximos 7 días {edad !== null ? `• ${edad} años` : ""}</> :
                     <><UserRound size={13} /> {edad !== null ? `${edad} años` : "Edad calculada"}</>}
                  </div>
                );
              })()}

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
                  placeholder="1234 5678"
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

              {isPandaAdmin && (
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
              )}
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
