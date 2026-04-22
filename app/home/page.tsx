"use client";

import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  QrCode,
  Smartphone,
  ScanLine,
  AlertTriangle,
  Skull,
  Wallet,
  Repeat,
  ChefHat,
  Crown,
  Star,
} from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/56999011141?text=Hola%2C%20quiero%20dejar%20de%20pagar%20comisiones%20y%20vender%20directo%20con%20PandaPOS";

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#05050c]/85 backdrop-blur-md border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-20 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3 text-white font-black tracking-tight text-2xl">
          <img src="/logo.png" alt="PandaPOS" className="w-10 h-10 object-contain" />
          PandaPOS
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <Link href="#problema" className="text-white/60 hover:text-white text-sm font-semibold transition-colors">Problema</Link>
          <Link href="#solucion" className="text-white/60 hover:text-white text-sm font-semibold transition-colors">Solución</Link>
          <Link href="#planes" className="text-white/60 hover:text-white text-sm font-semibold transition-colors">Planes</Link>
          <Link href={WHATSAPP_URL} target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#22be5b] text-white text-sm font-black transition-all">
            <MessageCircle size={16} /> Hablar por WhatsApp
          </Link>
        </div>

        <Link href={WHATSAPP_URL} target="_blank" className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-black">
          <MessageCircle size={14} /> WhatsApp
        </Link>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-screen pt-28 pb-16 bg-[#07070f] overflow-hidden flex items-center">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-violet-600/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 blur-[110px] rounded-full" />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/75 text-sm font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          Empieza hoy · Sin comisiones
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white mb-6">
          ¿Sigues regalando
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400"> hasta 30% </span>
          en cada pedido?
        </h1>

        <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-10">
          PandaPOS te ayuda a recibir pedidos directos por <span className="text-white font-bold">QR + WhatsApp</span>.
          Sin apps, sin intermediarios, sin comisión por orden.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={WHATSAPP_URL} target="_blank" className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#22be5b] text-white font-black transition-all shadow-lg shadow-[#25D366]/25">
            <MessageCircle size={20} /> Hablar por WhatsApp
          </Link>
          <Link href="#como-funciona" className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/15 hover:bg-white/10 text-white font-black transition-all">
            Ver cómo funciona <ArrowRight size={18} />
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/45 font-semibold">Activa PandaPOS hoy y empieza a recuperar margen esta misma semana.</p>
      </div>
    </div>
  </section>
);

