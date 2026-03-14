
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { Rol } from "@/types";

type TabKey = "empleados" | "asistencias";
type ToastTone = "success" | "error";

type Sucursal = {
  id: number;
  nombre: string;
  activa?: boolean;
  _count?: {
    empleados: number;
    asistencias: number;
  };
};

type Empleado = {
  id: number;
  sucursalId: number;
  usuarioId?: number | null;
  nombres: string;
  apellidos: string;
  documento: string | null;
  email: string | null;
  telefono: string | null;
  fechaIngreso: string | null;
  salarioBase: number | null;
  sucursal?: { id: number; nombre: string } | null;
  cargo?: { id: number; nombre: string } | null;
  departamento?: { id: number; nombre: string } | null;
};

type Asistencia = {
  id: number;
  sucursalId: number;
  empleadoId: number;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  estado: string;
  observacion: string | null;
  empleado: { id: number; nombres: string; apellidos: string };
  sucursal: { id: number; nombre: string };
};

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description: string;
};

type Props = {
  rol: Rol;
  sucursalIdSesion: number | null;
};

const attendanceStates = ["PRESENTE", "TARDE", "AUSENTE", "PERMISO"];

const employeeFormInitial = {
  sucursalId: "",
  nombres: "",
  apellidos: "",
  documento: "",
  email: "",
  telefono: "",
  fechaIngreso: "",
  salarioBase: "",
};

