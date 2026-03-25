"use client";

import { useState } from "react";
import { Gift, Cake, Loader2, CheckCircle2, Copy, Check, ChevronRight } from "lucide-react";

interface Props {
  sucursalId: number;
  sucursalNombre: string;
}

type Step = "form" | "success";

export function RegistroClient({ sucursalId, sucursalNombre }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ nombre: string; codigoCumple: string | null; esNuevo: boolean } | null>(null);
  const [emailCupon, setEmailCupon] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "",
    genero: "",
  });

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

  async function handleEnviarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!result?.codigoCumple || !emailCupon) return;
    setEnviandoEmail(true);
    setErrorEmail("");
    try {
      const res = await fetch("/api/public/registro/enviar-cupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailCupon, codigoCumple: result.codigoCumple, sucursalId }),
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
              ¡FELICIDADES,<br />{result.nombre.split(" ")[0]}!
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
              {/* Header cupón */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-white">
                  <Gift size={20} />
                  <span className="font-bold text-lg">REGALO DE CUMPLEAÑOS</span>
                  <Gift size={20} />
                </div>
                <p className="text-center text-white/90 text-sm mt-1">
                  {sucursalNombre}
                </p>
              </div>

              {/* Descuento */}
              <div className="px-6 py-5">
                <div className="text-6xl font-black text-orange-500 leading-none">30%</div>
                <div className="text-xl font-bold text-gray-700">DE DESCUENTO</div>
                <p className="text-gray-400 text-xs mt-1">en tu próxima visita el día de tu cumpleaños</p>
                <p className="text-gray-400 text-xs mt-0.5 font-medium">Tope máximo $15.000</p>
              </div>

              {/* Código */}
              <div className="px-6 pb-5">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">Tu código personal</p>
                <button
                  onClick={copiarCodigo}
                  className="w-full bg-gray-900 text-white rounded-xl py-3 px-4 flex items-center justify-between group transition-colors hover:bg-gray-800"
                >
                  <span className="font-mono text-xl font-bold tracking-widest">{result.codigoCumple}</span>
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  </span>
                </button>
                <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <CheckCircle2 size={11} className="text-green-500" />
                  Código de uso único · válido solo el día de tu cumpleaños
                </p>
              </div>

              {/* Footer */}
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
                    <p className="text-xs text-gray-500">Revisa tu bandeja de entrada en <strong>{emailCupon}</strong></p>
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
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorEmail}</p>
                  )}
                  <form onSubmit={handleEnviarEmail} className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={emailCupon}
                      onChange={(e) => setEmailCupon(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                      type="submit"
                      disabled={enviandoEmail}
                      className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-60 shrink-0"
                    >
                      {enviandoEmail ? <Loader2 size={16} className="animate-spin" /> : "Enviar"}
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

          {/* Volver */}
          <button
            onClick={() => { setStep("form"); setResult(null); setForm({ nombre: "", email: "", telefono: "", direccion: "", fechaNacimiento: "", genero: "" }); }}
            className="text-sm text-gray-400 underline"
          >
            Registrar otro cliente
          </button>
        </div>
      </div>
    );
  }

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
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase">{sucursalNombre}</p>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

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

            {/* Cumpleaños — destacado */}
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
              {!form.fechaNacimiento && (
                <p className="text-xs text-amber-600">
                  🎁 Necesitamos tu cumpleaños para activar tu cupón de regalo
                </p>
              )}
              {form.fechaNacimiento && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} /> ¡Perfecto! Tu cupón estará listo al enviar
                </p>
              )}
            </div>

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
          Tu información es privada y solo será usada para enviarte beneficios exclusivos de {sucursalNombre}.
        </p>
      </div>
    </div>
  );
}
