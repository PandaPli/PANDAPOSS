"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, Image as ImageIcon, Check, X, Loader2,
  Star, Gift, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS" | "SOCIO";

const PAGO_CFG: Record<EstadoPago, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SOCIO:     { label: "Socio",     color: "text-violet-700",  bg: "bg-violet-100",  icon: <Star size={9} /> },
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle2 size={9} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-100",    icon: <Gift size={9} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-100",   icon: <Clock size={9} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-100",     icon: <AlertTriangle size={9} /> },
};

const PLAN_CFG: Record<string, { color: string; bg: string }> = {
  PRIME:  { color: "text-brand-700",  bg: "bg-brand-100"  },
  PRO:    { color: "text-violet-700", bg: "bg-violet-100" },
  BASICO: { color: "text-amber-700",  bg: "bg-amber-100"  },
  DEMO:   { color: "text-slate-600",  bg: "bg-slate-100"  },
};

const ROW_BG: Record<EstadoPago, string> = {
  SOCIO:     "bg-violet-50/60 border-violet-100",
  AL_DIA:    "bg-emerald-50/60 border-emerald-100",
  GRATIS:    "bg-blue-50/60 border-blue-100",
  PENDIENTE: "bg-white border-surface-border",
  ATRASADO:  "bg-red-50/60 border-red-100",
};

export interface SucursalRowProps {
  id: number;
  nombre: string;
  logoUrl: string | null;
  creadoEn: string;
  plan: string;
  estadoPago: EstadoPago;
  mesesGratis: number;
  ventasHoy: { total: number; count: number };
  ventasMes: number;
  pedidosActivos: number;
  cajasAbiertas: number;
  totalClientes: number;
}

export function SucursalRow({
  id, nombre, logoUrl, creadoEn, plan, estadoPago, mesesGratis,
  ventasHoy, ventasMes, pedidosActivos, cajasAbiertas, totalClientes,
}: SucursalRowProps) {
  const [editingLogo, setEditingLogo] = useState(false);
  const [logoInput, setLogoInput]     = useState(logoUrl ?? "");
  const [currentLogo, setCurrentLogo] = useState(logoUrl);
  const [saving, setSaving]           = useState(false);

  const pago    = PAGO_CFG[estadoPago];
  const planCfg = PLAN_CFG[plan] ?? PLAN_CFG.BASICO;
  const rowBg   = ROW_BG[estadoPago];

  async function saveLogo() {
    setSaving(true);
    try {
      const res = await fetch("/api/sucursales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, logoUrl: logoInput.trim() }),
      });
      if (!res.ok) throw new Error();
      setCurrentLogo(logoInput.trim() || null);
      setEditingLogo(false);
    } catch {
      alert("No se pudo guardar el logo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border transition-colors ${rowBg}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Logo */}
        <div className="shrink-0">
          {currentLogo ? (
            <img
              src={currentLogo}
              alt={nombre}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center text-surface-muted">
              <Building2 size={14} />
            </div>
          )}
        </div>

        {/* Nombre + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-surface-text truncate leading-tight">{nombre}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${planCfg.bg} ${planCfg.color}`}>
              {plan}
            </span>
            {pago && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${pago.bg} ${pago.color}`}>
                {pago.icon}
                {pago.label}
                {estadoPago === "GRATIS" && mesesGratis > 0 ? ` ${mesesGratis}m` : ""}
              </span>
            )}
          </div>
          <p className="text-[10px] text-surface-muted mt-0.5 hidden sm:block">
            Desde {new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(creadoEn))}
          </p>
        </div>

        {/* Métricas — desktop */}
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          {/* Caja */}
          <div className="text-center">
            <div className={`flex items-center gap-1 text-xs font-bold justify-center ${cajasAbiertas > 0 ? "text-emerald-600" : "text-surface-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cajasAbiertas > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              {cajasAbiertas > 0 ? `${cajasAbiertas} caja${cajasAbiertas > 1 ? "s" : ""}` : "Cerrada"}
            </div>
            <p className="text-[9px] text-surface-muted mt-0.5">estado</p>
          </div>

          {/* Ventas hoy */}
          <div className="text-right min-w-[76px]">
            <p className="text-sm font-black text-surface-text tabular-nums leading-tight">
              {formatCurrency(ventasHoy.total, "$")}
            </p>
            <p className="text-[9px] text-surface-muted">{ventasHoy.count} tx · hoy</p>
          </div>

          {/* Pedidos activos */}
          <div className="text-center min-w-[36px]">
            <p className={`text-sm font-black tabular-nums leading-tight ${pedidosActivos > 0 ? "text-amber-600" : "text-surface-muted"}`}>
              {pedidosActivos}
            </p>
            <p className="text-[9px] text-surface-muted">pedidos</p>
          </div>

          {/* Clientes */}
          <div className="text-center min-w-[40px]">
            <p className="text-sm font-black text-surface-text tabular-nums leading-tight">
              {totalClientes.toLocaleString("es-CL")}
            </p>
            <p className="text-[9px] text-surface-muted">clientes</p>
          </div>

          {/* Ventas mes */}
          <div className="text-right min-w-[76px]">
            <p className="text-sm font-black text-surface-text tabular-nums leading-tight">
              {formatCurrency(ventasMes, "$")}
            </p>
            <p className="text-[9px] text-surface-muted">este mes</p>
          </div>
        </div>

        {/* Logo edit button */}
        <button
          onClick={() => setEditingLogo(!editingLogo)}
          className="shrink-0 p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
          title="Editar logo"
        >
          <ImageIcon size={12} />
        </button>
      </div>

      {/* Métricas móvil */}
      <div className="sm:hidden flex items-center gap-3 px-3 pb-2 text-xs">
        <div className={`flex items-center gap-1 font-semibold ${cajasAbiertas > 0 ? "text-emerald-600" : "text-surface-muted"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cajasAbiertas > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
          {cajasAbiertas > 0 ? "Abierta" : "Cerrada"}
        </div>
        <span className="font-bold text-surface-text">{formatCurrency(ventasHoy.total, "$")}</span>
        <span className="text-surface-muted">{ventasHoy.count} tx</span>
        {pedidosActivos > 0 && <span className="font-bold text-amber-600">{pedidosActivos} pedidos</span>}
      </div>

      {/* Logo editor */}
      {editingLogo && (
        <div className="flex items-center gap-2 mx-3 mb-2.5 bg-surface-bg p-2 rounded-lg border border-brand-200">
          <input
            type="text"
            placeholder="https://... URL del logo"
            value={logoInput}
            onChange={e => setLogoInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveLogo()}
            className="flex-1 text-xs bg-transparent border-none focus:ring-0 p-0.5 text-surface-text placeholder:text-surface-muted"
          />
          <button onClick={saveLogo} disabled={saving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button onClick={() => setEditingLogo(false)} disabled={saving} className="p-1.5 text-surface-muted hover:bg-surface-border rounded-lg transition">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