const SectionProblem = () => (
  <section id="problema" className="py-24 bg-[#05050c]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-red-500/25 bg-red-950/20 p-8">
          <p className="text-red-300 font-black text-xs tracking-widest uppercase mb-4">El problema real</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">Las apps te quitan el margen y al cliente.</h2>
          <p className="text-white/65 text-lg">Vendes más, pero ganas menos. Y cuando el cliente vuelve, vuelve a la app, no a tu restaurante.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <AlertTriangle className="text-amber-300 mb-4" size={28} />
            <h3 className="text-white font-black text-lg mb-2">Hasta 30% por pedido</h3>
            <p className="text-white/50 text-sm">Cada orden duele. Esa comisión sale directo de tu utilidad.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <Skull className="text-rose-300 mb-4" size={28} />
            <h3 className="text-white font-black text-lg mb-2">No eres dueño del cliente</h3>
            <p className="text-white/50 text-sm">La app tiene el contacto, los datos y la recompra. Tú solo cocinas.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionSolution = () => (
  <section id="solucion" className="py-24 bg-[#07070f]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-4xl mx-auto mb-14">
        <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-3">La salida</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">PandaPOS: venta directa en tu propio canal.</h2>
        <p className="text-white/55 text-lg">QR → menú → pedido → WhatsApp. Así de simple. Sin apps de delivery y sin comisiones por orden.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5" id="como-funciona">
        {[
          { icon: <ScanLine size={30} className="text-violet-300" />, title: "Escanean tu QR", desc: "Mesa, boleta o packaging. El cliente entra en segundos." },
          { icon: <Smartphone size={30} className="text-indigo-300" />, title: "Ven tu menú", desc: "Eligen productos y arman su pedido sin llamadas ni confusión." },
          { icon: <MessageCircle size={30} className="text-[#25D366]" />, title: "Te llega a WhatsApp", desc: "Pedido directo a tu equipo. Sin intermediarios en el medio." },
        ].map((s) => (
          <div key={s.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">{s.icon}</div>
            <h3 className="text-white text-2xl font-black mb-2">{s.title}</h3>
            <p className="text-white/50">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SectionBenefits = () => (
  <section className="py-24 bg-[#04040b]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-white">Beneficios que se notan en caja.</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Wallet size={24} className="text-violet-300" />, title: "Más ganancia por pedido", desc: "Si no pagas comisión, tu margen sube desde la primera orden." },
          { icon: <Repeat size={24} className="text-indigo-300" />, title: "Clientes que regresan", desc: "Relación directa: vuelven a comprarte a ti, no a la app." },
          { icon: <ChefHat size={24} className="text-amber-300" />, title: "Menos errores en cocina", desc: "Pedidos claros, completos y sin mensajes mal tomados." },
          { icon: <Crown size={24} className="text-[#25D366]" />, title: "Control total", desc: "Precios, promociones y contacto con tus clientes, todo tuyo." },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">{b.icon}</div>
            <h3 className="text-white font-black text-lg mb-2">{b.title}</h3>
            <p className="text-white/50 text-sm">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SectionDifferentiator = () => (
  <section className="py-24 bg-[#07070f]">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <p className="text-violet-400 font-bold text-xs tracking-widest uppercase mb-4">Diferenciador clave</p>
      <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-5">
        Tus clientes son tuyos.
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">No de las apps.</span>
      </h2>
      <p className="text-white/60 text-lg max-w-3xl mx-auto">Cuando controlas el canal, controlas el negocio. Más margen, más recompra, más independencia para crecer.</p>
    </div>
  </section>
);

const SectionPower = () => (
  <section className="py-24 bg-[#04040b]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-[#0a0a16] p-8 md:p-12">
        <p className="text-violet-300 font-bold text-sm uppercase tracking-widest mb-3">Sección Power</p>
        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">Convierte cada boleta en una nueva venta.</h2>
        <p className="text-white/60 text-lg mb-8">Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Recompra automática.</p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <p className="text-4xl mb-2">🧾</p>
            <p className="text-white font-bold">Boleta con QR</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <QrCode className="text-violet-300 mx-auto mb-2" size={34} />
            <p className="text-white font-bold">Escanea cuando quiera</p>
          </div>
          <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 p-5 text-center">
            <MessageCircle className="text-[#25D366] mx-auto mb-2" size={34} />
            <p className="text-white font-bold">Nuevo pedido directo</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionSocialProof = () => (
  <section className="py-24 bg-[#07070f]">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-10">Prueba social</p>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 md:p-14">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} className="text-amber-400 fill-amber-400" size={19} />)}
        </div>
        <blockquote className="text-2xl md:text-3xl text-white font-bold leading-relaxed mb-8">
          "Antes pagábamos casi 28% entre comisiones y promos. Con PandaPOS, los pedidos por WhatsApp ya son más de la mitad y ese margen volvió a la caja."
        </blockquote>
        <p className="text-white/70 font-bold">María P. · Dueña de dark kitchen (Lima)</p>
      </div>
    </div>
  </section>
);

const MAIN_FEATURES = [
  {
    title: "🖥️ KDS — Cocina en tiempo real",
    desc: "Pantallas de cocina que reciben pedidos al instante desde mesa, delivery, retiro, kiosko y WhatsApp. Filtra por estación, muestra tiempos y avisa automáticamente a Mesero, Cajero o Rider cuando el pedido está listo.",
  },
  {
    title: "🤖 Bot de WhatsApp",
    desc: "Atiende pedidos 24/7 en lenguaje natural. Arma carrito, pregunta retiro o delivery, dirección y pago. Confirma y envía directo al sistema para que entre al KDS sin intervención humana.",
  },
  {
    title: "🛒 Carta Online & Kiosko",
    desc: "Menú digital por link o QR desde cualquier dispositivo. Permite personalizar productos, elegir delivery/retiro y pagar con Mercado Pago, transferencia, efectivo o tarjeta. Incluye flujo de autoatención presencial.",
  },
  {
    title: "🚴 Gestión de Delivery",
    desc: "Panel completo con asignación de repartidores, tracking en tiempo real, zonas de despacho con precios diferenciados y app para rider. El cliente recibe confirmación y seguimiento del pedido.",
  },
  {
    title: "💳 Punto de Venta (POS)",
    desc: "Caja rápida con pagos mixtos, impresión térmica, gestión de mesas y comandas. Si la caja está abierta, la carta online toma pedidos; si está cerrada, el local se marca no disponible automáticamente.",
  },
  {
    title: "📊 Panel de Ventas",
    desc: "Dashboard con ventas del día/mes, comparativo mensual, ticket promedio, métodos de pago y tendencias. Incluye ranking de clientes y vista en tiempo real de pedidos directos y su estado.",
  },
  {
    title: "🔔 Notificaciones por área",
    desc: "Cada pedido listo notifica al rol correcto: mesero para mesas, cajero para retiros y rider para delivery. Cada área ve solo lo que le corresponde para operar sin ruido.",
  },
  {
    title: "🏪 Multi-sucursal",
    desc: "Gestiona múltiples locales desde una sola plataforma: menú, cajas, usuarios, delivery y reportes por sucursal. Roles diferenciados para administrador, restaurante, cajero, chef, bar y delivery.",
  },
];

const SectionMainFeatures = () => (
  <section className="py-24 bg-[#05050d]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-3">PandaPOS</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Funciones principales para operar sin fricción.</h2>
        <p className="text-white/55 text-lg">Todo conectado en un solo sistema para vender más, cometer menos errores y mantener el control del negocio.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {MAIN_FEATURES.map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-white text-xl font-black mb-3">{item.title}</h3>
            <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const PLAN_CARDS = [
  {
    name: "Basic",
    price: "$7.900",
    desc: "Para dejar de pagar comisión desde ya",
    items: ["Carta QR", "Pedidos por WhatsApp", "Soporte de arranque"],
    cta: "Empezar Basic",
    style: "border-white/10 bg-white/[0.03]",
  },
  {
    name: "Pro",
    price: "$11.900",
    desc: "Para crecer con más control diario",
    items: ["Todo Basic", "Gestión operativa completa", "Reportes para decidir mejor"],
    cta: "Elegir Pro",
    style: "border-violet-500/40 bg-violet-950/35",
  },
  {
    name: "Prime",
    price: "$14.900",
    desc: "Para operar sin límites y escalar",
    items: ["Todo Pro", "Automatización avanzada", "Soporte prioritario"],
    cta: "Ir por Prime",
    style: "border-amber-500/35 bg-amber-950/25",
  },
];

const SectionPricing = () => (
  <section id="planes" className="py-24 bg-[#04040b]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-3">Precios</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Más barato que una semana de comisiones.</h2>
        <p className="text-white/55 text-lg">Elige plan. Recupera margen. Cobra directo.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {PLAN_CARDS.map((plan) => (
          <div key={plan.name} className={`rounded-3xl border ${plan.style} p-7 flex flex-col`}>
            <p className="text-white/45 uppercase tracking-widest text-xs font-black mb-2">Plan</p>
            <h3 className="text-white text-3xl font-black mb-1">{plan.name}</h3>
            <p className="text-white text-4xl font-black mb-1">{plan.price}<span className="text-white/35 text-sm font-semibold">/mes</span></p>
            <p className="text-white/50 text-sm mb-5">{plan.desc}</p>

            <div className="space-y-2 mb-6">
              {plan.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#25D366]" />
                  <span className="text-white/70 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Link href={WHATSAPP_URL} target="_blank" className="mt-auto inline-flex justify-center items-center rounded-xl py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-black text-sm transition-all">
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SectionFinalCTA = () => (
  <section className="py-24 bg-[#07070f]">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-5">
        Deja de pagar comisiones.
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-emerald-400">Empieza a vender directo hoy.</span>
      </h2>
      <p className="text-white/55 text-xl mb-8">Más dinero por orden. Más control del negocio. Más independencia para crecer.</p>

      <Link href={WHATSAPP_URL} target="_blank" className="inline-flex items-center gap-2 px-9 py-5 rounded-2xl bg-[#25D366] hover:bg-[#22be5b] text-white text-lg font-black transition-all shadow-lg shadow-[#25D366]/25">
        <MessageCircle size={22} /> Hablar por WhatsApp
      </Link>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#04040b] border-t border-white/10 py-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <Link href="/home" className="flex items-center gap-3 text-white font-black text-xl">
        <img src="/logo.png" alt="PandaPOS" className="w-9 h-9 object-contain" /> PandaPOS
      </Link>
      <p className="text-white/30 text-sm">© {new Date().getFullYear()} PandaPOS</p>
    </div>
  </footer>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07070f] font-sans selection:bg-violet-500/30 selection:text-violet-100">
      <Navbar />
      <main>
        <Hero />
        <SectionProblem />
        <SectionSolution />
        <SectionBenefits />
        <SectionDifferentiator />
        <SectionPower />
        <SectionSocialProof />
        <SectionMainFeatures />
        <SectionPricing />
        <SectionFinalCTA />
      </main>
      <Footer />
    </div>
  );
}
