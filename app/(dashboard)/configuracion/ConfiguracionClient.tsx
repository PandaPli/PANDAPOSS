"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, Building2, Receipt, ImageIcon, Upload, X,
  Link2, Copy, ExternalLink, CheckCircle2, Printer, MapPin,
  Plus, Trash2, Star, Bot, Bike, QrCode, CreditCard, Globe,
} from "lucide-react";
import type { Rol } from "@/types";
import ZonaMapEditor from "@/components/configuracion/ZonaMapEditor";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  sucursalPrinterIp?: string | null;
  sucursalRut?: string | null;
  sucursalGiroComercial?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalCartaBg?: string | null;
  sucursalCartaTagline?: string | null;
  sucursalCartaSaludo?: string | null;
  sucursalZonasDelivery?: ZonaDelivery[] | null;
  sucursalSocialFacebook?: string | null;
  sucursalSocialInstagram?: string | null;
  sucursalSocialWhatsapp?: string | null;
  sucursalSocialYoutube?: string | null;
  sucursalSocialTiktok?: string | null;
  sucursalSocialTwitter?: string | null;
  sucursalFlayerUrl?: string | null;
  sucursalFlayerActivo?: boolean;
  sucursalMpAccessToken?: string | null;
  sucursalPuntosActivo?: boolean;
  sucursalPuntosPorMil?: number;
  sucursalValorPunto?: number;
}

// ─── Widget primitives ────────────────────────────────────────────────────────

