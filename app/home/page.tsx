"use client";

import Link from "next/link";
import { 
  ArrowRight, Store, QrCode, CookingPot, Truck, 
  PackageSearch, MapPin, CheckCircle2, ChevronRight, 
  Wallet, Users, ChefHat, Wine, ServerCog, BarChart3, 
  BellRing, Laptop, MessageCircle, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Components
const Hero = () => (
  <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
    {/* Background Decorations */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-white to-white" />
    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-brand-100/40 rounded-full blur-3xl opacity-50" />
    <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl opacity-50" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 font-semibold text-sm mb-8 border border-brand-100 shadow-sm">
        <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        Todo nuevo: Sistema 100% en la nube
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold text-surface-text tracking-tight mb-8">
        Control total de tu restaurante <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
          desde un solo sistema
        </span>
      </h1>
      
      <p className="mt-4 max-w-2xl mx-auto text-xl text-surface-muted leading-relaxed mb-10">
        Ventas en caja, pedidos en mesa con QR y delivery integrado. 
        Todo conectado. Todo en tiempo real.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link 
          href="/login" 
          className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-2xl overflow-hidden shadow-xl shadow-brand-500/20 hover:scale-[1.02] hover:shadow-brand-500/30 transition-all duration-300 w-full sm:w-auto"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <span className="relative">Probar Demo</span>
          <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={18} />
        </Link>
        <Link 
          href="#planes" 
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-surface-text font-bold rounded-2xl border-2 border-surface-border hover:border-brand-300 hover:bg-brand-50 transition-all duration-300 w-full sm:w-auto"
        >
          Ver Planes
        </Link>
      </div>

      <p className="mt-8 text-sm font-semibold text-surface-muted flex items-center justify-center gap-2">
        <CheckCircle2 className="text-emerald-500" size={16} /> Menos enredos. 
        <CheckCircle2 className="text-emerald-500" size={16} /> Más ventas. 
        <CheckCircle2 className="text-emerald-500" size={16} /> Más control.
      </p>
    </div>
  </section>
);

const featureCards = [
  { icon: <Store className="text-blue-500" />, title: "Punto de Venta (POS)", desc: "Caja rápida e intuitiva", color: "bg-blue-50" },
  { icon: <Users className="text-emerald-500" />, title: "Gestión de Mesas", desc: "Mapa interactivo de tu local", color: "bg-emerald-50" },
  { icon: <QrCode className="text-purple-500" />, title: "Carta Digital QR", desc: "Pedidos directos de clientes", color: "bg-purple-50" },
  { icon: <CookingPot className="text-amber-500" />, title: "Pantallas KDS", desc: "Cocina y Barra digitalizadas", color: "bg-amber-50" },
  { icon: <Truck className="text-rose-500" />, title: "Delivery Integrado", desc: "Rutas y despachos en línea", color: "bg-rose-50" },
  { icon: <PackageSearch className="text-indigo-500" />, title: "Control de Inventario", desc: "Stock actualizado al segundo", color: "bg-indigo-50" },
  { icon: <MapPin className="text-cyan-500" />, title: "Multi-Sucursal", desc: "Todo tu imperio desde un login", color: "bg-cyan-50" },
];

const SectionWhatIs = () => (
  <section className="py-24 bg-surface-bg relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3">¿Qué es PandaPoss?</h2>
        <h3 className="text-3xl md:text-4xl font-extrabold text-surface-text mb-4">
          Una plataforma inteligente que lo unifica todo
        </h3>
        <p className="text-surface-muted text-lg">
          Olvídate de tener un sistema para ventas, otro para delivery y libretas para la cocina. 
          PandaPoss centraliza toda la operación de tu restaurante en la nube.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featureCards.map((feat, i) => (
          <div key={i} className="group bg-white rounded-3xl p-6 border border-surface-border shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feat.color)}>
              {feat.icon}
            </div>
            <h4 className="text-xl font-bold text-surface-text mb-2">{feat.title}</h4>
            <p className="text-surface-muted">{feat.desc}</p>
          </div>
        ))}
        {/* Placeholder for the 8th grid item to make it symmetrical, acting as an extra callout */}
        <div className="group bg-gradient-to-br from-brand-600 to-indigo-600 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-start text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
          <h4 className="text-2xl font-bold mb-2 relative z-10">Todo sincronizado</h4>
          <p className="text-brand-100 relative z-10 mb-4">En la nube, sin instalaciones raras.</p>
          <ArrowUpRight className="relative z-10 opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={32} />
        </div>
      </div>
    </div>
  </section>
);

const SectionWorkflow = () => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-surface-text mb-4">
          Un solo flujo para todo tu negocio
        </h2>
        <p className="text-brand-600 font-semibold text-lg">Un solo sistema. Cero desorden.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-surface-bg rounded-3xl p-8 border border-surface-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
            <Store size={120} />
          </div>
          <h3 className="text-2xl font-bold text-surface-text mb-4 flex items-center gap-3">
            <span className="bg-brand-100 text-brand-600 p-2 rounded-xl"><Store size={24}/></span>
            En el local
          </h3>
          <p className="text-surface-muted leading-relaxed text-lg">
            Cobra rápido, envía pedidos a cocina al instante y controla el estado de cada mesa en tiempo real desde la caja.
          </p>
        </div>

        <div className="bg-surface-bg rounded-3xl p-8 border border-surface-border relative overflow-hidden group hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/10 transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
            <QrCode size={120} />
          </div>
          <h3 className="text-2xl font-bold text-surface-text mb-4 flex items-center gap-3">
            <span className="bg-purple-100 text-purple-600 p-2 rounded-xl"><QrCode size={24}/></span>
            En la mesa
          </h3>
          <p className="text-surface-muted leading-relaxed text-lg">
            Tus clientes escanean el QR, piden y pagan desde su celular. El pedido entra directo a la pantalla de la cocina.
          </p>
        </div>

        <div className="bg-surface-bg rounded-3xl p-8 border border-surface-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
            <Truck size={120} />
          </div>
          <h3 className="text-2xl font-bold text-surface-text mb-4 flex items-center gap-3">
            <span className="bg-rose-100 text-rose-600 p-2 rounded-xl"><Truck size={24}/></span>
            A domicilio
          </h3>
          <p className="text-surface-muted leading-relaxed text-lg">
            Recibe pedidos online, calcula envíos automáticamente y permite seguimiento en vivo para tus clientes.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const roles = [
  { role: "Cajeros", text: "Ventas rápidas y control exacto de caja.", icon: <Wallet/>, color: "text-blue-500 bg-blue-50" },
  { role: "Meseros", text: "Mapa visual de mesas y comanda sin errores.", icon: <Users/>, color: "text-emerald-500 bg-emerald-50" },
  { role: "Cocina", text: "Pedidos claros ordenados por prioridad en pantalla.", icon: <ChefHat/>, color: "text-amber-500 bg-amber-50" },
  { role: "Barra", text: "Bebidas y tragos organizados separadamente.", icon: <Wine/>, color: "text-rose-500 bg-rose-50" },
  { role: "Admins", text: "Reportes en vivo, configuración y control total.", icon: <ServerCog/>, color: "text-indigo-500 bg-indigo-50" },
];

const SectionRoles = () => (
  <section className="py-24 bg-surface-bg">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-surface-text mb-6">
            Diseñado especialmente para cada rol
          </h2>
          <p className="text-surface-muted text-lg mb-8">
            El sistema se adapta a quien lo usa. Cada usuario ve solo lo que necesita para hacer su trabajo excelente, sin distracciones.
          </p>
          <div className="space-y-4">
            {roles.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-border shadow-sm hover:shadow-md hover:border-brand-200 transition-all">
                <div className={cn("p-3 rounded-xl", r.color)}>
                  {r.icon}
                </div>
                <div>
                  <h4 className="font-bold text-surface-text">{r.role}</h4>
                  <p className="text-sm text-surface-muted">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-tr from-brand-100 to-indigo-50 border-8 border-white shadow-2xl overflow-hidden relative flex items-center justify-center">
             {/* Abstract UI representation */}
             <div className="absolute inset-x-8 top-8 bottom-8 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-lg p-6 flex flex-col gap-4">
                <div className="h-8 bg-surface-border/50 rounded-lg w-1/3" />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-brand-50 rounded-xl border border-brand-100" />
                  <div className="bg-surface-bg rounded-xl border border-surface-border flex flex-col gap-2 p-4">
                    <div className="h-4 bg-surface-border rounded w-3/4" />
                    <div className="h-4 bg-surface-border rounded w-1/2" />
                    <div className="mt-auto h-8 bg-brand-500 rounded-lg w-full opacity-80" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionControl = () => (
  <section className="py-24 bg-brand-900 text-white relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-600 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2" />
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Control total del negocio</h2>
      <p className="text-brand-100 text-xl max-w-2xl mx-auto mb-16">
        Decisiones basadas en datos, no en intuición.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
        {[
          { icon: <BarChart3/>, title: "Ventas en tiempo real" },
          { icon: <PackageSearch/>, title: "Inventario automático" },
          { icon: <BellRing/>, title: "Alertas de stock bajo" },
          { icon: <MessageCircle/>, title: "Reportes diarios automáticos" },
          { icon: <Wallet/>, title: "Control de turnos de caja" },
          { icon: <Store/>, title: "Gestión de sucursales" },
        ].map((feat, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-brand-300 backdrop-blur-sm border border-white/5">
              {feat.icon}
            </div>
            <h4 className="font-bold text-lg">{feat.title}</h4>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const BASICO_FEATURES = [
  "VENTAS Y CAJA",
  "GESTIÓN DE MESAS",
  "CARTA DIGITAL (QR)",
  "REPORTES BÁSICOS",
  "GESTIÓN DE PRODUCTOS",
  "USUARIOS Y PERFILES",
];

const PRO_FEATURES = [
  "VENTAS Y CAJA",
  "GESTIÓN DE MESAS",
  "CARTA DIGITAL (QR)",
  "REPORTES AVANZADOS",
  "GESTIÓN DE PRODUCTOS",
  "USUARIOS Y PERFILES",
  "KDS COCINA (PANTALLA)",
  "DELIVERY Y PEDIDOS",
  "STOCK AVANZADO",
  "MULTI SUCURSAL",
];

const SectionPlans = () => (
  <section id="planes" className="py-24 bg-[#0a0b14] relative overflow-hidden">
    {/* Background glow */}
    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          TODO TU RESTAURANTE<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">BAJO CONTROL</span>
        </h2>
        <p className="text-gray-400 text-lg font-medium tracking-widest uppercase">Desde un solo sistema</p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm font-bold text-gray-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-cyan-400" />FÁCIL</span>
          <span className="text-gray-600">•</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-cyan-400" />RÁPIDO</span>
          <span className="text-gray-600">•</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-cyan-400" />INTUITIVO</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* PLAN BÁSICO */}
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#0f1120] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f2a3a] to-[#0a1e2e] px-8 pt-8 pb-6 border-b border-cyan-500/20">
            <p className="text-cyan-400 text-xs font-black tracking-[0.3em] uppercase mb-1">PLAN</p>
            <h3 className="text-4xl font-black text-cyan-400 tracking-tight mb-1">BÁSICO</h3>
            {/* Precio */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-white text-3xl font-black">$7.900</span>
              <span className="text-cyan-400/70 text-sm font-semibold">/mes</span>
            </div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40">
              <span className="text-cyan-300 text-xs font-black tracking-widest uppercase">IDEAL PARA COMENZAR</span>
            </div>
          </div>

          {/* Features */}
          <div className="px-8 py-6 flex-1 space-y-3">
            {BASICO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-cyan-400" />
                </div>
                <span className="text-white font-bold text-sm tracking-wide">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <Link
              href="/login"
              className="block w-full py-4 rounded-2xl font-black text-center text-sm tracking-widest uppercase transition-all bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-[#0a0b14] shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            >
              PRUEBA GRATIS
            </Link>
            <p className="text-center mt-4 text-xs text-gray-500 flex items-center justify-center gap-3 font-semibold">
              <span>⚡ SIMPLE</span><span>•</span><span>🔒 SEGURO</span><span>•</span><span>📈 ESCALABLE</span>
            </p>
          </div>
        </div>

        {/* PLAN PRO */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-[#0f1120] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.15)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2a1a00] to-[#1e1200] px-8 pt-8 pb-6 border-b border-amber-500/20">
            <p className="text-amber-400 text-xs font-black tracking-[0.3em] uppercase mb-1">PLAN</p>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-4xl font-black text-amber-400 tracking-tight">PRO</h3>
              <span className="text-2xl">👑</span>
            </div>
            {/* Precio */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-white text-3xl font-black">$11.900</span>
              <span className="text-amber-400/70 text-sm font-semibold">/mes</span>
            </div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40">
              <span className="text-amber-300 text-xs font-black tracking-widest uppercase">CONTROL TOTAL</span>
            </div>
          </div>

          {/* Features */}
          <div className="px-8 py-6 flex-1 space-y-3">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-amber-400" />
                </div>
                <span className="text-white font-bold text-sm tracking-wide">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <Link
              href="https://wa.me/56999011141?text=Hola%2C%20quiero%20contratar%20PandaPoss%20PRO"
              target="_blank"
              className="block w-full py-4 rounded-2xl font-black text-center text-sm tracking-widest uppercase transition-all bg-gradient-to-r from-amber-500 to-amber-400 text-[#0a0b14] hover:from-amber-400 hover:to-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]"
            >
              CONTRATAR AHORA
            </Link>
            <p className="text-center mt-4 text-xs text-gray-500 flex items-center justify-center gap-3 font-semibold">
              <span>⚡ SIMPLE</span><span>•</span><span>🔒 SEGURO</span><span>•</span><span>📈 ESCALABLE</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionExperience = () => (
  <section className="py-24 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="absolute inset-0 bg-brand-100 rounded-[3rem] transform -rotate-6 scale-105" />
          <div className="relative bg-surface-bg border border-surface-border rounded-3xl p-8 shadow-xl space-y-4">
             {/* Mock Notifications */}
             <div className="bg-white border-l-4 border-emerald-500 rounded-xl p-4 shadow-sm flex items-center gap-4 animate-fade-in" style={{animationDelay: '100ms'}}>
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">🎉</div>
               <div>
                 <p className="font-bold text-surface-text text-sm">¡Venta completada!</p>
                 <p className="text-xs text-surface-muted">Mesa 4 cerrada con éxito.</p>
               </div>
             </div>
             
             <div className="bg-white border-l-4 border-brand-500 rounded-xl p-4 shadow-sm flex items-center gap-4 animate-fade-in" style={{animationDelay: '300ms'}}>
               <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xl">🔥</div>
               <div>
                 <p className="font-bold text-surface-text text-sm">¡Pedido en marcha!</p>
                 <p className="text-xs text-surface-muted">La cocina acaba de iniciar la orden #32.</p>
               </div>
             </div>

             <div className="bg-gradient-to-r from-indigo-500 to-brand-500 rounded-xl p-5 shadow-sm flex items-center gap-4 text-white animate-fade-in" style={{animationDelay: '600ms'}}>
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🐼</div>
               <div>
                 <p className="font-bold text-sm">¡Hola, Maria!</p>
                 <p className="text-xs text-brand-100">¡Ten un maravilloso turno hoy!</p>
               </div>
             </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl md:text-5xl font-extrabold text-surface-text mb-6">
            Una experiencia que tu equipo va a amar
          </h2>
          <p className="text-surface-muted text-lg mb-8 leading-relaxed">
            Interfaz moderna, extremadamente rápida y agradable a la vista. Con mensajes positivos que motivan y hacen más llevadero cada turno.
            <br/><br/>
            <strong>Tecnología que ayuda, no que estorba.</strong>
          </p>
          <div className="flex items-center gap-4 text-brand-600 font-bold">
            <Laptop size={24} /> UI 100% Optimizada
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionCTA = () => (
  <section className="py-24 bg-surface-bg">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-[3rem] p-10 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 relative z-10">
          Lleva tu restaurante al siguiente nivel
        </h2>
        <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto relative z-10">
          Únete a los restaurantes que ya están simplificando sus operaciones y aumentando sus ventas diarias.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
          <Link 
            href="/login" 
            className="px-10 py-5 bg-white text-brand-700 font-bold rounded-2xl shadow-xl hover:bg-brand-50 hover:scale-[1.02] transition-all w-full sm:w-auto text-lg"
          >
            Comenzar Ahora
          </Link>
          <Link 
            href="https://wa.me/56999011141?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20PandaPoss"
            target="_blank"
            className="px-10 py-5 bg-black/20 text-white font-bold rounded-2xl hover:bg-black/30 backdrop-blur-sm transition-all border border-white/20 w-full sm:w-auto text-lg"
          >
            Solicitar Asesoría
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-white border-t border-surface-border py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3 font-black text-xl text-surface-text tracking-tight">
        <img src="/logo.png" alt="PandaPoss" className="w-10 h-10 object-contain drop-shadow" />
        PandaPoss
      </div>
      <p className="text-surface-muted text-sm">
        © {new Date().getFullYear()} PandaPoss. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white selection:bg-brand-200 selection:text-brand-900 font-sans">
      <Navbar />
      <main>
        <Hero />
        <SectionWhatIs />
        <SectionWorkflow />
        <SectionRoles />
        <SectionControl />
        <SectionPlans />
        <SectionExperience />
        <SectionCTA />
      </main>
      <Footer />
    </div>
  );
}

// A simple Navbar that only shows up on the landing page
const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-surface-border transition-all">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <Link href="/home" className="flex items-center gap-3 font-black text-2xl text-surface-text tracking-tight group">
          <img src="/logo.png" alt="PandaPoss" className="w-10 h-10 object-contain drop-shadow group-hover:scale-105 transition-transform" />
          PandaPoss
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#planes" className="text-sm font-bold text-surface-muted hover:text-brand-600 transition-colors">Planes</Link>
          <Link href="/login" className="px-5 py-2.5 bg-surface-bg text-surface-text text-sm font-bold rounded-xl border border-surface-border hover:border-brand-300 hover:bg-brand-50 transition-colors">
            Iniciar Sesión
          </Link>
          <Link href="/login" className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-brand-700 hover:shadow-lg transition-all">
            Probar Demo
          </Link>
        </div>
      </div>
    </div>
  </nav>
);
