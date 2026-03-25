"use client";

import { useState, useEffect, useRef } from "react";
import {
  Gift, Cake, Loader2, CheckCircle2, Copy, Check,
  ChevronRight, Search, UserCheck, UserPlus,
} from "lucide-react";

interface Props {
  sucursalId: number;
  sucursalNombre: string;
}

type Step = "form" | "success";
type BusquedaEstado = "idle" | "buscando" | "encontrado" | "nuevo";

export function RegistroClient({ sucursalId, sucursalNombre }: Props) {
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
    fechaNacimiento: "",
    genero: "",
  });

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
            fechaNacimiento: prev.fechaNacimiento || data.cliente.fechaNacimiento,
            genero: prev.genero || data.cliente.genero,
          }));
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
    setForm({
      nombre: "",
      telefono: "",
      direccion: "",
      fechaNacimiento: "",
      genero: "",
    });
  }

  // ══════════════════════════════════════════════
  // PANTALLA DE ÉXITO
  // ══════════════════════════════════════════════
  if (step === "success" && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
          {/* Icono celebración */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <span className="text-5xl">🎂</span>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <h1 className="text-3xl font-black text-gray-800">
              ¡FELICIDADES,<br />
              {result.nombre.split(" ")[0]}!
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {result.esNuevo
                ? `Bienvenido/a a ${sucursalNombre}`
                : `Tus datos en ${sucursalNombre} han sido actualizados`}
            </p>
          </div>

          {/* Cupón */}
          {result.codigoCumple ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-dashed border-amber-300 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-white">
                  <Gift size={20} />
                  <span className="font-bold text-lg">REGALO DE CUMPLEAÑOS</span>
                  <Gift size={20} />
                </div>
                <p className="text-center text-white/90 text-sm mt-1">{sucursalNombre}</p>
              </div>

              <div className="px-6 py-5">
                <div className="text-6xl font-black text-orange-500 leading-none">30%</div>
                <div className="text-xl font-bold text-gray-700">DE DESCUENTO</div>
                <p className="text-gray-400 text-xs mt-1">
                  en tu próxima visita el día de tu cumpleaños
                </p>
                <p className="text-gray-400 text-xs mt-0.5 font-medium">Tope máximo $15.000</p>
              </div>

              <div className="px-6 pb-5">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">
                  Tu código personal
                </p>
                <button
                  onClick={copiarCodigo}
                  className="w-full bg-gray-900 text-white rounded-xl py-3 px-4 flex items-center justify-between group transition-colors hover:bg-gray-800"
                >
                  <span className="font-mono text-xl font-bold tracking-widest">
                    {result.codigoCumple}
                  </span>
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    {copied ? (
                      <Check size={18} className="text-green-400" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </span>
                </button>
                <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <CheckCircle2 size={11} className="text-green-500" />
                  Código de uso único · válido solo el día de tu cumpleaños
                </p>
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  🎁 Presenta este cupón al momento de pagar
                </p>
              </div>
            </div>
          ) : null}

          {/* Enviar cupón por correo */}
          {result.codigoCumple && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {emailEnviado ? (
                <div className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">¡Cupón enviado!</p>
                    <p className="text-xs text-gray-500">
                      Revisa tu bandeja en <strong>{emailCupon}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      📧 ¿Quieres que te enviemos el cupón a tu correo?
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Así lo tendrás guardado para el día de tu cumpleaños
                    </p>
                  </div>
                  {errorEmail && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                      {errorEmail}
                    </p>
                  )}
                  <form onSubmit={handleEnviarEmail} className="space-y-2">
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={emailCupon}
                        onChange={(e) => setEmailCupon(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
                      />
                      {/* Icono que indica que es editable */}
                      {emailCupon && (
                        <button
                          type="button"
                          onClick={() => setEmailCupon("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors text-xs"
                          title="Borrar y escribir otro"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={enviandoEmail || !emailCupon}
                      className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {enviandoEmail ? (
                        <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                      ) : (
                        "Enviarme el cupón 🎁"
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {!result.codigoCumple && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                ¡Datos registrados! Agrega tu fecha de cumpleaños para recibir tu cupón de regalo.
              </p>
            </div>
          )}

          <button onClick={resetForm} className="text-sm text-gray-400 underline">
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
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <Cake size={13} />
                Fecha de Cumpleaños ✨
              </label>
              <input
                type="date"
                className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                value={form.fechaNacimiento}
                onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                max={new Date().toISOString().slice(0, 10)}
              />
              {!form.fechaNacimiento ? (
                <p className="text-xs text-amber-600">
                  🎁 Necesitamos tu cumpleaños para activar tu cupón de regalo
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