const attendanceFormInitial = {
  sucursalId: "",
  empleadoId: "",
  fecha: "",
  horaEntrada: "",
  horaSalida: "",
  estado: "PRESENTE",
  observacion: "",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

export function RrhhClient({ rol, sucursalIdSesion }: Props) {
  const isAdminGeneral = rol === "ADMIN_GENERAL";
  const [activeTab, setActiveTab] = useState<TabKey>("empleados");
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState<string>(sucursalIdSesion ? String(sucursalIdSesion) : "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [employeeForm, setEmployeeForm] = useState({
    ...employeeFormInitial,
    sucursalId: sucursalIdSesion ? String(sucursalIdSesion) : "",
  });
  const [attendanceForm, setAttendanceForm] = useState({
    ...attendanceFormInitial,
    sucursalId: sucursalIdSesion ? String(sucursalIdSesion) : "",
    fecha: new Date().toISOString().slice(0, 10),
  });

  const requiresBranchSelection = isAdminGeneral && !selectedSucursal;
  const selectedBranch = useMemo(
    () => sucursales.find((sucursal) => String(sucursal.id) === selectedSucursal) ?? null,
    [selectedSucursal, sucursales]
  );

  function pushToast(tone: ToastTone, title: string, description: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, tone, title, description }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const sucursalesRes = await fetch("/api/rrhh/sucursales", { cache: "no-store" });
      const sucursalesData = await sucursalesRes.json();
      if (!sucursalesRes.ok) throw new Error(getApiError(sucursalesData, "No se pudo cargar RRHH."));
      setSucursales(sucursalesData);

      if (isAdminGeneral && !selectedSucursal) {
        setEmpleados([]);
        setAsistencias([]);
        return;
      }

      const query = selectedSucursal ? `?sucursalId=${selectedSucursal}` : "";
      const [empleadosRes, asistenciasRes] = await Promise.all([
        fetch(`/api/rrhh/empleados${query}`, { cache: "no-store" }),
        fetch(`/api/rrhh/asistencias${query}`, { cache: "no-store" }),
      ]);

      const [empleadosData, asistenciasData] = await Promise.all([
        empleadosRes.json(),
        asistenciasRes.json(),
      ]);

      if (!empleadosRes.ok) throw new Error(getApiError(empleadosData, "No se pudo cargar empleados."));
      if (!asistenciasRes.ok) throw new Error(getApiError(asistenciasData, "No se pudo cargar asistencias."));

      setEmpleados(empleadosData);
      setAsistencias(asistenciasData);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [selectedSucursal, isAdminGeneral]);
  const filteredEmpleados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return empleados;

    return empleados.filter((empleado) => {
      const fullName = `${empleado.nombres} ${empleado.apellidos}`.toLowerCase();
      return fullName.includes(term)
        || (empleado.documento ?? "").toLowerCase().includes(term)
        || (empleado.email ?? "").toLowerCase().includes(term)
        || (empleado.telefono ?? "").toLowerCase().includes(term);
    });
  }, [empleados, search]);

  const filteredAsistencias = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return asistencias;

    return asistencias.filter((asistencia) => {
      const fullName = `${asistencia.empleado.nombres} ${asistencia.empleado.apellidos}`.toLowerCase();
      return fullName.includes(term)
        || asistencia.estado.toLowerCase().includes(term)
        || asistencia.sucursal.nombre.toLowerCase().includes(term);
    });
  }, [asistencias, search]);

  const employeeOptions = useMemo(() => {
    const sucursalId = Number(attendanceForm.sucursalId || selectedSucursal || sucursalIdSesion || 0);
    if (!sucursalId) return [];
    return empleados.filter((empleado) => empleado.sucursalId === sucursalId);
  }, [attendanceForm.sucursalId, empleados, selectedSucursal, sucursalIdSesion]);

  const totalPresentes = asistencias.filter((item) => item.estado === "PRESENTE").length;

  function openEmployeeForm() {
    setEmployeeForm({
      ...employeeFormInitial,
      sucursalId: selectedSucursal || (sucursalIdSesion ? String(sucursalIdSesion) : ""),
    });
    setShowEmployeeForm(true);
  }

  function openAttendanceForm() {
    setAttendanceForm({
      ...attendanceFormInitial,
      sucursalId: selectedSucursal || (sucursalIdSesion ? String(sucursalIdSesion) : ""),
      fecha: new Date().toISOString().slice(0, 10),
      estado: "PRESENTE",
    });
    setShowAttendanceForm(true);
  }

  async function submitEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/rrhh/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId: Number(employeeForm.sucursalId),
          nombres: employeeForm.nombres,
          apellidos: employeeForm.apellidos,
          documento: employeeForm.documento || null,
          email: employeeForm.email || null,
          telefono: employeeForm.telefono || null,
          fechaIngreso: employeeForm.fechaIngreso || null,
          salarioBase: employeeForm.salarioBase ? Number(employeeForm.salarioBase) : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getApiError(payload, "No se pudo crear el empleado."));

      setShowEmployeeForm(false);
      pushToast("success", "Empleado creado", "El registro ya forma parte del modulo RRHH de la sucursal seleccionada.");
      await loadData();
    } catch (submitError) {
      const message = (submitError as Error).message;
      setError(message);
      pushToast("error", "No se pudo guardar", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function importFromUsuarios() {
    if (!selectedSucursal) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/rrhh/empleados/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId: Number(selectedSucursal) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getApiError(payload, "No se pudieron importar usuarios."));

      const summary = `${payload.created} creados, ${payload.linked} vinculados, ${payload.skipped} omitidos.`;
      pushToast("success", "Importacion completada", summary);
      await loadData();
    } catch (importError) {
      const message = (importError as Error).message;
      setError(message);
      pushToast("error", "No se pudo importar", message);
    } finally {
      setSubmitting(false);
    }
  }
  async function submitAttendance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const baseDate = attendanceForm.fecha;
      const horaEntrada = attendanceForm.horaEntrada ? `${baseDate}T${attendanceForm.horaEntrada}:00` : null;
      const horaSalida = attendanceForm.horaSalida ? `${baseDate}T${attendanceForm.horaSalida}:00` : null;

      const response = await fetch("/api/rrhh/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId: Number(attendanceForm.sucursalId),
          empleadoId: Number(attendanceForm.empleadoId),
          fecha: `${baseDate}T00:00:00`,
          horaEntrada,
          horaSalida,
          estado: attendanceForm.estado,
          observacion: attendanceForm.observacion || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getApiError(payload, "No se pudo registrar la asistencia."));

      setShowAttendanceForm(false);
      pushToast("success", "Asistencia registrada", "La asistencia quedo guardada y la tabla se actualizo al instante.");
      await loadData();
    } catch (submitError) {
      const message = (submitError as Error).message;
      setError(message);
      pushToast("error", "No se pudo registrar", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="fixed right-4 top-16 z-[70] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.tone === "success"
                ? "rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg"
                : "rounded-2xl border border-red-200 bg-white p-4 shadow-lg"
            }
          >
            <div className="flex items-start gap-3">
              <div className={toast.tone === "success" ? "mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700" : "mt-0.5 rounded-full bg-red-100 p-1 text-red-700"}>
                {toast.tone === "success" ? <CheckCheck size={14} /> : <AlertTriangle size={14} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-text">{toast.title}</p>
                <p className="mt-1 text-xs leading-5 text-surface-muted">{toast.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-[30px] border border-surface-border bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/12 ring-1 ring-white/20">
              <BriefcaseBusiness className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Recursos Humanos</p>
              <h1 className="mt-2 text-3xl font-bold">Personal y asistencia por sucursal</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/80">
                El flujo empieza por una sede concreta para que RRHH responda rapido, sea legible y no mezcle registros de distintas operaciones.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openEmployeeForm}
              disabled={requiresBranchSelection}
              className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Nuevo empleado
            </button>
            <button
              onClick={openAttendanceForm}
              disabled={requiresBranchSelection}
              className="btn-secondary border-white/20 bg-white text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarClock size={16} />
              Registrar asistencia
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="card p-5">
          <p className="text-sm text-surface-muted">Sucursales visibles</p>
          <p className="mt-2 text-3xl font-bold text-surface-text">{sucursales.length}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-surface-muted">Empleados</p>
          <p className="mt-2 text-3xl font-bold text-surface-text">{empleados.length}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-surface-muted">Asistencias</p>
          <p className="mt-2 text-3xl font-bold text-surface-text">{asistencias.length}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-surface-muted">Presentes</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{totalPresentes}</p>
        </article>
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Entrada por sucursal</p>
            <h2 className="mt-1 text-xl font-bold text-surface-text">
              {selectedBranch ? `Trabajando en ${selectedBranch.nombre}` : "Selecciona una sucursal para abrir RRHH"}
            </h2>
            <p className="mt-1 text-sm text-surface-muted">
              {selectedBranch
                ? "Todos los datos y formularios de esta vista quedan acotados a la sede elegida."
                : "Asi evitamos abrir tablas enormes y mantenemos una experiencia clara para Administracion General."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-[240px] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeTab === "empleados" ? "Buscar empleado..." : "Buscar asistencia..."}
                className="input pl-9"
                disabled={requiresBranchSelection}
              />
            </div>
            {(isAdminGeneral || sucursalIdSesion) && (
              <select
                value={selectedSucursal}
                onChange={(event) => setSelectedSucursal(event.target.value)}
                className="input w-full sm:w-[260px]"
                disabled={!isAdminGeneral && !!sucursalIdSesion}
              >
                {isAdminGeneral && <option value="">Selecciona una sucursal</option>}
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>
      {requiresBranchSelection ? (
        <section className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <Info size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Elige una sede para empezar</p>
              <p>RRHH ahora se abre por sucursal, con tarjetas de entrada y datos enfocados en esa operacion.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sucursales.map((sucursal) => (
              <button
                key={sucursal.id}
                onClick={() => setSelectedSucursal(String(sucursal.id))}
                className="card group p-5 text-left hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700">
                    <Building2 size={22} />
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-600">
                    Abrir sede
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-surface-text">{sucursal.nombre}</h3>
                <p className="mt-1 text-sm text-surface-muted">Ingresa a RRHH de esta sucursal con tablas, formularios y reportes filtrados.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-bg p-3">
                    <p className="text-xs text-surface-muted">Empleados</p>
                    <p className="mt-1 text-xl font-bold text-surface-text">{sucursal._count?.empleados ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-bg p-3">
                    <p className="text-xs text-surface-muted">Asistencias</p>
                    <p className="mt-1 text-xl font-bold text-surface-text">{sucursal._count?.asistencias ?? 0}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="card p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Sucursal activa</p>
                  <h3 className="mt-1 text-lg font-bold text-surface-text">{selectedBranch?.nombre ?? "Sucursal seleccionada"}</h3>
                  <p className="mt-1 text-sm text-surface-muted">Usa esta vista para cargar solo la informacion de RRHH que importa en esta sede.</p>
                </div>
              </div>
              {isAdminGeneral && (
                <button onClick={() => setSelectedSucursal("")} className="btn-ghost">
                  <ArrowLeft size={16} />
                  Cambiar sucursal
                </button>
              )}
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">RRHH necesita atencion</p>
                <p>{error}</p>
                <p className="mt-1 text-amber-700/90">Si aun no existe la estructura en la base, ejecuta `prisma db push` para crear las tablas RRHH.</p>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["empleados", "Empleados"],
                ["asistencias", "Asistencias"],
              ] as [TabKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} className={activeTab === key ? "btn-primary" : "btn-secondary"}>
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-full bg-surface-bg px-4 py-2 text-xs font-medium text-surface-muted">
              {selectedBranch?._count?.empleados ?? empleados.length} personas en esta sede
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            <button onClick={openEmployeeForm} className="btn-primary">
              <Plus size={16} />
              Nuevo empleado
            </button>
            <button onClick={importFromUsuarios} disabled={submitting} className="btn-secondary">
              <Users size={16} />
              Importar desde usuarios
            </button>
            <button onClick={openAttendanceForm} className="btn-secondary">
              <CalendarClock size={16} />
              Registrar asistencia
            </button>
          </section>

          {loading ? (
            <div className="card flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-surface-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando modulo RRHH...
              </div>
            </div>
          ) : activeTab === "empleados" ? (
            filteredEmpleados.length === 0 ? (
              <div className="card flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                <Users className="h-10 w-10 text-surface-muted" />
                <h2 className="text-xl font-semibold text-surface-text">Todavia no hay empleados RRHH en esta sucursal</h2>
                <p className="max-w-xl text-sm text-surface-muted">
                  Los usuarios del sistema no aparecen automaticamente aqui. Registra el primer empleado para empezar a ordenar personal, asistencia y futuros reportes.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <button onClick={openEmployeeForm} className="btn-primary">
                    <Plus size={16} />
                    Crear primer empleado
                  </button>
                  <button onClick={importFromUsuarios} disabled={submitting} className="btn-secondary">
                    <Users size={16} />
                    Importar desde usuarios
                  </button>
                </div>
              </div>
            ) : (
              <section className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border bg-surface-bg">
                        <th className="px-4 py-3 text-left font-medium text-surface-muted">Empleado</th>
                        <th className="px-4 py-3 text-left font-medium text-surface-muted">Sucursal</th>
                        <th className="px-4 py-3 text-left font-medium text-surface-muted">Contacto</th>
                        <th className="px-4 py-3 text-left font-medium text-surface-muted">Ingreso</th>
                        <th className="px-4 py-3 text-left font-medium text-surface-muted">Documento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredEmpleados.map((empleado) => (
                        <tr key={empleado.id} className="transition-colors hover:bg-surface-bg">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-surface-text">{empleado.nombres} {empleado.apellidos}</p>
                            <p className="text-xs text-surface-muted">{empleado.cargo?.nombre ?? "Sin cargo"}</p>
                          </td>
                          <td className="px-4 py-3 text-surface-muted">{empleado.sucursal?.nombre ?? `Sucursal ${empleado.sucursalId}`}</td>
                          <td className="px-4 py-3 text-surface-muted">
                            <p>{empleado.email ?? "Sin email"}</p>
                            <p>{empleado.telefono ?? "Sin telefono"}</p>
                          </td>
                          <td className="px-4 py-3 text-surface-muted">{formatDate(empleado.fechaIngreso)}</td>
                          <td className="px-4 py-3 text-surface-muted">{empleado.documento ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          ) : filteredAsistencias.length === 0 ? (
            <div className="card flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
              <Clock3 className="h-10 w-10 text-surface-muted" />
              <h2 className="text-xl font-semibold text-surface-text">Aun no hay asistencias registradas</h2>
              <p className="max-w-xl text-sm text-surface-muted">
                Cuando registres entradas, tardanzas o permisos, esta vista te mostrara la operacion diaria de la sucursal elegida sin que parezca un error del sistema.
              </p>
              <button onClick={openAttendanceForm} className="btn-primary mt-2">
                <CalendarClock size={16} />
                Registrar primera asistencia
              </button>
            </div>
          ) : (
            <section className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-bg">
                      <th className="px-4 py-3 text-left font-medium text-surface-muted">Empleado</th>
                      <th className="px-4 py-3 text-left font-medium text-surface-muted">Sucursal</th>
                      <th className="px-4 py-3 text-left font-medium text-surface-muted">Estado</th>
                      <th className="px-4 py-3 text-left font-medium text-surface-muted">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-surface-muted">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredAsistencias.map((asistencia) => (
                      <tr key={asistencia.id} className="transition-colors hover:bg-surface-bg">
                        <td className="px-4 py-3 font-semibold text-surface-text">{asistencia.empleado.nombres} {asistencia.empleado.apellidos}</td>
                        <td className="px-4 py-3 text-surface-muted">{asistencia.sucursal.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {asistencia.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-surface-muted">{formatDate(asistencia.fecha)}</td>
                        <td className="px-4 py-3 text-surface-muted">
                          <p>Entrada: {formatDateTime(asistencia.horaEntrada)}</p>
                          <p>Salida: {formatDateTime(asistencia.horaSalida)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {showEmployeeForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:h-auto sm:rounded-l-2xl">
            <div className="flex items-center justify-between border-b border-surface-border p-5">
              <div>
                <h2 className="font-bold text-surface-text">Nuevo empleado</h2>
                <p className="mt-1 text-xs text-surface-muted">Quedara vinculado a una sucursal RRHH y no solo como usuario del sistema.</p>
              </div>
              <button onClick={() => setShowEmployeeForm(false)} className="rounded-lg p-2 text-surface-muted hover:bg-surface-bg hover:text-surface-text">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitEmployee} className="space-y-4 overflow-y-auto p-5">
              <div>
                <label className="label">Sucursal *</label>
                <select
                  value={employeeForm.sucursalId}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, sucursalId: event.target.value }))}
                  className="input"
                  disabled={!isAdminGeneral && !!sucursalIdSesion}
                  required
                >
                  <option value="">Selecciona una sucursal</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Nombres *</label>
                  <input className="input" value={employeeForm.nombres} onChange={(event) => setEmployeeForm((current) => ({ ...current, nombres: event.target.value }))} required />
                </div>
                <div>
                  <label className="label">Apellidos *</label>
                  <input className="input" value={employeeForm.apellidos} onChange={(event) => setEmployeeForm((current) => ({ ...current, apellidos: event.target.value }))} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Documento</label>
                  <input className="input" value={employeeForm.documento} onChange={(event) => setEmployeeForm((current) => ({ ...current, documento: event.target.value }))} />
                </div>
                <div>
                  <label className="label">Telefono</label>
                  <input className="input" value={employeeForm.telefono} onChange={(event) => setEmployeeForm((current) => ({ ...current, telefono: event.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={employeeForm.email} onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Fecha de ingreso</label>
                  <input type="date" className="input" value={employeeForm.fechaIngreso} onChange={(event) => setEmployeeForm((current) => ({ ...current, fechaIngreso: event.target.value }))} />
                </div>
                <div>
                  <label className="label">Salario base</label>
                  <input type="number" min="0" step="0.01" className="input" value={employeeForm.salarioBase} onChange={(event) => setEmployeeForm((current) => ({ ...current, salarioBase: event.target.value }))} />
                </div>
              </div>
              <button disabled={submitting} className="btn-primary w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                Guardar empleado
              </button>
            </form>
          </div>
        </div>
      )}

      {showAttendanceForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:h-auto sm:rounded-l-2xl">
            <div className="flex items-center justify-between border-b border-surface-border p-5">
              <div>
                <h2 className="font-bold text-surface-text">Registrar asistencia</h2>
                <p className="mt-1 text-xs text-surface-muted">Se guardara directamente en la sucursal y fecha elegidas.</p>
              </div>
              <button onClick={() => setShowAttendanceForm(false)} className="rounded-lg p-2 text-surface-muted hover:bg-surface-bg hover:text-surface-text">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitAttendance} className="space-y-4 overflow-y-auto p-5">
              <div>
                <label className="label">Sucursal *</label>
                <select
                  value={attendanceForm.sucursalId}
                  onChange={(event) => setAttendanceForm((current) => ({ ...current, sucursalId: event.target.value, empleadoId: "" }))}
                  className="input"
                  disabled={!isAdminGeneral && !!sucursalIdSesion}
                  required
                >
                  <option value="">Selecciona una sucursal</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Empleado *</label>
                <select
                  value={attendanceForm.empleadoId}
                  onChange={(event) => setAttendanceForm((current) => ({ ...current, empleadoId: event.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Selecciona un empleado</option>
                  {employeeOptions.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>{empleado.nombres} {empleado.apellidos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Estado *</label>
                <div className="grid grid-cols-2 gap-2">
                  {attendanceStates.map((state) => {
                    const active = attendanceForm.estado === state;
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => setAttendanceForm((current) => ({ ...current, estado: state }))}
                        className={active ? "rounded-2xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700" : "rounded-2xl border border-surface-border bg-white px-3 py-2 text-sm font-medium text-surface-muted hover:border-brand-100 hover:bg-slate-50"}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Fecha *</label>
                  <input type="date" className="input" value={attendanceForm.fecha} onChange={(event) => setAttendanceForm((current) => ({ ...current, fecha: event.target.value }))} required />
                </div>
                <div className="rounded-2xl bg-surface-bg p-3 text-xs text-surface-muted">
                  <p className="font-semibold text-surface-text">Estado seleccionado</p>
                  <p className="mt-1">{attendanceForm.estado}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Hora entrada</label>
                  <input type="time" className="input" value={attendanceForm.horaEntrada} onChange={(event) => setAttendanceForm((current) => ({ ...current, horaEntrada: event.target.value }))} />
                </div>
                <div>
                  <label className="label">Hora salida</label>
                  <input type="time" className="input" value={attendanceForm.horaSalida} onChange={(event) => setAttendanceForm((current) => ({ ...current, horaSalida: event.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Observacion</label>
                <textarea className="input min-h-[96px]" value={attendanceForm.observacion} onChange={(event) => setAttendanceForm((current) => ({ ...current, observacion: event.target.value }))} />
              </div>
              <button disabled={submitting} className="btn-primary w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                Guardar asistencia
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

