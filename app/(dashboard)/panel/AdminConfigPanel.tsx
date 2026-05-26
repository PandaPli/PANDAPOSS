"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, Building2, Receipt, CheckCircle2, AlertCircle, Circle,
} from "lucide-react";
import { HomeEditorModule } from "./HomeEditorModule";

interface Config {
  id: number;
  nombreEmpresa: string;
  rut: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  simbolo: string;
  ivaPorc: number;
  logoUrl: string | null;
}

interface Props {
  config: Config;
  homePreviewUrl: string | null;
}

function GlassMsg({ msg }: { msg: { type: "ok" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium backdrop-blur-sm border ${
      msg.type === "ok"
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-300/30"
        : "bg-red-500/10 text-red-600 border-red-300/30"
    }`}>
      {msg.type === "ok" ? <CheckCircle2 size={13} className="shrink-0" /> : <AlertCircle size={13} className="shrink-0" />}
      <span>{msg.text}</span>
    </div>
  );
}

export function AdminConfigPanel({ config, homePreviewUrl }: Props) {
  const router = useRouter();

  // Snapshot of the saved state for dirty-checking
  const savedForm = useMemo(() => ({
    nombreEmpresa: config.nombreEmpresa,
    rut: config.rut ?? "",
    direccion: config.direccion ?? "",
    telefono: config.telefono ?? "",
    email: config.email ?? "",
    moneda: config.moneda,
    simbolo: config.simbolo,
    ivaPorc: String(config.ivaPorc),
  }), [config]);

  const [form, setForm] = useState(savedForm);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Dirty detection
  const isDirty = useMemo(() => {
    return (Object.keys(savedForm) as (keyof typeof savedForm)[]).some(
      (k) => form[k] !== savedForm[k]
    );
  }, [form, savedForm]);

  // Protect against page unload with unsaved changes
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, handleBeforeUnload]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEmpresa: form.nombreEmpresa,
          rut: form.rut || null,
          direccion: form.direccion || null,
          telefono: form.telefono || null,
          email: form.email || null,
          moneda: form.moneda,
          simbolo: form.simbolo,
          ivaPorc: Number(form.ivaPorc),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      setMsg({ type: "ok", text: "Configuración guardada correctamente" });
      router.refresh();
    } catch (e) {
      setMsg({ type: "error", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Indicador de sincronización ── */}
      <div className="flex items-center justify-between">
        <div />
        <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          isDirty
            ? "text-amber-700 bg-amber-500/10 border-amber-300/30"
            : "text-emerald-700 bg-emerald-500/10 border-emerald-300/30"
        }`}>
          <Circle size={6} className={isDirty ? "fill-amber-500 text-amber-500" : "fill-emerald-500 text-emerald-500"} />
          {isDirty ? "Sin guardar" : "Guardado"}
        </span>
      </div>

      <GlassMsg msg={msg} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Datos de la Empresa ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-md shadow-brand-600/15">
              <Building2 size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-surface-text leading-tight">Datos de la Empresa</p>
              <p className="text-[11px] text-surface-muted mt-0.5 leading-tight">Información general de tu negocio</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-surface-muted block mb-1.5">Nombre de la Empresa *</label>
              <input
                className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-muted/50"
                value={form.nombreEmpresa}
                onChange={(e) => setForm({ ...form, nombreEmpresa: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-surface-muted block mb-1.5">RUT Empresa</label>
                <input
                  className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-muted/50"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  placeholder="76.000.000-0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-muted block mb-1.5">Teléfono</label>
                <input
                  className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-muted/50"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+56 2 1234 5678"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-muted block mb-1.5">Email</label>
              <input
                type="email"
                className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-muted/50"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-muted block mb-1.5">Dirección</label>
              <input
                className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-muted/50"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
          </div>
        </div>

        {/* ── Facturación e Impuestos ─────────────────────────────────── */}
        <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/15">
              <Receipt size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-surface-text leading-tight">Facturación e Impuestos</p>
              <p className="text-[11px] text-surface-muted mt-0.5 leading-tight">Moneda, símbolo y porcentaje de IVA</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-surface-muted block mb-1.5">IVA (%)</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  value={form.ivaPorc}
                  onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })}
                  min={0}
                  max={100}
                  step={0.01}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-muted block mb-1.5">Moneda</label>
                <select
                  className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  value={form.moneda}
                  onChange={(e) => {
                    const moneda = e.target.value;
                    const simbolos: Record<string, string> = {
                      CLP: "$", USD: "US$", EUR: "€", ARS: "$",
                      PEN: "S/", MXN: "$", COP: "$", BRL: "R$",
                    };
                    setForm({ ...form, moneda, simbolo: simbolos[moneda] ?? "$" });
                  }}
                >
                  <option value="CLP">CLP - Peso Chileno</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="PEN">PEN - Sol Peruano</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="BRL">BRL - Real Brasileño</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-muted block mb-1.5">Símbolo</label>
                <input
                  className="w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  value={form.simbolo}
                  onChange={(e) => setForm({ ...form, simbolo: e.target.value })}
                  maxLength={5}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Guardar ─────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading || !isDirty}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 ${
            isDirty
              ? "bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 shadow-lg shadow-brand-600/20"
              : "bg-gradient-to-r from-brand-600/60 to-violet-600/60"
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isDirty ? "Guardar Configuración" : "Sin cambios"}
        </button>
      </form>

      {/* ── Editor Home ───────────────────────────────────────────────── */}
      <HomeEditorModule currentUrl={homePreviewUrl} />
    </div>
  );
}
