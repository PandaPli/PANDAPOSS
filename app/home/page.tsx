"use client";

import Link from "next/link";
import {
  MessageCircle, CheckCircle2, QrCode, ArrowRight,
  Zap, Monitor, Bot, ShoppingCart, Bike, CreditCard,
  BarChart3, Bell, Check, X, Star, Receipt,
} from "lucide-react";

const WA = "https://wa.me/56999011141?text=Hola%2C%20quiero%20dejar%20de%20pagar%20comisiones%20y%20vender%20directo%20con%20PandaPOS";
const sg: React.CSSProperties = { fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" };
const dm: React.CSSProperties = { fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)" };

/* ── gradient border wrapper ─────────────────────────────────────── */
const GB = ({
  children, from = "rgba(139,92,246,0.6)", to = "rgba(99,102,241,0.2)",
  via, bg = "#0d0d18", className = "", radius = "1rem",
}: {
  children: React.ReactNode; from?: string; to?: string; via?: string;
  bg?: string; className?: string; radius?: string;
}) => (
  <div
    className={className}
    style={{
      padding: 1,
      borderRadius: radius,
      background: via
        ? `linear-gradient(135deg,${from},${via},${to})`
        : `linear-gradient(135deg,${from},${to})`,
    }}
  >
    <div style={{ borderRadius: `calc(${radius} - 1px)`, background: bg, height: "100%" }}>
      {children}
    </div>
  </div>
);

/* ── aurora blobs ───────────────────────────────────────────────── */
const Aurora = ({ className = "" }: { className?: string }) => (
  <div className={`absolute pointer-events-none overflow-hidden ${className}`} style={{ inset: 0 }}>
    <div style={{ position: "absolute", top: "-10%", left: "10%", width: 700, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(124,58,237,0.18) 0%,transparent 70%)", filter: "blur(40px)" }} />
    <div style={{ position: "absolute", top: "30%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(219,39,119,0.1) 0%,transparent 70%)", filter: "blur(60px)" }} />
    <div style={{ position: "absolute", bottom: "-10%", left: "40%", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(37,211,102,0.07) 0%,transparent 70%)", filter: "blur(50px)" }} />
  </div>
);

/* ── dot grid ───────────────────────────────────────────────────── */
const Dots = ({ opacity = 1 }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)", backgroundSize: "28px 28px", opacity }} />
);

/* ═══════════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════ */
const Navbar = () => (
  <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", background: "rgba(8,8,15,0.8)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
      <Link href="/home" className="flex items-center gap-2.5 text-white font-black text-lg" style={sg}>
        <img src="/logo.png" alt="PandaPOS" className="w-8 h-8 object-contain" />
        PandaPOS
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {[["El problema","#problema"],["Cómo funciona","#como-funciona"],["Planes","#planes"]].map(([l,h])=>(
          <Link key={h} href={h} className="text-white/40 hover:text-white text-sm font-semibold transition-colors" style={dm}>{l}</Link>
        ))}
        <Link href={WA} target="_blank" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", boxShadow: "0 0 20px rgba(37,211,102,0.3)" }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90 transition-opacity">
          <MessageCircle size={14}/> Hablar por WhatsApp
        </Link>
      </div>
      <Link href={WA} target="_blank" className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-black" style={{ ...sg, background: "#25D366" }}>
        <MessageCircle size={14}/> WhatsApp
      </Link>
    </div>
  </nav>
);

/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP MOCKUP
══════════════════════════════════════════════════════════════════ */
const Mockup = () => (
  <div className="relative">
    <div style={{ position: "absolute", inset: -24, background: "radial-gradient(ellipse,rgba(37,211,102,0.12) 0%,transparent 70%)", filter: "blur(30px)", borderRadius: "50%" }} />
    <GB from="rgba(37,211,102,0.5)" via="rgba(99,102,241,0.3)" to="rgba(139,92,246,0.4)" radius="1.25rem" className="relative shadow-2xl">
      <div style={{ background: "linear-gradient(145deg,#111120,#0c0c18)", borderRadius: "calc(1.25rem - 1px)", overflow: "hidden" }}>
        {/* Header bar */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={14} color="white"/>
          </div>
          <div>
            <p style={{ ...sg, color: "white", fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>Tu Restaurante · PandaPOS</p>
            <p style={{ ...dm, color: "#25D366", fontSize: 10 }}>● en línea</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {[1,2,3].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.15)"}}/>)}
          </div>
        </div>
        {/* Chat */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Order card */}
          <div style={{ maxWidth: "90%" }}>
            <GB from="rgba(139,92,246,0.4)" to="rgba(99,102,241,0.2)" radius="0.875rem" bg="#161628">
              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ ...sg, color: "white", fontWeight: 800, fontSize: 13 }}>Pedido #1.247</span>
                  <span style={{ ...dm, background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>Mesa 4</span>
                </div>
                {["2× Sushi Roll Salmón","1× Causa Rellena","3× Agua s/gas"].map(item=>(
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0 }}/>
                    <span style={{ ...dm, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{item}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...dm, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Total</span>
                  <span style={{ ...sg, color: "white", fontWeight: 800, fontSize: 15 }}>$22.500</span>
                </div>
              </div>
            </GB>
            <span style={{ ...dm, color: "rgba(255,255,255,0.2)", fontSize: 10, marginLeft: 4 }}>hace 2 min</span>
          </div>
          {/* Confirmations */}
          {["Pedido enviado al KDS ✓","0% de comisión cobrada ✓","Cliente guardado en tu base ✓"].map(t=>(
            <div key={t} style={{ alignSelf: "flex-end", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "14px 14px 2px 14px", padding: "8px 12px" }}>
              <span style={{ ...dm, color: "#4ade80", fontSize: 11, fontWeight: 600 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </GB>
    {/* Floating badges */}
    <div style={{ position: "absolute", top: -16, right: -16, background: "linear-gradient(135deg,#2d0a0a,#1a0606)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(239,68,68,0.2)" }}>
      <p style={{ ...dm, color: "rgba(252,165,165,0.7)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Uber Eats te cobraría</p>
      <p style={{ ...sg, color: "#f87171", fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>−$6.750</p>
    </div>
    <div style={{ position: "absolute", bottom: -16, left: -16, background: "linear-gradient(135deg,#061a0e,#041008)", border: "1px solid rgba(37,211,102,0.35)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(37,211,102,0.15)" }}>
      <p style={{ ...dm, color: "rgba(74,222,128,0.6)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Con PandaPOS</p>
      <p style={{ ...sg, color: "#4ade80", fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>$0 comisión</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
const Hero = () => (
  <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 80, paddingBottom: 80, background: "#08080f", position: "relative", overflow: "hidden" }}>
    <Aurora />
    <Dots />
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
            <span style={{ ...dm, color: "rgba(196,181,253,0.9)", fontSize: 12, fontWeight: 600 }}>Sin comisiones · Pedidos directos · Empieza hoy</span>
          </div>
          {/* Headline */}
          <h1 style={{ ...sg, fontSize: "clamp(2.8rem,5.5vw,4.8rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.02em", color: "white", marginBottom: 12 }}>
            Las apps de delivery
            <br />
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>te cobran un 30%</span>
            <br/>por cada pedido.
          </h1>
          <p style={{ ...dm, color: "rgba(196,181,253,0.6)", fontSize: 13, fontWeight: 500, marginBottom: 16, letterSpacing: "0.02em" }}>
            Uber Eats · PedidosYa · Rappi · y todas las demás.
          </p>
          <p style={{ ...dm, color: "rgba(255,255,255,0.45)", fontSize: 18, lineHeight: 1.65, maxWidth: 480, marginBottom: 36 }}>
            PandaPOS te da tu propio canal de ventas por{" "}
            <span style={{ color: "white", fontWeight: 600 }}>QR y WhatsApp</span>.
            Tus clientes piden directo a ti. Sin comisión por orden.
          </p>
          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
            <Link href={WA} target="_blank" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", boxShadow: "0 4px 24px rgba(37,211,102,0.35)", padding: "14px 28px", borderRadius: 14, color: "white", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <MessageCircle size={17}/> Hablar por WhatsApp
            </Link>
            <Link href="#como-funciona" style={{ ...sg, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", padding: "14px 28px", borderRadius: 14, color: "white", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              Ver cómo funciona <ArrowRight size={15}/>
            </Link>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[{v:"0%",l:"comisión por pedido"},{v:"$7.900",l:"desde /mes"},{v:"24/7",l:"automático"}].map(s=>(
              <div key={s.l}>
                <p style={{ ...sg, color: "white", fontWeight: 900, fontSize: 24 }}>{s.v}</p>
                <p style={{ ...dm, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <Mockup/>
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   STATS BAR
══════════════════════════════════════════════════════════════════ */
const StatsBar = () => (
  <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", padding: "20px 0" }}>
        {[
          {v:"0%",l:"Comisión por pedido",c:"#a78bfa"},
          {v:"30%",l:"Margen que recuperas",c:"#4ade80"},
          {v:"5 min",l:"Para activar",c:"#60a5fa"},
          {v:"24/7",l:"Pedidos automáticos",c:"#f9a8d4"},
        ].map((s,i)=>(
          <div key={s.l} style={{ textAlign: "center", padding: "0 16px", borderRight: i<3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <p style={{ ...sg, color: s.c, fontWeight: 900, fontSize: 26 }}>{s.v}</p>
            <p style={{ ...dm, color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PROBLEM — comparison table
══════════════════════════════════════════════════════════════════ */
const SectionProblem = () => (
  <section id="problema" style={{ padding: "96px 0", background: "#060609", position: "relative" }}>
    <div className="max-w-5xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ ...dm, color: "#f87171", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>El problema real</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          Las apps te consiguen pedidos.<br/>
          <span style={{ background: "linear-gradient(135deg,#f87171,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Y se quedan con el margen.</span>
        </h2>
      </div>

      <GB from="rgba(239,68,68,0.3)" via="rgba(255,255,255,0.05)" to="rgba(139,92,246,0.3)" radius="1.25rem" bg="#0a0a12">
        <div style={{ overflow: "hidden", borderRadius: "calc(1.25rem - 1px)" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "20px 24px" }}/>
            <div style={{ padding: "20px 24px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ ...sg, color: "#f87171", fontWeight: 800, fontSize: 15 }}>Apps de delivery</p>
              <p style={{ ...dm, color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>Uber Eats, PedidosYa…</p>
            </div>
            <div style={{ padding: "20px 24px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(139,92,246,0.06)" }}>
              <p style={{ ...sg, color: "#c4b5fd", fontWeight: 800, fontSize: 15 }}>PandaPOS</p>
              <p style={{ ...dm, color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>Tu canal directo</p>
            </div>
          </div>
          {[
            {l:"Comisión por pedido",a:"18–30%",p:"0%",ar:true,pg:true},
            {l:"Dueño de tus clientes",a:"No",p:"Sí",ar:true,pg:true},
            {l:"Canal de venta propio",a:"No",p:"Sí",ar:true,pg:true},
            {l:"Datos del cliente",a:"Son de la app",p:"Son tuyos",ar:true,pg:true},
            {l:"Costo mensual fijo",a:"Gratis* (+30%)",p:"Desde $7.900",ar:false,pg:false},
          ].map((row,i)=>(
            <div key={row.l} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: i<4 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i%2===0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <div style={{ padding: "16px 24px", display: "flex", alignItems: "center" }}>
                <span style={{ ...dm, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{row.l}</span>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                {row.ar ? (
                  <span style={{ ...sg, color: "#f87171", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <X size={13}/> {row.a}
                  </span>
                ) : (
                  <span style={{ ...dm, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>{row.a}</span>
                )}
              </div>
              <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid rgba(255,255,255,0.04)", background: "rgba(139,92,246,0.04)" }}>
                {row.pg ? (
                  <span style={{ ...sg, color: "#4ade80", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={13}/> {row.p}
                  </span>
                ) : (
                  <span style={{ ...sg, color: "white", fontWeight: 700, fontSize: 13 }}>{row.p}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </GB>
      <p style={{ ...dm, color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", marginTop: 16 }}>*Gratis para entrar, pero cada pedido te cuesta entre 18% y 30% de comisión.</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   SOLUTION — 3 steps
══════════════════════════════════════════════════════════════════ */
const SectionSolution = () => (
  <section style={{ padding: "96px 0", background: "#08080f", position: "relative", overflow: "hidden" }} id="como-funciona">
    <Aurora className="opacity-50"/>
    <Dots opacity={0.5}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 56px" }}>
        <p style={{ ...dm, color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>La solución</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em" }}>Tu canal. Tu margen. Tus clientes.</h2>
        <p style={{ ...dm, color: "rgba(255,255,255,0.4)", fontSize: 17, marginTop: 14, lineHeight: 1.6 }}>QR → Carta → Pedido → WhatsApp. Sin apps de por medio.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="grid-cols-1 md:grid-cols-3">
        {[
          {icon:<Receipt size={22} className="text-violet-300"/>,n:"01",title:"Escanean tu QR",desc:"En la mesa, el packaging o la boleta. El cliente entra a tu menú en segundos.",from:"rgba(139,92,246,0.5)",to:"rgba(99,102,241,0.1)"},
          {icon:<ShoppingCart size={22} className="text-indigo-300"/>,n:"02",title:"Ven tu carta y piden",desc:"Menú digital con fotos, variantes y precios. El pedido armado, sin confusión.",from:"rgba(99,102,241,0.5)",to:"rgba(168,85,247,0.1)"},
          {icon:<MessageCircle size={22} className="text-[#25D366]"/>,n:"03",title:"Llega directo a ti",desc:"El pedido llega confirmado. Sin intermediarios, sin porcentaje, sin esperas.",from:"rgba(37,211,102,0.5)",to:"rgba(16,185,129,0.1)"},
        ].map(s=>(
          <GB key={s.n} from={s.from} to={s.to} radius="1rem" bg="#0d0d18" className="h-full">
            <div style={{ padding: "28px 24px", height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                <span style={{ ...sg, color: "rgba(255,255,255,0.12)", fontWeight: 900, fontSize: 28 }}>{s.n}</span>
              </div>
              <h3 style={{ ...sg, color: "white", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ ...dm, color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </GB>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   POWER — boleta QR loop
══════════════════════════════════════════════════════════════════ */
const SectionPower = () => (
  <section style={{ padding: "96px 0", background: "#060609" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="grid-cols-1 md:grid-cols-2">
        <div>
          <p style={{ ...dm, color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>El ciclo que cambia todo</p>
          <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 18 }}>
            Convierte cada boleta en una nueva venta.
          </h2>
          <p style={{ ...dm, color: "rgba(255,255,255,0.4)", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Sin que tú hagas nada. Sin comisión.
          </p>
          <Link href={WA} target="_blank" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", boxShadow: "0 4px 20px rgba(37,211,102,0.3)", padding: "12px 24px", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <MessageCircle size={15}/> Activar ciclo directo
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {icon:<Receipt size={17}/>,label:"Entrega con QR impreso",desc:"Cada boleta lleva tu QR.",from:"rgba(139,92,246,0.35)",to:"rgba(255,255,255,0.05)",ic:"rgba(139,92,246,0.6)"},
            {icon:<QrCode size={17}/>,label:"Escanea cuando quiere",desc:"Tu menú siempre disponible.",from:"rgba(99,102,241,0.35)",to:"rgba(255,255,255,0.05)",ic:"rgba(99,102,241,0.6)"},
            {icon:<MessageCircle size={17}/>,label:"Nuevo pedido, cero comisión",desc:"Tú cobras el 100%.",from:"rgba(37,211,102,0.35)",to:"rgba(255,255,255,0.05)",ic:"rgba(37,211,102,0.5)"},
          ].map((s,i)=>(
            <GB key={i} from={s.from} to={s.to} radius="0.875rem" bg="#0c0c16">
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.ic, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>{s.icon}</div>
                <div>
                  <p style={{ ...sg, color: "white", fontWeight: 800, fontSize: 13 }}>{s.label}</p>
                  <p style={{ ...dm, color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{s.desc}</p>
                </div>
                <span style={{ ...sg, color: "rgba(255,255,255,0.08)", fontWeight: 900, fontSize: 22, marginLeft: "auto" }}>{i+1}</span>
              </div>
            </GB>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   SOCIAL PROOF
══════════════════════════════════════════════════════════════════ */
const SectionSocialProof = () => (
  <section style={{ padding: "96px 0", background: "#08080f", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse,rgba(139,92,246,0.08) 0%,transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }}/>
    <div className="max-w-3xl mx-auto px-5 sm:px-8">
      <GB from="rgba(139,92,246,0.4)" via="rgba(255,255,255,0.08)" to="rgba(37,211,102,0.3)" radius="1.5rem" bg="#0d0d1a">
        <div style={{ padding: "48px 40px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
            {[...Array(5)].map((_,i)=><Star key={i} size={17} style={{ color: "#fbbf24", fill: "#fbbf24" }}/>)}
          </div>
          <blockquote style={{ ...sg, color: "white", fontSize: "clamp(1.1rem,2vw,1.4rem)", fontWeight: 700, lineHeight: 1.45, marginBottom: 32 }}>
            "Antes le pagábamos casi 28% entre comisiones y promos. Con PandaPOS, la mitad de los pedidos ya son directos por WhatsApp y ese margen volvió a la caja. En el primer mes recuperamos lo que costó el sistema."
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 15 }} >M</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ ...sg, color: "white", fontWeight: 800, fontSize: 13 }}>María P.</p>
              <p style={{ ...dm, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Dueña de dark kitchen · Santiago</p>
            </div>
          </div>
        </div>
      </GB>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FEATURES BENTO
══════════════════════════════════════════════════════════════════ */
const FEATS = [
  {icon:<Monitor size={19}/>,title:"KDS — Cocina en tiempo real",desc:"Pantallas que reciben pedidos al instante desde cualquier canal. Filtra por estación, muestra tiempos y notifica al área correcta cuando el pedido está listo.",wide:true,from:"rgba(139,92,246,0.5)",to:"rgba(99,102,241,0.15)",ic:"rgba(139,92,246,0.7)"},
  {icon:<Bot size={19}/>,title:"Bot de WhatsApp 24/7",desc:"El bot arma el carrito, pregunta retiro o delivery y envía al KDS. Sin intervención humana.",wide:false,from:"rgba(37,211,102,0.4)",to:"rgba(16,185,129,0.1)",ic:"rgba(37,211,102,0.7)"},
  {icon:<ShoppingCart size={19}/>,title:"Carta online y kiosko",desc:"Menú digital por QR o link. Personaliza, elige zona, paga con MP o transferencia.",wide:false,from:"rgba(99,102,241,0.4)",to:"rgba(139,92,246,0.1)",ic:"rgba(99,102,241,0.7)"},
  {icon:<Bike size={19}/>,title:"Gestión de delivery",desc:"Asigna repartidores, define zonas con precios y haz seguimiento en tiempo real.",wide:false,from:"rgba(245,158,11,0.4)",to:"rgba(234,179,8,0.1)",ic:"rgba(245,158,11,0.7)"},
  {icon:<CreditCard size={19}/>,title:"Punto de venta (POS)",desc:"Caja rápida con multipago, boleta térmica y gestión de mesas.",wide:false,from:"rgba(239,68,68,0.4)",to:"rgba(220,38,38,0.1)",ic:"rgba(239,68,68,0.7)"},
  {icon:<BarChart3 size={19}/>,title:"Panel de ventas",desc:"Ventas del día y mes, ticket promedio, ranking de clientes y pedidos directos en tiempo real.",wide:true,from:"rgba(56,189,248,0.4)",to:"rgba(14,165,233,0.1)",ic:"rgba(56,189,248,0.7)"},
  {icon:<Bell size={19}/>,title:"Notificaciones por área",desc:"Mesero, cajero y rider reciben solo lo que les corresponde. Menos ruido, más velocidad.",wide:false,from:"rgba(217,70,239,0.4)",to:"rgba(168,85,247,0.1)",ic:"rgba(217,70,239,0.7)"},
];

const SectionFeatures = () => (
  <section style={{ padding: "96px 0", background: "#060609" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 56px" }}>
        <p style={{ ...dm, color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Todo incluido</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em" }}>Un sistema. Sin fricción.</h2>
        <p style={{ ...dm, color: "rgba(255,255,255,0.35)", fontSize: 16, marginTop: 12 }}>Todo lo que necesitas para operar, vender y crecer.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {FEATS.map(f=>(
          <GB key={f.title} from={f.from} to={f.to} radius="1rem" bg="#0c0c17" className={f.wide ? "col-span-2" : ""} style={f.wide ? {gridColumn:"1/-1"} : {}}>
            <div style={{ padding: "24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: f.ic, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: `0 4px 16px ${f.ic}` }}>{f.icon}</div>
              <div style={{ maxWidth: f.wide ? 640 : "100%" }}>
                <h3 style={{ ...sg, color: "white", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ ...dm, color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          </GB>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   PRICING
══════════════════════════════════════════════════════════════════ */
const PLANS = [
  {name:"Basic",price:"$7.900",pitch:"Para dejar de pagar comisión desde ya.",items:["Carta QR con menú digital","Pedidos por WhatsApp","Gestión de mesas","Soporte de arranque"],cta:"Empezar con Basic",from:"rgba(255,255,255,0.12)",to:"rgba(255,255,255,0.04)",badge:null,ctaBg:"rgba(255,255,255,0.08)",bg:"#0c0c16"},
  {name:"Pro",price:"$11.900",pitch:"Para crecer con control total del día a día.",items:["Todo de Basic","KDS de cocina","Bot de WhatsApp 24/7","Delivery con zonas","Panel de ventas y reportes"],cta:"Elegir Pro",from:"rgba(139,92,246,0.7)",via:"rgba(99,102,241,0.4)",to:"rgba(168,85,247,0.5)",badge:"Más elegido",ctaBg:"linear-gradient(135deg,#7c3aed,#6366f1)",bg:"#0f0f20"},
  {name:"Prime",price:"$14.900",pitch:"Para operar sin límites y escalar.",items:["Todo de Pro","Multi-sucursal","Kiosko de autoatención","Pagos con Mercado Pago","Soporte prioritario"],cta:"Ir por Prime",from:"rgba(245,158,11,0.4)",to:"rgba(234,179,8,0.1)",badge:null,ctaBg:"rgba(255,255,255,0.08)",bg:"#0e0d0c"},
];

const SectionPricing = () => (
  <section id="planes" style={{ padding: "96px 0", background: "#08080f", position: "relative", overflow: "hidden" }}>
    <Aurora className="opacity-40"/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ ...dm, color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Precios</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em" }}>Más barato que una semana de comisiones.</h2>
        <p style={{ ...dm, color: "rgba(255,255,255,0.35)", fontSize: 16, marginTop: 12 }}>Elige un plan. Recupera margen. Cobra directo.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {PLANS.map(p=>(
          <div key={p.name} style={{ position: "relative" }}>
            {p.badge && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#6366f1)", boxShadow: "0 4px 16px rgba(124,58,237,0.5)", padding: "4px 16px", borderRadius: 999, color: "white", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", zIndex: 1, ...sg }}>
                {p.badge}
              </div>
            )}
            <GB from={p.from} via={p.via} to={p.to} radius="1.25rem" bg={p.bg} className="h-full">
              <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", height: "100%" }}>
                <p style={{ ...dm, color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Plan</p>
                <p style={{ ...sg, color: "white", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>{p.name}</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                  <span style={{ ...sg, color: "white", fontWeight: 900, fontSize: 36 }}>{p.price}</span>
                  <span style={{ ...dm, color: "rgba(255,255,255,0.25)", fontSize: 13, paddingBottom: 6 }}>/mes</span>
                </div>
                <p style={{ ...dm, color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>{p.pitch}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, flex: 1 }}>
                  {p.items.map(item=>(
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircle2 size={14} style={{ color: "#4ade80", flexShrink: 0, marginTop: 1 }}/>
                      <span style={{ ...dm, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href={WA} target="_blank" style={{ ...sg, background: p.ctaBg, padding: "12px 20px", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", boxShadow: p.badge ? "0 4px 20px rgba(124,58,237,0.4)" : "none" }}>
                  <MessageCircle size={14}/> {p.cta}
                </Link>
              </div>
            </GB>
          </div>
        ))}
      </div>
      <p style={{ ...dm, color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", marginTop: 24 }}>¿Tienes dudas sobre qué plan elegir? Hablamos por WhatsApp y te recomendamos el mejor.</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FINAL CTA
══════════════════════════════════════════════════════════════════ */
const SectionFinalCTA = () => (
  <section style={{ padding: "120px 0", background: "#060609", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 500, background: "radial-gradient(ellipse,rgba(124,58,237,0.15) 0%,rgba(37,211,102,0.05) 50%,transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }}/>
    <Dots opacity={0.4}/>
    <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 0 30px rgba(139,92,246,0.2)" }}>
        <Zap style={{ color: "#a78bfa" }} size={26}/>
      </div>
      <h2 style={{ ...sg, color: "white", fontSize: "clamp(2.4rem,5vw,4rem)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.02em", marginBottom: 20 }}>
        Deja de pagar comisiones.{" "}
        <span style={{ background: "linear-gradient(135deg,#25D366,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Empieza a cobrar directo hoy.
        </span>
      </h2>
      <p style={{ ...dm, color: "rgba(255,255,255,0.4)", fontSize: 18, marginBottom: 40, lineHeight: 1.65 }}>
        Más dinero por orden. Clientes que son tuyos. Control total.
      </p>
      <Link href={WA} target="_blank" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", boxShadow: "0 8px 40px rgba(37,211,102,0.35)", padding: "18px 40px", borderRadius: 16, color: "white", fontWeight: 900, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <MessageCircle size={20}/> Hablar por WhatsApp ahora
      </Link>
      <p style={{ ...dm, color: "rgba(255,255,255,0.18)", fontSize: 12, marginTop: 20 }}>Sin contratos. Sin permanencia. Activa hoy.</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════ */
const Footer = () => (
  <footer style={{ background: "#040407", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "36px 0" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: 800, fontSize: 16, textDecoration: "none", ...sg }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width: 28, height: 28, objectFit: "contain" }}/>
        PandaPOS
      </Link>
      <p style={{ ...dm, color: "rgba(255,255,255,0.18)", fontSize: 12 }}>© {new Date().getFullYear()} PandaPOS · Todos los derechos reservados</p>
      <Link href={WA} target="_blank" style={{ ...dm, color: "#25D366", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
        <MessageCircle size={13}/> WhatsApp
      </Link>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080f", ...dm }}>
      <Navbar/>
      <main>
        <Hero/>
        <StatsBar/>
        <SectionProblem/>
        <SectionSolution/>
        <SectionPower/>
        <SectionSocialProof/>
        <SectionFeatures/>
        <SectionPricing/>
        <SectionFinalCTA/>
      </main>
      <Footer/>
    </div>
  );
}
