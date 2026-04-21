"use client";

import Link from "next/link";
import {
  ArrowRight, QrCode, MessageCircle, CheckCircle2,
  Zap, Store, CookingPot, Truck, PackageSearch,
  BarChart3, TrendingUp, Users, ShieldCheck, Star,
  Smartphone, ScanLine,
} from "lucide-react";

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#07070f]/80 backdrop-blur-md border-b border-white/5 transition-all">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <Link href="/home" className="flex items-center gap-3 font-black text-2xl text-white tracking-tight group">
          <img src="/logo.png" alt="PandaPOS" className="w-10 h-10 object-contain drop-shadow group-hover:scale-105 transition-transform" />
          PandaPOS
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#como-funciona" className="text-sm font-semibold text-white/50 hover:text-white transition-colors">Cómo funciona</Link>
          <Link href="#planes" className="text-sm font-semibold text-white/50 hover:text-white transition-colors">Planes</Link>
          <Link href="/login" className="px-5 py-2.5 text-white/70 text-sm font-bold rounded-xl border border-white/10 hover:border-white/20 hover:text-white transition-all">
            Iniciar Sesión
          </Link>
          <Link
            href="https://wa.me/56999011141?text=Hola%2C%20quiero%20ver%20c%C3%B3mo%20funciona%20PandaPOS"
            target="_blank"
            className="px-5 py-2.5 bg-[#25D366] text-white text-sm font-bold rounded-xl shadow-lg shadow-green-500/20 hover:bg-[#22be5b] transition-all flex items-center gap-2"
          >
            <MessageCircle size={15} /> Hablar por WhatsApp
          </Link>
        </div>
        {/* Mobile CTA */}
        <Link
          href="https://wa.me/56999011141?text=Hola%2C%20quiero%20ver%20PandaPOS"
          target="_blank"
          className="md:hidden px-4 py-2 bg-[#25D366] text-white text-sm font-bold rounded-xl flex items-center gap-2"
        >
          <MessageCircle size={14} /> WhatsApp
        </Link>
      </div>
    </div>
  </nav>
);

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
const Hero = () => (
  <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#07070f]">
    {/* Glow background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-violet-900/20 rounded-full blur-[80px]" />
    </div>
    {/* Subtle grid */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }}
    />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-semibold mb-8">
          <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
          Pedidos directos por WhatsApp · Sin comisiones
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
          Recibe pedidos{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            directos por WhatsApp
          </span>{" "}
          desde tu carta QR
        </h1>

        <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
          Tus clientes escanean el QR, piden y recibes todo directo por WhatsApp.{" "}
          <span className="text-white/80 font-semibold">Sin pagar comisiones a apps de delivery.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="#como-funciona"
            className="group px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-violet-600/30 hover:shadow-violet-500/40 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Ver cómo funciona
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all w-full sm:w-auto justify-center flex items-center"
          >
            Probar demo
          </Link>
        </div>

        {/* Visual flow */}
        <div className="flex items-center justify-center gap-3 md:gap-6 flex-wrap">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm text-center">
            <QrCode size={52} className="text-violet-300 mx-auto mb-2" />
            <p className="text-white/40 text-xs font-semibold">Tu carta QR</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-10 md:w-20 h-[2px] bg-gradient-to-r from-violet-500 to-[#25D366] relative">
              <div className="absolute -right-1 -top-[5px] w-3 h-3 border-t-2 border-r-2 border-[#25D366] rotate-45" />
            </div>
            <span className="text-white/20 text-xs font-semibold">escanean</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm text-center">
            <Smartphone size={52} className="text-white/60 mx-auto mb-2" />
            <p className="text-white/40 text-xs font-semibold">Tu carta digital</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-10 md:w-20 h-[2px] bg-gradient-to-r from-white/20 to-[#25D366] relative">
              <div className="absolute -right-1 -top-[5px] w-3 h-3 border-t-2 border-r-2 border-[#25D366] rotate-45" />
            </div>
            <span className="text-white/20 text-xs font-semibold">piden</span>
          </div>

          <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5 backdrop-blur-sm text-center">
            <MessageCircle size={52} className="text-[#25D366] mx-auto mb-2" />
            <p className="text-[#25D366]/60 text-xs font-semibold">Te llega a WhatsApp</p>
          </div>
        </div>

        <p className="mt-10 text-sm text-white/30 font-semibold flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#25D366]" /> Sin comisiones
          </span>
          <span className="text-white/10">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#25D366]" /> Clientes directos
          </span>
          <span className="text-white/10">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#25D366]" /> Activo el mismo día
          </span>
        </p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// CÓMO FUNCIONA
// ─────────────────────────────────────────────
const SectionHowItWorks = () => (
  <section id="como-funciona" className="py-24 bg-[#07070f] relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]" />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <p className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-3">Así de simple</p>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          3 pasos. Sin complicaciones.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            step: "01",
            icon: <ScanLine size={32} className="text-violet-300" />,
            title: "Escanean tu QR",
            desc: "El cliente en tu local, en la mesa o en casa escanea el código QR con su celular. Sin descargar nada.",
            borderColor: "border-violet-500/30",
            glowBg: "bg-violet-500/20",
            from: "from-violet-950",
            to: "to-[#0d0520]",
          },
          {
            step: "02",
            icon: <Smartphone size={32} className="text-indigo-300" />,
            title: "Ven tu carta digital",
            desc: "Tu menú se abre al instante con fotos y precios. Eligen, personalizan y arman su pedido.",
            borderColor: "border-indigo-500/30",
            glowBg: "bg-indigo-500/20",
            from: "from-indigo-950",
            to: "to-[#050520]",
          },
          {
            step: "03",
            icon: <MessageCircle size={32} className="text-[#25D366]" />,
            title: "Te llega por WhatsApp",
            desc: "El pedido completo llega directo a tu WhatsApp. Sin apps intermediarias, sin comisiones.",
            borderColor: "border-[#25D366]/30",
            glowBg: "bg-[#25D366]/15",
            from: "from-emerald-950",
            to: "to-[#030f05]",
          },
        ].map((item, i) => (
          <div
            key={i}
            className={`relative rounded-3xl bg-gradient-to-br ${item.from} ${item.to} border ${item.borderColor} p-8 flex flex-col items-center text-center gap-6`}
          >
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl ${item.glowBg} border ${item.borderColor} flex items-center justify-center`}>
                {item.icon}
              </div>
              <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-xs font-black">
                {item.step}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
              <p className="text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// BENEFICIOS
// ─────────────────────────────────────────────
const SectionBenefits = () => (
  <section className="py-24 bg-[#04040c] relative overflow-hidden">
    <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-3">Por qué PandaPOS</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Más ventas.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Menos dependencia.
            </span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Cada pedido que entra por tu carta QR es un cliente tuyo, no de una app.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: <TrendingUp size={24} className="text-violet-300" />,
              title: "Más pedidos directos",
              desc: "Tus clientes piden sin intermediarios que se quedan con parte de tu venta.",
              color: "border-violet-500/30 bg-violet-950/40",
            },
            {
              icon: <Users size={24} className="text-indigo-300" />,
              title: "Clientes que vuelven",
              desc: "Escanean el QR de tu boleta y vuelven a pedir. El ciclo de recompra corre solo.",
              color: "border-indigo-500/30 bg-indigo-950/40",
            },
            {
              icon: <ShieldCheck size={24} className="text-[#25D366]" />,
              title: "Más margen",
              desc: "0% de comisión. Lo que vendes, es tuyo. Sin PedidosYa, sin Rappi, sin Uber.",
              color: "border-[#25D366]/30 bg-emerald-950/40",
            },
            {
              icon: <CheckCircle2 size={24} className="text-amber-300" />,
              title: "Menos errores en cocina",
              desc: "El pedido llega tal como el cliente lo armó. Sin malos entendidos ni pedidos perdidos.",
              color: "border-amber-500/30 bg-amber-950/40",
            },
          ].map((b, i) => (
            <div key={i} className={`rounded-2xl border ${b.color} p-6 flex flex-col gap-4`}>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {b.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">{b.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// DIFERENCIAL CLAVE
// ─────────────────────────────────────────────
const SectionKeyDiff = () => (
  <section className="py-24 bg-[#07070f] relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-violet-600/15 rounded-full blur-[120px]" />
    </div>
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-semibold mb-8">
        <Zap size={14} className="text-amber-400" />
        El diferencial que más importa
      </div>
      <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-6">
        Convierte cada boleta{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
          en una nueva venta
        </span>
      </h2>
      <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
        El cliente ya compró. Tu boleta tiene un QR.{" "}
        <span className="text-white/80 font-semibold">Lo escanea y vuelve a pedir directo, sin tener que buscarte.</span>
      </p>

      <div className="mt-16 flex items-center justify-center gap-4 md:gap-6 flex-wrap">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-white font-bold text-sm">Boleta con QR</p>
          <p className="text-white/30 text-xs mt-1">Se la lleva el cliente</p>
        </div>
        <ArrowRight size={24} className="text-violet-400 flex-shrink-0" />
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <QrCode size={40} className="text-violet-300 mx-auto mb-3" />
          <p className="text-white font-bold text-sm">Escanea desde casa</p>
          <p className="text-white/30 text-xs mt-1">Cuando quiera volver</p>
        </div>
        <ArrowRight size={24} className="text-violet-400 flex-shrink-0" />
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-6 text-center">
          <MessageCircle size={40} className="text-[#25D366] mx-auto mb-3" />
          <p className="text-white font-bold text-sm">Nuevo pedido por WhatsApp</p>
          <p className="text-[#25D366]/70 text-xs mt-1">Venta sin esfuerzo</p>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// DEMO VISUAL
// ─────────────────────────────────────────────
const SectionDemoVisual = () => (
  <section className="py-24 bg-[#04040c] relative overflow-hidden">
    <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <p className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-3">Demo real</p>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Así se ve en la práctica
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {/* Paso 1 */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 flex flex-col gap-5">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <ScanLine size={28} className="text-violet-300" />
          </div>
          <div>
            <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-2">Paso 1</p>
            <h3 className="text-white font-black text-xl mb-2">Cliente escanea el QR</h3>
            <p className="text-white/40 text-sm leading-relaxed">Con la cámara del celular. Sin descargar apps. Se abre al instante.</p>
          </div>
          <div className="mt-auto bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="h-32 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
              <QrCode size={56} className="text-white/20" />
            </div>
            <p className="text-center text-white/20 text-xs font-semibold mt-3">📱 Apuntar cámara aquí</p>
          </div>
        </div>

        {/* Paso 2 */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 flex flex-col gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Smartphone size={28} className="text-indigo-300" />
          </div>
          <div>
            <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-2">Paso 2</p>
            <h3 className="text-white font-black text-xl mb-2">Ve tu carta digital</h3>
            <p className="text-white/40 text-sm leading-relaxed">Navega el menú, elige productos y arma su pedido. Fácil e intuitivo.</p>
          </div>
          <div className="mt-auto bg-black/30 rounded-2xl p-4 border border-white/5 space-y-2">
            {["Sushi Roll Spicy", "Chicken Woo", "Acevichado Hot"].map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5">
                <span className="text-white/60 text-xs font-semibold">{item}</span>
                <span className="text-indigo-300 text-xs font-black">${(6900 + i * 1000).toLocaleString()}</span>
              </div>
            ))}
            <div className="bg-indigo-500 rounded-xl py-2.5 text-center mt-3">
              <span className="text-white text-xs font-black">Agregar al pedido</span>
            </div>
          </div>
        </div>

        {/* Paso 3 */}
        <div className="bg-[#25D366]/[0.05] border border-[#25D366]/20 rounded-3xl p-8 flex flex-col gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center">
            <MessageCircle size={28} className="text-[#25D366]" />
          </div>
          <div>
            <p className="text-[#25D366]/50 text-xs font-black tracking-widest uppercase mb-2">Paso 3</p>
            <h3 className="text-white font-black text-xl mb-2">Recibes en WhatsApp</h3>
            <p className="text-white/40 text-sm leading-relaxed">El pedido llega con todos los detalles. Solo confirmas y preparas.</p>
          </div>
          <div className="mt-auto bg-black/30 rounded-2xl p-4 border border-[#25D366]/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                <MessageCircle size={14} className="text-[#25D366]" />
              </div>
              <span className="text-white/40 text-xs font-semibold">WhatsApp · ahora</span>
            </div>
            <div className="bg-[#25D366]/10 rounded-xl rounded-tl-none px-3 py-3 mb-2">
              <p className="text-white/70 text-xs font-bold mb-1">🛒 Nuevo pedido:</p>
              <p className="text-white/50 text-xs leading-relaxed">• 2x Sushi Roll Spicy<br />• 1x Chicken Woo<br />📍 Retiro en local</p>
            </div>
            <p className="text-[#25D366] text-xs font-semibold text-center">✓ Pedido recibido</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// PRUEBA SOCIAL
// ─────────────────────────────────────────────
const SectionSocialProof = () => (
  <section className="py-24 bg-[#07070f] relative overflow-hidden">
    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <p className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-12">Lo que dicen los que ya lo usan</p>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10 md:p-14 relative">
        <div className="absolute top-6 left-8 text-violet-500/20 text-8xl font-black leading-none select-none">"</div>

        <div className="flex justify-center mb-5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
          ))}
        </div>

        <blockquote className="text-white text-2xl md:text-3xl font-bold leading-relaxed mb-8 relative z-10">
          Con PandaPOS los pedidos ahora llegan directo por WhatsApp.{" "}
          <span className="text-violet-300">
            Dejé de depender de apps caras y mis clientes vuelven solos.
          </span>
        </blockquote>

        <div className="flex items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-white font-black text-xl">B</span>
          </div>
          <div className="text-left">
            <p className="text-white font-bold">Dueño de BAMPAI</p>
            <p className="text-white/40 text-sm">Restaurante de sushi · Santiago</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// EXPANSIÓN DEL SISTEMA
// ─────────────────────────────────────────────
const SectionExpansion = () => (
  <section className="py-24 bg-[#04040c] relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <p className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-3">Hay más cuando lo necesites</p>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Y además tienes control total
        </h2>
        <p className="text-white/40 text-lg max-w-2xl mx-auto mt-4">
          Cuando estés listo para escalar, todo el sistema te espera.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: <Store size={28} />, label: "POS / Caja", color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20" },
          { icon: <CookingPot size={28} />, label: "Cocina (KDS)", color: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
          { icon: <Truck size={28} />, label: "Delivery propio", color: "text-rose-300 bg-rose-500/10 border-rose-500/20" },
          { icon: <PackageSearch size={28} />, label: "Inventario", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
          { icon: <BarChart3 size={28} />, label: "Reportes", color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20" },
        ].map((item, i) => (
          <div key={i} className={`rounded-2xl border ${item.color} p-6 flex flex-col items-center gap-3 text-center`}>
            <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center`}>
              {item.icon}
            </div>
            <span className="text-white/60 font-bold text-sm">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="text-center mt-8 text-white/25 text-sm font-semibold">
        Empieza con pedidos por QR · Escala cuando quieras
      </p>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// PLANES
// ─────────────────────────────────────────────
const BASICO_FEATURES = [
  "Carta QR digital",
  "Pedidos por WhatsApp",
  "POS / Ventas en caja",
  "Gestión de mesas",
  "Reportes básicos",
  "Usuarios y perfiles",
];

const PRO_FEATURES = [
  "Todo del plan Básico",
  "Pantalla KDS cocina",
  "Delivery y pedidos online",
  "Control de inventario",
  "Multi sucursal",
  "RRHH y turnos",
  "Reportes avanzados",
];

const PRIME_FEATURES = [
  "Todo del plan Pro",
  "Kiosko de autoservicio",
  "Venta de eventos y tickets",
  "Cupones y descuentos",
  "Clientes frecuentes",
  "Reportes premium",
  "Soporte prioritario",
];

const SectionPlans = () => (
  <section id="planes" className="py-24 bg-[#07070f] relative overflow-hidden">
    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/[0.07] rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />

    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <p className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-3">Precios</p>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Empieza con el QR.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            Escala cuando quieras.
          </span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* BÁSICO */}
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] flex flex-col">
          <div className="px-8 pt-8 pb-6 border-b border-white/5">
            <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-1">Plan</p>
            <h3 className="text-3xl font-black text-white mb-3">Básico</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-white text-4xl font-black">$7.900</span>
              <span className="text-white/30 text-sm font-semibold">/mes</span>
            </div>
            <p className="text-white/30 text-sm">Ideal para comenzar con pedidos directos</p>
          </div>
          <div className="px-8 py-6 flex-1 space-y-3">
            {BASICO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-white/25 flex-shrink-0" />
                <span className="text-white/55 text-sm font-semibold">{f}</span>
              </div>
            ))}
          </div>
          <div className="px-8 pb-8">
            <Link
              href="/login"
              className="block w-full py-3.5 rounded-2xl font-black text-center text-sm tracking-wide border border-white/15 text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              Probar gratis
            </Link>
          </div>
        </div>

        {/* PRO */}
        <div className="rounded-3xl overflow-hidden border border-violet-500/40 bg-gradient-to-b from-violet-950/50 to-[#07070f] flex flex-col shadow-[0_0_60px_rgba(139,92,246,0.12)] relative">
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-black tracking-widest uppercase">
              Popular
            </span>
          </div>
          <div className="px-8 pt-8 pb-6 border-b border-violet-500/10">
            <p className="text-violet-400 text-xs font-black tracking-widest uppercase mb-1">Plan</p>
            <h3 className="text-3xl font-black text-white mb-3">Pro</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-white text-4xl font-black">$11.900</span>
              <span className="text-violet-400/40 text-sm font-semibold">/mes</span>
            </div>
            <p className="text-white/30 text-sm">Control total de tu restaurante</p>
          </div>
          <div className="px-8 py-6 flex-1 space-y-3">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2
                  size={16}
                  className={`flex-shrink-0 ${f === "Todo del plan Básico" ? "text-violet-400" : "text-violet-400/60"}`}
                />
                <span
                  className={`text-sm font-semibold ${f === "Todo del plan Básico" ? "text-violet-300" : "text-white/55"}`}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
          <div className="px-8 pb-8">
            <Link
              href="https://wa.me/56999011141?text=Hola%2C%20quiero%20contratar%20PandaPOS%20Pro"
              target="_blank"
              className="block w-full py-3.5 rounded-2xl font-black text-center text-sm tracking-wide bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 transition-all"
            >
              Contratar Pro
            </Link>
          </div>
        </div>

        {/* PRIME */}
        <div className="rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-[#07070f] flex flex-col relative">
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black tracking-widest uppercase">
              Más completo
            </span>
          </div>
          <div className="px-8 pt-8 pb-6 border-b border-amber-500/10">
            <p className="text-amber-400 text-xs font-black tracking-widest uppercase mb-1">Plan</p>
            <h3 className="text-3xl font-black text-white mb-3">Prime 🐼</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-white text-4xl font-black">$14.900</span>
              <span className="text-amber-400/40 text-sm font-semibold">/mes</span>
            </div>
            <p className="text-white/30 text-sm">Todo incluido, sin límites</p>
          </div>
          <div className="px-8 py-6 flex-1 space-y-3">
            {PRIME_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2
                  size={16}
                  className={`flex-shrink-0 ${f === "Todo del plan Pro" ? "text-amber-400" : "text-amber-400/60"}`}
                />
                <span
                  className={`text-sm font-semibold ${f === "Todo del plan Pro" ? "text-amber-300" : "text-white/55"}`}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
          <div className="px-8 pb-8">
            <Link
              href="https://wa.me/56999011141?text=Hola%2C%20quiero%20contratar%20PandaPOS%20Prime"
              target="_blank"
              className="block w-full py-3.5 rounded-2xl font-black text-center text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300 transition-all"
            >
              Contratar Prime
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// CTA FINAL
// ─────────────────────────────────────────────
const SectionCTA = () => (
  <section className="py-24 bg-[#04040c] relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-violet-600/20 rounded-full blur-[120px]" />
    </div>

    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm font-semibold mb-8">
        <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
        Empieza hoy mismo
      </div>

      <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-6">
        Empieza a recibir pedidos directos{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-emerald-400">
          hoy
        </span>
      </h2>

      <p className="text-xl text-white/40 max-w-2xl mx-auto mb-10">
        Sin instalaciones. Sin contratos largos. Sin comisiones.
        <br />
        <span className="text-white/60 font-semibold">
          Tu carta QR lista para recibir pedidos el mismo día.
        </span>
      </p>

      <Link
        href="https://wa.me/56999011141?text=Hola%2C%20quiero%20empezar%20a%20recibir%20pedidos%20por%20WhatsApp%20con%20PandaPOS"
        target="_blank"
        className="inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] hover:bg-[#22be5b] text-white font-black rounded-2xl shadow-xl shadow-[#25D366]/30 hover:shadow-[#25D366]/40 transition-all text-lg"
      >
        <MessageCircle size={24} />
        Hablar por WhatsApp
        <ArrowRight size={20} />
      </Link>

      <p className="mt-6 text-white/20 text-sm font-semibold">
        Te respondemos en menos de 10 minutos
      </p>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-[#07070f] border-t border-white/5 py-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <Link href="/home" className="flex items-center gap-3 font-black text-xl text-white tracking-tight">
        <img src="/logo.png" alt="PandaPOS" className="w-10 h-10 object-contain drop-shadow" />
        PandaPOS
      </Link>
      <div className="flex items-center gap-8">
        <Link href="#como-funciona" className="text-white/25 text-sm font-semibold hover:text-white/60 transition-colors">
          Cómo funciona
        </Link>
        <Link href="#planes" className="text-white/25 text-sm font-semibold hover:text-white/60 transition-colors">
          Planes
        </Link>
        <Link href="/login" className="text-white/25 text-sm font-semibold hover:text-white/60 transition-colors">
          Acceder
        </Link>
      </div>
      <p className="text-white/20 text-sm">© {new Date().getFullYear()} PandaPOS</p>
    </div>
  </footer>
);

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07070f] selection:bg-violet-500/30 selection:text-violet-100 font-sans">
      <Navbar />
      <main>
        <Hero />
        <SectionHowItWorks />
        <SectionBenefits />
        <SectionKeyDiff />
        <SectionDemoVisual />
        <SectionSocialProof />
        <SectionExpansion />
        <SectionPlans />
        <SectionCTA />
      </main>
      <Footer />
    </div>
  );
}
