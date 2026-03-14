"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, Package, Truck, QrCode, Mail, TrendingUp, CreditCard, Image as ImageIcon, Check, X, Loader2 } from "lucide-react";

export function SucursalCard({ s, plan, limits, ventasHoy, deliveryOk, menuQROk, correoOk }: any) {
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

  return (
    <div className="card p-5 space-y-4">
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
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
            plan === "PRO" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {plan}
        </span>
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
