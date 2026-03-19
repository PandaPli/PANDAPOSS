"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Building2, Receipt, ImageIcon, Upload, X, Link2, Copy, ExternalLink, CheckCircle2, Printer, MapPin, Plus, Trash2 } from "lucide-react";
import type { Rol } from "@/types";
import ZonaMapEditor from "@/components/configuracion/ZonaMapEditor";

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

interface ZonaDelivery {
  id: number;
  nombre: string;
  precio: number;
  polygon?: { lat: number; lng: number }[];
}

interface Props {
  config: Config;
  rol: Rol;
  sucursalId: number | null;
  sucursalLogoUrl: string | null;
  sucursalSlug?: string | null;
  sucursalPrinterPath?: string | null;
  sucursalRut?: string | null;
  sucursalGiroComercial?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalCartaBg?: string | null;
  sucursalCartaTagline?: string | null;
  sucursalCartaSaludo?: string | null;
  sucursalZonasDelivery?: ZonaDelivery[] | null;
}

export function ConfiguracionClient({ config, rol, sucursalId, sucursalLogoUrl, sucursalCartaBg, sucursalCartaTagline, sucursalCartaSaludo, sucursalSlug, sucursalPrinterPath, sucursalRut, sucursalGiroComercial, sucursalTelefono, sucursalDireccion, sucursalZonasDelivery }: Props) {
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
  const [logoPreview, setLogoPreview] = useState<string | null>(sucursalLogoUrl ?? null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Estado personalización carta ---
  const [cartaBgPreview, setCartaBgPreview] = useState<string | null>(sucursalCartaBg ?? null);
  const [cartaBgLoading, setCartaBgLoading] = useState(false);
  const [cartaTagline, setCartaTagline] = useState(sucursalCartaTagline ?? "");
  const [cartaSaludo, setCartaSaludo] = useState(sucursalCartaSaludo ?? "");
  const [cartaMsg, setCartaMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [cartaLoading, setCartaLoading] = useState(false);
  const bgRef = useRef<HTMLInputElement>(null);

  // --- Estado impresora ---
  const [printerPath, setPrinterPath] = useState(sucursalPrinterPath ?? "/dev/usb/lp0");
  const [printerLoading, setPrinterLoading] = useState(false);
  const [printerMsg, setPrinterMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // --- Estado datos legales sucursal ---
  const [legalForm, setLegalForm] = useState({
    rut: sucursalRut ?? "",
    giroComercial: sucursalGiroComercial ?? "",
    telefono: sucursalTelefono ?? "",
    direccion: sucursalDireccion ?? "",
  });
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalMsg, setLegalMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // --- Estado zonas de delivery ---
  const [zonas, setZonas] = useState<ZonaDelivery[]>(
    Array.isArray(sucursalZonasDelivery) ? sucursalZonasDelivery : []
  );
  const [newZonaNombre, setNewZonaNombre] = useState("");
  const [newZonaPrecio, setNewZonaPrecio] = useState("");
  const [zonasLoading, setZonasLoading] = useState(false);
  const [zonasMsg, setZonasMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [zonaModo, setZonaModo] = useState<"manual" | "mapa">("manual");

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  function copyToClipboard(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  async function handlePrinterSave() {
    setPrinterLoading(true);
    setPrinterMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerPath: printerPath || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      setPrinterMsg({ type: "ok", text: "Ruta de impresora guardada" });
    } catch (err) {
      setPrinterMsg({ type: "error", text: (err as Error).message });
    } finally {
      setPrinterLoading(false);
    }
  }

  async function handleLegalSave() {
    setLegalLoading(true);
    setLegalMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rut: legalForm.rut || null,
          giroComercial: legalForm.giroComercial || null,
          telefono: legalForm.telefono || null,
          direccion: legalForm.direccion || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      setLegalMsg({ type: "ok", text: "Datos legales guardados" });
    } catch (err) {
      setLegalMsg({ type: "error", text: (err as Error).message });
    } finally {
      setLegalLoading(false);
    }
  }

  async function handleZonasSave(nuevasZonas: ZonaDelivery[]) {
    setZonasLoading(true);
    setZonasMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zonasDelivery: nuevasZonas }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      setZonasMsg({ type: "ok", text: "Zonas guardadas" });
    } catch (err) {
      setZonasMsg({ type: "error", text: (err as Error).message });
    } finally {
      setZonasLoading(false);
    }
  }

  function handleAddZona() {
    const nombre = newZonaNombre.trim();
    const precio = Number(newZonaPrecio);
    if (!nombre || !precio || precio <= 0) return;
    const nuevasZonas = [...zonas, { id: Date.now(), nombre, precio }];
    setZonas(nuevasZonas);
    setNewZonaNombre("");
    setNewZonaPrecio("");
    handleZonasSave(nuevasZonas);
  }

  function handleRemoveZona(id: number) {
    const nuevasZonas = zonas.filter((z) => z.id !== id);
    setZonas(nuevasZonas);
    handleZonasSave(nuevasZonas);
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
      const upRes = await fetch("/api/upload?tipo=logo", { method: "POST", body: fd });
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

  // --- Handlers personalización carta ---
  async function handleCartaBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCartaBgLoading(true);
    setCartaMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload?tipo=fondo", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? "Error al subir fondo");
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaBg: upData.url }),
      });
      if (!res.ok) throw new Error("Error al guardar fondo");
      setCartaBgPreview(upData.url);
      setCartaMsg({ type: "ok", text: "Fondo actualizado correctamente." });
      router.refresh();
    } catch (err) {
      setCartaMsg({ type: "error", text: (err as Error).message });
    } finally {
      setCartaBgLoading(false);
      if (bgRef.current) bgRef.current.value = "";
    }
  }

  async function handleCartaBgRemove() {
    setCartaBgLoading(true);
    setCartaMsg(null);
    try {
      await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaBg: null }),
      });
      setCartaBgPreview(null);
      setCartaMsg({ type: "ok", text: "Fondo eliminado." });
      router.refresh();
    } catch {
      setCartaMsg({ type: "error", text: "Error al eliminar fondo." });
    } finally {
      setCartaBgLoading(false);
    }
  }

  async function handleCartaSaludoSave() {
    setCartaLoading(true);
    setCartaMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaTagline: cartaTagline.trim() || null, cartaSaludo: cartaSaludo.trim() || null }),
      });
      if (!res.ok) throw new Error("Error al guardar texto");
      setCartaMsg({ type: "ok", text: "Texto de carta guardado." });
      router.refresh();
    } catch (err) {
      setCartaMsg({ type: "error", text: (err as Error).message });
    } finally {
      setCartaLoading(false);
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

        {/* Personalización de Carta */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Personalización de Carta</h2>
          </div>
          <p className="text-xs text-surface-muted mb-5">Configura cómo se ve tu carta pública y delivery. Los cambios se reflejan de inmediato.</p>

          {cartaMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${cartaMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {cartaMsg.text}
            </div>
          )}

          {/* Fondo de carta */}
          <div className="mb-6">
            <p className="text-sm font-medium text-surface-text mb-3">Imagen de fondo</p>
            <div className="flex items-start gap-4">
              <div className="w-32 h-20 rounded-xl border-2 border-dashed border-surface-border flex items-center justify-center bg-surface-bg flex-shrink-0 overflow-hidden">
                {cartaBgPreview ? (
                  <img src={cartaBgPreview} alt="Fondo carta" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} className="text-surface-muted opacity-30" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-surface-muted">Aparece como fondo en tu carta pública. <strong>PNG con fondo transparente ✓</strong> · JPG · WEBP. Máx 8 MB.</p>
                <div className="flex gap-2 flex-wrap">
                  <input ref={bgRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCartaBgUpload} />
                  <button type="button" onClick={() => bgRef.current?.click()} disabled={cartaBgLoading} className="btn-primary text-sm">
                    {cartaBgLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {cartaBgPreview ? "Cambiar fondo" : "Subir fondo"}
                  </button>
                  {cartaBgPreview && (
                    <button type="button" onClick={handleCartaBgRemove} disabled={cartaBgLoading} className="btn-secondary text-sm">
                      <X size={14} /> Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Frase principal (tagline) */}
          <div className="mb-4">
            <p className="text-sm font-medium text-surface-text mb-1">Frase principal</p>
            <p className="text-xs text-surface-muted mb-2">Aparece destacada en el hero de tu carta. Ej: "Tu Fantasía Mexicana" o "Sushi de autor 🍣"</p>
            <input
              type="text"
              value={cartaTagline}
              onChange={(e) => setCartaTagline(e.target.value)}
              maxLength={150}
              placeholder='ej: Tu Fantasía Mexicana 🌮'
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-4 py-3 text-sm text-surface-text outline-none focus:border-brand-500"
            />
            <p className="text-right text-xs text-surface-muted mt-1">{cartaTagline.length}/150</p>
          </div>

          {/* Subtexto / saludo / redes */}
          <div>
            <p className="text-sm font-medium text-surface-text mb-1">Subtexto / redes sociales</p>
            <p className="text-xs text-surface-muted mb-3">Segunda línea bajo la frase. Horarios, redes sociales, eslogan, etc.</p>
            <textarea
              value={cartaSaludo}
              onChange={(e) => setCartaSaludo(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="ej: Síguenos en @netaa.mx 🌶️ | Lunes a Domingo 12:00 - 22:00"
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-4 py-3 text-sm text-surface-text outline-none focus:border-brand-500 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-surface-muted">{cartaSaludo.length}/300</span>
              <button
                type="button"
                onClick={handleCartaSaludoSave}
                disabled={cartaLoading}
                className="btn-primary text-sm"
              >
                {cartaLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar textos
              </button>
            </div>
          </div>
        </div>

        {/* Impresora */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Printer size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Impresora Local</h2>
          </div>

          {printerMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${printerMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {printerMsg.text}
            </div>
          )}

          <p className="text-sm text-surface-muted mb-4">
            Ruta del dispositivo de impresora en el PC local donde corre el agente. En Linux/Mac suele ser <code className="bg-surface-bg px-1 rounded">/dev/usb/lp0</code>. En Windows usa el puerto COM, ej: <code className="bg-surface-bg px-1 rounded">\\\\?\\COM3</code>.
          </p>

          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono text-sm"
              value={printerPath}
              onChange={(e) => setPrinterPath(e.target.value)}
              placeholder="/dev/usb/lp0"
            />
            <button
              type="button"
              onClick={handlePrinterSave}
              disabled={printerLoading}
              className="btn-primary shrink-0"
            >
              {printerLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </div>
        </div>

        {/* Datos Legales */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Datos Legales</h2>
          </div>
          <p className="text-sm text-surface-muted mb-4">Estos datos aparecen en los tickets y boletas de tu sucursal.</p>

          {legalMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${legalMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {legalMsg.text}
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">RUT</label>
                <input className="input" value={legalForm.rut} onChange={(e) => setLegalForm({ ...legalForm, rut: e.target.value })} placeholder="76.000.000-0" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={legalForm.telefono} onChange={(e) => setLegalForm({ ...legalForm, telefono: e.target.value })} placeholder="+56 9 1234 5678" />
              </div>
            </div>
            <div>
              <label className="label">Giro Comercial</label>
              <input className="input" value={legalForm.giroComercial} onChange={(e) => setLegalForm({ ...legalForm, giroComercial: e.target.value })} placeholder="Restaurante y delivery" />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input className="input" value={legalForm.direccion} onChange={(e) => setLegalForm({ ...legalForm, direccion: e.target.value })} placeholder="Calle 123, Ciudad" />
            </div>
          </div>

          <button type="button" onClick={handleLegalSave} disabled={legalLoading} className="btn-primary mt-4">
            {legalLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar Datos Legales
          </button>
        </div>

        {/* Zonas de Delivery */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} className="text-brand-600" />
            <h2 className="font-semibold text-surface-text">Zonas de Delivery</h2>
          </div>
          <p className="text-sm text-surface-muted mb-4">Define las zonas de despacho y su costo. Los clientes eligen la zona al pedir online.</p>

          {zonasMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${zonasMsg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {zonasMsg.text}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 p-1 rounded-lg bg-surface-bg border border-surface-border w-fit">
            <button
              type="button"
              onClick={() => setZonaModo("manual")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${zonaModo === "manual" ? "bg-white shadow text-surface-text" : "text-surface-muted hover:text-surface-text"}`}
            >
              📝 Por nombre
            </button>
            <button
              type="button"
              onClick={() => setZonaModo("mapa")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${zonaModo === "mapa" ? "bg-white shadow text-surface-text" : "text-surface-muted hover:text-surface-text"}`}
            >
              🗺️ Por mapa
            </button>
          </div>

          {zonaModo === "manual" && (
            <>
              <div className="space-y-2 mb-4">
                {zonas.length === 0 && (
                  <p className="text-sm text-surface-muted italic">Sin zonas configuradas. Agrega al menos una.</p>
                )}
                {zonas.map((zona) => (
                  <div key={zona.id} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-bg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-surface-text">{zona.nombre}</span>
                      <span className="ml-1 text-sm text-surface-muted">${zona.precio.toLocaleString("es-CL")}</span>
                      {zona.polygon?.length ? (
                        <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">📍</span>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => handleRemoveZona(zona.id)} disabled={zonasLoading} className="text-red-500 hover:text-red-700 transition-colors p-1 rounded">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={newZonaNombre}
                  onChange={(e) => setNewZonaNombre(e.target.value)}
                  placeholder="Nombre zona (ej: Llolleo Centro)"
                  onKeyDown={(e) => e.key === "Enter" && handleAddZona()}
                />
                <input
                  className="input w-32"
                  type="number"
                  value={newZonaPrecio}
                  onChange={(e) => setNewZonaPrecio(e.target.value)}
                  placeholder="Precio"
                  min={0}
                  onKeyDown={(e) => e.key === "Enter" && handleAddZona()}
                />
                <button type="button" onClick={handleAddZona} disabled={zonasLoading || !newZonaNombre.trim() || !newZonaPrecio} className="btn-primary shrink-0">
                  {zonasLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Agregar
                </button>
              </div>
            </>
          )}

          {zonaModo === "mapa" && (
            <ZonaMapEditor
              zonas={zonas}
              onChange={(nuevasZonas) => {
                setZonas(nuevasZonas);
                handleZonasSave(nuevasZonas);
              }}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
              defaultCenter={undefined}
            />
          )}
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
