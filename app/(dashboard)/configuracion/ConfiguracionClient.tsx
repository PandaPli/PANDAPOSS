"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Building2, Receipt, ImageIcon, Upload, X, Link2, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import type { Rol } from "@/types";

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
  rol: Rol;
  sucursalId: number | null;
  sucursalLogoUrl: string | null;
  sucursalSlug?: string | null;
}

export function ConfiguracionClient({ config, rol, sucursalId, sucursalLogoUrl, sucursalSlug }: Props) {
  const router = useRouter();
  const esAdminSucursal = rol === "RESTAURANTE";

  // --- Estado global config (solo ADMIN_GENERAL) ---
  const [form, setForm] = useState({
    nombreEmpresa: config.nombreEmpresa,
    rut: config.rut ?? "",
    direccion: config.direccion ?? "",
    telefono: config.telefono ?? "",
    email: config.email ?? "",
    moneda: config.moneda,
    simbolo: config.simbolo,
    ivaPorc: String(config.ivaPorc),
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // --- Estado logo sucursal ---
  const [logoPreview, setLogoPreview] = useState<string | null>(sucursalLogoUrl);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  function copyToClipboard(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  }

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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoLoading(true);
    setLogoMsg(null);

    try {
      // Subir imagen
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error ?? "Error al subir imagen");

      // Guardar URL en la sucursal
      const patchRes = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: upData.url }),
      });
      if (!patchRes.ok) {
        const d = await patchRes.json();
        throw new Error(d.error ?? "Error al guardar logo");
      }

      setLogoPreview(upData.url);
      setLogoMsg({ type: "ok", text: "Logo actualizado. Recarga la página para verlo en el menú." });
      router.refresh();
    } catch (err) {
      setLogoMsg({ type: "error", text: (err as Error).message });
    } finally {
      setLogoLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    setLogoLoading(true);
    setLogoMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });
      if (!res.ok) throw new Error("Error al eliminar logo");
      setLogoPreview(null);
      setLogoMsg({ type: "ok", text: "Logo eliminado. Se usará el logo por defecto." });
      router.refresh();
    } catch (err) {
      setLogoMsg({ type: "error", text: (err as Error).message });
    } finally {
      setLogoLoading(false);
    }
  }

  // --- Vista RESTAURANTE: solo card de logo y links ---
  if (esAdminSucursal) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const urlDelivery  = baseUrl + `/pedir/${sucursalSlug}`;
    const urlMenuClean = sucursalSlug ? baseUrl + `/vercarta/${sucursalSlug}` : baseUrl + `/vercarta`;

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Configuración</h1>
          <p className="text-surface-muted text-sm mt-1">Configuración online de tu sucursal</p>
        </div>

        {/* Links Públicos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Link2 size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Enlaces Públicos</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-surface-bg border border-surface-border p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-surface-text">🚀 Delivery Online</span>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full">Pedidos activos</span>
              </div>
              <p className="text-xs text-surface-muted mb-3">Comparte este enlace en tus redes sociales (Instagram, WhatsApp) para que tus clientes pidan a domicilio. Tus clientes verán la carta y podrán pedir directamente al Punto de Venta.</p>
              
              <div className="flex items-center gap-2">
                <input readOnly value={urlDelivery} className="input text-xs font-mono py-2 bg-white flex-1" />
                <button 
                  onClick={() => copyToClipboard(urlDelivery, "delivery")}
                  className="btn-secondary py-2 px-3 text-sm shrink-0"
                >
                  {copiedLink === "delivery" ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14} />}
                  Copy
                </button>
                <a href={urlDelivery} target="_blank" className="btn-secondary py-2 px-3 text-sm shrink-0" title="Probar enlace">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="bg-surface-bg border border-surface-border p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-surface-text">📱 Carta Digital (Solo ver)</span>
              </div>
              <p className="text-xs text-surface-muted mb-3">Este enlace muestra únicamente el menú, sirve para clientes que están sentados en el local y no necesitan hacer un pedido online, solo quieren leer la carta.</p>
              
              <div className="flex items-center gap-2">
                <input readOnly value={urlMenuClean} className="input text-xs font-mono py-2 bg-white flex-1" />
                <button 
                  onClick={() => copyToClipboard(urlMenuClean, "menu")}
                  className="btn-secondary py-2 px-3 text-sm shrink-0"
                >
                  {copiedLink === "menu" ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14} />}
                  Copy
                </button>
                <a href={urlMenuClean} target="_blank" className="btn-secondary py-2 px-3 text-sm shrink-0" title="Probar enlace">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Logo de Sucursal</h2>
          </div>

          {logoMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${logoMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {logoMsg.text}
            </div>
          )}

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-surface-border flex items-center justify-center bg-surface-bg flex-shrink-0 overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo sucursal" className="w-full h-full object-contain p-1" />
              ) : (
                <ImageIcon size={32} className="text-surface-muted opacity-40" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <p className="text-sm text-surface-muted">
                Sube el logo de tu empresa. Se mostrará en el menú, tickets y dashboard.
                Formatos: JPG, PNG, WEBP. Máx 2 MB.
              </p>

              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoLoading}
                  className="btn-primary text-sm"
                >
                  {logoLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {logoPreview ? "Cambiar logo" : "Subir logo"}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={logoLoading}
                    className="btn-secondary text-sm"
                  >
                    <X size={14} />
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Vista ADMIN_GENERAL: config global completa ---
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-text">Configuración</h1>
        <p className="text-surface-muted text-sm mt-1">Datos generales de la empresa y sistema</p>
      </div>

      {msg && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm border ${
            msg.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Empresa */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Datos de la Empresa</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Nombre de la Empresa *</label>
              <input
                className="input"
                value={form.nombreEmpresa}
                onChange={(e) => setForm({ ...form, nombreEmpresa: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">RUT Empresa</label>
                <input
                  className="input"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  placeholder="76.000.000-0"
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+56 2 1234 5678"
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input
                className="input"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
          </div>
        </div>

        {/* Facturación */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Facturación e Impuestos</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">IVA (%)</label>
              <input
                type="number"
                className="input"
                value={form.ivaPorc}
                onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })}
                min={0}
                max={100}
                step={0.01}
              />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select
                className="input"
                value={form.moneda}
                onChange={(e) => {
                  const moneda = e.target.value;
                  const simbolos: Record<string, string> = {
                    CLP: "$", USD: "US$", EUR: "€", ARS: "$", PEN: "S/", MXN: "$", COP: "$", BRL: "R$",
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
              <label className="label">Símbolo</label>
              <input
                className="input"
                value={form.simbolo}
                onChange={(e) => setForm({ ...form, simbolo: e.target.value })}
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {/* Guardar */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Configuración
        </button>
      </form>
    </div>
  );
}
