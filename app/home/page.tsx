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

/* ── CSS animations ─────────────────────────────────────────────── */
const Animations = () => (
  <style>{`
    @keyframes pulse-glow {
      0%,100% { opacity:1; }
      50% { opacity:0.55; }
    }
    @keyframes float {
      0%,100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes float2 {
      0%,100% { transform: translateY(0px); }
      50% { transform: translateY(8px); }
    }
    @keyframes spin-slow {
      to { transform: rotate(360deg); }
    }
    @keyframes shimmer-border {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes glow-card-violet {
      0%,100% { box-shadow: 0 0 0 1px rgba(139,92,246,0.6), 0 8px 40px rgba(139,92,246,0.15); }
      50%      { box-shadow: 0 0 0 1px rgba(139,92,246,1),   0 8px 60px rgba(139,92,246,0.35); }
    }
    @keyframes glow-card-green {
      0%,100% { box-shadow: 0 0 0 1px rgba(37,211,102,0.6), 0 8px 40px rgba(37,211,102,0.12); }
      50%      { box-shadow: 0 0 0 1px rgba(37,211,102,1),   0 8px 60px rgba(37,211,102,0.3); }
    }
    @keyframes glow-card-blue {
      0%,100% { box-shadow: 0 0 0 1px rgba(56,189,248,0.6), 0 8px 40px rgba(56,189,248,0.12); }
      50%      { box-shadow: 0 0 0 1px rgba(56,189,248,1),   0 8px 60px rgba(56,189,248,0.3); }
    }
    @keyframes glow-card-red {
      0%,100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.6), 0 8px 40px rgba(239,68,68,0.12); }
      50%      { box-shadow: 0 0 0 1px rgba(239,68,68,1),   0 8px 60px rgba(239,68,68,0.3); }
    }
    @keyframes glow-card-amber {
      0%,100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.6), 0 8px 40px rgba(245,158,11,0.12); }
      50%      { box-shadow: 0 0 0 1px rgba(245,158,11,1),   0 8px 60px rgba(245,158,11,0.3); }
    }
    @keyframes glow-card-pink {
      0%,100% { box-shadow: 0 0 0 1px rgba(217,70,239,0.6), 0 8px 40px rgba(217,70,239,0.12); }
      50%      { box-shadow: 0 0 0 1px rgba(217,70,239,1),   0 8px 60px rgba(217,70,239,0.3); }
    }
    .card-hover { transition: transform 0.2s ease, filter 0.2s ease; }
    .card-hover:hover { transform: translateY(-3px) scale(1.01); filter: brightness(1.08); }
    .cta-pulse { animation: glow-card-green 2.5s ease-in-out infinite; }
    .badge-float { animation: float 3s ease-in-out infinite; }
    .badge-float2 { animation: float2 3.5s ease-in-out infinite; }
  `}</style>
);

