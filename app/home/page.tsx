"use client";

import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  QrCode,
  Smartphone,
  ScanLine,
  ArrowRight,
  TrendingUp,
  Users,
  ChefHat,
  Crown,
  Star,
  Receipt,
  Zap,
  BadgeDollarSign,
} from "lucide-react";

const WA =
  "https://wa.me/56999011141?text=Hola%2C%20quiero%20dejar%20de%20pagar%20comisiones%20y%20vender%20directo%20con%20PandaPOS";

// ─── NAVBAR ────────────────────────────────────────────────────────────────
const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#050509]/90 backdrop-blur-lg border-b border-white/[0.07]">
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="h-[68px] flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2.5 text-white font-black text-xl tracking-tight">
          <img src="/logo.png" alt="PandaPOS" className="w-9 h-9 object-contain" />
          PandaPOS
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "El problema", href: "#problema" },
            { label: "Cómo funciona", href: "#como-funciona" },
            { label: "Planes", href: "#planes" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-white/50 hover:text-white text-sm font-semibold transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            href={WA}
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20c05c] text-white text-sm font-black transition-all shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle size={15} />
            Hablar por WhatsApp
          </Link>
        </div>

        <Link href={WA} target="_blank" className="md:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-black">
          <MessageCircle size={14} /> WhatsApp
        </Link>
      </div>
    </div>
  </nav>
);

