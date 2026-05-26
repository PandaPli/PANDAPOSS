"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, Image as ImageIcon, Check, X, Loader2,
  Star, Gift, CheckCircle2, Clock, AlertTriangle,
  Wifi, Timer, ChevronDown, ChevronUp,
  Settings2, CreditCard,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS" | "SOCIO";
type PlanTipo = "BASICO" | "PRO" | "PRIME" | "DEMO";

const PAGO_CFG: Record<EstadoPago, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  SOCIO:     { label: "Socio",     color: "text-violet-700",  bg: "bg-violet-500/10", border: "border-violet-300/30", icon: <Star size={9} /> },
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-500/10", border: "border-emerald-300/30", icon: <CheckCircle2 size={9} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-500/10", border: "border-blue-300/30", icon: <Gift size={9} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-500/10", border: "border-amber-300/30", icon: <Clock size={9} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-500/10", border: "border-red-300/30", icon: <AlertTriangle size={9} /> },
};

const PLAN_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PRIME:  { color: "text-brand-700",  bg: "bg-brand-500/10",  border: "border-brand-300/30" },
  PRO:    { color: "text-violet-700", bg: "bg-violet-500/10", border: "border-violet-300/30" },
  BASICO: { color: "text-amber-700",  bg: "bg-amber-500/10",  border: "border-amber-300/30" },
  DEMO:   { color: "text-slate-600",  bg: "bg-slate-500/10",  border: "border-slate-300/30" },
};

const PLANES: PlanTipo[] = ["BASICO", "PRO", "PRIME", "DEMO"];
const ESTADOS_PAGO: EstadoPago[] = ["AL_DIA", "PENDIENTE", "ATRASADO", "GRATIS", "SOCIO"];

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
  ultimaConexion: string | null;
  tiempoTotalSeg: number;
}

function formatTiempoUso(seg: number): string {
  if (seg < 60) return seg > 0 ? `${seg}s` : "0m";
  const min = Math.floor(seg / 60);
  if (min < 60) return `${min}m`;
  const hrs = Math.floor(min / 60);
  const restMin = min % 60;
  if (hrs < 24) return restMin > 0 ? `${hrs}h ${restMin}m` : `${hrs}h`;
  const dias = Math.floor(hrs / 24);
  const restHrs = hrs % 24;
  return restHrs > 0 ? `${dias}d ${restHrs}h` : `${dias}d`;
}

function formatUltimaConexion(iso: string | null): string {
  if (!iso) return "Nunca";
  const fecha = new Date(iso);
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 2) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  const diffDias = Math.floor(diffHrs / 24);
  if (diffDias < 7) return `Hace ${diffDias}d`;
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(fecha);
}

