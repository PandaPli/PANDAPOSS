"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Building2, Truck, QrCode, Mail, CreditCard, Image as ImageIcon, Check, X, Loader2, Star, Gift, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS" | "SOCIO";

const PAGO_CONFIG: Record<EstadoPago, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SOCIO:     { label: "Socio",     color: "text-violet-700",  bg: "bg-violet-100",  icon: <Star size={11} /> },
  AL_DIA:    { label: "Al día",    color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle2 size={11} /> },
  GRATIS:    { label: "Gratis",    color: "text-blue-700",    bg: "bg-blue-100",    icon: <Gift size={11} /> },
  PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-100",   icon: <Clock size={11} /> },
  ATRASADO:  { label: "Atrasado",  color: "text-red-700",     bg: "bg-red-100",     icon: <AlertTriangle size={11} /> },
};

export function SucursalCard({ s, plan, limits, ventasHoy, deliveryOk, menuQROk, correoOk, estadoPago, mesesGratis }: any) {
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(s.logoUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(s.logoUrl);

  async function handleSaveLogo() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/sucursales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, logoUrl: logoUrl.trim() }),
      });
      if (!res.ok) throw new Error("Error al guardar logo");
      setCurrentLogo(logoUrl.trim() || null);
      setIsEditingLogo(false);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el logo");
    } finally {
      setIsSaving(false);
    }
  }

  const bgCard: Record<EstadoPago, string> = {
    SOCIO:     "bg-violet-50 border-violet-200",
    AL_DIA:    "bg-emerald-50 border-emerald-200",
    GRATIS:    "bg-blue-50 border-blue-200",
    PENDIENTE: "bg-white border-surface-border",
    ATRASADO:  "bg-red-50 border-red-200",
  };
  const cardClass = (PAGO_CONFIG[estadoPago as EstadoPago] ? bgCard[estadoPago as EstadoPago] : "bg-white border-surface-border");

  return (
    <div className={`rounded-xl border shadow-card p-5 space-y-4 ${cardClass}`}>
      {/* Nombre + plan + Logo Thumb */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {currentLogo ? (
            <img src={currentLogo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface-bg flex items-center justify-center border border-surface-border text-surface-muted shrink-0">
               <Building2 size={16} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-surface-text truncate">{s.nombre}</p>
            <p className="text-xs text-surface-muted mt-0.5">
              Cliente desde{" "}
              {new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", }).format(new Date(s.creadoEn))}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              plan === "PRIME" ? "bg-brand-100 text-brand-700" :
              plan === "PRO" ? "bg-violet-100 text-violet-700" :
              plan === "DEMO" ? "bg-slate-100 text-slate-600" :
              "bg-amber-100 text-amber-700"
            }`}
          >
            {plan}
          </span>
          {estadoPago && (() => {
            const cfg = PAGO_CONFIG[estadoPago as EstadoPago];
            return cfg ? (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
                {estadoPago === "GRATIS" && mesesGratis > 0 && ` · ${mesesGratis}m`}
              </span>
            ) : null;
          })()}
        </div>
      </div>

      {/* Editor Logo Dropdown */}
      <div className="pt-2 border-t border-surface-border">
          {isEditingLogo ? (
            <div className="flex items-center gap-2 bg-surface-bg p-2 rounded-xl border border-brand-200">
               <input 
                 type="text" 
                 placeholder="Ej: https://imgur.com/logo.png" 
                 value={logoUrl}
                 onChange={(e) => setLogoUrl(e.target.value)}
                 className="flex-1 text-xs bg-transparent border-none focus:ring-0 p-1 text-surface-text"
               />
               <button onClick={handleSaveLogo} disabled={isSaving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                 {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
               </button>
               <button onClick={() => setIsEditingLogo(false)} disabled={isSaving} className="p-1.5 text-surface-muted hover:bg-surface-border rounded-lg transition">
                 <X size={14} />
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingLogo(true)}
              className="text-xs flex items-center gap-1.5 text-brand-600 font-medium hover:underline p-1"
            >
              <ImageIcon size={12} />
              {currentLogo ? "Cambiar Logo (URL)" : "Añadir Logo (URL)"}
            </button>
          )}
      </div>

      {/* Ventas hoy */}
      <div className="flex items-center justify-between bg-brand-50 rounded-xl px-3 py-2">
        <span className="text-xs text-brand-600 font-medium">Ventas hoy</span>
        <div className="text-right">
          <span className="text-sm font-bold text-brand-600">
            {formatCurrency(ventasHoy?.total ?? 0, "$")}
          </span>
          <span className="text-xs text-brand-400 ml-1.5">
            ({ventasHoy?.count ?? 0} tx)
          </span>
        </div>
      </div>

      {/* APIs / Features */}
      <div>
        <p className="text-xs text-surface-muted font-medium mb-2">APIs habilitadas</p>
        <div className="flex flex-wrap gap-1.5">
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
            deliveryOk ? "bg-emerald-100 text-emerald-700" : "bg-surface-muted/15 text-surface-muted"
          }`}>
            <Truck size={10} /> Delivery {deliveryOk ? "✓" : "—"}
          </span>
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
            menuQROk ? "bg-blue-100 text-blue-700" : "bg-surface-muted/15 text-surface-muted"
          }`}>
            <QrCode size={10} /> Menú QR {menuQROk ? "✓" : "—"}
          </span>
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
            correoOk ? "bg-purple-100 text-purple-700" : "bg-surface-muted/15 text-surface-muted"
          }`}>
            <Mail size={10} /> Correo {correoOk ? "✓" : "—"}
          </span>
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
            <CreditCard size={10} /> POS ✓
          </span>
        </div>
      </div>
    </div>
  );
}