/* ── glassmorphism card ─────────────────────────────────────────── */
const GlassCard = ({
  children,
  borderColor = "rgba(139,92,246,0.8)",
  glowAnim = "glow-card-violet",
  animDelay = "0s",
  className = "",
  style = {},
  radius = "1rem",
  noPad = false,
}: {
  children: React.ReactNode;
  borderColor?: string;
  glowAnim?: string;
  animDelay?: string;
  className?: string;
  style?: React.CSSProperties;
  radius?: string;
  noPad?: boolean;
}) => (
  <div
    className={`card-hover ${className}`}
    style={{
      borderRadius: radius,
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${borderColor}`,
      animation: `${glowAnim} 3s ease-in-out infinite`,
      animationDelay: animDelay,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    {/* inner subtle shine */}
    <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,255,255,0.05) 0%,transparent 60%)", pointerEvents:"none", borderRadius:radius }} />
    {noPad ? children : <div style={{ position:"relative", height:"100%" }}>{children}</div>}
  </div>
);

/* ── aurora blobs ───────────────────────────────────────────────── */
const Aurora = ({ className = "" }: { className?: string }) => (
  <div className={`absolute pointer-events-none overflow-hidden ${className}`} style={{ inset: 0, zIndex:0 }}>
    <div style={{ position:"absolute", top:"-15%", left:"5%", width:800, height:600, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(124,58,237,0.22) 0%,transparent 65%)", filter:"blur(50px)", animation:"pulse-glow 6s ease-in-out infinite" }} />
    <div style={{ position:"absolute", top:"25%", right:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(219,39,119,0.14) 0%,transparent 65%)", filter:"blur(60px)", animation:"pulse-glow 8s ease-in-out infinite", animationDelay:"2s" }} />
    <div style={{ position:"absolute", bottom:"-15%", left:"35%", width:700, height:500, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(37,211,102,0.1) 0%,transparent 65%)", filter:"blur(55px)", animation:"pulse-glow 7s ease-in-out infinite", animationDelay:"4s" }} />
  </div>
);

/* ── dot grid ───────────────────────────────────────────────────── */
const Dots = ({ opacity = 1 }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)", backgroundSize:"28px 28px", opacity, zIndex:0 }} />
);

/* ═══════════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════ */
const Navbar = () => (
  <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, borderBottom:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(24px)", background:"rgba(8,8,15,0.75)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
      <Link href="/home" className="flex items-center gap-2.5 text-white font-black text-lg" style={sg}>
        <img src="/logo.png" alt="PandaPOS" className="w-8 h-8 object-contain" />
        PandaPOS
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {[["El problema","#problema"],["Cómo funciona","#como-funciona"],["Planes","#planes"]].map(([l,h])=>(
          <Link key={h} href={h} className="text-white/40 hover:text-white text-sm font-semibold transition-colors" style={dm}>{l}</Link>
        ))}
        <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background:"linear-gradient(135deg,#25D366,#1db954)", padding:"10px 20px", borderRadius:12, color:"white", fontSize:13, fontWeight:800, display:"inline-flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <MessageCircle size={14}/> Hablar por WhatsApp
        </Link>
      </div>
      <Link href={WA} target="_blank" className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-black" style={{ ...sg, background:"#25D366" }}>
        <MessageCircle size={14}/> WhatsApp
      </Link>
    </div>
  </nav>
);

/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP MOCKUP
══════════════════════════════════════════════════════════════════ */
const Mockup = () => (
  <div className="relative" style={{ padding:"24px 0" }}>
    {/* glow behind */}
    <div style={{ position:"absolute", inset:-40, background:"radial-gradient(ellipse,rgba(37,211,102,0.18) 0%,rgba(139,92,246,0.12) 50%,transparent 75%)", filter:"blur(40px)", borderRadius:"50%", pointerEvents:"none" }} />

    <GlassCard borderColor="rgba(37,211,102,0.9)" glowAnim="glow-card-green" radius="1.25rem" noPad style={{ position:"relative", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>
      {/* header */}
      <div style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#25D366,#1db954)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 16px rgba(37,211,102,0.5)" }}>
          <MessageCircle size={15} color="white"/>
        </div>
        <div>
          <p style={{ ...sg, color:"white", fontSize:12, fontWeight:800 }}>Tu Restaurante · PandaPOS</p>
          <p style={{ ...dm, color:"#25D366", fontSize:10 }}>● en línea</p>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
          {[1,2,3].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,0.2)" }}/>)}
        </div>
      </div>
      {/* chat body */}
      <div style={{ padding:"18px", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ maxWidth:"90%" }}>
          <GlassCard borderColor="rgba(139,92,246,0.8)" glowAnim="glow-card-violet" radius="0.875rem" noPad>
            <div style={{ padding:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ ...sg, color:"white", fontWeight:800, fontSize:13 }}>Pedido #1.247</span>
                <span style={{ ...dm, background:"rgba(139,92,246,0.25)", border:"1px solid rgba(139,92,246,0.6)", color:"#c4b5fd", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999 }}>Mesa 4</span>
              </div>
              {["2× Sushi Roll Salmón","1× Causa Rellena","3× Agua s/gas"].map(item=>(
                <div key={item} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <div style={{ width:4, height:4, borderRadius:"50%", background:"#a78bfa", flexShrink:0 }}/>
                  <span style={{ ...dm, color:"rgba(255,255,255,0.5)", fontSize:12 }}>{item}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ ...dm, color:"rgba(255,255,255,0.3)", fontSize:11 }}>Total</span>
                <span style={{ ...sg, color:"white", fontWeight:800, fontSize:15 }}>$22.500</span>
              </div>
            </div>
          </GlassCard>
          <span style={{ ...dm, color:"rgba(255,255,255,0.2)", fontSize:10, marginLeft:4 }}>hace 2 min</span>
        </div>
        {["Pedido enviado al KDS ✓","0% de comisión cobrada ✓","Cliente guardado en tu base ✓"].map(t=>(
          <div key={t} style={{ alignSelf:"flex-end", background:"rgba(37,211,102,0.15)", border:"1px solid rgba(37,211,102,0.5)", borderRadius:"14px 14px 2px 14px", padding:"8px 12px", backdropFilter:"blur(8px)" }}>
            <span style={{ ...dm, color:"#4ade80", fontSize:11, fontWeight:600 }}>{t}</span>
          </div>
        ))}
      </div>
    </GlassCard>

    {/* floating badges */}
    <div className="badge-float" style={{ position:"absolute", top:-10, right:-20, background:"rgba(239,68,68,0.12)", backdropFilter:"blur(16px)", border:"1px solid rgba(239,68,68,0.8)", borderRadius:14, padding:"10px 16px", boxShadow:"0 0 30px rgba(239,68,68,0.3), 0 8px 32px rgba(0,0,0,0.4)" }}>
      <p style={{ ...dm, color:"rgba(252,165,165,0.8)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>Uber Eats te cobraría</p>
      <p style={{ ...sg, color:"#f87171", fontWeight:900, fontSize:22, lineHeight:1.2, textShadow:"0 0 20px rgba(239,68,68,0.6)" }}>−$6.750</p>
    </div>
    <div className="badge-float2" style={{ position:"absolute", bottom:-10, left:-20, background:"rgba(37,211,102,0.1)", backdropFilter:"blur(16px)", border:"1px solid rgba(37,211,102,0.8)", borderRadius:14, padding:"10px 16px", boxShadow:"0 0 30px rgba(37,211,102,0.25), 0 8px 32px rgba(0,0,0,0.4)" }}>
      <p style={{ ...dm, color:"rgba(74,222,128,0.8)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>Con PandaPOS</p>
      <p style={{ ...sg, color:"#4ade80", fontWeight:900, fontSize:22, lineHeight:1.2, textShadow:"0 0 20px rgba(37,211,102,0.6)" }}>$0 comisión</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
const Hero = () => (
  <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", paddingTop:80, paddingBottom:80, background:"#08080f", position:"relative", overflow:"hidden" }}>
    <Aurora />
    <Dots />
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full" style={{ zIndex:1 }}>
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999, background:"rgba(139,92,246,0.12)", border:"1px solid rgba(139,92,246,0.6)", marginBottom:28, backdropFilter:"blur(8px)", boxShadow:"0 0 20px rgba(139,92,246,0.15)", animation:"glow-card-violet 3s ease-in-out infinite" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#a78bfa", boxShadow:"0 0 8px #a78bfa", animation:"pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ ...dm, color:"rgba(196,181,253,0.95)", fontSize:12, fontWeight:600 }}>Sin comisiones · Pedidos directos · Empieza hoy</span>
          </div>
          <h1 style={{ ...sg, fontSize:"clamp(2.8rem,5.5vw,4.8rem)", fontWeight:900, lineHeight:1.02, letterSpacing:"-0.02em", color:"white", marginBottom:12 }}>
            Las apps de delivery
            <br/>
            <span style={{ background:"linear-gradient(135deg,#a78bfa,#818cf8,#c4b5fd)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", filter:"drop-shadow(0 0 20px rgba(139,92,246,0.5))" }}>te cobran un 30%</span>
            <br/>por cada pedido.
          </h1>
          <p style={{ ...dm, color:"rgba(196,181,253,0.65)", fontSize:13, fontWeight:600, marginBottom:16, letterSpacing:"0.04em" }}>
            Uber Eats · PedidosYa · Rappi · y todas las demás.
          </p>
          <p style={{ ...dm, color:"rgba(255,255,255,0.45)", fontSize:18, lineHeight:1.65, maxWidth:480, marginBottom:36 }}>
            PandaPOS te da tu propio canal de ventas por{" "}
            <span style={{ color:"white", fontWeight:700 }}>QR y WhatsApp</span>.
            Tus clientes piden directo a ti. Sin comisión por orden.
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:44 }}>
            <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background:"linear-gradient(135deg,#25D366,#1db954)", padding:"14px 28px", borderRadius:14, color:"white", fontWeight:800, fontSize:14, display:"inline-flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <MessageCircle size={17}/> Hablar por WhatsApp
            </Link>
            <Link href="#como-funciona" style={{ ...sg, background:"rgba(255,255,255,0.05)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", padding:"14px 28px", borderRadius:14, color:"white", fontWeight:800, fontSize:14, display:"inline-flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              Ver cómo funciona <ArrowRight size={15}/>
            </Link>
          </div>
          <div style={{ display:"flex", gap:32, flexWrap:"wrap" }}>
            {[{v:"0%",l:"comisión por pedido",c:"#a78bfa"},{v:"$7.900",l:"desde /mes",c:"#4ade80"},{v:"24/7",l:"automático",c:"#60a5fa"}].map(s=>(
              <div key={s.l}>
                <p style={{ ...sg, color:s.c, fontWeight:900, fontSize:26, textShadow:`0 0 20px ${s.c}` }}>{s.v}</p>
                <p style={{ ...dm, color:"rgba(255,255,255,0.3)", fontSize:12 }}>{s.l}</p>
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
  <div style={{ background:"rgba(255,255,255,0.025)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(8px)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", padding:"24px 0" }}>
        {[
          {v:"0%",l:"Comisión por pedido",c:"#a78bfa",glow:"rgba(139,92,246,0.5)"},
          {v:"30%",l:"Margen que recuperas",c:"#4ade80",glow:"rgba(37,211,102,0.5)"},
          {v:"5 min",l:"Para activar",c:"#60a5fa",glow:"rgba(96,165,250,0.5)"},
          {v:"24/7",l:"Pedidos automáticos",c:"#f9a8d4",glow:"rgba(249,168,212,0.5)"},
        ].map((s,i)=>(
          <div key={s.l} style={{ textAlign:"center", padding:"0 16px", borderRight:i<3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <p style={{ ...sg, color:s.c, fontWeight:900, fontSize:30, textShadow:`0 0 24px ${s.glow}`, lineHeight:1 }}>{s.v}</p>
            <p style={{ ...dm, color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:6 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PROBLEM
══════════════════════════════════════════════════════════════════ */
const SectionProblem = () => (
  <section id="problema" style={{ padding:"96px 0", background:"#060609", position:"relative" }}>
    <div className="max-w-5xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign:"center", marginBottom:56 }}>
        <p style={{ ...dm, color:"#f87171", fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12, textShadow:"0 0 16px rgba(239,68,68,0.5)" }}>El problema real</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3.5rem)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em" }}>
          Las apps te consiguen pedidos.<br/>
          <span style={{ background:"linear-gradient(135deg,#f87171,#ef4444)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", filter:"drop-shadow(0 0 16px rgba(239,68,68,0.4))" }}>Y se quedan con el margen.</span>
        </h2>
      </div>

      <GlassCard borderColor="rgba(239,68,68,0.7)" glowAnim="glow-card-red" radius="1.25rem" noPad style={{ overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ padding:"20px 24px" }}/>
          <div style={{ padding:"20px 24px", textAlign:"center", borderLeft:"1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ ...sg, color:"#f87171", fontWeight:800, fontSize:15 }}>Apps de delivery</p>
            <p style={{ ...dm, color:"rgba(255,255,255,0.25)", fontSize:11, marginTop:2 }}>Uber Eats, PedidosYa, Rappi…</p>
          </div>
          <div style={{ padding:"20px 24px", textAlign:"center", borderLeft:"1px solid rgba(255,255,255,0.07)", background:"rgba(139,92,246,0.08)" }}>
            <p style={{ ...sg, color:"#c4b5fd", fontWeight:800, fontSize:15 }}>PandaPOS</p>
            <p style={{ ...dm, color:"rgba(255,255,255,0.25)", fontSize:11, marginTop:2 }}>Tu canal directo</p>
          </div>
        </div>
        {[
          {l:"Comisión por pedido",a:"18–30%",p:"0%",ar:true,pg:true},
          {l:"Dueño de tus clientes",a:"No",p:"Sí",ar:true,pg:true},
          {l:"Canal de venta propio",a:"No",p:"Sí",ar:true,pg:true},
          {l:"Datos del cliente",a:"Son de la app",p:"Son tuyos",ar:true,pg:true},
          {l:"Costo mensual fijo",a:"Gratis* (+30%)",p:"Desde $7.900",ar:false,pg:false},
        ].map((row,i)=>(
          <div key={row.l} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderBottom:i<4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ padding:"16px 24px", display:"flex", alignItems:"center" }}>
              <span style={{ ...dm, color:"rgba(255,255,255,0.5)", fontSize:13 }}>{row.l}</span>
            </div>
            <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"center", borderLeft:"1px solid rgba(255,255,255,0.05)" }}>
              {row.ar ? (
                <span style={{ ...sg, color:"#f87171", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                  <X size={13}/> {row.a}
                </span>
              ) : (
                <span style={{ ...dm, color:"rgba(255,255,255,0.3)", fontSize:13 }}>{row.a}</span>
              )}
            </div>
            <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"center", borderLeft:"1px solid rgba(255,255,255,0.05)", background:"rgba(139,92,246,0.05)" }}>
              {row.pg ? (
                <span style={{ ...sg, color:"#4ade80", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                  <Check size={13}/> {row.p}
                </span>
              ) : (
                <span style={{ ...sg, color:"white", fontWeight:700, fontSize:13 }}>{row.p}</span>
              )}
            </div>
          </div>
        ))}
      </GlassCard>
      <p style={{ ...dm, color:"rgba(255,255,255,0.2)", fontSize:11, textAlign:"center", marginTop:16 }}>*Gratis para entrar, pero cada pedido te cuesta entre 18% y 30% de comisión.</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   SOLUTION — 3 steps
══════════════════════════════════════════════════════════════════ */
const SectionSolution = () => (
  <section style={{ padding:"96px 0", background:"#08080f", position:"relative", overflow:"hidden" }} id="como-funciona">
    <Aurora className="opacity-60"/>
    <Dots opacity={0.5}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth:560, margin:"0 auto 56px" }}>
        <p style={{ ...dm, color:"#a78bfa", fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>La solución</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em" }}>Tu canal. Tu margen. Tus clientes.</h2>
        <p style={{ ...dm, color:"rgba(255,255,255,0.4)", fontSize:17, marginTop:14, lineHeight:1.6 }}>QR → Carta → Pedido → WhatsApp. Sin apps de por medio.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }} className="grid-cols-1 md:grid-cols-3">
        {[
          {icon:<Receipt size={22}/>,n:"01",title:"Escanean tu QR",desc:"En la mesa, el packaging o la boleta. El cliente entra a tu menú en segundos.",border:"rgba(139,92,246,0.85)",anim:"glow-card-violet",ic:"rgba(139,92,246,0.8)",delay:"0s"},
          {icon:<ShoppingCart size={22}/>,n:"02",title:"Ven tu carta y piden",desc:"Menú digital con fotos, variantes y precios. El pedido armado, sin confusión.",border:"rgba(56,189,248,0.85)",anim:"glow-card-blue",ic:"rgba(56,189,248,0.8)",delay:"0.4s"},
          {icon:<MessageCircle size={22}/>,n:"03",title:"Llega directo a ti",desc:"El pedido llega confirmado. Sin intermediarios, sin porcentaje, sin esperas.",border:"rgba(37,211,102,0.85)",anim:"glow-card-green",ic:"rgba(37,211,102,0.8)",delay:"0.8s"},
        ].map(s=>(
          <GlassCard key={s.n} borderColor={s.border} glowAnim={s.anim} animDelay={s.delay} radius="1rem">
            <div style={{ padding:"28px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:46, height:46, borderRadius:13, background:s.ic, display:"flex", alignItems:"center", justifyContent:"center", color:"white", boxShadow:`0 0 24px ${s.ic}` }}>{s.icon}</div>
                <span style={{ ...sg, color:"rgba(255,255,255,0.1)", fontWeight:900, fontSize:32 }}>{s.n}</span>
              </div>
              <h3 style={{ ...sg, color:"white", fontWeight:800, fontSize:17, marginBottom:8 }}>{s.title}</h3>
              <p style={{ ...dm, color:"rgba(255,255,255,0.4)", fontSize:13, lineHeight:1.6 }}>{s.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   POWER — boleta QR loop
══════════════════════════════════════════════════════════════════ */
const SectionPower = () => (
  <section style={{ padding:"96px 0", background:"#060609" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }} className="grid-cols-1 md:grid-cols-2">
        <div>
          <p style={{ ...dm, color:"#a78bfa", fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>El ciclo que cambia todo</p>
          <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,3.5vw,3rem)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em", marginBottom:18 }}>
            Convierte cada boleta en una nueva venta.
          </h2>
          <p style={{ ...dm, color:"rgba(255,255,255,0.4)", fontSize:16, lineHeight:1.7, marginBottom:32 }}>
            Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Sin que tú hagas nada. Sin comisión.
          </p>
          <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background:"linear-gradient(135deg,#25D366,#1db954)", padding:"12px 24px", borderRadius:12, color:"white", fontWeight:800, fontSize:13, display:"inline-flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <MessageCircle size={15}/> Activar ciclo directo
          </Link>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            {icon:<Receipt size={17}/>,label:"Entrega con QR impreso",desc:"Cada boleta lleva tu QR.",border:"rgba(139,92,246,0.85)",anim:"glow-card-violet",ic:"rgba(139,92,246,0.85)",delay:"0s"},
            {icon:<QrCode size={17}/>,label:"Escanea cuando quiere",desc:"Tu menú siempre disponible.",border:"rgba(56,189,248,0.85)",anim:"glow-card-blue",ic:"rgba(56,189,248,0.85)",delay:"0.5s"},
            {icon:<MessageCircle size={17}/>,label:"Nuevo pedido, cero comisión",desc:"Tú cobras el 100%.",border:"rgba(37,211,102,0.85)",anim:"glow-card-green",ic:"rgba(37,211,102,0.8)",delay:"1s"},
          ].map((s,i)=>(
            <GlassCard key={i} borderColor={s.border} glowAnim={s.anim} animDelay={s.delay} radius="0.875rem">
              <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:s.ic, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"white", boxShadow:`0 0 20px ${s.ic}` }}>{s.icon}</div>
                <div>
                  <p style={{ ...sg, color:"white", fontWeight:800, fontSize:13 }}>{s.label}</p>
                  <p style={{ ...dm, color:"rgba(255,255,255,0.35)", fontSize:12 }}>{s.desc}</p>
                </div>
                <span style={{ ...sg, color:"rgba(255,255,255,0.08)", fontWeight:900, fontSize:24, marginLeft:"auto" }}>{i+1}</span>
              </div>
            </GlassCard>
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
  <section style={{ padding:"96px 0", background:"#08080f", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:500, background:"radial-gradient(ellipse,rgba(139,92,246,0.1) 0%,transparent 70%)", filter:"blur(50px)", pointerEvents:"none" }}/>
    <div className="max-w-3xl mx-auto px-5 sm:px-8">
      <GlassCard borderColor="rgba(139,92,246,0.8)" glowAnim="glow-card-violet" radius="1.5rem">
        <div style={{ padding:"48px 40px", textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:24 }}>
            {[...Array(5)].map((_,i)=><Star key={i} size={18} style={{ color:"#fbbf24", fill:"#fbbf24", filter:"drop-shadow(0 0 6px rgba(251,191,36,0.6))" }}/>)}
          </div>
          <blockquote style={{ ...sg, color:"white", fontSize:"clamp(1.1rem,2vw,1.35rem)", fontWeight:700, lineHeight:1.5, marginBottom:32 }}>
            "Antes le pagábamos casi 28% entre comisiones y promos. Con PandaPOS, la mitad de los pedidos ya son directos por WhatsApp y ese margen volvió a la caja. En el primer mes recuperamos lo que costó el sistema."
          </blockquote>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:16, boxShadow:"0 0 20px rgba(124,58,237,0.5)" }}>M</div>
            <div style={{ textAlign:"left" }}>
              <p style={{ ...sg, color:"white", fontWeight:800, fontSize:13 }}>María P.</p>
              <p style={{ ...dm, color:"rgba(255,255,255,0.35)", fontSize:11 }}>Dueña de dark kitchen · Santiago</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FEATURES BENTO
══════════════════════════════════════════════════════════════════ */
const FEATS = [
  {icon:<Monitor size={20}/>,title:"KDS — Cocina en tiempo real",desc:"Pantallas que reciben pedidos al instante desde cualquier canal. Filtra por estación, muestra tiempos y notifica al área correcta cuando el pedido está listo.",wide:true,border:"rgba(139,92,246,0.85)",anim:"glow-card-violet",ic:"rgba(139,92,246,0.85)",delay:"0s"},
  {icon:<Bot size={20}/>,title:"Bot de WhatsApp 24/7",desc:"El bot arma el carrito, pregunta retiro o delivery y envía al KDS. Sin intervención humana.",wide:false,border:"rgba(37,211,102,0.85)",anim:"glow-card-green",ic:"rgba(37,211,102,0.85)",delay:"0.2s"},
  {icon:<ShoppingCart size={20}/>,title:"Carta online y kiosko",desc:"Menú digital por QR o link. Personaliza, elige zona, paga con MP o transferencia.",wide:false,border:"rgba(56,189,248,0.85)",anim:"glow-card-blue",ic:"rgba(56,189,248,0.85)",delay:"0.4s"},
  {icon:<Bike size={20}/>,title:"Gestión de delivery",desc:"Asigna repartidores, define zonas con precios y haz seguimiento en tiempo real.",wide:false,border:"rgba(245,158,11,0.85)",anim:"glow-card-amber",ic:"rgba(245,158,11,0.85)",delay:"0.6s"},
  {icon:<CreditCard size={20}/>,title:"Punto de venta (POS)",desc:"Caja rápida con multipago, boleta térmica y gestión de mesas.",wide:false,border:"rgba(239,68,68,0.85)",anim:"glow-card-red",ic:"rgba(239,68,68,0.85)",delay:"0.8s"},
  {icon:<BarChart3 size={20}/>,title:"Panel de ventas",desc:"Ventas del día y mes, ticket promedio, ranking de clientes y pedidos directos en tiempo real.",wide:true,border:"rgba(56,189,248,0.85)",anim:"glow-card-blue",ic:"rgba(56,189,248,0.85)",delay:"1s"},
  {icon:<Bell size={20}/>,title:"Notificaciones por área",desc:"Mesero, cajero y rider reciben solo lo que les corresponde. Menos ruido, más velocidad.",wide:false,border:"rgba(217,70,239,0.85)",anim:"glow-card-pink",ic:"rgba(217,70,239,0.85)",delay:"1.2s"},
];

const SectionFeatures = () => (
  <section style={{ padding:"96px 0", background:"#060609" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign:"center", maxWidth:540, margin:"0 auto 56px" }}>
        <p style={{ ...dm, color:"#a78bfa", fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Todo incluido</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em" }}>Un sistema. Sin fricción.</h2>
        <p style={{ ...dm, color:"rgba(255,255,255,0.35)", fontSize:16, marginTop:12 }}>Todo lo que necesitas para operar, vender y crecer.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {FEATS.map(f=>(
          <GlassCard key={f.title} borderColor={f.border} glowAnim={f.anim} animDelay={f.delay} radius="1rem" className={f.wide ? "col-span-2" : ""} style={f.wide ? { gridColumn:"1/-1" } : {}}>
            <div style={{ padding:"24px", display:"flex", gap:18, alignItems:"flex-start" }}>
              <div style={{ width:42, height:42, borderRadius:12, background:f.ic, display:"flex", alignItems:"center", justifyContent:"center", color:"white", flexShrink:0, boxShadow:`0 0 28px ${f.ic}` }}>{f.icon}</div>
              <div style={{ maxWidth:f.wide ? 640 : "100%" }}>
                <h3 style={{ ...sg, color:"white", fontWeight:800, fontSize:15, marginBottom:7 }}>{f.title}</h3>
                <p style={{ ...dm, color:"rgba(255,255,255,0.4)", fontSize:13, lineHeight:1.65 }}>{f.desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   PRICING
══════════════════════════════════════════════════════════════════ */
const PLANS = [
  {name:"Basic",price:"$7.900",pitch:"Para dejar de pagar comisión desde ya.",items:["Carta QR con menú digital","Pedidos por WhatsApp","Gestión de mesas","Soporte de arranque"],cta:"Empezar con Basic",border:"rgba(255,255,255,0.2)",anim:"glow-card-violet",badge:null,ctaBg:"rgba(255,255,255,0.08)"},
  {name:"Pro",price:"$11.900",pitch:"Para crecer con control total del día a día.",items:["Todo de Basic","KDS de cocina","Bot de WhatsApp 24/7","Delivery con zonas","Panel de ventas y reportes"],cta:"Elegir Pro",border:"rgba(139,92,246,1)",anim:"glow-card-violet",badge:"Más elegido",ctaBg:"linear-gradient(135deg,#7c3aed,#6366f1)"},
  {name:"Prime",price:"$14.900",pitch:"Para operar sin límites y escalar.",items:["Todo de Pro","Multi-sucursal","Kiosko de autoatención","Pagos con Mercado Pago","Soporte prioritario"],cta:"Ir por Prime",border:"rgba(245,158,11,0.85)",anim:"glow-card-amber",badge:null,ctaBg:"rgba(255,255,255,0.08)"},
];

const SectionPricing = () => (
  <section id="planes" style={{ padding:"96px 0", background:"#08080f", position:"relative", overflow:"hidden" }}>
    <Aurora className="opacity-40"/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:56 }}>
        <p style={{ ...dm, color:"#a78bfa", fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Precios</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em" }}>Más barato que una semana de comisiones.</h2>
        <p style={{ ...dm, color:"rgba(255,255,255,0.35)", fontSize:16, marginTop:12 }}>Elige un plan. Recupera margen. Cobra directo.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {PLANS.map(p=>(
          <div key={p.name} style={{ position:"relative" }}>
            {p.badge && (
              <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#7c3aed,#6366f1)", boxShadow:"0 0 24px rgba(124,58,237,0.7), 0 4px 16px rgba(0,0,0,0.4)", padding:"4px 18px", borderRadius:999, color:"white", fontSize:11, fontWeight:800, whiteSpace:"nowrap", zIndex:2, ...sg }}>
                {p.badge}
              </div>
            )}
            <GlassCard borderColor={p.border} glowAnim={p.anim} radius="1.25rem" style={{ height:"100%" }}>
              <div style={{ padding:"28px 24px", display:"flex", flexDirection:"column", height:"100%" }}>
                <p style={{ ...dm, color:"rgba(255,255,255,0.25)", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Plan</p>
                <p style={{ ...sg, color:"white", fontWeight:900, fontSize:24, marginBottom:4 }}>{p.name}</p>
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:6 }}>
                  <span style={{ ...sg, color:"white", fontWeight:900, fontSize:36 }}>{p.price}</span>
                  <span style={{ ...dm, color:"rgba(255,255,255,0.25)", fontSize:13, paddingBottom:6 }}>/mes</span>
                </div>
                <p style={{ ...dm, color:"rgba(255,255,255,0.35)", fontSize:13, marginBottom:24 }}>{p.pitch}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24, flex:1 }}>
                  {p.items.map(item=>(
                    <div key={item} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <CheckCircle2 size={14} style={{ color:"#4ade80", flexShrink:0, marginTop:1, filter:"drop-shadow(0 0 4px rgba(74,222,128,0.6))" }}/>
                      <span style={{ ...dm, color:"rgba(255,255,255,0.5)", fontSize:13 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href={WA} target="_blank" style={{ ...sg, background:p.ctaBg, padding:"12px 20px", borderRadius:12, color:"white", fontWeight:800, fontSize:13, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", boxShadow:p.badge ? "0 0 30px rgba(124,58,237,0.5)" : "none" }}>
                  <MessageCircle size={14}/> {p.cta}
                </Link>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
      <p style={{ ...dm, color:"rgba(255,255,255,0.2)", fontSize:12, textAlign:"center", marginTop:24 }}>¿Tienes dudas sobre qué plan elegir? Hablamos por WhatsApp y te recomendamos el mejor.</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FINAL CTA
══════════════════════════════════════════════════════════════════ */
const SectionFinalCTA = () => (
  <section style={{ padding:"120px 0", background:"#060609", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:800, height:500, background:"radial-gradient(ellipse,rgba(124,58,237,0.18) 0%,rgba(37,211,102,0.06) 50%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }}/>
    <Dots opacity={0.4}/>
    <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center" style={{ zIndex:1 }}>
      <div style={{ width:60, height:60, borderRadius:18, background:"rgba(139,92,246,0.15)", border:"1px solid rgba(139,92,246,0.8)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 28px", boxShadow:"0 0 40px rgba(139,92,246,0.35)", animation:"glow-card-violet 2.5s ease-in-out infinite" }}>
        <Zap style={{ color:"#a78bfa" }} size={28}/>
      </div>
      <h2 style={{ ...sg, color:"white", fontSize:"clamp(2.4rem,5vw,4rem)", fontWeight:900, lineHeight:1.04, letterSpacing:"-0.02em", marginBottom:20 }}>
        Deja de pagar comisiones.{" "}
        <span style={{ background:"linear-gradient(135deg,#25D366,#4ade80)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", filter:"drop-shadow(0 0 16px rgba(37,211,102,0.4))" }}>
          Empieza a cobrar directo hoy.
        </span>
      </h2>
      <p style={{ ...dm, color:"rgba(255,255,255,0.4)", fontSize:18, marginBottom:40, lineHeight:1.65 }}>
        Más dinero por orden. Clientes que son tuyos. Control total.
      </p>
      <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background:"linear-gradient(135deg,#25D366,#1db954)", padding:"18px 44px", borderRadius:16, color:"white", fontWeight:900, fontSize:16, display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none" }}>
        <MessageCircle size={20}/> Hablar por WhatsApp ahora
      </Link>
      <p style={{ ...dm, color:"rgba(255,255,255,0.18)", fontSize:12, marginTop:20 }}>Sin contratos. Sin permanencia. Activa hoy.</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════ */
const Footer = () => (
  <footer style={{ background:"#040407", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"36px 0" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
      <Link href="/home" style={{ display:"flex", alignItems:"center", gap:8, color:"white", fontWeight:800, fontSize:16, textDecoration:"none", ...sg }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width:28, height:28, objectFit:"contain" }}/>
        PandaPOS
      </Link>
      <p style={{ ...dm, color:"rgba(255,255,255,0.18)", fontSize:12 }}>© {new Date().getFullYear()} PandaPOS · Todos los derechos reservados</p>
      <Link href={WA} target="_blank" style={{ ...dm, color:"#25D366", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, textDecoration:"none" }}>
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
    <div style={{ minHeight:"100vh", background:"#08080f", ...dm }}>
      <Animations/>
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