function WidgetCard({
  icon, iconBg = "bg-brand-600", title, description,
  badge, badgeVariant = "neutral", children, className,
}: {
  icon: React.ReactNode; iconBg?: string; title: string; description: string;
  badge?: string; badgeVariant?: "neutral" | "active" | "inactive" | "warning";
  children: React.ReactNode; className?: string;
}) {
  const badgeStyles = {
    neutral:  "bg-surface-bg text-surface-muted border border-surface-border",
    active:   "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-400",
    warning:  "bg-amber-100 text-amber-700",
  };
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-border/60">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-text text-sm leading-tight">{title}</p>
          <p className="text-xs text-surface-muted mt-0.5 leading-tight truncate">{description}</p>
        </div>
        {badge && (
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide", badgeStyles[badgeVariant])}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Toggle({
  checked, onChange, disabled = false, activeColor = "bg-emerald-500",
}: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50",
        checked ? activeColor : "bg-gray-200"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

function Msg({ msg }: { msg: { type: "ok" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium",
      msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
    )}>
      {msg.type === "ok" && <CheckCircle2 size={13} className="shrink-0" />}
      <span>{msg.text}</span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-surface-muted/60 px-0.5">{label}</p>
      {children}
    </div>
  );
}

function UrlBlock({
  url, copyId, copiedLink, onCopy,
}: {
  url: string; copyId: string; copiedLink: string | null; onCopy: (url: string, id: string) => void;
}) {
  const isCopied = copiedLink === copyId;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-bg border border-surface-border">
        <Globe size={11} className="shrink-0 text-surface-muted/40" />
        <span className="flex-1 text-xs font-mono text-surface-muted truncate">{url}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(url, copyId)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
            isCopied
              ? "bg-emerald-500 text-white"
              : "bg-surface-bg border border-surface-border text-surface-text hover:bg-surface-border/50"
          )}
        >
          {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          {isCopied ? "¡Copiado!" : "Copiar link"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-text text-white hover:opacity-80 transition-opacity shrink-0"
          title="Abrir en nueva pestaña"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConfiguracionClient({
  config, rol, sucursalId, sucursalLogoUrl, sucursalCartaBg, sucursalCartaTagline,
  sucursalCartaSaludo, sucursalSlug, sucursalPrinterPath, sucursalPrinterIp,
  sucursalRut, sucursalGiroComercial, sucursalTelefono, sucursalDireccion,
  sucursalZonasDelivery, sucursalSocialFacebook, sucursalSocialInstagram,
  sucursalSocialWhatsapp, sucursalSocialYoutube, sucursalSocialTiktok,
  sucursalSocialTwitter, sucursalFlayerUrl, sucursalFlayerActivo,
  sucursalMpAccessToken, sucursalPuntosActivo, sucursalPuntosPorMil, sucursalValorPunto,
}: Props) {
  const router = useRouter();
  const esAdminSucursal = rol === "RESTAURANTE";

  // Estado config global
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

  // Estado logo sucursal
  const [logoPreview, setLogoPreview] = useState<string | null>(sucursalLogoUrl ?? null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Estado personalización carta
  const [cartaBgPreview, setCartaBgPreview] = useState<string | null>(sucursalCartaBg ?? null);
  const [cartaBgLoading, setCartaBgLoading] = useState(false);
  const [cartaTagline, setCartaTagline] = useState(sucursalCartaTagline ?? "");
  const [cartaSaludo, setCartaSaludo] = useState(sucursalCartaSaludo ?? "");
  const [cartaMsg, setCartaMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [cartaLoading, setCartaLoading] = useState(false);
  const bgRef = useRef<HTMLInputElement>(null);

  // Estado impresora
  const [printerIp, setPrinterIp] = useState(sucursalPrinterIp ?? "");
  const [printerLoading, setPrinterLoading] = useState(false);
  const [printerMsg, setPrinterMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [printerTestLoading, setPrinterTestLoading] = useState(false);

  // Estado datos legales
  const [legalForm, setLegalForm] = useState({
    rut: sucursalRut ?? "",
    giroComercial: sucursalGiroComercial ?? "",
    telefono: sucursalTelefono ?? "",
    direccion: sucursalDireccion ?? "",
  });
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalMsg, setLegalMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Estado redes sociales
  const [socialForm, setSocialForm] = useState({
    facebook:  sucursalSocialFacebook  ?? "",
    instagram: sucursalSocialInstagram ?? "",
    whatsapp:  sucursalSocialWhatsapp  ?? "",
    youtube:   sucursalSocialYoutube   ?? "",
    tiktok:    sucursalSocialTiktok    ?? "",
    twitter:   sucursalSocialTwitter   ?? "",
  });
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMsg, setSocialMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Estado flayer popup
  const [flayerUrl, setFlayerUrl] = useState<string | null>(sucursalFlayerUrl ?? null);
  const [flayerActivo, setFlayerActivo] = useState<boolean>(sucursalFlayerActivo ?? false);
  const [flayerLoading, setFlayerLoading] = useState(false);
  const [flayerMsg, setFlayerMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const flayerRef = useRef<HTMLInputElement>(null);

  // Estado zonas de delivery
  const [zonas, setZonas] = useState<ZonaDelivery[]>(
    Array.isArray(sucursalZonasDelivery) ? sucursalZonasDelivery : []
  );
  const [newZonaNombre, setNewZonaNombre] = useState("");
  const [newZonaPrecio, setNewZonaPrecio] = useState("");
  const [zonasLoading, setZonasLoading] = useState(false);
  const [zonasMsg, setZonasMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [zonaModo, setZonaModo] = useState<"manual" | "mapa">("manual");

  // Estado Mercado Pago
  const [mpToken, setMpToken] = useState(sucursalMpAccessToken ?? "");
  const [mpLoading, setMpLoading] = useState(false);
  const [mpMsg, setMpMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Estado Sistema de Puntos
  const [puntosActivo, setPuntosActivo] = useState<boolean>(sucursalPuntosActivo ?? false);
  const [puntosPorMil, setPuntosPorMil] = useState<string>(String(sucursalPuntosPorMil ?? 10));
  const [valorPunto, setValorPunto] = useState<string>(String(sucursalValorPunto ?? 1));
  const [puntosLoading, setPuntosLoading] = useState(false);
  const [puntosMsg, setPuntosMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Estado PANDI
  const [pandiActivo, setPandiActivo] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pp_pandi_activo");
    if (stored === "false") setPandiActivo(false);
  }, []);

  function handlePandiToggle(activo: boolean) {
    setPandiActivo(activo);
    localStorage.setItem("pp_pandi_activo", String(activo));
    window.dispatchEvent(new Event("pandi-toggle"));
  }

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  function copyToClipboard(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  async function handlePrinterSave() {
    setPrinterLoading(true); setPrinterMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerIp: printerIp.trim() || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error al guardar"); }
      setPrinterMsg({ type: "ok", text: "IP de impresora guardada" });
    } catch (err) { setPrinterMsg({ type: "error", text: (err as Error).message }); }
    finally { setPrinterLoading(false); }
  }

  async function handlePrinterTest() {
    if (!printerIp.trim()) { setPrinterMsg({ type: "error", text: "Ingresa la IP primero" }); return; }
    setPrinterTestLoading(true); setPrinterMsg(null);
    try {
      const res = await fetch("/api/print", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId, content: "** TEST PANDAPOSS **\n" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Sin respuesta");
      setPrinterMsg({ type: "ok", text: "Ticket de prueba enviado OK" });
    } catch (err) { setPrinterMsg({ type: "error", text: (err as Error).message }); }
    finally { setPrinterTestLoading(false); }
  }

  async function handleLegalSave() {
    setLegalLoading(true); setLegalMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rut: legalForm.rut || null, giroComercial: legalForm.giroComercial || null,
          telefono: legalForm.telefono || null, direccion: legalForm.direccion || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error al guardar"); }
      setLegalMsg({ type: "ok", text: "Datos legales guardados" });
    } catch (err) { setLegalMsg({ type: "error", text: (err as Error).message }); }
    finally { setLegalLoading(false); }
  }

  async function handleZonasSave(nuevasZonas: ZonaDelivery[]) {
    setZonasLoading(true); setZonasMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zonasDelivery: nuevasZonas }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error al guardar"); }
      setZonasMsg({ type: "ok", text: "Zonas guardadas" });
    } catch (err) { setZonasMsg({ type: "error", text: (err as Error).message }); }
    finally { setZonasLoading(false); }
  }

  function handleAddZona() {
    const nombre = newZonaNombre.trim();
    const precio = Number(newZonaPrecio);
    if (!nombre || !precio || precio <= 0) return;
    const nuevasZonas = [...zonas, { id: Date.now(), nombre, precio }];
    setZonas(nuevasZonas); setNewZonaNombre(""); setNewZonaPrecio("");
    handleZonasSave(nuevasZonas);
  }

  function handleRemoveZona(id: number) {
    const nuevasZonas = zonas.filter((z) => z.id !== id);
    setZonas(nuevasZonas); handleZonasSave(nuevasZonas);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEmpresa: form.nombreEmpresa, rut: form.rut || null,
          direccion: form.direccion || null, telefono: form.telefono || null,
          email: form.email || null, moneda: form.moneda,
          simbolo: form.simbolo, ivaPorc: Number(form.ivaPorc),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error al guardar"); }
      setMsg({ type: "ok", text: "Configuración guardada correctamente" });
      router.refresh();
    } catch (e) { setMsg({ type: "error", text: (e as Error).message }); }
    finally { setLoading(false); }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true); setLogoMsg(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const upRes = await fetch("/api/upload?tipo=logo", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error ?? "Error al subir imagen");
      const patchRes = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: upData.url }),
      });
      if (!patchRes.ok) { const d = await patchRes.json(); throw new Error(d.error ?? "Error al guardar logo"); }
      setLogoPreview(upData.url);
      setLogoMsg({ type: "ok", text: "Logo actualizado correctamente." });
      router.refresh();
    } catch (err) { setLogoMsg({ type: "error", text: (err as Error).message }); }
    finally { setLogoLoading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function handleLogoRemove() {
    setLogoLoading(true); setLogoMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });
      if (!res.ok) throw new Error("Error al eliminar logo");
      setLogoPreview(null);
      setLogoMsg({ type: "ok", text: "Logo eliminado." });
      router.refresh();
    } catch (err) { setLogoMsg({ type: "error", text: (err as Error).message }); }
    finally { setLogoLoading(false); }
  }

  async function handleCartaBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCartaBgLoading(true); setCartaMsg(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload?tipo=fondo", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? "Error al subir fondo");
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaBg: upData.url }),
      });
      if (!res.ok) throw new Error("Error al guardar fondo");
      setCartaBgPreview(upData.url);
      setCartaMsg({ type: "ok", text: "Fondo actualizado correctamente." });
      router.refresh();
    } catch (err) { setCartaMsg({ type: "error", text: (err as Error).message }); }
    finally { setCartaBgLoading(false); if (bgRef.current) bgRef.current.value = ""; }
  }

  async function handleCartaBgRemove() {
    setCartaBgLoading(true); setCartaMsg(null);
    try {
      await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaBg: null }),
      });
      setCartaBgPreview(null);
      setCartaMsg({ type: "ok", text: "Fondo eliminado." });
      router.refresh();
    } catch { setCartaMsg({ type: "error", text: "Error al eliminar fondo." }); }
    finally { setCartaBgLoading(false); }
  }

  async function handleCartaSaludoSave() {
    setCartaLoading(true); setCartaMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaTagline: cartaTagline.trim() || null, cartaSaludo: cartaSaludo.trim() || null }),
      });
      if (!res.ok) throw new Error("Error al guardar texto");
      setCartaMsg({ type: "ok", text: "Texto de carta guardado." });
      router.refresh();
    } catch (err) { setCartaMsg({ type: "error", text: (err as Error).message }); }
    finally { setCartaLoading(false); }
  }

  async function handleSocialSave() {
    if (!sucursalId) return;
    setSocialLoading(true); setSocialMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialFacebook:  socialForm.facebook.trim()  || null,
          socialInstagram: socialForm.instagram.trim() || null,
          socialWhatsapp:  socialForm.whatsapp.trim()  || null,
          socialYoutube:   socialForm.youtube.trim()   || null,
          socialTiktok:    socialForm.tiktok.trim()    || null,
          socialTwitter:   socialForm.twitter.trim()   || null,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar redes sociales");
      setSocialMsg({ type: "ok", text: "Redes sociales guardadas." });
      router.refresh();
    } catch (err) { setSocialMsg({ type: "error", text: (err as Error).message }); }
    finally { setSocialLoading(false); }
  }

  async function handleFlayerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!sucursalId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setFlayerLoading(true); setFlayerMsg(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error ?? "Error al subir imagen");
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flayerUrl: upData.url }),
      });
      if (!res.ok) throw new Error("Error al guardar flayer");
      setFlayerUrl(upData.url);
      setFlayerMsg({ type: "ok", text: "Flayer actualizado." });
      router.refresh();
    } catch (err) { setFlayerMsg({ type: "error", text: (err as Error).message }); }
    finally { setFlayerLoading(false); if (flayerRef.current) flayerRef.current.value = ""; }
  }

  async function handleFlayerToggle(activo: boolean) {
    if (!sucursalId) return;
    setFlayerLoading(true); setFlayerMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flayerActivo: activo }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado del flayer");
      setFlayerActivo(activo);
      setFlayerMsg({ type: "ok", text: activo ? "Flayer activado." : "Flayer desactivado." });
    } catch (err) { setFlayerMsg({ type: "error", text: (err as Error).message }); }
    finally { setFlayerLoading(false); }
  }

  async function handleFlayerRemove() {
    if (!sucursalId) return;
    setFlayerLoading(true); setFlayerMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flayerUrl: null, flayerActivo: false }),
      });
      if (!res.ok) throw new Error("Error al quitar flayer");
      setFlayerUrl(null); setFlayerActivo(false);
      setFlayerMsg({ type: "ok", text: "Flayer eliminado." });
      router.refresh();
    } catch (err) { setFlayerMsg({ type: "error", text: (err as Error).message }); }
    finally { setFlayerLoading(false); }
  }

  async function handlePuntosSave() {
    if (!sucursalId) return;
    setPuntosLoading(true); setPuntosMsg(null);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}/config-puntos`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puntosActivo,
          puntosPorMil: parseFloat(puntosPorMil) || 0,
          valorPunto: parseFloat(valorPunto) || 0,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar configuración de puntos");
      setPuntosMsg({ type: "ok", text: "Configuración de puntos guardada." });
    } catch (err) { setPuntosMsg({ type: "error", text: (err as Error).message }); }
    finally { setPuntosLoading(false); }
  }

  // ─── Vista RESTAURANTE ────────────────────────────────────────────────────

  if (esAdminSucursal) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const urlDelivery  = baseUrl + `/pedir/${sucursalSlug}`;
    const urlMenuClean = sucursalSlug ? baseUrl + `/vercarta/${sucursalSlug}` : baseUrl + `/vercarta`;

    return (
      <div className="space-y-6 max-w-4xl">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-bold text-surface-text">Configuración</h1>
          <p className="text-sm text-surface-muted mt-0.5">Presencia digital, branding y operaciones de tu sucursal</p>
        </div>

        {/* ── Canales Digitales ── */}
        <Section label="Canales Digitales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WidgetCard
              icon={<Bike size={17} />}
              iconBg="bg-brand-600"
              title="Delivery Online"
              description="Comparte este link para recibir pedidos desde redes sociales"
              badge="Activo"
              badgeVariant="active"
            >
              <UrlBlock url={urlDelivery} copyId="delivery" copiedLink={copiedLink} onCopy={copyToClipboard} />
            </WidgetCard>

            <WidgetCard
              icon={<QrCode size={17} />}
              iconBg="bg-blue-500"
              title="Carta Digital"
              description="Menú de solo lectura para clientes sentados en el local"
              badge="Siempre activo"
              badgeVariant="active"
            >
              <UrlBlock url={urlMenuClean} copyId="menu" copiedLink={copiedLink} onCopy={copyToClipboard} />
            </WidgetCard>
          </div>
        </Section>

        {/* ── Identidad Visual ── */}
        <Section label="Identidad Visual">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Logo */}
            <WidgetCard
              icon={<ImageIcon size={17} />}
              iconBg="bg-violet-500"
              title="Logo de Sucursal"
              description="Se muestra en el menú, tickets y dashboard"
            >
              <Msg msg={logoMsg} />
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-surface-border flex items-center justify-center bg-surface-bg shrink-0 overflow-hidden">
                  {logoPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    : <ImageIcon size={26} className="text-surface-muted/30" />
                  }
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <p className="text-xs text-surface-muted">JPG, PNG, WEBP · Máx 2 MB</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleLogoUpload} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={logoLoading} className="btn-primary text-sm">
                    {logoLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {logoPreview ? "Cambiar logo" : "Subir logo"}
                  </button>
                  {logoPreview && (
                    <button type="button" onClick={handleLogoRemove} disabled={logoLoading} className="btn-secondary text-sm">
                      <X size={13} /> Quitar
                    </button>
                  )}
                </div>
              </div>
            </WidgetCard>

            {/* Personalización de Carta */}
            <WidgetCard
              icon={<ImageIcon size={17} />}
              iconBg="bg-rose-500"
              title="Personalización de Carta"
              description="Fondo, tagline y subtexto de tu carta pública"
            >
              <Msg msg={cartaMsg} />

              {/* Fondo */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-xl border-2 border-dashed border-surface-border flex items-center justify-center bg-surface-bg shrink-0 overflow-hidden">
                  {cartaBgPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={cartaBgPreview} alt="Fondo" className="w-full h-full object-cover" />
                    : <ImageIcon size={18} className="text-surface-muted/30" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-surface-text mb-1.5">Imagen de fondo</p>
                  <div className="flex gap-1.5">
                    <input ref={bgRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCartaBgUpload} />
                    <button type="button" onClick={() => bgRef.current?.click()} disabled={cartaBgLoading} className="btn-secondary text-xs py-1.5 px-3">
                      {cartaBgLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {cartaBgPreview ? "Cambiar" : "Subir"}
                    </button>
                    {cartaBgPreview && (
                      <button type="button" onClick={handleCartaBgRemove} disabled={cartaBgLoading} className="btn-secondary text-xs py-1.5 px-3">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="text-xs font-medium text-surface-text block mb-1.5">Frase principal</label>
                <input
                  type="text" value={cartaTagline}
                  onChange={(e) => setCartaTagline(e.target.value)}
                  maxLength={150} placeholder='ej: Tu Fantasía Mexicana 🌮'
                  className="input text-sm"
                />
                <p className="text-right text-xs text-surface-muted mt-1">{cartaTagline.length}/150</p>
              </div>

              {/* Saludo */}
              <div>
                <label className="text-xs font-medium text-surface-text block mb-1.5">Subtexto / redes</label>
                <textarea
                  value={cartaSaludo} onChange={(e) => setCartaSaludo(e.target.value)}
                  maxLength={300} rows={2}
                  placeholder="ej: Síguenos en @local 🌶️ | Lun–Dom 12:00–22:00"
                  className="w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2.5 text-sm text-surface-text outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none transition-all"
                />
              </div>

              <button type="button" onClick={handleCartaSaludoSave} disabled={cartaLoading} className="btn-primary text-sm w-full">
                {cartaLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Guardar carta
              </button>
            </WidgetCard>
          </div>
        </Section>

        {/* ── Promoción ── */}
        <Section label="Promoción">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Flayer Popup */}
            <WidgetCard
              icon={<ImageIcon size={17} />}
              iconBg="bg-amber-500"
              title="Flayer Popup"
              description="Imagen promocional al abrir tu carta pública"
              badge={flayerUrl ? (flayerActivo ? "Activo" : "Inactivo") : undefined}
              badgeVariant={flayerActivo ? "active" : "inactive"}
            >
              <Msg msg={flayerMsg} />
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-surface-border flex items-center justify-center bg-surface-bg shrink-0 overflow-hidden">
                  {flayerUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={flayerUrl} alt="Flayer" className="w-full h-full object-contain p-1" />
                    : <ImageIcon size={22} className="text-surface-muted/30" />
                  }
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-surface-muted">JPG, PNG, WEBP · Aparece como popup al entrar</p>
                  <input ref={flayerRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFlayerUpload} />
                  <div className="flex gap-1.5 flex-wrap">
                    <button type="button" onClick={() => flayerRef.current?.click()} disabled={flayerLoading} className="btn-primary text-xs py-1.5 px-3">
                      {flayerLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {flayerUrl ? "Cambiar" : "Subir"}
                    </button>
                    {flayerUrl && (
                      <button type="button" onClick={handleFlayerRemove} disabled={flayerLoading} className="btn-secondary text-xs py-1.5 px-3">
                        <X size={12} /> Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {flayerUrl && (
                <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-text">Mostrar popup</p>
                    <p className="text-xs text-surface-muted">{flayerActivo ? "Visible para clientes" : "Oculto"}</p>
                  </div>
                  <Toggle checked={flayerActivo} onChange={handleFlayerToggle} disabled={flayerLoading} />
                </div>
              )}
            </WidgetCard>

            {/* Redes Sociales */}
            <WidgetCard
              icon={<Link2 size={17} />}
              iconBg="bg-pink-500"
              title="Redes Sociales"
              description="Aparecen como botón flotante en tu carta digital"
            >
              <Msg msg={socialMsg} />
              <div className="space-y-2">
                {([
                  { key: "whatsapp",  label: "WhatsApp",   placeholder: "56912345678",             icon: "📱" },
                  { key: "instagram", label: "Instagram",  placeholder: "https://instagram.com/…", icon: "📷" },
                  { key: "facebook",  label: "Facebook",   placeholder: "https://facebook.com/…",  icon: "📘" },
                  { key: "tiktok",    label: "TikTok",     placeholder: "https://tiktok.com/@…",   icon: "🎵" },
                  { key: "youtube",   label: "YouTube",    placeholder: "https://youtube.com/@…",  icon: "▶️" },
                  { key: "twitter",   label: "X / Twitter",placeholder: "https://x.com/…",         icon: "🐦" },
                ] as { key: keyof typeof socialForm; label: string; placeholder: string; icon: string }[]).map(({ key, label, placeholder, icon }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-base w-6 shrink-0 text-center">{icon}</span>
                    <input
                      type="text" value={socialForm[key]}
                      onChange={(e) => setSocialForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 rounded-xl border border-surface-border bg-surface-bg px-3 py-1.5 text-xs text-surface-text outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-mono transition-all"
                    />
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleSocialSave} disabled={socialLoading} className="btn-primary text-sm w-full">
                {socialLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Guardar redes
              </button>
            </WidgetCard>
          </div>
        </Section>

        {/* ── Operaciones ── */}
        <Section label="Operaciones">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Impresora */}
            <WidgetCard
              icon={<Printer size={17} />}
              iconBg="bg-brand-600"
              title="Impresora Térmica"
              description="Conexión TCP directa por red local al puerto 9100"
            >
              <Msg msg={printerMsg} />
              <div>
                <label className="text-xs font-medium text-surface-text block mb-1.5">IP de impresora</label>
                <input
                  className="input font-mono text-sm"
                  value={printerIp}
                  onChange={(e) => setPrinterIp(e.target.value)}
                  placeholder="192.168.1.100 ó 192.168.1.100:9100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handlePrinterSave} disabled={printerLoading} className="btn-primary text-sm">
                  {printerLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Guardar IP
                </button>
                <button type="button" onClick={handlePrinterTest} disabled={printerTestLoading || !printerIp.trim()} className="btn-secondary text-sm">
                  {printerTestLoading ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                  Test ticket
                </button>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-600">
                Compatible: Epson TM-T20/T88 · Star TSP100 · Bixolon SRP-350
              </div>
            </WidgetCard>

            {/* Datos Legales */}
            <WidgetCard
              icon={<Building2 size={17} />}
              iconBg="bg-slate-600"
              title="Datos Legales"
              description="Aparecen en los tickets y boletas de tu sucursal"
            >
              <Msg msg={legalMsg} />
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-surface-text block mb-1">RUT</label>
                    <input className="input text-sm" value={legalForm.rut} onChange={(e) => setLegalForm({ ...legalForm, rut: e.target.value })} placeholder="76.000.000-0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-text block mb-1">Teléfono</label>
                    <input className="input text-sm" value={legalForm.telefono} onChange={(e) => setLegalForm({ ...legalForm, telefono: e.target.value })} placeholder="+56 9…" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-text block mb-1">Giro Comercial</label>
                  <input className="input text-sm" value={legalForm.giroComercial} onChange={(e) => setLegalForm({ ...legalForm, giroComercial: e.target.value })} placeholder="Restaurante y delivery" />
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-text block mb-1">Dirección</label>
                  <input className="input text-sm" value={legalForm.direccion} onChange={(e) => setLegalForm({ ...legalForm, direccion: e.target.value })} placeholder="Calle 123, Ciudad" />
                </div>
              </div>
              <button type="button" onClick={handleLegalSave} disabled={legalLoading} className="btn-primary text-sm w-full">
                {legalLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Guardar datos legales
              </button>
            </WidgetCard>
          </div>
        </Section>

        {/* ── Zonas de Delivery ── */}
        <Section label="Zonas de Cobertura">
          <WidgetCard
            icon={<MapPin size={17} />}
            iconBg="bg-teal-500"
            title="Zonas de Delivery"
            description="Áreas de despacho y costos — el cliente elige al pedir online"
          >
            <Msg msg={zonasMsg} />
            <div className="flex gap-1 p-1 rounded-xl bg-surface-bg border border-surface-border w-fit">
              <button type="button" onClick={() => setZonaModo("manual")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors", zonaModo === "manual" ? "bg-white shadow text-surface-text" : "text-surface-muted hover:text-surface-text")}>
                📝 Por nombre
              </button>
              <button type="button" onClick={() => setZonaModo("mapa")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors", zonaModo === "mapa" ? "bg-white shadow text-surface-text" : "text-surface-muted hover:text-surface-text")}>
                🗺️ Por mapa
              </button>
            </div>

            {zonaModo === "manual" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {zonas.length === 0 && <p className="text-sm text-surface-muted italic">Sin zonas configuradas. Agrega al menos una.</p>}
                  {zonas.map((zona) => (
                    <div key={zona.id} className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-bg px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-text">{zona.nombre}</span>
                        <span className="text-sm text-surface-muted">${zona.precio.toLocaleString("es-CL")}</span>
                        {zona.polygon?.length ? <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">📍</span> : null}
                      </div>
                      <button type="button" onClick={() => handleRemoveZona(zona.id)} disabled={zonasLoading} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1" value={newZonaNombre} onChange={(e) => setNewZonaNombre(e.target.value)} placeholder="Nombre zona (ej: Centro)" onKeyDown={(e) => e.key === "Enter" && handleAddZona()} />
                  <input className="input w-28" type="number" value={newZonaPrecio} onChange={(e) => setNewZonaPrecio(e.target.value)} placeholder="Precio" min={0} onKeyDown={(e) => e.key === "Enter" && handleAddZona()} />
                  <button type="button" onClick={handleAddZona} disabled={zonasLoading || !newZonaNombre.trim() || !newZonaPrecio} className="btn-primary shrink-0">
                    {zonasLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Agregar
                  </button>
                </div>
              </div>
            )}

            {zonaModo === "mapa" && (
              <ZonaMapEditor
                zonas={zonas}
                onChange={(nuevasZonas) => { setZonas(nuevasZonas); handleZonasSave(nuevasZonas); }}
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
                defaultCenter={undefined}
              />
            )}
          </WidgetCard>
        </Section>

        {/* ── Pagos y Fidelización ── */}
        <Section label="Pagos y Fidelización">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Mercado Pago */}
            <WidgetCard
              icon={<CreditCard size={17} />}
              iconBg="bg-blue-500"
              title="Mercado Pago"
              description="Acepta pagos online en tus pedidos delivery"
              badge={mpToken.trim() ? "Conectado" : "Desconectado"}
              badgeVariant={mpToken.trim() ? "active" : "inactive"}
            >
              <Msg msg={mpMsg} />
              <div>
                <label className="text-xs font-medium text-surface-text block mb-1.5">Access Token</label>
                <input
                  type="password" className="input font-mono text-sm"
                  value={mpToken} onChange={(e) => setMpToken(e.target.value)}
                  placeholder="APP_USR-…"
                />
                <p className="text-xs text-surface-muted mt-1.5">
                  Obtén tu token en{" "}
                  <a href="https://www.mercadopago.cl/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    Mercado Pago Developers
                  </a>
                </p>
              </div>
              <button
                type="button" disabled={mpLoading}
                onClick={async () => {
                  setMpLoading(true); setMpMsg(null);
                  try {
                    const res = await fetch(`/api/sucursales/${sucursalId}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ mpAccessToken: mpToken.trim() || null }),
                    });
                    if (!res.ok) throw new Error("Error al guardar");
                    setMpMsg({ type: "ok", text: mpToken.trim() ? "Mercado Pago conectado" : "Mercado Pago desconectado" });
                  } catch (err) { setMpMsg({ type: "error", text: (err as Error).message }); }
                  finally { setMpLoading(false); }
                }}
                className="btn-primary text-sm w-full"
              >
                {mpLoading ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                {mpToken.trim() ? "Guardar Access Token" : "Desconectar"}
              </button>
            </WidgetCard>

            {/* Sistema de Puntos */}
            <WidgetCard
              icon={<Star size={17} />}
              iconBg="bg-amber-500"
              title="Sistema de Puntos"
              description="Fidelización: los clientes acumulan y canjean puntos en caja"
              badge={puntosActivo ? "Activo" : "Inactivo"}
              badgeVariant={puntosActivo ? "active" : "inactive"}
            >
              <Msg msg={puntosMsg} />
              <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-surface-text">Activar puntos</p>
                  <p className="text-xs text-surface-muted">Solo aplica en Caja Básica</p>
                </div>
                <Toggle checked={puntosActivo} onChange={setPuntosActivo} activeColor="bg-amber-500" />
              </div>

              {puntosActivo && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-surface-text block mb-1">Pts por $1.000</label>
                      <input type="number" className="input text-sm" value={puntosPorMil} onChange={(e) => setPuntosPorMil(e.target.value)} min={0} placeholder="10" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-text block mb-1">Valor de 1 punto</label>
                      <input type="number" className="input text-sm" value={valorPunto} onChange={(e) => setValorPunto(e.target.value)} min={0} step={0.01} placeholder="1" />
                    </div>
                  </div>
                  {parseFloat(puntosPorMil) > 0 && parseFloat(valorPunto) > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs space-y-0.5">
                      <p className="font-semibold text-amber-800">📊 Equivalencia actual</p>
                      <p className="text-amber-700">$10.000 → <strong>{Math.floor(10000 * parseFloat(puntosPorMil) / 1000)} pts</strong></p>
                      <p className="text-amber-700">100 pts = <strong>${(100 * parseFloat(valorPunto)).toLocaleString()}</strong> de descuento</p>
                    </div>
                  )}
                </div>
              )}

              <button type="button" onClick={handlePuntosSave} disabled={puntosLoading} className="btn-primary text-sm w-full">
                {puntosLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Guardar puntos
              </button>
            </WidgetCard>
          </div>
        </Section>

        {/* ── Sistema ── */}
        <Section label="Sistema">
          <WidgetCard
            icon={<Bot size={17} />}
            iconBg="bg-purple-600"
            title="Asistente PANDI"
            description="Ayuda inteligente integrada — responde preguntas sin salir del sistema"
            badge={pandiActivo ? "Activo" : "Inactivo"}
            badgeVariant={pandiActivo ? "active" : "inactive"}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-xs text-purple-700 leading-relaxed">
                  Aparece como botón flotante en todas las páginas. Responde dudas sobre ventas, mesas, delivery, reportes y configuración.
                </div>
              </div>
              <Toggle checked={pandiActivo} onChange={handlePandiToggle} activeColor="bg-purple-600" />
            </div>
          </WidgetCard>
        </Section>

      </div>
    );
  }

  // ─── Vista ADMIN_GENERAL ──────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-text">Configuración Global</h1>
        <p className="text-sm text-surface-muted mt-0.5">Datos generales de la empresa y sistema</p>
      </div>

      <Msg msg={msg} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <WidgetCard icon={<Building2 size={17} />} iconBg="bg-brand-600" title="Datos de la Empresa" description="Información general de tu negocio">
          <div className="space-y-3">
            <div>
              <label className="label">Nombre de la Empresa *</label>
              <input className="input" value={form.nombreEmpresa} onChange={(e) => setForm({ ...form, nombreEmpresa: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">RUT Empresa</label>
                <input className="input" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="76.000.000-0" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+56 2 1234 5678" />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contacto@empresa.com" />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input className="input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección completa" />
            </div>
          </div>
        </WidgetCard>

        <WidgetCard icon={<Receipt size={17} />} iconBg="bg-teal-500" title="Facturación e Impuestos" description="Moneda, símbolo y porcentaje de IVA">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">IVA (%)</label>
              <input type="number" className="input" value={form.ivaPorc} onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })} min={0} max={100} step={0.01} />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.moneda} onChange={(e) => {
                const moneda = e.target.value;
                const simbolos: Record<string, string> = { CLP: "$", USD: "US$", EUR: "€", ARS: "$", PEN: "S/", MXN: "$", COP: "$", BRL: "R$" };
                setForm({ ...form, moneda, simbolo: simbolos[moneda] ?? "$" });
              }}>
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
              <input className="input" value={form.simbolo} onChange={(e) => setForm({ ...form, simbolo: e.target.value })} maxLength={5} />
            </div>
          </div>
        </WidgetCard>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Configuración
        </button>
      </form>
    </div>
  );
}
