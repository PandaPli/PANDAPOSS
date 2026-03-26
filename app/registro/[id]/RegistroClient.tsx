"use client";

import { useState, useEffect, useRef } from "react";
import {
  Gift, Cake, Loader2, CheckCircle2, Copy, Check,
  ChevronRight, Search, UserCheck, UserPlus,
} from "lucide-react";

interface Props {
  sucursalId: number;
  sucursalNombre: string;
  sucursalLogo?: string | null;
}

type Step = "form" | "success";
type BusquedaEstado = "idle" | "buscando" | "encontrado" | "nuevo";

export function RegistroClient({ sucursalId, sucursalNombre, sucursalLogo }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    nombre: string;
    codigoCumple: string | null;
    esNuevo: boolean;
  } | null>(null);

  // Estado del email para envío del cupón
  const [emailCupon, setEmailCupon] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "", // ISO YYYY-MM-DD (lo que va a la API)
    genero: "",
  });

  // Texto visible de la fecha (DD/MM/AAAA) — separado del valor ISO
  const [fechaTexto, setFechaTexto] = useState("");
  const [fechaError, setFechaError] = useState("");

  // Convierte DD/MM/AAAA → YYYY-MM-DD; retorna "" si inválida
  function parseDisplayDate(texto: string): string {
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return "";
    const [, d, m, y] = match;
    const dia = Number(d), mes = Number(m), anio = Number(y);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return "";
    if (anio < 1900 || anio > new Date().getFullYear()) return "";
    return `${y}-${m}-${d}`;
  }

  function handleFechaChange(raw: string) {
    // Solo dígitos y slashes
    let v = raw.replace(/[^\d/]/g, "");

    // Auto-insertar slash después de DD y MM
    if (/^\d{2}$/.test(v) && fechaTexto.length === 1) v = v + "/";
    else if (/^\d{2}\/\d{2}$/.test(v) && fechaTexto.length === 4) v = v + "/";

    // Limitar a 10 caracteres DD/MM/AAAA
    if (v.length > 10) return;

    setFechaTexto(v);
    setFechaError("");

    if (v.length === 10) {
      const iso = parseDisplayDate(v);
      if (iso) {
        setForm((prev) => ({ ...prev, fechaNacimiento: iso }));
      } else {
        setFechaError("Fecha inválida — usa el formato DD/MM/AAAA");
        setForm((prev) => ({ ...prev, fechaNacimiento: "" }));
      }
    } else {
      setForm((prev) => ({ ...prev, fechaNacimiento: "" }));
    }
  }

  // Estado de la búsqueda automática por teléfono
  const [busquedaEstado, setBusquedaEstado] = useState<BusquedaEstado>("idle");
  const busquedaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telefonoAnterior = useRef("");

  // ──────────────────────────────────────────────
  // Búsqueda automática mientras escribe el teléfono
  // ──────────────────────────────────────────────
  useEffect(() => {
    const tel = form.telefono.replace(/\D/g, "");

    // Necesitamos al menos 8 dígitos para buscar
    if (tel.length < 8) {
      if (busquedaEstado !== "idle") setBusquedaEstado("idle");
      return;
    }

    // Si el teléfono no cambió, no volver a buscar
    if (tel === telefonoAnterior.current) return;

    // Debounce: esperar 600ms después de que deje de escribir
    if (busquedaTimer.current) clearTimeout(busquedaTimer.current);
    setBusquedaEstado("buscando");

    busquedaTimer.current = setTimeout(async () => {
      telefonoAnterior.current = tel;
      try {
        const res = await fetch(
          `/api/public/registro/buscar?telefono=${encodeURIComponent(form.telefono)}&sucursalId=${sucursalId}`
        );
        const data = await res.json();

        if (data.encontrado) {
          setBusquedaEstado("encontrado");
          // Prellenar solo campos vacíos (no pisar lo que el usuario ya escribió)
          setForm((prev) => ({
            ...prev,
            nombre: prev.nombre || data.cliente.nombre,
            direccion: prev.direccion || data.cliente.direccion,
            fechaNacimiento: prev.fechaNacimiento || data.cliente.fechaNacimiento || "",
            genero: prev.genero || data.cliente.genero,
          }));
          // Convertir fecha ISO a DD/MM/AAAA para mostrar en el campo texto
          if (!fechaTexto && data.cliente.fechaNacimiento) {
            const [y, m, d] = data.cliente.fechaNacimiento.slice(0, 10).split("-");
            if (y && m && d) setFechaTexto(`${d}/${m}/${y}`);
          }
          // Prellenar email en el campo post-éxito si ya lo tenía guardado
          if (data.cliente.email) setEmailCupon(data.cliente.email);
        } else {
          setBusquedaEstado("nuevo");
        }
      } catch {
        setBusquedaEstado("nuevo");
      }
    }, 600);

    return () => {
      if (busquedaTimer.current) clearTimeout(busquedaTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.telefono]);

  // ──────────────────────────────────────────────
  // Submit del formulario
  // ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sucursalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar");
      setResult(data);
      setStep("success");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────
  // Enviar cupón por correo
  // ──────────────────────────────────────────────
  async function handleEnviarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!result?.codigoCumple || !emailCupon) return;
    setEnviandoEmail(true);
    setErrorEmail("");
    try {
      const res = await fetch("/api/public/registro/enviar-cupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailCupon,
          codigoCumple: result.codigoCumple,
          sucursalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      setEmailEnviado(true);
    } catch (err) {
      setErrorEmail((err as Error).message);
    } finally {
      setEnviandoEmail(false);
    }
  }

  function copiarCodigo() {
    if (!result?.codigoCumple) return;
    navigator.clipboard.writeText(result.codigoCumple).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resetForm() {
    setStep("form");
    setResult(null);
    setBusquedaEstado("idle");
    telefonoAnterior.current = "";
    setEmailCupon("");
    setEmailEnviado(false);
    setFechaTexto("");
    setFechaError("");
    setForm({
      nombre: "",
      telefono: "",
      direccion: "",
      fechaNacimiento: "",
      genero: "",
    });
  }

  // ══════════════════════════════════════════════
  // PANTALLA DE ÉXITO — festiva y celebrativa
  // ══════════════════════════════════════════════
  if (step === "success" && result) {
    const nombre = result.nombre.split(" ")[0];
    return (
      <div className="min-h-screen relative overflow-hidden flex items-start justify-center p-4 pt-6"
        style={{ background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 30%, #ff6b9d 60%, #c44dff 100%)" }}>

        {/* ── Confetti decorativo (CSS puro) ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {["🎊","🎉","⭐","🌟","✨","🎈","🎁","💛","🧡","💜","🩷","🎀"].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-2xl select-none"
              style={{
                left: `${[8,18,28,38,48,58,68,78,88,12,35,62][i]}%`,
                top: `${[5,12,3,8,15,6,10,4,7,18,2,14][i]}%`,
                animation: `float-${(i % 3) + 1} ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.85,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <style>{`
          @keyframes float-1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(8deg)} }
          @keyframes float-2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-10deg)} }
          @keyframes float-3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(5deg)} }
          @keyframes pop-in  { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
          @keyframes slide-up{ 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
          @keyframes pulse-ring{ 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
          .pop-in  { animation: pop-in  0.6s cubic-bezier(.34,1.56,.64,1) both }
          .slide-up{ animation: slide-up 0.5s ease both }
        `}</style>

        <div className="relative w-full max-w-sm space-y-4 z-10">

          {/* ── HERO ── */}
          <div className="text-center pt-4 pop-in">

            {/* Logo del restaurante con anillo de pulso */}
            <div className="relative flex justify-center mb-5">
              <span className="absolute w-36 h-36 rounded-full bg-white/25"
                style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
              <span className="absolute w-36 h-36 rounded-full bg-white/15"
                style={{ animation: "pulse-ring 1.8s ease-out infinite", animationDelay: "0.5s" }} />
              <div className="relative w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-2xl overflow-hidden">
                {sucursalLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sucursalLogo}
                    alt={sucursalNombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}>🎂</span>
                )}
              </div>
            </div>

            {/* Nombre del restaurante grande */}
            <div className="mb-1">
              <p className="text-white/70 text-sm font-bold uppercase tracking-[0.2em] mb-1">
                🎊 &nbsp; tu regalo de &nbsp; 🎊
              </p>
              <h2 className="font-black leading-none"
                style={{
                  fontSize: "clamp(2.2rem, 11vw, 3.5rem)",
                  textShadow: "0 3px 16px rgba(0,0,0,0.25)",
                  background: "linear-gradient(180deg, #ffffff 0%, #ffe58a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.01em",
                }}>
                {sucursalNombre.toUpperCase()}
              </h2>
            </div>

            {/* Separador brillante */}
            <div className="flex items-center justify-center gap-2 my-3">
              <div className="h-px flex-1 bg-white/30" />
              <span className="text-white/60 text-lg">✦</span>
              <div className="h-px flex-1 bg-white/30" />
            </div>

            {/* Felicidades + mensaje */}
            <h1 className="font-black text-white leading-tight"
              style={{
                fontSize: "clamp(1.8rem, 9vw, 2.8rem)",
                textShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}>
              ¡Felicidades,<br />
              <span className="text-yellow-200">{nombre}!</span>
            </h1>
            <p className="text-white/85 mt-2 text-base font-semibold leading-snug px-2"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
              <span className="text-yellow-200 font-black">{sucursalNombre}</span> te regala{" "}
              <span className="text-yellow-200 font-black">30% de descuento</span>
              <br />para el día de tu cumpleaños 🎂
            </p>
          </div>

          {/* ── CUPÓN ── */}
          {result.codigoCumple && (
            <div className="slide-up rounded-3xl overflow-hidden shadow-2xl"
              style={{ animationDelay: "0.15s", border: "3px solid rgba(255,255,255,0.6)" }}>

              {/* Header del cupón */}
              <div className="bg-white/15 backdrop-blur-sm px-6 py-4 text-center border-b border-white/20">
                <div className="flex items-center justify-center gap-2 text-white font-black text-lg tracking-wide">
                  <span>🎁</span> REGALO DE CUMPLEAÑOS <span>🎁</span>
                </div>
                <p className="text-white/70 text-xs mt-0.5 font-semibold uppercase tracking-widest">
                  {sucursalNombre}
                </p>
              </div>

              {/* Cuerpo blanco */}
              <div className="bg-white px-6 py-5 text-center">
                {/* Descuento grande */}
                <div className="mb-3">
                  <div className="text-8xl font-black leading-none"
                    style={{ background: "linear-gradient(135deg,#ff6b6b,#ff8e53,#c44dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    30%
                  </div>
                  <div className="text-2xl font-black text-gray-800 -mt-1">DE DESCUENTO</div>
                  <p className="text-gray-400 text-xs mt-1">en tu visita el día de tu cumpleaños</p>
                  <div className="inline-block mt-1 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                    Tope máximo $15.000
                  </div>
                </div>

                {/* Separador punteado */}
                <div className="border-t-2 border-dashed border-gray-200 my-4" />

                {/* Código */}
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                  Tu código personal
                </p>
                <button
                  onClick={copiarCodigo}
                  className="w-full rounded-2xl py-3.5 px-5 flex items-center justify-between group transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}
                >
                  <span className="font-mono text-2xl font-black tracking-widest text-white">
                    {result.codigoCumple}
                  </span>
                  <span className="ml-3 shrink-0">
                    {copied
                      ? <span className="text-green-400 text-xs font-bold">¡Copiado!</span>
                      : <Copy size={18} className="text-white/50 group-hover:text-white transition-colors" />
                    }
                  </span>
                </button>

                <p className="text-xs text-gray-400 mt-2.5 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={12} className="text-green-400" />
                  Código único · válido solo el día de tu cumpleaños
                </p>
              </div>

              {/* Footer del cupón */}
              <div className="px-6 py-3 text-center"
                style={{ background: "linear-gradient(135deg,#ff6b6b,#ff8e53)" }}>
                <p className="text-white text-xs font-bold">
                  🎊 Preséntalo al momento de pagar · ¡Te esperamos!
                </p>
              </div>
            </div>
          )}

          {/* ── ENVIAR POR EMAIL ── */}
          {result.codigoCumple && (
            <div className="slide-up rounded-3xl overflow-hidden shadow-xl bg-white"
              style={{ animationDelay: "0.3s" }}>
              {emailEnviado ? (
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                    ✓
                  </div>
                  <div>
                    <p className="font-black text-gray-800">¡Cupón enviado! 🎉</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Revisa <strong>{emailCupon}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <p className="font-black text-gray-800">
                    📧 ¿Te lo enviamos al correo?
                  </p>
                  <p className="text-xs text-gray-400 -mt-1">
                    Así lo tendrás guardado para tu cumpleaños
                  </p>
                  {errorEmail && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{errorEmail}</p>
                  )}
                  <form onSubmit={handleEnviarEmail} className="space-y-2">
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={emailCupon}
                        onChange={(e) => setEmailCupon(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full border-2 border-gray-100 focus:border-orange-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition pr-10"
                      />
                      {emailCupon && (
                        <button type="button" onClick={() => setEmailCupon("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm transition-colors">
                          ✕
                        </button>
                      )}
                    </div>
                    <button type="submit" disabled={enviandoEmail || !emailCupon}
                      className="w-full text-white font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg,#ff6b6b,#ff8e53,#c44dff)" }}>
                      {enviandoEmail
                        ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                        : "Enviarme el cupón 🎁"
                      }
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {!result.codigoCumple && (
            <div className="slide-up bg-white rounded-3xl shadow-xl p-6 text-center" style={{ animationDelay: "0.2s" }}>
              <CheckCircle2 size={44} className="text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 text-sm font-medium">
                ¡Datos registrados! Agrega tu fecha de cumpleaños para activar tu cupón.
              </p>
            </div>
          )}

          <button onClick={resetForm}
            className="w-full text-center text-white/60 text-xs py-2 hover:text-white/90 transition-colors">
            Registrar otro cliente
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // FORMULARIO DE REGISTRO
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <Gift size={36} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase">
              {sucursalNombre}
            </p>
            <h1 className="text-2xl font-black text-gray-800 mt-1 leading-tight">
              Actualiza tus datos<br />y te regalamos un
            </h1>
            <div className="text-5xl font-black text-orange-500 leading-none my-2">30% DCT</div>
            <p className="text-gray-500 text-sm flex items-center justify-center gap-1.5">
              <Cake size={15} className="text-amber-500" />
              Válido el día de tu cumpleaños
            </p>
            <p className="text-gray-400 text-xs mt-0.5">Tope máximo $15.000</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── TELÉFONO (campo principal, va primero) ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Celular *
              </label>
              <div className="relative">
                {/* Prefijo +569 fijo */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none pointer-events-none">
                  +569
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9 \-]*"
                  required
                  value={form.telefono}
                  onChange={(e) => {
                    // Quitamos el prefijo si el usuario lo escribe
                    const raw = e.target.value
                      .replace(/^\+?56\s*9?\s*/, "")
                      .replace(/[^\d\s\-]/g, "");
                    setForm({ ...form, telefono: raw });
                  }}
                  placeholder="XXXXXXXX"
                  maxLength={12}
                  className="w-full border border-gray-200 rounded-xl pl-14 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
                {/* Icono de estado de búsqueda */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {busquedaEstado === "buscando" && (
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                  )}
                  {busquedaEstado === "encontrado" && (
                    <UserCheck size={16} className="text-green-500" />
                  )}
                  {busquedaEstado === "nuevo" && (
                    <UserPlus size={16} className="text-blue-400" />
                  )}
                  {busquedaEstado === "idle" && (
                    <Search size={16} className="text-gray-300" />
                  )}
                </span>
              </div>

              {/* Mensaje de estado */}
              {busquedaEstado === "encontrado" && (
                <p className="text-xs text-green-600 font-medium mt-1.5 flex items-center gap-1">
                  <UserCheck size={11} />
                  ¡Te encontramos! Revisa y actualiza tus datos
                </p>
              )}
              {busquedaEstado === "nuevo" && (
                <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1">
                  <UserPlus size={11} />
                  Número nuevo — completa tus datos para registrarte
                </p>
              )}
            </div>

            {/* ── NOMBRE ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Nombre completo *
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                placeholder="Ej: María González"
              />
            </div>

            {/* ── GÉNERO ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Soy...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "F", label: "Mujer", emoji: "👩" },
                  { value: "M", label: "Hombre", emoji: "👨" },
                  { value: "O", label: "Otro", emoji: "🧑" },
                ].map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, genero: form.genero === value ? "" : value })}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.genero === value
                        ? value === "F"
                          ? "border-pink-400 bg-pink-50 text-pink-700"
                          : value === "M"
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-purple-400 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── DIRECCIÓN ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Dirección
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Calle y número"
              />
            </div>

            {/* ── CUMPLEAÑOS — destacado ── */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <Cake size={13} />
                Fecha de Cumpleaños ✨
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={fechaTexto}
                onChange={(e) => handleFechaChange(e.target.value)}
                placeholder="30/09/1987"
                maxLength={10}
                className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition font-mono tracking-widest text-gray-700"
              />
              {fechaError ? (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  ⚠️ {fechaError}
                </p>
              ) : !form.fechaNacimiento ? (
                <p className="text-xs text-amber-600">
                  🎁 Escribe tu cumpleaños — día/mes/año (ej: 30/09/1987)
                </p>
              ) : (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} /> ¡Perfecto! Tu cupón estará listo al enviar
                </p>
              )}
            </div>

            {/* ── SUBMIT ── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-200 transition-all disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Obtener mi regalo <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 px-4">
          Tu información es privada y solo será usada para enviarte beneficios exclusivos de{" "}
          {sucursalNombre}.
        </p>
      </div>
    </div>
  );
}