export function SucursalRow({
  id, nombre, logoUrl, creadoEn, plan, estadoPago, mesesGratis,
  ventasHoy, ventasMes, pedidosActivos, cajasAbiertas, totalClientes,
  ultimaConexion, tiempoTotalSeg,
}: SucursalRowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [expanded, setExpanded]         = useState(false);
  const [editingLogo, setEditingLogo]   = useState(false);
  const [logoInput, setLogoInput]       = useState(logoUrl ?? "");
  const [currentLogo, setCurrentLogo]   = useState(logoUrl);
  const [saving, setSaving]             = useState(false);

  // Quick actions panel
  const [showActions, setShowActions]   = useState(false);
  const [currentPlan, setCurrentPlan]   = useState(plan);
  const [currentPago, setCurrentPago]   = useState(estadoPago);
  const [actionSaving, setActionSaving] = useState(false);

  const pago    = PAGO_CFG[currentPago];
  const planCfg = PLAN_CFG[currentPlan] ?? PLAN_CFG.BASICO;
  const isOnline = ultimaConexion && (Date.now() - new Date(ultimaConexion).getTime()) < 120_000;

  async function saveLogo() {
    const url = logoInput.trim();
    if (url && !/^https?:\/\/.+/i.test(url)) {
      toast("error", "URL inválida — debe comenzar con http:// o https://");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sucursales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, logoUrl: url }),
      });
      if (!res.ok) throw new Error();
      setCurrentLogo(url || null);
      setEditingLogo(false);
    } catch {
      toast("error", "No se pudo guardar el logo");
    } finally {
      setSaving(false);
    }
  }

  async function handlePlanChange(newPlan: PlanTipo) {
    if (newPlan === currentPlan) return;
    setActionSaving(true);
    try {
      const res = await fetch(`/api/sucursales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) throw new Error();
      setCurrentPlan(newPlan);
      toast("ok", `Plan cambiado a ${newPlan}`);
      router.refresh();
    } catch {
      toast("error", "Error al cambiar plan");
    } finally {
      setActionSaving(false);
    }
  }

  async function handlePagoChange(newPago: EstadoPago) {
    if (newPago === currentPago) return;
    setActionSaving(true);
    try {
      const res = await fetch(`/api/sucursales/${id}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoPago: newPago }),
      });
      if (!res.ok) throw new Error();
      setCurrentPago(newPago);
      toast("ok", `Estado de pago actualizado`);
      router.refresh();
    } catch {
      toast("error", "Error al cambiar estado de pago");
    } finally {
      setActionSaving(false);
    }
  }

  return (
    <div className={`
      rounded-2xl border backdrop-blur-xl transition-all duration-300
      ${isOnline
        ? "border-emerald-300/30 bg-gradient-to-r from-emerald-500/5 via-white/70 to-white/50 shadow-[0_2px_16px_rgba(16,185,129,0.06)]"
        : "border-white/50 bg-white/50 hover:bg-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      }
    `}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo */}
        <div className="shrink-0 relative">
          {currentLogo ? (
            <img
              src={currentLogo}
              alt={nombre}
              className="w-10 h-10 rounded-xl object-contain bg-white/80 border border-white/60 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/60 border border-white/50 flex items-center justify-center text-surface-muted backdrop-blur-sm">
              <Building2 size={16} />
            </div>
          )}
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>

        {/* Nombre + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-surface-text truncate leading-tight">{nombre}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg leading-none border backdrop-blur-sm ${planCfg.bg} ${planCfg.color} ${planCfg.border}`}>
              {currentPlan}
            </span>
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-lg leading-none border backdrop-blur-sm ${pago.bg} ${pago.color} ${pago.border}`}>
              {pago.icon}
              {pago.label}
              {currentPago === "GRATIS" && mesesGratis > 0 ? ` ${mesesGratis}m` : ""}
            </span>
          </div>
          <p className="text-[10px] text-surface-muted mt-0.5 hidden sm:block">
            Desde {new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(creadoEn))}
          </p>
        </div>

        {/* Métricas inline — desktop */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {/* Estado caja */}
          <div className="text-center min-w-[56px]">
            <div className={`flex items-center gap-1 text-xs font-bold justify-center ${cajasAbiertas > 0 ? "text-emerald-600" : "text-surface-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cajasAbiertas > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              {cajasAbiertas > 0 ? `${cajasAbiertas} caja${cajasAbiertas > 1 ? "s" : ""}` : "Cerrada"}
            </div>
            <p className="text-[9px] text-surface-muted/70 mt-0.5">estado</p>
          </div>

          {/* Última conexión */}
          <div className="text-center min-w-[60px]">
            <div className={`flex items-center gap-1 text-xs font-bold justify-center ${isOnline ? "text-emerald-600" : "text-surface-muted"}`}>
              <Wifi size={10} />
              {formatUltimaConexion(ultimaConexion)}
            </div>
            <p className="text-[9px] text-surface-muted/70 mt-0.5">última vez</p>
          </div>

          {/* Tiempo total */}
          <div className="text-center min-w-[52px]">
            <div className="flex items-center gap-1 text-xs font-bold justify-center text-indigo-600">
              <Timer size={10} />
              {formatTiempoUso(tiempoTotalSeg)}
            </div>
            <p className="text-[9px] text-surface-muted/70 mt-0.5">uso total</p>
          </div>

          {/* Ventas hoy */}
          <div className="text-right min-w-[72px]">
            <p className="text-sm font-black text-surface-text tabular-nums leading-tight">
              {formatCurrency(ventasHoy.total, "$")}
            </p>
            <p className="text-[9px] text-surface-muted/70">{ventasHoy.count} tx · hoy</p>
          </div>

          {/* Ventas mes */}
          <div className="text-right min-w-[72px]">
            <p className="text-sm font-black text-surface-text tabular-nums leading-tight">
              {formatCurrency(ventasMes, "$")}
            </p>
            <p className="text-[9px] text-surface-muted/70">este mes</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setShowActions(!showActions); setEditingLogo(false); }}
            className={`p-1.5 rounded-lg transition-all ${
              showActions
                ? "text-brand-600 bg-brand-500/10"
                : "text-surface-muted hover:text-brand-600 hover:bg-brand-500/10"
            }`}
            title="Acciones rápidas"
          >
            <Settings2 size={12} />
          </button>
          <button
            onClick={() => { setEditingLogo(!editingLogo); setShowActions(false); }}
            className={`p-1.5 rounded-lg transition-all ${
              editingLogo
                ? "text-brand-600 bg-brand-500/10"
                : "text-surface-muted hover:text-brand-600 hover:bg-brand-500/10"
            }`}
            title="Editar logo"
          >
            <ImageIcon size={12} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="lg:hidden p-1.5 text-surface-muted hover:text-brand-600 hover:bg-brand-500/10 rounded-lg transition-all"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Métricas expandibles — mobile/tablet */}
      {expanded && (
        <div className="lg:hidden px-4 pb-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/40 border border-white/50 backdrop-blur-sm p-2.5 text-center">
              <div className={`flex items-center gap-1 text-[11px] font-bold justify-center ${cajasAbiertas > 0 ? "text-emerald-600" : "text-surface-muted"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cajasAbiertas > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                {cajasAbiertas > 0 ? "Abierta" : "Cerrada"}
              </div>
              <p className="text-[9px] text-surface-muted mt-0.5">estado</p>
            </div>
            <div className="rounded-xl bg-white/40 border border-white/50 backdrop-blur-sm p-2.5 text-center">
              <div className={`flex items-center gap-1 text-[11px] font-bold justify-center ${isOnline ? "text-emerald-600" : "text-surface-muted"}`}>
                <Wifi size={9} /> {formatUltimaConexion(ultimaConexion)}
              </div>
              <p className="text-[9px] text-surface-muted mt-0.5">última vez</p>
            </div>
            <div className="rounded-xl bg-white/40 border border-white/50 backdrop-blur-sm p-2.5 text-center">
              <div className="flex items-center gap-1 text-[11px] font-bold justify-center text-indigo-600">
                <Timer size={9} /> {formatTiempoUso(tiempoTotalSeg)}
              </div>
              <p className="text-[9px] text-surface-muted mt-0.5">uso total</p>
            </div>
            <div className="rounded-xl bg-white/40 border border-white/50 backdrop-blur-sm p-2.5 text-center">
              <p className="text-[11px] font-black text-surface-text tabular-nums">{formatCurrency(ventasHoy.total, "$")}</p>
              <p className="text-[9px] text-surface-muted">{ventasHoy.count} tx hoy</p>
            </div>
            <div className="rounded-xl bg-white/40 border border-white/50 backdrop-blur-sm p-2.5 text-center">
              <p className={`text-[11px] font-black tabular-nums ${pedidosActivos > 0 ? "text-amber-600" : "text-surface-muted"}`}>{pedidosActivos}</p>
              <p className="text-[9px] text-surface-muted">pedidos</p>
            </div>
            <div className="rounded-xl bg-white/40 border border-white/50 backdrop-blur-sm p-2.5 text-center">
              <p className="text-[11px] font-black text-surface-text tabular-nums">{formatCurrency(ventasMes, "$")}</p>
              <p className="text-[9px] text-surface-muted">este mes</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions panel */}
      {showActions && (
        <div className="mx-4 mb-3 rounded-xl bg-white/50 backdrop-blur-sm border border-brand-200/30 p-3 space-y-3 animate-fade-in">
          {actionSaving && (
            <div className="flex items-center gap-2 text-xs text-brand-600 font-medium">
              <Loader2 size={11} className="animate-spin" /> Guardando...
            </div>
          )}

          {/* Plan */}
          <div>
            <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CreditCard size={10} /> Plan
            </p>
            <div className="flex gap-1 flex-wrap">
              {PLANES.map(p => {
                const cfg = PLAN_CFG[p] ?? PLAN_CFG.BASICO;
                const isActive = currentPlan === p;
                return (
                  <button
                    key={p}
                    onClick={() => handlePlanChange(p)}
                    disabled={actionSaving}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all disabled:opacity-40 ${
                      isActive
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-offset-1 ring-brand-300/40`
                        : "bg-white/40 text-surface-muted border-white/50 hover:bg-white/70"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado de pago */}
          <div>
            <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 size={10} /> Estado de Pago
            </p>
            <div className="flex gap-1 flex-wrap">
              {ESTADOS_PAGO.map(ep => {
                const cfg = PAGO_CFG[ep];
                const isActive = currentPago === ep;
                return (
                  <button
                    key={ep}
                    onClick={() => handlePagoChange(ep)}
                    disabled={actionSaving}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all disabled:opacity-40 ${
                      isActive
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-offset-1 ring-brand-300/40`
                        : "bg-white/40 text-surface-muted border-white/50 hover:bg-white/70"
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Logo editor */}
      {editingLogo && (
        <div className="flex items-center gap-2 mx-4 mb-3 bg-white/40 backdrop-blur-sm p-2.5 rounded-xl border border-brand-200/30 animate-fade-in">
          <input
            type="text"
            placeholder="https://... URL del logo"
            value={logoInput}
            onChange={e => setLogoInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveLogo()}
            className="flex-1 text-xs bg-transparent border-none focus:ring-0 p-0.5 text-surface-text placeholder:text-surface-muted"
          />
          <button onClick={saveLogo} disabled={saving} className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button onClick={() => setEditingLogo(false)} disabled={saving} className="p-1.5 text-surface-muted hover:bg-slate-500/10 rounded-lg transition">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
