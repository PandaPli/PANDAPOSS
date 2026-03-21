"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Loader2, Mail, X, Phone, Send } from "lucide-react";

// CSS de animación del panda — inyectado una sola vez
const PANDA_STYLES = `
  @keyframes pandaFloat {
    0%   { transform: translateY(0px) rotate(-2deg); }
    50%  { transform: translateY(-12px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(-2deg); }
  }
  .panda-float { animation: pandaFloat 3s ease-in-out infinite; }
  .panda-look-away { filter: hue-rotate(0deg); transform: scale(0.95) rotate(-5deg) !important; transition: all 0.3s ease; }
  @keyframes pandaFloat { 0%,100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
`;

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Contacto drawer
  const [showContacto, setShowContacto] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [prefijo, setPrefijo] = useState("+56");
  const [contactoEnviado, setContactoEnviado] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showContacto && phoneRef.current) {
      setTimeout(() => phoneRef.current?.focus(), 300);
    }
  }, [showContacto]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      usuario: usuario.toUpperCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Usuario o contrasena incorrectos.");
    } else {
      router.push("/panel");
    }
  }

  function handleContactoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;

    // Construir link de WhatsApp al negocio
    const numero = `${prefijo}${telefono}`.replace(/\s+/g, "").replace(/^\+/, "");
    const msg = encodeURIComponent(`Hola! Me interesa saber más sobre PandaPoss. Mi número es ${prefijo} ${telefono}`);
    window.open(`https://wa.me/56999011141?text=${msg}`, "_blank");

    setContactoEnviado(true);
    setTimeout(() => {
      setContactoEnviado(false);
      setShowContacto(false);
      setTelefono("");
    }, 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 relative overflow-hidden">
      {/* Estilos de animación del panda */}
      <style dangerouslySetInnerHTML={{ __html: PANDA_STYLES }} />

      {/* Burbujas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-brand-300/5 rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Panda flotante animado */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block mb-3">
            <img
              src={passwordFocused ? "/panda-close.png" : "/panda-open.png"}
              alt="PandaPoss"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
              className={`w-28 h-28 mx-auto drop-shadow-2xl panda-float transition-all duration-300 ${passwordFocused ? "panda-look-away" : ""}`}
              style={{ display: "block" }}
            />
            {/* Destello de ojos al enfocar contraseña */}
            {passwordFocused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full rounded-full bg-brand-400/10 animate-ping" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Panda<span className="text-brand-300">Poss</span>
          </h1>
          <p className="text-brand-300/70 text-sm mt-2">Sistema Punto de Venta para Restaurantes</p>
        </div>

        {/* Card login */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 shadow-2xl animate-fade-in">
          <h2 className="text-lg font-bold text-white mb-1">Iniciar Sesion</h2>
          <p className="text-brand-200/60 text-sm mb-6">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <span className="text-red-400">&#9888;</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-100 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value.toUpperCase())}
                placeholder="Ingrese su usuario"
                autoComplete="off"
                required
                className="w-full px-4 py-3 bg-white/[0.08] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-100 mb-2">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Ingrese su contrasena"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-white/[0.08] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25 hover:shadow-brand-400/30 text-sm"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? "Verificando..." : "Ingresar al Sistema"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-brand-300/40 text-xs">
            PandaPoss &copy; {new Date().getFullYear()}
          </p>
          <p className="text-brand-300/25 text-[10px]">
            Zap Zapp Food SpA
          </p>
        </div>
      </div>

      {/* ─── Botón flotante CONTACTO ─── */}
      <button
        onClick={() => setShowContacto(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-full shadow-lg shadow-brand-500/30 hover:shadow-brand-400/40 transition-all hover:scale-105 text-sm z-40"
      >
        <Mail size={16} />
        CONTACTO
      </button>

      {/* ─── Overlay ─── */}
      {showContacto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setShowContacto(false)}
        />
      )}

      {/* ─── Drawer lateral CONTACTO ─── */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          showContacto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <Mail size={18} className="text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Hablemos</h2>
            </div>
            <button
              onClick={() => setShowContacto(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 p-6">
            {contactoEnviado ? (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Send size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Mensaje enviado!</h3>
                <p className="text-gray-500 text-sm">Te contactaremos pronto por WhatsApp</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-brand-600 mb-2">
                    Necesitas ayuda?
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Dejanos tu WhatsApp y te escribimos en breve.
                  </p>
                </div>

                <form onSubmit={handleContactoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono WhatsApp
                    </label>
                    <div className="flex gap-2">
                      {/* Prefijo pais */}
                      <div className="relative">
                        <div className="flex items-center gap-1.5 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 min-w-[80px]">
                          <Phone size={14} className="text-emerald-500" />
                          <select
                            value={prefijo}
                            onChange={(e) => setPrefijo(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer appearance-none pr-2"
                          >
                            <option value="+56">+56</option>
                            <option value="+52">+52</option>
                            <option value="+54">+54</option>
                            <option value="+57">+57</option>
                            <option value="+51">+51</option>
                            <option value="+1">+1</option>
                            <option value="+34">+34</option>
                          </select>
                        </div>
                      </div>

                      {/* Numero */}
                      <input
                        ref={phoneRef}
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s]/g, ""))}
                        placeholder="9 1234 5678"
                        required
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-400/30 text-sm"
                  >
                    <Send size={16} />
                    Enviar contacto
                  </button>
                </form>

                {/* Info adicional */}
                <div className="mt-8 p-4 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-brand-700 text-xs font-medium mb-1">Horario de atencion</p>
                  <p className="text-brand-500 text-xs">Lunes a Viernes, 9:00 - 18:00 hrs</p>
                </div>
              </>
            )}
          </div>

          {/* Footer drawer */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PandaPoss" className="w-8 h-8" />
              <div>
                <p className="text-xs font-bold text-gray-700">PandaPoss</p>
                <p className="text-[10px] text-gray-400">Zap Zapp Food SpA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
