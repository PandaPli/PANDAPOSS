"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, CheckCircle2, XCircle, Users, Wallet, RotateCcw, Bell, BellOff } from "lucide-react";
import { useState } from "react";
import type { PlanTipo } from "@/core/billing/planConfig";

interface Props {
  s: any; // Sucursal Type
  onEdit: (s: any) => void;
  onToggleActiva: (s: any) => void;
  onToggleNotif: (s: any) => void;
}

const DEMO_SUCURSAL_ID = 5;

export function SortableSucursalCard({ s, onEdit, onToggleActiva, onToggleNotif }: Props) {
  const [resetting, setResetting] = useState(false);

  async function handleResetDemo() {
    if (!confirm("¿Resetear todos los datos de la demo? Esta acción no se puede deshacer.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      if (data.ok) alert("✅ Demo reseteada correctamente");
      else alert("❌ Error: " + (data.error ?? "desconocido"));
    } catch {
      alert("❌ Error de red");
    } finally {
      setResetting(false);
    }
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: s.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border shadow-card p-5 transition-shadow relative group pl-8 ${
        s.activa ? "border-surface-border" : "border-surface-border opacity-70"
      } ${isDragging ? "shadow-2xl ring-2 ring-brand-500 scale-[1.02]" : ""}`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-surface-muted hover:text-brand-600 hover:bg-brand-50 cursor-grab active:cursor-grabbing transition-all z-10 hidden md:flex"
      >
        <GripVertical size={18} />
      </div>

      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Handle visible for mobile */}
          <div 
            {...attributes} 
            {...listeners}
            className="p-1.5 -ml-6 text-surface-muted hover:text-brand-600 active:bg-brand-50 rounded-lg cursor-grab active:cursor-grabbing md:hidden"
          >
            <GripVertical size={18} />
          </div>

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
          onClick={() => onEdit(s)}
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
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
          s.plan === "DEMO"  ? "bg-violet-100 text-violet-700 border-violet-300" :
          s.plan === "PRIME" ? "bg-purple-50 text-purple-700 border-purple-300" :
          s.plan === "PRO"   ? "bg-amber-50 text-amber-700 border-amber-300" :
                               "bg-slate-100 text-slate-600 border-slate-300"
        }`}>
          {s.plan === "DEMO"  ? "🧪 DEMO" :
           s.plan === "PRIME" ? "👑 PRIME" :
           s.plan === "PRO"   ? "⭐ PRO" : "INICIAL"}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-surface-border text-xs text-surface-text-muted">
        <span className="flex items-center gap-1">
          <Users size={13} /> {s._count?.usuarios || 0} usuarios
        </span>
        <span className="flex items-center gap-1">
          <Wallet size={13} /> {s._count?.cajas || 0} cajas
        </span>
      </div>

      {/* Botón Enviar Push (aviso cuotas) */}
      <button
        onClick={() => onToggleNotif(s)}
        className={`mt-3 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors font-medium ${
          s.notifAviso
            ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border-blue-200 text-blue-600 hover:bg-blue-50"
        }`}
      >
        {s.notifAviso ? <BellOff size={12} /> : <Bell size={12} />}
        {s.notifAviso ? "Quitar aviso Push" : "Enviar aviso Push (cuotas)"}
      </button>

      {/* Toggle activa — bloqueo total */}
      <button
        onClick={() => onToggleActiva(s)}
        className={`mt-2 w-full text-xs py-1.5 rounded-lg border transition-colors font-medium ${
          s.activa
            ? "border-red-200 text-red-500 hover:bg-red-50"
            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {s.activa ? "Desactivar sucursal" : "Activar sucursal"}
      </button>

      {/* Botón reset — solo para sucursal demo */}
      {s.id === DEMO_SUCURSAL_ID && (
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors font-medium disabled:opacity-50"
        >
          <RotateCcw size={12} className={resetting ? "animate-spin" : ""} />
          {resetting ? "Reseteando..." : "Resetear Demo"}
        </button>
      )}
    </div>
  );
}
