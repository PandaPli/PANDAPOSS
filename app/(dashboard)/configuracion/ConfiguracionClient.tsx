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
  sucursalDescripcionDelivery?: string | null;
  sucursalInstagram?: string | null;
  sucursalFacebook?: string | null;
  sucursalWhatsapp?: string | null;
  sucursalTiktok?: string | null;
}

export function ConfiguracionClient({ config, rol, sucursalId, sucursalLogoUrl, sucursalSlug, sucursalDescripcionDelivery, sucursalInstagram, sucursalFacebook, sucursalWhatsapp, sucursalTiktok }: Props) {
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

  // --- Estado descripción delivery ---
  const [descripcion, setDescripcion] = useState(sucursalDescripcionDelivery ?? "");
  const [descripcionLoading, setDescripcionLoading] = useState(false);
  const [descripcionMsg, setDescripcionMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSaveDescripcion() {
    if (!sucursalId) return;
    setDescripcionLoading(true);
    setDescripcionMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionDelivery: descripcion || null }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setDescripcionMsg({ type: "ok", text: "Descripción guardada." });
      router.refresh();
    } catch {
      setDescripcionMsg({ type: "error", text: "No se pudo guardar la descripción." });
    } finally {
      setDescripcionLoading(false);
    }
  }

  // --- Estado redes sociales ---
  const [redes, setRedes] = useState({
    instagram: sucursalInstagram ?? "",
    facebook: sucursalFacebook ?? "",
    whatsapp: sucursalWhatsapp ?? "",
    tiktok: sucursalTiktok ?? "",
  });
  const [redesLoading, setRedesLoading] = useState(false);
  const [redesMsg, setRedesMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSaveRedes() {
    if (!sucursalId) return;
    setRedesLoading(true);
    setRedesMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram: redes.instagram || null,
          facebook: redes.facebook || null,
          whatsapp: redes.whatsapp || null,
          tiktok: redes.tiktok || null,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setRedesMsg({ type: "ok", text: "Redes sociales guardadas." });
      router.refresh();
    } catch {
      setRedesMsg({ type: "error", text: "No se pudo guardar las redes." });
    } finally {
      setRedesLoading(false);
    }
  }
  
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

        {/* Descripción de Delivery */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Descripción Delivery</h2>
          </div>
          <p className="text-xs text-surface-muted mb-4">Texto que aparece en la página de delivery pública. Puedes poner el horario, condiciones de envío o lo que quieras comunicar a tus clientes.</p>

          {descripcionMsg && (
            <div className={`mb-3 p-3 rounded-lg text-sm border ${descripcionMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {descripcionMsg.text}
            </div>
          )}

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: Hacemos delivery de lunes a domingo de 12:00 a 22:00. Tiempo estimado 30-45 min."
            className="input w-full resize-none text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-surface-muted">{descripcion.length}/500</span>
            <button
              onClick={handleSaveDescripcion}
              disabled={descripcionLoading}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              {descripcionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Redes Sociales</h2>
          </div>
          <p className="text-xs text-surface-muted mb-4">Aparecen como botones en tu página de delivery para que los clientes te sigan.</p>

          {redesMsg && (
            <div className={`mb-3 p-3 rounded-lg text-sm border ${redesMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {redesMsg.text}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-surface-muted uppercase tracking-wide">WhatsApp</label>
              <input
                value={redes.whatsapp}
                onChange={(e) => setRedes(r => ({ ...r, whatsapp: e.target.value }))}
                placeholder="569XXXXXXXX (número completo con código país)"
                className="input w-full mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Instagram</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-muted">@</span>
                <input
                  value={redes.instagram}
                  onChange={(e) => setRedes(r => ({ ...r, instagram: e.target.value.replace("@", "") }))}
                  placeholder="tu_usuario"
                  className="input w-full pl-7 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-muted uppercase tracking-wide">TikTok</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-muted">@</span>
                <input
                  value={redes.tiktok}
                  onChange={(e) => setRedes(r => ({ ...r, tiktok: e.target.value.replace("@", "") }))}
                  placeholder="tu_usuario"
                  className="input w-full pl-7 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Facebook</label>
              <input
                value={redes.facebook}
                onChange={(e) => setRedes(r => ({ ...r, facebook: e.target.value }))}
                placeholder="nombre de página o URL completa"
                className="input w-full mt-1 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveRedes}
              disabled={redesLoading}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              {redesLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar redes
            </button>
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