// ─── HERO ───────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative min-h-screen flex items-center pt-24 pb-20 bg-[#060609] overflow-hidden">
    {/* Glow */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-600/[0.12] blur-[140px] rounded-full" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-700/[0.08] blur-[100px] rounded-full" />
    </div>

    <div className="relative max-w-6xl mx-auto px-5 sm:px-8 w-full">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 text-xs font-semibold mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
        Sin comisiones · Pedidos directos · Empieza hoy
      </div>

      {/* Headline */}
      <h1 className="text-[clamp(2.6rem,7vw,5.5rem)] font-black leading-[1.04] tracking-tight text-white max-w-5xl mb-6">
        Cada pedido de Uber Eats
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
          te cuesta un 30%.
        </span>
      </h1>

      {/* Sub */}
      <p className="text-white/55 text-xl max-w-2xl leading-relaxed mb-10">
        PandaPOS te da tu propio canal de ventas por{" "}
        <span className="text-white font-bold">QR y WhatsApp</span>.
        Tus clientes piden directo a ti. Sin intermediarios. Sin comisión por orden.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={WA}
          target="_blank"
          className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20c05c] text-white font-black text-base transition-all shadow-xl shadow-[#25D366]/25"
        >
          <MessageCircle size={20} />
          Hablar por WhatsApp
        </Link>
        <Link
          href="#como-funciona"
          className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.1] text-white font-black text-base transition-all"
        >
          Ver cómo funciona <ArrowRight size={18} />
        </Link>
      </div>

      <p className="mt-5 text-white/30 text-sm font-semibold">
        Activa PandaPOS esta semana y recupera margen desde el primer pedido.
      </p>

      {/* Stat strip */}
      <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl">
        {[
          { val: "0%", label: "Comisión por orden" },
          { val: "30%", label: "Margen que recuperas" },
          { val: "24/7", label: "Pedidos automáticos" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
            <p className="text-white font-black text-2xl">{s.val}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── PROBLEM ────────────────────────────────────────────────────────────────
const SectionProblem = () => (
  <section id="problema" className="py-28 bg-[#040407]">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="max-w-3xl mb-14">
        <p className="text-red-400 text-xs font-black tracking-widest uppercase mb-3">El problema real</p>
        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
          Vendes más.<br />
          <span className="text-red-400">Ganas menos.</span>
        </h2>
        <p className="text-white/50 text-lg mt-5 leading-relaxed">
          Las apps de delivery te consiguen pedidos, sí. Pero te cobran por cada uno — y encima se quedan con el cliente.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Card grande */}
        <div className="rounded-3xl border border-red-500/20 bg-red-950/15 p-8 flex flex-col justify-between row-span-2">
          <div>
            <p className="text-red-300 text-6xl font-black mb-4">30%</p>
            <h3 className="text-white text-2xl font-black mb-3">De cada pedido, para la app.</h3>
            <p className="text-white/50 leading-relaxed">
              Si vendes $1.000.000 al mes por delivery, entregas hasta <span className="text-red-300 font-bold">$300.000</span> en comisiones.
              Eso es una semana entera de trabajo que no llega a tu bolsillo.
            </p>
          </div>
          <div className="mt-8 rounded-2xl bg-red-950/40 border border-red-500/20 p-5">
            <p className="text-white/70 text-sm font-semibold">Ventas del mes: <span className="text-white">$1.000.000</span></p>
            <p className="text-white/70 text-sm font-semibold mt-1">Comisión (30%): <span className="text-red-400 font-black">−$300.000</span></p>
            <p className="text-white font-black mt-3 pt-3 border-t border-white/10">Lo que queda: $700.000</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <Users className="text-rose-400 mb-4" size={26} />
          <h3 className="text-white font-black text-xl mb-2">No eres dueño de tus clientes</h3>
          <p className="text-white/50 text-sm leading-relaxed">
            La app tiene el contacto, los datos y la recompra. Cuando el cliente vuelve, vuelve a la app — no a tu local.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <BadgeDollarSign className="text-amber-400 mb-4" size={26} />
          <h3 className="text-white font-black text-xl mb-2">Promos que pagas tú</h3>
          <p className="text-white/50 text-sm leading-relaxed">
            Descuentos, envíos gratis, posicionamiento pago. La app te cobra por existir en su plataforma.
          </p>
        </div>
      </div>
    </div>
  </section>
);

// ─── SOLUTION ───────────────────────────────────────────────────────────────
const SectionSolution = () => (
  <section className="py-28 bg-[#060609]">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="text-violet-400 text-xs font-black tracking-widest uppercase mb-3">La solución</p>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
          Tu canal. Tu margen.<br />Tus clientes.
        </h2>
        <p className="text-white/50 text-lg mt-5 leading-relaxed">
          PandaPOS te da todo lo que necesitas para vender directo — sin depender de ninguna app.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4" id="como-funciona">
        {[
          {
            icon: <ScanLine size={28} className="text-violet-300" />,
            step: "01",
            title: "Escanean tu QR",
            desc: "En la mesa, el packaging o la boleta. El cliente entra a tu menú en segundos, desde su celular.",
          },
          {
            icon: <Smartphone size={28} className="text-indigo-300" />,
            step: "02",
            title: "Ven tu carta y piden",
            desc: "Menú digital, fotos, variantes y precios. El cliente arma su pedido sin llamadas ni confusión.",
          },
          {
            icon: <MessageCircle size={28} className="text-[#25D366]" />,
            step: "03",
            title: "Llega directo a WhatsApp",
            desc: "El pedido llega a tu equipo confirmado. Sin intermediarios, sin porcentaje, sin esperas.",
          },
        ].map((s) => (
          <div key={s.step} className="rounded-3xl border border-white/[0.09] bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                {s.icon}
              </div>
              <span className="text-white/20 font-black text-2xl">{s.step}</span>
            </div>
            <h3 className="text-white text-xl font-black mb-2">{s.title}</h3>
            <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── BENEFITS ───────────────────────────────────────────────────────────────
const SectionBenefits = () => (
  <section className="py-28 bg-[#040407]">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Resultados que se sienten en caja.</h2>
        <p className="text-white/45 text-lg mt-4">No son promesas. Son los cambios concretos que ves cuando dejas de depender de las apps.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <TrendingUp size={22} className="text-violet-300" />,
            title: "Más ganancia por orden",
            desc: "Si no pagas comisión, tu margen sube desde el primer pedido. Sin cambiar precios.",
          },
          {
            icon: <Users size={22} className="text-indigo-300" />,
            title: "Clientes que vuelven a ti",
            desc: "El contacto es tuyo. La relación es tuya. Ellos vuelven a tu local, no a la app.",
          },
          {
            icon: <ChefHat size={22} className="text-amber-300" />,
            title: "Menos errores en cocina",
            desc: "Pedidos claros, completos y en tiempo real. Sin mensajes mal tomados ni faltantes.",
          },
          {
            icon: <Crown size={22} className="text-[#25D366]" />,
            title: "Control total del negocio",
            desc: "Tus precios, tus promos, tus datos. Todo el poder en tus manos, no en las de una app.",
          },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-6">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-5">
              {b.icon}
            </div>
            <h3 className="text-white font-black text-lg mb-2">{b.title}</h3>
            <p className="text-white/45 text-sm leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── DIFFERENTIATOR ──────────────────────────────────────────────────────────
const SectionDifferentiator = () => (
  <section className="py-28 bg-[#060609]">
    <div className="max-w-5xl mx-auto px-5 sm:px-8">
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-[#060609] p-10 md:p-16 text-center">
        <p className="text-violet-400 text-xs font-black tracking-widest uppercase mb-5">Diferenciador clave</p>
        <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.02] tracking-tight mb-5">
          Tus clientes son tuyos.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            No de las apps.
          </span>
        </h2>
        <p className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">
          Cuando controlas el canal de venta, controlas el negocio. Más margen, más recompra, más independencia para crecer sin pedirle permiso a nadie.
        </p>
      </div>
    </div>
  </section>
);

// ─── POWER SECTION ───────────────────────────────────────────────────────────
const SectionPower = () => (
  <section className="py-28 bg-[#040407]">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-violet-400 text-xs font-black tracking-widest uppercase mb-4">El ciclo que cambia todo</p>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
            Convierte cada boleta en una nueva venta.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-8">
            Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Sin que tú hagas nada. Sin que la app se lleve su parte.
          </p>
          <Link
            href={WA}
            target="_blank"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20c05c] text-white font-black transition-all shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle size={18} /> Activar ciclo directo
          </Link>
        </div>

        <div className="space-y-3">
          {[
            {
              icon: <Receipt size={20} className="text-white/60" />,
              label: "Entrega con QR impreso",
              desc: "Cada boleta lleva tu QR. Es tu canal en manos del cliente.",
              border: "border-white/[0.09]",
            },
            {
              icon: <QrCode size={20} className="text-violet-400" />,
              label: "Escanea cuando quiere",
              desc: "En casa, al día siguiente, cuando tenga hambre. Tu menú siempre disponible.",
              border: "border-violet-500/25",
            },
            {
              icon: <MessageCircle size={20} className="text-[#25D366]" />,
              label: "Nuevo pedido, cero comisión",
              desc: "El pedido llega directo. Tú cobras el 100%. La app no existe.",
              border: "border-[#25D366]/25",
            },
          ].map((step, i) => (
            <div key={i} className={`flex items-start gap-4 rounded-2xl border ${step.border} bg-white/[0.02] p-5`}>
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-white font-black text-sm mb-0.5">{step.label}</p>
                <p className="text-white/40 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ─── SOCIAL PROOF ────────────────────────────────────────────────────────────
const SectionSocialProof = () => (
  <section className="py-28 bg-[#060609]">
    <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
      <div className="flex justify-center gap-1 mb-8">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
        ))}
      </div>

      <blockquote className="text-2xl md:text-[2rem] text-white font-bold leading-[1.35] mb-8">
        "Antes le pagábamos casi 28% entre comisiones y promos. Con PandaPOS, la mitad de los pedidos ya son directos por WhatsApp y ese margen volvió a la caja. En el primer mes recuperamos lo que costó el sistema."
      </blockquote>

      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-sm">
          M
        </div>
        <div className="text-left">
          <p className="text-white font-bold text-sm">María P.</p>
          <p className="text-white/40 text-xs">Dueña de dark kitchen · Santiago</p>
        </div>
      </div>
    </div>
  </section>
);

// ─── FEATURES GRID ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🖥️",
    title: "KDS en tiempo real",
    desc: "Pantalla de cocina con pedidos al instante desde mesa, delivery, retiro, kiosko y WhatsApp. Cocina sin papel, sin gritos.",
  },
  {
    icon: "🤖",
    title: "Bot de WhatsApp 24/7",
    desc: "Atiende, arma carrito, confirma y envía al sistema sin intervención humana. Vende mientras duermes.",
  },
  {
    icon: "🛒",
    title: "Carta online y kiosko",
    desc: "Menú digital por QR desde cualquier dispositivo. Pago con Mercado Pago, transferencia o efectivo.",
  },
  {
    icon: "🚴",
    title: "Gestión de delivery",
    desc: "Asignación de repartidores, zonas con precios diferenciados y seguimiento del pedido en tiempo real.",
  },
  {
    icon: "💳",
    title: "Punto de venta (POS)",
    desc: "Caja rápida con pagos mixtos, impresión térmica y gestión de mesas. Todo integrado, todo en uno.",
  },
  {
    icon: "📊",
    title: "Panel de ventas",
    desc: "Ventas del día, ticket promedio, métodos de pago y ranking de clientes. Datos para decidir mejor.",
  },
  {
    icon: "🔔",
    title: "Notificaciones por rol",
    desc: "Mesero, cajero y rider reciben solo lo que les corresponde. Menos ruido, más velocidad.",
  },
  {
    icon: "🏪",
    title: "Multi-sucursal",
    desc: "Gestión de múltiples locales desde una sola plataforma. Roles, reportes y menú por sucursal.",
  },
];

const SectionFeatures = () => (
  <section className="py-28 bg-[#040407]">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <p className="text-violet-400 text-xs font-black tracking-widest uppercase mb-3">Todo incluido</p>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Un sistema. Sin fricción.</h2>
        <p className="text-white/45 text-lg mt-4">Todo lo que necesitas para operar, vender y crecer sin depender de terceros.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <article key={f.title} className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
            <div>
              <h3 className="text-white font-black mb-1">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

// ─── PRICING ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Basic",
    price: "$7.900",
    pitch: "Para dejar de pagar comisión desde ya.",
    items: [
      "Carta QR con menú digital",
      "Pedidos por WhatsApp",
      "Gestión de mesas",
      "Soporte de arranque",
    ],
    cta: "Empezar con Basic",
    style: "border-white/[0.1] bg-white/[0.02]",
    badge: null,
  },
  {
    name: "Pro",
    price: "$11.900",
    pitch: "Para crecer con control total del día a día.",
    items: [
      "Todo de Basic",
      "KDS de cocina",
      "Bot de WhatsApp 24/7",
      "Delivery con zonas y repartidores",
      "Panel de ventas y reportes",
    ],
    cta: "Elegir Pro",
    style: "border-violet-500/40 bg-violet-950/25",
    badge: "Más elegido",
  },
  {
    name: "Prime",
    price: "$14.900",
    pitch: "Para operar sin límites y escalar.",
    items: [
      "Todo de Pro",
      "Multi-sucursal",
      "Kiosko de autoatención",
      "Pagos con Mercado Pago",
      "Soporte prioritario",
    ],
    cta: "Ir por Prime",
    style: "border-amber-500/30 bg-amber-950/15",
    badge: null,
  },
];

const SectionPricing = () => (
  <section id="planes" className="py-28 bg-[#060609]">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="text-center mb-16">
        <p className="text-violet-400 text-xs font-black tracking-widest uppercase mb-3">Precios</p>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
          Más barato que una semana<br className="hidden md:block" /> de comisiones.
        </h2>
        <p className="text-white/45 text-lg">Elige un plan. Recupera margen. Cobra directo.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((p) => (
          <div key={p.name} className={`rounded-3xl border ${p.style} p-7 flex flex-col relative`}>
            {p.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-500 text-white text-xs font-black">
                {p.badge}
              </div>
            )}
            <p className="text-white/30 text-xs font-black uppercase tracking-widest mb-2">Plan</p>
            <h3 className="text-white text-3xl font-black">{p.name}</h3>
            <div className="flex items-end gap-1 mt-1 mb-1">
              <span className="text-white text-4xl font-black">{p.price}</span>
              <span className="text-white/30 text-sm font-semibold mb-1">/mes</span>
            </div>
            <p className="text-white/45 text-sm mb-6">{p.pitch}</p>

            <div className="space-y-2.5 mb-7 flex-1">
              {p.items.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#25D366] mt-0.5 shrink-0" />
                  <span className="text-white/65 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href={WA}
              target="_blank"
              className="inline-flex justify-center items-center gap-2 py-3 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.13] text-white font-black text-sm transition-all"
            >
              <MessageCircle size={15} />
              {p.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-white/30 text-sm mt-8">
        ¿Tienes dudas sobre qué plan elegir? Hablamos por WhatsApp y te recomendamos el mejor para tu negocio.
      </p>
    </div>
  </section>
);

// ─── FINAL CTA ───────────────────────────────────────────────────────────────
const SectionFinalCTA = () => (
  <section className="py-32 bg-[#040407] relative overflow-hidden">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-violet-600/[0.1] blur-[130px] rounded-full" />
    </div>

    <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
      <Zap className="text-violet-400 mx-auto mb-6" size={36} />
      <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.03] tracking-tight mb-5">
        Deja de pagar comisiones.
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-emerald-400">
          Empieza a cobrar directo hoy.
        </span>
      </h2>
      <p className="text-white/50 text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
        Más dinero por orden. Clientes que son tuyos. Control total del negocio. Todo empieza con un QR y WhatsApp.
      </p>

      <Link
        href={WA}
        target="_blank"
        className="inline-flex items-center gap-2.5 px-10 py-5 rounded-2xl bg-[#25D366] hover:bg-[#20c05c] text-white text-lg font-black transition-all shadow-2xl shadow-[#25D366]/25"
      >
        <MessageCircle size={22} />
        Hablar por WhatsApp ahora
      </Link>

      <p className="mt-5 text-white/25 text-sm font-semibold">Sin contratos. Sin permanencia. Activa hoy.</p>
    </div>
  </section>
);

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-[#030306] border-t border-white/[0.06] py-10">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <Link href="/home" className="flex items-center gap-2.5 text-white font-black text-lg">
        <img src="/logo.png" alt="PandaPOS" className="w-8 h-8 object-contain" />
        PandaPOS
      </Link>
      <p className="text-white/25 text-sm">© {new Date().getFullYear()} PandaPOS · Todos los derechos reservados</p>
      <Link href={WA} target="_blank" className="text-[#25D366] hover:text-[#20c05c] text-sm font-bold transition-colors flex items-center gap-1.5">
        <MessageCircle size={14} /> WhatsApp
      </Link>
    </div>
  </footer>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060609] font-sans selection:bg-violet-500/30 selection:text-violet-100">
      <Navbar />
      <main>
        <Hero />
        <SectionProblem />
        <SectionSolution />
        <SectionBenefits />
        <SectionDifferentiator />
        <SectionPower />
        <SectionSocialProof />
        <SectionFeatures />
        <SectionPricing />
        <SectionFinalCTA />
      </main>
      <Footer />
    </div>
  );
}
