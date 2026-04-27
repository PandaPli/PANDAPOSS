"use client";

import Link from "next/link";
import {
  MessageCircle, ArrowRight, Zap, Monitor, Bot,
  ShoppingCart, Bike, CreditCard, BarChart3, Bell,
  Check, Star, TrendingUp, Shield, Clock, Users, DollarSign,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   BRAND TOKENS
   purple: #8b2fc9  teal: #1a5f57  wa-green: #25D366
───────────────────────────────────────────────────────────── */
const WA  = "https://wa.me/56999011141?text=Hola%2C%20quiero%20ver%20una%20demo%20de%20PandaPOS";
const sg: React.CSSProperties = { fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" };
const dm: React.CSSProperties = { fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)" };

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES + ANIMATIONS
───────────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    /* ── Brand keyframes ── */
    @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }
    @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1deg)} 55%{transform:translateY(-12px) rotate(1.5deg)} }
    @keyframes floatB { 0%,100%{transform:translateY(0) rotate(1deg)} 55%{transform:translateY(10px) rotate(-1.5deg)} }
    @keyframes floatM { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-9px) scale(1.03)} }
    @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes strike { from{width:0} to{width:100%} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scaleIn { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    @keyframes glowV  { 0%,100%{box-shadow:0 0 0 1px rgba(139,47,201,.6),0 8px 40px rgba(139,47,201,.15)} 50%{box-shadow:0 0 0 1px rgba(139,47,201,1),0 8px 64px rgba(139,47,201,.45)} }
    @keyframes glowG  { 0%,100%{box-shadow:0 0 0 1px rgba(37,211,102,.55),0 8px 40px rgba(37,211,102,.12)} 50%{box-shadow:0 0 0 1px rgba(37,211,102,1),0 8px 64px rgba(37,211,102,.38)} }
    @keyframes glowT  { 0%,100%{box-shadow:0 0 0 1px rgba(26,95,87,.6),0 8px 40px rgba(45,212,191,.12)} 50%{box-shadow:0 0 0 1px rgba(45,212,191,.9),0 8px 64px rgba(45,212,191,.32)} }
    @keyframes glowR  { 0%,100%{box-shadow:0 0 0 1px rgba(239,68,68,.55),0 8px 40px rgba(239,68,68,.12)} 50%{box-shadow:0 0 0 1px rgba(239,68,68,1),0 8px 64px rgba(239,68,68,.38)} }
    @keyframes glowB  { 0%,100%{box-shadow:0 0 0 1px rgba(56,189,248,.55),0 8px 40px rgba(56,189,248,.12)} 50%{box-shadow:0 0 0 1px rgba(56,189,248,1),0 8px 64px rgba(56,189,248,.35)} }
    @keyframes glowA  { 0%,100%{box-shadow:0 0 0 1px rgba(245,158,11,.55),0 8px 40px rgba(245,158,11,.12)} 50%{box-shadow:0 0 0 1px rgba(245,158,11,1),0 8px 64px rgba(245,158,11,.35)} }
    @keyframes glowP  { 0%,100%{box-shadow:0 0 0 1px rgba(217,70,239,.55),0 8px 40px rgba(217,70,239,.12)} 50%{box-shadow:0 0 0 1px rgba(217,70,239,1),0 8px 64px rgba(217,70,239,.35)} }
    @keyframes pandaBounce { 0%,100%{transform:translateY(0) scale(1)} 40%{transform:translateY(-16px) scale(1.05)} 65%{transform:translateY(-8px) scale(1.02)} }
    @keyframes numberUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes borderRun {
      0%{background-position:0% 50%}
      50%{background-position:100% 50%}
      100%{background-position:0% 50%}
    }

    /* ── Utility classes ── */
    .glow-v { animation: glowV 3s ease-in-out infinite; }
    .glow-g { animation: glowG 3s ease-in-out infinite; }
    .glow-t { animation: glowT 3s ease-in-out infinite; }
    .glow-r { animation: glowR 3s ease-in-out infinite; }
    .glow-b { animation: glowB 3s ease-in-out infinite; }
    .glow-a { animation: glowA 3s ease-in-out infinite; }
    .glow-p { animation: glowP 3s ease-in-out infinite; }
    .float-a { animation: floatA 4s ease-in-out infinite; }
    .float-b { animation: floatB 4.5s ease-in-out infinite; }
    .float-m { animation: floatM 3.5s ease-in-out infinite; }
    .panda   { animation: pandaBounce 3.2s ease-in-out infinite; }

    .card {
      background: rgba(6,9,22,.72);
      backdrop-filter: blur(28px) saturate(1.4);
      -webkit-backdrop-filter: blur(28px) saturate(1.4);
      border-radius: 1rem;
      position: relative;
      overflow: hidden;
      transition: transform .22s ease, filter .22s ease;
    }
    .card::before {
      content:'';position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.015) 40%,transparent 65%);
      pointer-events:none;border-radius:inherit;
    }
    .card:hover { transform: translateY(-4px) scale(1.015); filter: brightness(1.12); }

    /* Gradient border for hero */
    .grad-border {
      position: relative;
      border-radius: 16px;
      padding: 1px;
      background: linear-gradient(135deg,#8b2fc9,#1a5f57,#8b2fc9);
      background-size: 300% 300%;
      animation: borderRun 4s ease-in-out infinite;
    }
    .grad-border-inner {
      border-radius: 15px;
      background: #1a1d3a;
    }

    /* Strikethrough animated */
    .strike-wrap { position: relative; display: inline-block; }
    .strike-wrap::after {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      height: 3px;
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239,68,68,.8);
      animation: strike 1s cubic-bezier(.77,0,.18,1) .8s forwards;
      width: 0;
    }

    /* CTA buttons */
    .btn-wa {
      background: linear-gradient(135deg,#25D366,#1db954);
      animation: glowG 2.5s ease-in-out infinite;
    }
    .btn-demo {
      background: rgba(139,47,201,.18);
      border: 1px solid rgba(139,47,201,.75);
      animation: glowV 2.5s ease-in-out infinite;
    }
    .btn-wa, .btn-demo {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 15px 30px; border-radius: 14px;
      color: white; font-weight: 800; font-size: 14px;
      text-decoration: none; transition: transform .18s ease;
    }
    .btn-wa:hover, .btn-demo:hover { transform: translateY(-2px) scale(1.03); }

    /* Section fade-up on scroll */
    .fade-up { opacity:0; transform:translateY(36px); transition:opacity .65s ease, transform .65s ease; }
    .fade-up.visible { opacity:1; transform:translateY(0); }

    /* Number gradient */
    .num-v { color:#c084f5; text-shadow:0 0 28px rgba(139,47,201,.7); }
    .num-g { color:#4ade80; text-shadow:0 0 28px rgba(37,211,102,.6); }
    .num-r { color:#f87171; text-shadow:0 0 28px rgba(239,68,68,.6); }
    .num-t { color:#2dd4bf; text-shadow:0 0 28px rgba(45,212,191,.6); }
    .num-b { color:#60a5fa; text-shadow:0 0 28px rgba(96,165,250,.6); }

    /* Text gradients */
    .grad-v {
      background: linear-gradient(135deg,#c084f5,#a855f7,#d8b4fe);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 18px rgba(139,47,201,.55));
    }
    .grad-g {
      background: linear-gradient(135deg,#25D366,#4ade80);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 14px rgba(37,211,102,.45));
    }
    .grad-r {
      background: linear-gradient(135deg,#f87171,#ef4444);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 16px rgba(239,68,68,.5));
    }
    .grad-vt {
      background: linear-gradient(135deg,#8b2fc9,#1a5f57,#2dd4bf);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    @media(max-width:639px){
      .float-a { right:4px!important; }
      .float-b { left:4px!important; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────── */
const Aurora = ({ op = 1 }: { op?: number }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity: op }}>
    <div style={{ position:"absolute", top:"-10%", left:"0%", width:900, height:700, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(139,47,201,.2) 0%,transparent 65%)", filter:"blur(60px)", animation:"pulse 6s ease-in-out infinite" }} />
    <div style={{ position:"absolute", top:"20%", right:"-8%", width:650, height:650, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(26,95,87,.28) 0%,rgba(45,212,191,.08) 60%,transparent 75%)", filter:"blur(65px)", animation:"pulse 8s ease-in-out infinite", animationDelay:"2s" }} />
    <div style={{ position:"absolute", bottom:"-10%", left:"30%", width:750, height:550, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(139,47,201,.1) 0%,rgba(26,95,87,.07) 50%,transparent 70%)", filter:"blur(60px)", animation:"pulse 7s ease-in-out infinite", animationDelay:"4s" }} />
  </div>
);

const Dots = ({ op = 1 }: { op?: number }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"radial-gradient(circle,rgba(255,255,255,.065) 1px,transparent 1px)", backgroundSize:"28px 28px", opacity:op, zIndex:0 }} />
);

const GlassCard = ({
  children, cls = "", anim = "glow-v", r = "1rem",
  style = {}, noPad = false,
}: {
  children: React.ReactNode; cls?: string; anim?: string;
  r?: string; style?: React.CSSProperties; noPad?: boolean;
}) => (
  <div className={`card ${anim} ${cls}`} style={{ borderRadius:r, ...style }}>
    {noPad ? children : <div style={{ position:"relative" }}>{children}</div>}
  </div>
);

const Panda = ({ size = 80, cls = "" }: { size?: number; cls?: string }) => (
  <div className={`panda ${cls}`} style={{ width:size, height:size, filter:`drop-shadow(0 0 ${Math.round(size*.35)}px rgba(139,47,201,.65)) drop-shadow(0 0 ${Math.round(size*.15)}px rgba(45,212,191,.4))` }}>
    <img src="/logo.png" alt="PandaPOS" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
  </div>
);

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
const Navbar = () => (
  <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, backdropFilter:"blur(24px)", background:"rgba(20,22,52,.92)", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
      <Link href="/home" className="flex items-center gap-2.5" style={{ ...sg, color:"white", fontWeight:900, fontSize:18, textDecoration:"none" }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width:32, height:32, objectFit:"contain" }}/>
        <span>Panda<span style={{ color:"#c084f5" }}>POS</span></span>
      </Link>
      <div className="hidden md:flex items-center gap-7">
        {[["Cómo funciona","#como-funciona"],["Sistema","#sistema"],["Precios","#planes"]].map(([l,h])=>(
          <Link key={h} href={h} style={{ ...dm, color:"rgba(255,255,255,.38)", fontSize:13, fontWeight:600, textDecoration:"none", transition:"color .18s" }}
            onMouseEnter={e=>(e.currentTarget.style.color="white")}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,.38)")}>{l}</Link>
        ))}
        <Link href={WA} target="_blank" className="btn-demo" style={{ padding:"9px 18px", fontSize:13 }}>Ver demo</Link>
        <Link href={WA} target="_blank" className="btn-wa" style={{ padding:"9px 18px", fontSize:13 }}>
          <MessageCircle size={14}/> WhatsApp
        </Link>
      </div>
      <Link href={WA} target="_blank" className="md:hidden btn-wa" style={{ padding:"8px 14px", fontSize:13 }}>
        <MessageCircle size={14}/> WhatsApp
      </Link>
    </div>
  </nav>
);

/* ─────────────────────────────────────────────────────────────
   TICKER
───────────────────────────────────────────────────────────── */
const Ticker = () => {
  const items = ["0% comisión","Pedidos automáticos","Bot WhatsApp 24/7","KDS en tiempo real","Carta QR","Desde $7.900/mes","Clientes que son tuyos","Sin intermediarios"];
  const d = [...items,...items];
  return (
    <div style={{ overflow:"hidden", background:"rgba(139,47,201,.055)", borderTop:"1px solid rgba(139,47,201,.18)", borderBottom:"1px solid rgba(26,95,87,.2)", padding:"9px 0", whiteSpace:"nowrap" }}>
      <div style={{ display:"inline-flex", animation:"ticker 26s linear infinite" }}>
        {d.map((t,i)=>(
          <span key={i} style={{ ...sg, display:"inline-flex", alignItems:"center", gap:8, padding:"0 24px", fontSize:12, fontWeight:700,
            color: i%2===0 ? "rgba(192,132,252,.6)" : "rgba(45,212,191,.5)",
            letterSpacing:".05em" }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:"currentColor", display:"inline-block" }}/>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────────── */
const WAMockup = () => (
  <div style={{ position:"relative", padding:"20px 0" }}>
    {/* glow halo */}
    <div style={{ position:"absolute", inset:-50, background:"radial-gradient(ellipse,rgba(37,211,102,.18) 0%,rgba(139,47,201,.1) 50%,transparent 72%)", filter:"blur(44px)", borderRadius:"50%", pointerEvents:"none" }} />

    <GlassCard anim="glow-g" r="1.25rem" noPad style={{ boxShadow:"0 32px 90px rgba(0,0,0,.65)", border:"1px solid rgba(37,211,102,.8)" }}>
      {/* Header */}
      <div style={{ background:"rgba(255,255,255,.035)", borderBottom:"1px solid rgba(255,255,255,.07)", padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:33, height:33, borderRadius:"50%", background:"linear-gradient(135deg,#25D366,#1db954)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 18px rgba(37,211,102,.5)" }}>
          <MessageCircle size={14} color="white"/>
        </div>
        <div>
          <p style={{ ...sg, color:"white", fontSize:11, fontWeight:800 }}>Tu Restaurante · PandaPOS</p>
          <p style={{ ...dm, color:"#25D366", fontSize:9 }}>● en línea ahora</p>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:3 }}>
          {[0,1,2].map(i=><div key={i} style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,.18)" }}/>)}
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {/* Order card */}
        <div style={{ maxWidth:"88%" }}>
          <GlassCard anim="glow-v" r=".75rem" noPad style={{ border:"1px solid rgba(139,47,201,.8)" }}>
            <div style={{ padding:"12px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ ...sg, color:"white", fontWeight:800, fontSize:12 }}>Pedido #1.247</span>
                <span style={{ ...dm, background:"rgba(139,47,201,.25)", border:"1px solid rgba(139,47,201,.6)", color:"#d8b4fe", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:999 }}>Mesa 4</span>
              </div>
              {["2× Sushi Roll Salmón","1× Causa Rellena","3× Agua s/gas"].map(it=>(
                <div key={it} style={{ display:"flex", gap:5, marginBottom:4 }}>
                  <div style={{ width:3, height:3, borderRadius:"50%", background:"#c084f5", flexShrink:0, marginTop:5 }}/>
                  <span style={{ ...dm, color:"rgba(255,255,255,.45)", fontSize:11 }}>{it}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", marginTop:9, paddingTop:9, display:"flex", justifyContent:"space-between" }}>
                <span style={{ ...dm, color:"rgba(255,255,255,.28)", fontSize:10 }}>Total</span>
                <span style={{ ...sg, color:"white", fontWeight:800, fontSize:14 }}>$22.500</span>
              </div>
            </div>
          </GlassCard>
          <span style={{ ...dm, color:"rgba(255,255,255,.18)", fontSize:9, marginLeft:3 }}>hace 2 min</span>
        </div>
        {/* System confirmations */}
        {[
          { t:"Pedido enviado al KDS ✓", c:"#4ade80" },
          { t:"0% de comisión cobrada ✓", c:"#4ade80" },
          { t:"Cliente guardado en tu base ✓", c:"#4ade80" },
        ].map(m=>(
          <div key={m.t} style={{ alignSelf:"flex-end", background:"rgba(37,211,102,.13)", border:"1px solid rgba(37,211,102,.45)", borderRadius:"13px 13px 2px 13px", padding:"7px 11px" }}>
            <span style={{ ...dm, color:m.c, fontSize:10, fontWeight:600 }}>{m.t}</span>
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Floating badge: lo que cobrarían */}
    <div className="float-a" style={{ position:"absolute", top:-12, right:-22, background:"rgba(239,68,68,.1)", backdropFilter:"blur(16px)", border:"1px solid rgba(239,68,68,.85)", borderRadius:13, padding:"9px 14px", boxShadow:"0 0 28px rgba(239,68,68,.28),0 8px 28px rgba(0,0,0,.45)" }}>
      <p style={{ ...dm, color:"rgba(252,165,165,.75)", fontSize:8, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700 }}>Rappi te cobraría</p>
      <p style={{ ...sg, color:"#f87171", fontWeight:900, fontSize:21, lineHeight:1.2, textShadow:"0 0 18px rgba(239,68,68,.6)" }}>−$6.750</p>
    </div>

    {/* Floating badge: lo que pagas con PandaPOS */}
    <div className="float-b" style={{ position:"absolute", bottom:-12, left:-22, background:"rgba(37,211,102,.08)", backdropFilter:"blur(16px)", border:"1px solid rgba(37,211,102,.85)", borderRadius:13, padding:"9px 14px", boxShadow:"0 0 28px rgba(37,211,102,.22),0 8px 28px rgba(0,0,0,.45)" }}>
      <p style={{ ...dm, color:"rgba(74,222,128,.75)", fontSize:8, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700 }}>Con PandaPOS</p>
      <p style={{ ...sg, color:"#4ade80", fontWeight:900, fontSize:21, lineHeight:1.2, textShadow:"0 0 18px rgba(37,211,102,.6)" }}>$0 comisión</p>
    </div>
  </div>
);

const Hero = () => (
  <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", paddingTop:80, paddingBottom:64, background:"#1a1d3a", position:"relative", overflow:"hidden" }}>
    <Aurora />
    <Dots />
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full" style={{ zIndex:1 }}>
      <div className="grid lg:grid-cols-2 gap-14 items-center">

        {/* LEFT — copy */}
        <div>
          {/* Eyebrow badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999, background:"rgba(139,47,201,.12)", border:"1px solid rgba(139,47,201,.6)", marginBottom:26, backdropFilter:"blur(8px)", animation:"glowV 3s ease-in-out infinite" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#c084f5", boxShadow:"0 0 8px #c084f5", animation:"pulse 2s ease-in-out infinite" }}/>
            <span style={{ ...dm, color:"rgba(216,180,254,.9)", fontSize:12, fontWeight:600 }}>Sistema operativo para restaurantes</span>
          </div>

          {/* H1 — hook fuerte */}
          <h1 style={{ ...sg, fontSize:"clamp(2.6rem,5vw,4.5rem)", fontWeight:900, lineHeight:1.02, letterSpacing:"-.028em", color:"white", marginBottom:8 }}>
            Las apps de delivery
            <br/>
            {/* Número con strikethrough animado */}
            <span style={{ display:"inline-block", position:"relative" }}>
              <span className="grad-r">
                te cobran un{" "}
                <span className="strike-wrap">30%</span>
              </span>
            </span>
            <br/>
            por cada pedido.
          </h1>

          {/* Subheadline */}
          <p style={{ ...dm, color:"rgba(255,255,255,.52)", fontSize:17, lineHeight:1.7, maxWidth:490, marginBottom:30, marginTop:14 }}>
            Con PandaPOS vendes directo por{" "}
            <strong style={{ color:"white" }}>QR y WhatsApp</strong>,
            automatizas tu operación y{" "}
            <strong style={{ color:"#4ade80" }}>recuperas tu margen.</strong>
          </p>

          {/* Bullets */}
          <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:34 }}>
            {[
              { icon:"🚫", label:"0% comisión por pedido", color:"#f87171" },
              { icon:"💬", label:"Pedidos directos por WhatsApp y QR", color:"#4ade80" },
              { icon:"⚡", label:"Automatización total del negocio", color:"#c084f5" },
            ].map(b=>(
              <div key={b.label} style={{ display:"flex", alignItems:"center", gap:11 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.09)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{b.icon}</div>
                <span style={{ ...dm, color:"rgba(255,255,255,.72)", fontSize:15, fontWeight:500 }}>{b.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:44 }}>
            <Link href={WA} target="_blank" className="btn-wa">
              <MessageCircle size={17}/> Hablar por WhatsApp
            </Link>
            <Link href={WA} target="_blank" className="btn-demo">
              Ver demo <ArrowRight size={15}/>
            </Link>
          </div>

          {/* Stats rápidos */}
          <div style={{ display:"flex", gap:28, flexWrap:"wrap", borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:24 }}>
            {[
              { v:"0%",    l:"comisión",   cls:"num-r" },
              { v:"$7.900",l:"desde /mes", cls:"num-g" },
              { v:"24/7",  l:"automático", cls:"num-v" },
            ].map(s=>(
              <div key={s.l}>
                <p style={{ ...sg, fontWeight:900, fontSize:24, lineHeight:1 }} className={s.cls}>{s.v}</p>
                <p style={{ ...dm, color:"rgba(255,255,255,.28)", fontSize:11, marginTop:4 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — mockup + mascota */}
        <div className="hidden lg:block" style={{ position:"relative" }}>
          <WAMockup />
          {/* Mascota en esquina */}
          <div style={{ position:"absolute", bottom:-40, right:-30 }}>
            <Panda size={128}/>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────────────────────── */
const StatsBar = () => (
  <div style={{ background:"rgba(255,255,255,.02)", borderTop:"1px solid rgba(255,255,255,.07)", borderBottom:"1px solid rgba(255,255,255,.07)", backdropFilter:"blur(8px)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {[
          { v:"0%",    l:"Comisión por pedido",      cls:"num-r" },
          { v:"30%",   l:"Margen que recuperas",      cls:"num-g" },
          { v:"5 min", l:"Para activar",              cls:"num-b" },
          { v:"24/7",  l:"Opera solo, sin esfuerzo",  cls:"num-v" },
        ].map((s,i)=>(
          <div key={s.l} style={{ textAlign:"center", padding:"24px 16px", borderRight: i<3 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
            <p style={{ ...sg, fontWeight:900, fontSize:28, lineHeight:1 }} className={s.cls}>{s.v}</p>
            <p style={{ ...dm, color:"rgba(255,255,255,.28)", fontSize:11, marginTop:5 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 2 — SOLUCIÓN SIMPLE
───────────────────────────────────────────────────────────── */
const SectionSolution = () => (
  <section id="como-funciona" style={{ padding:"96px 0", background:"#1a1d3a", position:"relative", overflow:"hidden" }}>
    <Aurora op={0.55}/>
    <Dots op={0.45}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth:560, margin:"0 auto 52px" }}>
        <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>La solución</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3.1rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em" }}>
          Tu canal. Tu margen.<br/>Tus clientes.
        </h2>
        <p style={{ ...dm, color:"rgba(255,255,255,.38)", fontSize:16, marginTop:12, lineHeight:1.65 }}>
          QR → Carta → Pedido → WhatsApp. Sin apps de por medio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { n:"01", icon:"📱", t:"Escanean tu QR", d:"En la mesa, el packaging o la boleta. El cliente entra a tu menú en segundos — sin descargar nada.", anim:"glow-v", border:"rgba(139,47,201,.85)", bg:"rgba(139,47,201,.85)", delay:"0s" },
          { n:"02", icon:"🛒", t:"Ven tu carta y piden", d:"Menú digital con fotos, variantes y precios. El pedido armado, confirmado, sin confusión ni llamadas.", anim:"glow-b", border:"rgba(56,189,248,.85)", bg:"rgba(56,189,248,.85)", delay:".25s" },
          { n:"03", icon:"💬", t:"Llega directo a ti", d:"El pedido entra a tu KDS y WhatsApp al instante. Sin intermediarios, sin porcentaje, sin esperas.", anim:"glow-g", border:"rgba(37,211,102,.85)", bg:"rgba(37,211,102,.85)", delay:".5s" },
        ].map(s=>(
          <GlassCard key={s.n} anim={s.anim} style={{ border:`1px solid ${s.border}`, animationDelay:s.delay }}>
            <div style={{ padding:"26px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                <div style={{ width:46, height:46, borderRadius:13, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:`0 0 26px ${s.bg}` }}>{s.icon}</div>
                <span style={{ ...sg, color:"rgba(255,255,255,.07)", fontWeight:900, fontSize:34, marginLeft:"auto" }}>{s.n}</span>
              </div>
              <h3 style={{ ...sg, color:"white", fontWeight:800, fontSize:17, marginBottom:8 }}>{s.t}</h3>
              <p style={{ ...dm, color:"rgba(255,255,255,.38)", fontSize:13, lineHeight:1.65 }}>{s.d}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 3 — CICLO DE BOLETA
───────────────────────────────────────────────────────────── */
const SectionCycle = () => (
  <section style={{ padding:"96px 0", background:"#141830" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", marginBottom:12 }}>El ciclo que cambia todo</p>
          <h2 style={{ ...sg, color:"white", fontSize:"clamp(1.9rem,3.5vw,2.9rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", marginBottom:16 }}>
            Convierte cada boleta<br/>en una nueva venta.
          </h2>
          <p style={{ ...dm, color:"rgba(255,255,255,.4)", fontSize:16, lineHeight:1.72, marginBottom:20 }}>
            Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Sin que tú hagas nada. Sin comisión.
          </p>

          {/* Resultado destacado */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"11px 16px", borderRadius:12, background:"rgba(37,211,102,.07)", border:"1px solid rgba(37,211,102,.4)", marginBottom:28, animation:"glowG 3.5s ease-in-out infinite" }}>
            <Panda size={28}/>
            <span style={{ ...sg, color:"#4ade80", fontSize:13, fontWeight:800 }}>Clientes que vuelven sin pagar publicidad</span>
          </div>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <Link href={WA} target="_blank" className="btn-wa">
              <MessageCircle size={15}/> Activar ciclo directo
            </Link>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:"🧾", t:"Entregas boleta con QR impreso", d:"Cada boleta lleva tu QR. El cliente se va con la puerta abierta.", anim:"glow-v", border:"rgba(139,47,201,.85)", bg:"rgba(139,47,201,.85)", d2:"0s", n:1 },
            { icon:"📲", t:"Cliente escanea cuando quiere", d:"Tu menú disponible las 24h. Sin llamar, sin intermediarios.", anim:"glow-b", border:"rgba(56,189,248,.85)", bg:"rgba(56,189,248,.85)", d2:".2s", n:2 },
            { icon:"💬", t:"Nuevo pedido, cero comisión", d:"Tú cobras el 100%. El margen es tuyo, como debe ser.", anim:"glow-g", border:"rgba(37,211,102,.85)", bg:"rgba(37,211,102,.8)", d2:".4s", n:3 },
          ].map(s=>(
            <GlassCard key={s.n} anim={s.anim} style={{ border:`1px solid ${s.border}`, animationDelay:s.d2 }}>
              <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:13 }}>
                <div style={{ width:40, height:40, borderRadius:11, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0, boxShadow:`0 0 20px ${s.bg}` }}>{s.icon}</div>
                <div>
                  <p style={{ ...sg, color:"white", fontWeight:800, fontSize:13 }}>{s.t}</p>
                  <p style={{ ...dm, color:"rgba(255,255,255,.35)", fontSize:12, marginTop:2 }}>{s.d}</p>
                </div>
                <span style={{ ...sg, color:"rgba(255,255,255,.07)", fontWeight:900, fontSize:28, marginLeft:"auto" }}>{s.n}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 4 — PRUEBA SOCIAL
───────────────────────────────────────────────────────────── */
const SectionTestimonial = () => (
  <section style={{ padding:"96px 0", background:"#1a1d3a", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:460, background:"radial-gradient(ellipse,rgba(139,47,201,.1) 0%,transparent 70%)", filter:"blur(55px)", pointerEvents:"none" }}/>
    <div className="max-w-2xl mx-auto px-5 sm:px-8" style={{ position:"relative", zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Lo que dicen nuestros clientes</p>
      </div>
      <GlassCard anim="glow-v" r="1.5rem" style={{ border:"1px solid rgba(139,47,201,.75)" }}>
        <div style={{ padding:"44px 38px", textAlign:"center" }}>
          {/* Stars */}
          <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:22 }}>
            {[...Array(5)].map((_,i)=><Star key={i} size={17} style={{ color:"#fbbf24", fill:"#fbbf24", filter:"drop-shadow(0 0 5px rgba(251,191,36,.6))" }}/>)}
          </div>

          <blockquote style={{ ...sg, color:"white", fontSize:"clamp(1.05rem,1.9vw,1.28rem)", fontWeight:700, lineHeight:1.55, marginBottom:18 }}>
            "Antes le pagábamos casi 28% entre comisiones y promos. Con PandaPOS, la mitad de los pedidos ya son directos por WhatsApp y ese margen volvió a la caja."
          </blockquote>

          {/* Resultado destacado */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:999, background:"rgba(37,211,102,.1)", border:"1px solid rgba(37,211,102,.5)", marginBottom:26, animation:"glowG 3s ease-in-out infinite" }}>
            <span style={{ ...sg, color:"#4ade80", fontSize:13, fontWeight:800 }}>→ Recuperamos el costo en el primer mes</span>
          </div>

          {/* Author */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:11 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#8b2fc9,#7b21cc)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:16, boxShadow:"0 0 22px rgba(139,47,201,.55)" }}>M</div>
            <div style={{ textAlign:"left" }}>
              <p style={{ ...sg, color:"white", fontWeight:800, fontSize:13 }}>María P.</p>
              <p style={{ ...dm, color:"rgba(255,255,255,.35)", fontSize:11 }}>Dueña de dark kitchen · Santiago</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 5 — SISTEMA COMPLETO
───────────────────────────────────────────────────────────── */
const FEATS = [
  { icon:<Monitor size={20}/>, t:"KDS — Tu cocina nunca pierde un pedido", d:"Cada orden llega a la pantalla de cocina en tiempo real. Menos errores. Menos gritos. Más velocidad.", wide:true, anim:"glow-v", border:"rgba(139,47,201,.85)", bg:"rgba(139,47,201,.85)", delay:"0s" },
  { icon:<Bot size={20}/>, t:"Bot WhatsApp — Vende mientras duermes", d:"El bot arma el carrito, confirma y manda a cocina. Sin intervención humana.", wide:false, anim:"glow-g", border:"rgba(37,211,102,.85)", bg:"rgba(37,211,102,.85)", delay:".15s" },
  { icon:<ShoppingCart size={20}/>, t:"Carta QR — Tu menú en cualquier lugar", d:"Mesa, packaging, redes. El cliente escanea, elige y paga. Sin llamadas.", wide:false, anim:"glow-b", border:"rgba(56,189,248,.85)", bg:"rgba(56,189,248,.85)", delay:".3s" },
  { icon:<Bike size={20}/>, t:"Delivery — Control total del reparto", d:"Asigna repartidores, define zonas con precios y sigue cada pedido.", wide:false, anim:"glow-a", border:"rgba(245,158,11,.85)", bg:"rgba(245,158,11,.85)", delay:".45s" },
  { icon:<CreditCard size={20}/>, t:"POS — Caja rápida, cero caos", d:"Multipago, boleta térmica y mesas en un lugar. Menos colas, más rotación.", wide:false, anim:"glow-r", border:"rgba(239,68,68,.85)", bg:"rgba(239,68,68,.85)", delay:".6s" },
  { icon:<BarChart3 size={20}/>, t:"Panel — Sabe exactamente cuánto ganas", d:"Ventas del día, ticket promedio, ranking de clientes. Decisiones con datos.", wide:true, anim:"glow-b", border:"rgba(56,189,248,.85)", bg:"rgba(56,189,248,.85)", delay:".75s" },
  { icon:<Bell size={20}/>, t:"Notificaciones — Cada área recibe lo suyo", d:"Mesero, cajero y rider ven solo lo que les corresponde. Menos ruido, más velocidad.", wide:false, anim:"glow-p", border:"rgba(217,70,239,.85)", bg:"rgba(217,70,239,.85)", delay:".9s" },
];

const SectionSystem = () => (
  <section id="sistema" style={{ padding:"96px 0", background:"#141830" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign:"center", maxWidth:540, margin:"0 auto 52px" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
          <Panda size={64}/>
        </div>
        <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Todo incluido</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em" }}>
          Un sistema. Sin fricción.
        </h2>
        <p style={{ ...dm, color:"rgba(255,255,255,.35)", fontSize:16, marginTop:11 }}>
          Todo lo que necesitas para operar, vender y crecer — en una sola plataforma.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATS.map(f=>(
          <GlassCard key={f.t} anim={f.anim} cls={f.wide ? "sm:col-span-2" : ""} style={{ border:`1px solid ${f.border}`, gridColumn: f.wide ? "1/-1" : undefined, animationDelay:f.delay }}>
            <div style={{ padding:"22px", display:"flex", gap:16, alignItems:"flex-start" }}>
              <div style={{ width:43, height:43, borderRadius:12, background:f.bg, display:"flex", alignItems:"center", justifyContent:"center", color:"white", flexShrink:0, boxShadow:`0 0 28px ${f.bg}` }}>{f.icon}</div>
              <div>
                <h3 style={{ ...sg, color:"white", fontWeight:800, fontSize:15, marginBottom:6 }}>{f.t}</h3>
                <p style={{ ...dm, color:"rgba(255,255,255,.38)", fontSize:13, lineHeight:1.65 }}>{f.d}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 6 — BENEFICIOS
───────────────────────────────────────────────────────────── */
const BENEFITS = [
  { icon:<DollarSign size={22}/>, t:"Más ventas", d:"Canal directo disponible 24/7. Cada boleta es una oportunidad de venta futura.", c:"#4ade80", anim:"glow-g", border:"rgba(37,211,102,.7)", bg:"rgba(37,211,102,.12)", d2:"0s" },
  { icon:<Shield size={22}/>, t:"Menos errores", d:"Pedidos directos al KDS. Sin reinterpretaciones, sin llamadas, sin confusión.", c:"#c084f5", anim:"glow-v", border:"rgba(139,47,201,.7)", bg:"rgba(139,47,201,.12)", d2:".1s" },
  { icon:<Clock size={22}/>, t:"Más velocidad", d:"Del pedido al plato sin fricción. Tu equipo trabaja más rápido, tu mesa rota más.", c:"#60a5fa", anim:"glow-b", border:"rgba(56,189,248,.7)", bg:"rgba(56,189,248,.12)", d2:".2s" },
  { icon:<TrendingUp size={22}/>, t:"Control total", d:"Datos reales de ventas, clientes y operación. Sabes qué funciona y qué no.", c:"#fbbf24", anim:"glow-a", border:"rgba(245,158,11,.7)", bg:"rgba(245,158,11,.12)", d2:".3s" },
  { icon:<Users size={22}/>, t:"Clientes propios", d:"Base de datos tuya. Tus clientes no son de Rappi — son del restaurante.", c:"#f9a8d4", anim:"glow-p", border:"rgba(217,70,239,.7)", bg:"rgba(217,70,239,.12)", d2:".4s" },
  { icon:<Zap size={22}/>, t:"Sin intermediarios", d:"Uber Eats y Rappi se llevan entre 18% y 30% de cada pedido. Eso termina hoy.", c:"#f87171", anim:"glow-r", border:"rgba(239,68,68,.7)", bg:"rgba(239,68,68,.12)", d2:".5s" },
];

const SectionBenefits = () => (
  <section style={{ padding:"96px 0", background:"#1a1d3a", position:"relative", overflow:"hidden" }}>
    <Aurora op={0.45}/>
    <Dots op={0.35}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth:520, margin:"0 auto 52px" }}>
        <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Por qué funciona</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em" }}>
          Más ventas, menos caos.<br/>Control de verdad.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map(b=>(
          <GlassCard key={b.t} anim={b.anim} style={{ border:`1px solid ${b.border}`, animationDelay:b.d2 }}>
            <div style={{ padding:"26px 22px" }}>
              <div style={{ width:50, height:50, borderRadius:14, background:b.bg, border:`1px solid ${b.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:b.c, marginBottom:18 }}>{b.icon}</div>
              <h3 style={{ ...sg, color:"white", fontWeight:800, fontSize:18, marginBottom:9 }}>{b.t}</h3>
              <p style={{ ...dm, color:"rgba(255,255,255,.38)", fontSize:13, lineHeight:1.65 }}>{b.d}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 7 — PRECIOS
───────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name:"Basic", price:"$7.900", hook:"Empieza a cobrar directo",
    pitch:"Deja de pagar comisión desde hoy.",
    items:["Carta QR con menú digital","Pedidos por WhatsApp","Gestión de mesas","Soporte de arranque"],
    cta:"Empezar con Basic", ctaStyle:{ background:"rgba(255,255,255,.08)" } as React.CSSProperties,
    border:"rgba(255,255,255,.16)", anim:"glow-v", badge:null, shadow:"none",
  },
  {
    name:"Pro", price:"$11.900", hook:"Control total del negocio",
    pitch:"Todo lo que necesitas para operar y escalar.",
    items:["Todo de Basic","KDS de cocina","Bot de WhatsApp 24/7","Delivery con zonas","Panel de ventas y reportes"],
    cta:"Elegir Pro", ctaStyle:{ background:"linear-gradient(135deg,#8b2fc9,#9b3de0)", boxShadow:"0 0 28px rgba(139,47,201,.5)" } as React.CSSProperties,
    border:"rgba(139,47,201,1)", anim:"glow-v", badge:"Más elegido", shadow:"0 0 60px rgba(139,47,201,.25)",
  },
  {
    name:"Prime", price:"$14.900", hook:"Escala sin límites",
    pitch:"Multi-sucursal, kiosko y pagos avanzados.",
    items:["Todo de Pro","Multi-sucursal","Kiosko de autoatención","Pagos con Mercado Pago","Soporte prioritario"],
    cta:"Ir por Prime", ctaStyle:{ background:"rgba(255,255,255,.08)" } as React.CSSProperties,
    border:"rgba(245,158,11,.8)", anim:"glow-a", badge:null, shadow:"none",
  },
];

const SectionPricing = () => (
  <section id="planes" style={{ padding:"96px 0", background:"#141830", position:"relative", overflow:"hidden" }}>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:52 }}>
        <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Precios</p>
        <h2 style={{ ...sg, color:"white", fontSize:"clamp(2rem,4vw,3.1rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em" }}>
          Más barato que una semana<br/>de comisiones.
        </h2>
        {/* Comparativa gancho */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:14, marginTop:16, padding:"11px 18px", borderRadius:11, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)" }}>
          <span style={{ ...dm, color:"rgba(239,68,68,.8)", fontSize:13, fontWeight:600 }}>Rappi: −$6.750 por pedido</span>
          <span style={{ color:"rgba(255,255,255,.2)", fontWeight:300 }}>vs</span>
          <span style={{ ...sg, color:"#4ade80", fontSize:13, fontWeight:800 }}>PandaPOS: $7.900/mes completo</span>
        </div>
        <p style={{ ...dm, color:"rgba(255,255,255,.3)", fontSize:15, marginTop:12 }}>Elige un plan. Recupera margen. Cobra directo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(p=>(
          <div key={p.name} style={{ position:"relative" }}>
            {p.badge && (
              <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#8b2fc9,#9b3de0)", boxShadow:"0 0 22px rgba(139,47,201,.7),0 4px 14px rgba(0,0,0,.4)", padding:"4px 17px", borderRadius:999, color:"white", fontSize:11, fontWeight:800, whiteSpace:"nowrap", zIndex:2, ...sg }}>
                {p.badge}
              </div>
            )}
            <GlassCard anim={p.anim} r="1.25rem" style={{ border:`1px solid ${p.border}`, height:"100%", boxShadow:p.shadow }}>
              <div style={{ padding:"26px 22px", display:"flex", flexDirection:"column", height:"100%" }}>
                <p style={{ ...dm, color:"#c084f5", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>{p.hook}</p>
                <p style={{ ...sg, color:"white", fontWeight:900, fontSize:22, marginBottom:3 }}>{p.name}</p>
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:5 }}>
                  <span style={{ ...sg, color:"white", fontWeight:900, fontSize:36 }}>{p.price}</span>
                  <span style={{ ...dm, color:"rgba(255,255,255,.25)", fontSize:13, paddingBottom:5 }}>/mes</span>
                </div>
                <p style={{ ...dm, color:"rgba(255,255,255,.35)", fontSize:12, marginBottom:22 }}>{p.pitch}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:22, flex:1 }}>
                  {p.items.map(it=>(
                    <div key={it} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <Check size={13} style={{ color:"#4ade80", flexShrink:0, marginTop:2, filter:"drop-shadow(0 0 4px rgba(74,222,128,.6))" }}/>
                      <span style={{ ...dm, color:"rgba(255,255,255,.48)", fontSize:13 }}>{it}</span>
                    </div>
                  ))}
                </div>
                <Link href={WA} target="_blank" style={{ ...sg, ...p.ctaStyle, padding:"12px 18px", borderRadius:11, color:"white", fontWeight:800, fontSize:13, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7, textDecoration:"none" }}>
                  <MessageCircle size={13}/> {p.cta}
                </Link>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
      <p style={{ ...dm, color:"rgba(255,255,255,.18)", fontSize:12, textAlign:"center", marginTop:20 }}>¿Dudas sobre qué plan elegir? Hablamos por WhatsApp en 2 minutos.</p>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 8 — CTA FINAL
───────────────────────────────────────────────────────────── */
const SectionCTA = () => (
  <section style={{ padding:"120px 0", background:"#1a1d3a", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:800, height:500, background:"radial-gradient(ellipse,rgba(139,47,201,.17) 0%,rgba(37,211,102,.06) 50%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }}/>
    <Dots op={0.32}/>
    <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center" style={{ zIndex:1 }}>
      {/* Mascota grande */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
        <Panda size={110}/>
      </div>

      <h2 style={{ ...sg, color:"white", fontSize:"clamp(2.2rem,5vw,3.7rem)", fontWeight:900, lineHeight:1.04, letterSpacing:"-.025em", marginBottom:12 }}>
        Deja de pagar comisiones.{" "}
        <span className="grad-g">Empieza hoy.</span>
      </h2>

      {/* Submensaje de valor */}
      <p style={{ ...sg, color:"rgba(255,255,255,.52)", fontSize:20, fontWeight:600, marginBottom:8, letterSpacing:"-.01em" }}>
        Más margen. Más control. Más ventas.
      </p>
      <p style={{ ...dm, color:"rgba(255,255,255,.32)", fontSize:16, marginBottom:44, lineHeight:1.65 }}>
        Únete a los restaurantes que ya recuperaron su margen.
      </p>

      <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:18 }}>
        <Link href={WA} target="_blank" className="btn-wa" style={{ fontSize:16, padding:"18px 42px", borderRadius:16 }}>
          <MessageCircle size={20}/> Hablar por WhatsApp ahora
        </Link>
        <Link href={WA} target="_blank" className="btn-demo" style={{ fontSize:15, padding:"18px 32px", borderRadius:16 }}>
          Ver demo <ArrowRight size={16}/>
        </Link>
      </div>
      <p style={{ ...dm, color:"rgba(255,255,255,.18)", fontSize:12 }}>Sin contratos. Sin permanencia. Activa hoy.</p>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer style={{ background:"#0f1228", borderTop:"1px solid rgba(255,255,255,.06)", padding:"32px 0" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
      <Link href="/home" style={{ display:"flex", alignItems:"center", gap:8, color:"white", fontWeight:800, fontSize:16, textDecoration:"none", ...sg }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width:26, height:26, objectFit:"contain" }}/>
        <span>Panda<span style={{ color:"#c084f5" }}>POS</span></span>
      </Link>
      <p style={{ ...dm, color:"rgba(255,255,255,.18)", fontSize:12 }}>© {new Date().getFullYear()} PandaPOS · Tu margen es tuyo.</p>
      <Link href={WA} target="_blank" style={{ ...dm, color:"#25D366", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, textDecoration:"none" }}>
        <MessageCircle size={13}/> WhatsApp
      </Link>
    </div>
  </footer>
);

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div style={{ minHeight:"100vh", background:"#1a1d3a", ...dm }}>
      <Styles/>
      <Navbar/>
      <main>
        <Hero/>
        <Ticker/>
        <StatsBar/>
        <SectionSolution/>
        <SectionCycle/>
        <SectionTestimonial/>
        <SectionSystem/>
        <SectionBenefits/>
        <SectionPricing/>
        <SectionCTA/>
      </main>
      <Footer/>
    </div>
  );
}
