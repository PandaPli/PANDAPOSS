"use client";

import { useState } from "react";
import {
  CreditCard, Building2, Gift, CheckCircle2, AlertTriangle,
  Clock, Crown, Save, Loader2, StickyNote,
} from "lucide-react";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS";

interface SucursalPago {
  id: number;
  nombre: string;
  plan: string;
  creadoEn: string;
  activa: boolean;
  logoUrl: string | null;
  estadoPago: EstadoPago;
  mesesGratis: number;
  fechaInicioPlan: string | null;
  notaPago: string | null;
  tenant: { nombre: string } | null;
}

const ESTADO_CONFIG: Record<EstadoPago, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle2 size={14} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-100",   icon: <Clock size={14} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-100",     icon: <AlertTriangle size={14} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-100",    icon: <Gift size={14} /> },
};

const PLAN_COLORS: Record<string, string> = {
  BASICO: "bg-amber-100 text-amber-700",
  PRO: "bg-violet-100 text-violet-700",
  PRIME: "bg-brand-100 text-brand-700",
  DEMO: "bg-slate-100 text-slate-600",
};

const PLAN_PRECIOS: Record<string, string> = {
  BASICO: "$8.990",
  PRO: "$12.990",
  PRIME: "$14.990",
  DEMO: "Gratis",
};

export function PagosClient({ sucursales: initial }: { sucursales: SucursalPago[] }) {
  const [sucursales, setSucursales] = useState(initial);
  const [filter, setFilter] = useState<EstadoPago | "TODOS">("TODOS");

  const counts = {
    total: sucursales.length,
    alDia: sucursales.filter((s) => s.estadoPago === "AL_DIA").length,
    pendiente: sucursales.filter((s) => s.estadoPago === "PENDIENTE").length,
    atrasado: sucursales.filter((s) => s.estadoPago === "ATRASADO").length,
    gratis: sucursales.filter((s) => s.estadoPago === "GRATIS").length,
    mesesGratisTotal: sucursales.reduce((sum, s) => sum + s.mesesGratis, 0),
  };

  const filtered = filter === "TODOS" ? sucursales : sucursales.filter((s) => s.estadoPago === filter);

  function handleUpdate(id: number, data: Partial<SucursalPago>) {
    setSucursales((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 rounded-2xl p-6 shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-20" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <CreditCard size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Administración de Pagos</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Control de cobros y meses gratis por sucursal
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={counts.total} color="text-surface-text" onClick={() => setFilter("TODOS")} active={filter === "TODOS"} />
        <StatCard label="Al día" value={counts.alDia} color="text-emerald-600" onClick={() => setFilter("AL_DIA")} active={filter === "AL_DIA"} />
        <StatCard label="Pendiente" value={counts.pendiente} color="text-amber-600" onClick={() => setFilter("PENDIENTE")} active={filter === "PENDIENTE"} />
        <StatCard label="Atrasado" value={counts.atrasado} color="text-red-600" onClick={() => setFilter("ATRASADO")} active={filter === "ATRASADO"} />
        <StatCard label="Gratis" value={counts.gratis} color="text-blue-600" onClick={() => setFilter("GRATIS")} active={filter === "GRATIS"} />
        <div className="card p-4 flex flex-col items-center justify-center">
          <Gift size={16} className="text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-surface-text">{counts.mesesGratisTotal}</p>
          <p className="text-[10px] text-surface-muted font-medium uppercase">Meses regalados</p>
        </div>
      </div>

      {/* Lista de sucursales */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <SucursalPayRow key={s.id} sucursal={s} onUpdate={handleUpdate} />
        ))}
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-surface-muted">
            No hay sucursales con este estado.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, onClick, active }: {
  label: string; value: number; color: string; onClick: () => void; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`card p-4 text-center transition-all hover:shadow-md ${active ? "ring-2 ring-brand-500" : ""}`}
    >
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-surface-muted font-semibold uppercase tracking-wider">{label}</p>
    </button>
  );
}

function SucursalPayRow({ sucursal: s, onUpdate }: {
  sucursal: SucursalPago;
  onUpdate: (id: number, data: Partial<SucursalPago>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estado, setEstado] = useState<EstadoPago>(s.estadoPago);
  const [mesesGratis, setMesesGratis] = useState(s.mesesGratis);
  const [nota, setNota] = useState(s.notaPago ?? "");
  const [fechaInicio, setFechaInicio] = useState(s.fechaInicioPlan?.split("T")[0] ?? "");

  const cfg = ESTADO_CONFIG[s.estadoPago];
  const planColor = PLAN_COLORS[s.plan] ?? "bg-slate-100 text-slate-600";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/sucursales/${s.id}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estadoPago: estado,
          mesesGratis,
          fechaInicioPlan: fechaInicio || null,
          notaPago: nota,
        }),
      });
      if (!res.ok) throw new Error();
      onUpdate(s.id, { estadoPago: estado, mesesGratis, notaPago: nota || null, fechaInicioPlan: fechaInicio || null });
      setEditing(false);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Logo + nombre */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {s.logoUrl ? (
            <img src={s.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface-bg flex items-center justify-center border border-surface-border text-surface-muted shrink-0">
              <Building2 size={16} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-surface-text truncate">{s.nombre}</p>
            <p className="text-xs text-surface-muted">
              {s.tenant?.nombre ?? "Sin tenant"} · Desde{" "}
              {new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(s.creadoEn))}
            </p>
          </div>
        </div>

        {/* Plan */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${planColor}`}>
          {s.plan} {PLAN_PRECIOS[s.plan] && <span className="font-normal opacity-75">· {PLAN_PRECIOS[s.plan]}/mes</span>}
        </span>

        {/* Estado pago */}
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>

        {/* Meses gratis */}
        {s.mesesGratis > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 shrink-0">
            <Gift size={12} /> {s.mesesGratis} mes{s.mesesGratis > 1 ? "es" : ""} gratis
          </span>
        )}

        {/* Nota */}
        {s.notaPago && !editing && (
          <span className="flex items-center gap-1 text-xs text-surface-muted max-w-[200px] truncate" title={s.notaPago}>
            <StickyNote size={11} /> {s.notaPago}
          </span>
        )}

        {/* Botón editar */}
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs font-medium text-brand-600 hover:underline shrink-0"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      {/* Panel de edición */}
      {editing && (
        <div className="mt-4 pt-4 border-t border-surface-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estado */}
          <div>
            <label className="text-xs font-medium text-surface-muted mb-1 block">Estado de pago</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoPago)}
              className="w-full text-sm border border-surface-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="AL_DIA">Al día</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="GRATIS">Gratis</option>
            </select>
          </div>

          {/* Meses gratis */}
          <div>
            <label className="text-xs font-medium text-surface-muted mb-1 block">Meses gratis</label>
            <input
              type="number"
              min={0}
              max={99}
              value={mesesGratis}
              onChange={(e) => setMesesGratis(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-sm border border-surface-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Fecha inicio plan */}
          <div>
            <label className="text-xs font-medium text-surface-muted mb-1 block">Fecha inicio plan</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full text-sm border border-surface-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Nota */}
          <div>
            <label className="text-xs font-medium text-surface-muted mb-1 block">Nota</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: pagó el 26 de abril"
              maxLength={300}
              className="w-full text-sm border border-surface-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Guardar */}
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
