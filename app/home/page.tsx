"use client";

import Link from "next/link";
import {
  MessageCircle, ArrowRight, Zap, Monitor, Bot,
  ShoppingCart, Bike, CreditCard, BarChart3, Bell,
  Check, X, Star, TrendingUp, Shield, Clock, Users, DollarSign,
} from "lucide-react";

const WA = "https://wa.me/56999011141?text=Hola%2C%20quiero%20ver%20una%20demo%20de%20PandaPOS";
const sg: React.CSSProperties = { fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" };
const dm: React.CSSProperties = { fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)" };

/* ── Animations ── */
const Animations = () => (
  <style>{`
    @keyframes pulse-glow { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes float-up   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes float-dn   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
    @keyframes float-idle { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
    /* Brand: purple #8b2fc9, teal #1a5f57 */
    @keyframes glow-v { 0%,100%{box-shadow:0 0 0 1px rgba(139,47,201,.65),0 8px 40px rgba(139,47,201,.2)} 50%{box-shadow:0 0 0 1px rgba(139,47,201,1),0 8px 60px rgba(139,47,201,.45)} }
    @keyframes glow-t { 0%,100%{box-shadow:0 0 0 1px rgba(26,95,87,.65),0 8px 40px rgba(45,212,191,.15)} 50%{box-shadow:0 0 0 1px rgba(45,212,191,.9),0 8px 60px rgba(45,212,191,.35)} }
    @keyframes glow-g { 0%,100%{box-shadow:0 0 0 1px rgba(37,211,102,.6),0 8px 40px rgba(37,211,102,.12)} 50%{box-shadow:0 0 0 1px rgba(37,211,102,1),0 8px 60px rgba(37,211,102,.35)} }
    @keyframes glow-b { 0%,100%{box-shadow:0 0 0 1px rgba(56,189,248,.6),0 8px 40px rgba(56,189,248,.12)} 50%{box-shadow:0 0 0 1px rgba(56,189,248,1),0 8px 60px rgba(56,189,248,.35)} }
    @keyframes glow-r { 0%,100%{box-shadow:0 0 0 1px rgba(239,68,68,.6),0 8px 40px rgba(239,68,68,.12)} 50%{box-shadow:0 0 0 1px rgba(239,68,68,1),0 8px 60px rgba(239,68,68,.35)} }
    @keyframes glow-a { 0%,100%{box-shadow:0 0 0 1px rgba(245,158,11,.6),0 8px 40px rgba(245,158,11,.12)} 50%{box-shadow:0 0 0 1px rgba(245,158,11,1),0 8px 60px rgba(245,158,11,.35)} }
    @keyframes glow-p { 0%,100%{box-shadow:0 0 0 1px rgba(217,70,239,.6),0 8px 40px rgba(217,70,239,.12)} 50%{box-shadow:0 0 0 1px rgba(217,70,239,1),0 8px 60px rgba(217,70,239,.35)} }
    @keyframes panda-bounce { 0%,100%{transform:translateY(0) scale(1)} 40%{transform:translateY(-14px) scale(1.04)} 60%{transform:translateY(-10px) scale(1.02)} }
    @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes shimmer { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes gradient-shift {
      0%,100%{background-position:0% 50%}
      50%{background-position:100% 50%}
    }
    .card-hover { transition: transform .22s ease, filter .22s ease; }
    .card-hover:hover { transform: translateY(-4px) scale(1.015); filter: brightness(1.1); }
    .cta-pulse   { animation: glow-g 2.5s ease-in-out infinite; }
    .cta-pulse-v { animation: glow-v 2.5s ease-in-out infinite; }
    .cta-pulse-t { animation: glow-t 2.5s ease-in-out infinite; }
    .badge-float  { animation: float-up 3s ease-in-out infinite; }
    .badge-float2 { animation: float-dn 3.5s ease-in-out infinite; }
    .panda-float  { animation: float-idle 4s ease-in-out infinite; }
    .panda-bounce { animation: panda-bounce 3s ease-in-out infinite; }
    .grad-animate {
      background-size: 200% 200%;
      animation: gradient-shift 4s ease-in-out infinite;
    }
    @media(max-width:639px){
      .badge-float  { right:4px!important; }
      .badge-float2 { left:4px!important; }
    }
  `}</style>
);

/* ── Glassmorphism card ── */
const G = ({
  children, bc = "rgba(139,47,201,.75)", anim = "glow-v", delay = "0s",
  cls = "", style = {}, r = "1rem", noPad = false,
}: {
  children: React.ReactNode; bc?: string; anim?: string; delay?: string;
  cls?: string; style?: React.CSSProperties; r?: string; noPad?: boolean;
}) => (
  <div
    className={`card-hover ${cls}`}
    style={{
      borderRadius: r,
      background: "rgba(255,255,255,.04)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${bc}`,
      animation: `${anim} 3s ease-in-out infinite`,
      animationDelay: delay,
      position: "relative", overflow: "hidden", ...style,
    }}
  >
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.055) 0%,transparent 60%)", pointerEvents: "none", borderRadius: r }} />
    {noPad ? children : <div style={{ position: "relative", height: "100%" }}>{children}</div>}
  </div>
);

/* ── Aurora blobs — brand colors: purple #8b2fc9 + teal #1a5f57 ── */
const Aurora = ({ cls = "" }: { cls?: string }) => (
  <div className={`absolute pointer-events-none overflow-hidden ${cls}`} style={{ inset: 0, zIndex: 0 }}>
    <div style={{ position: "absolute", top: "-15%", left: "5%", width: 800, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(139,47,201,.25) 0%,transparent 65%)", filter: "blur(55px)", animation: "pulse-glow 6s ease-in-out infinite" }} />
    <div style={{ position: "absolute", top: "25%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(26,95,87,.3) 0%,rgba(45,212,191,.1) 60%,transparent 75%)", filter: "blur(60px)", animation: "pulse-glow 8s ease-in-out infinite", animationDelay: "2s" }} />
    <div style={{ position: "absolute", bottom: "-15%", left: "35%", width: 700, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(139,47,201,.12) 0%,rgba(26,95,87,.08) 50%,transparent 70%)", filter: "blur(55px)", animation: "pulse-glow 7s ease-in-out infinite", animationDelay: "4s" }} />
  </div>
);

const Dots = ({ op = 1 }: { op?: number }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.07) 1px,transparent 1px)", backgroundSize: "28px 28px", opacity: op, zIndex: 0 }} />
);

/* ══════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════ */
const Navbar = () => (
  <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(24px)", background: "rgba(8,8,15,.8)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
      <Link href="/home" className="flex items-center gap-2.5 text-white font-black text-lg" style={sg}>
        <img src="/logo.png" alt="PandaPOS" className="w-8 h-8 object-contain" />
        PandaPOS
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {[["Cómo funciona","#como-funciona"],["Sistema","#sistema"],["Precios","#planes"]].map(([l,h])=>(
          <Link key={h} href={h} className="text-white/40 hover:text-white text-sm font-semibold transition-colors" style={dm}>{l}</Link>
        ))}
        <Link href={WA} target="_blank" style={{ ...sg, background: "rgba(139,47,201,.18)", border: "1px solid rgba(139,47,201,.75)", padding: "10px 20px", borderRadius: 12, color: "#d8b4fe", fontSize: 13, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          className="cta-pulse-v">
          Ver demo
        </Link>
        <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", padding: "10px 20px", borderRadius: 12, color: "white", fontSize: 13, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <MessageCircle size={14} /> WhatsApp
        </Link>
      </div>
      <Link href={WA} target="_blank" className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-black cta-pulse" style={{ ...sg, background: "#25D366" }}>
        <MessageCircle size={14} /> WhatsApp
      </Link>
    </div>
  </nav>
);

/* ══════════════════════════════════════════════════════
   TICKER
══════════════════════════════════════════════════════ */
const Ticker = () => {
  const items = ["0% comisión ✦", "Pedidos automáticos ✦", "Bot WhatsApp 24/7 ✦", "KDS en tiempo real ✦", "Carta QR ✦", "Desde $7.900/mes ✦", "Clientes que son tuyos ✦", "Sin intermediarios ✦"];
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", background: "rgba(139,47,201,.06)", borderTop: "1px solid rgba(139,47,201,.2)", borderBottom: "1px solid rgba(26,95,87,.25)", padding: "10px 0", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-flex", animation: "ticker 24s linear infinite" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ ...sg, display: "inline-flex", alignItems: "center", padding: "0 28px", fontSize: 12, fontWeight: 700, color: i % 2 === 0 ? "rgba(192,132,252,.6)" : "rgba(45,212,191,.5)", letterSpacing: ".04em" }}>{t}</span>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MOCKUP — WhatsApp chat con pedido
══════════════════════════════════════════════════════ */
const Mockup = () => (
  <div className="relative" style={{ padding: "24px 0" }}>
    <div style={{ position: "absolute", inset: -40, background: "radial-gradient(ellipse,rgba(37,211,102,.2) 0%,rgba(139,47,201,.12) 50%,transparent 75%)", filter: "blur(40px)", borderRadius: "50%", pointerEvents: "none" }} />
    <G bc="rgba(37,211,102,.9)" anim="glow-g" r="1.25rem" noPad style={{ boxShadow: "0 32px 80px rgba(0,0,0,.6)" }}>
      <div style={{ background: "rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.08)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#25D366,#1db954)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(37,211,102,.5)" }}>
          <MessageCircle size={15} color="white" />
        </div>
        <div>
          <p style={{ ...sg, color: "white", fontSize: 12, fontWeight: 800 }}>Tu Restaurante · PandaPOS</p>
          <p style={{ ...dm, color: "#25D366", fontSize: 10 }}>● en línea</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[1,2,3].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.2)" }} />)}
        </div>
      </div>
      <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ maxWidth: "90%" }}>
          <G bc="rgba(139,47,201,.85)" anim="glow-v" r=".875rem" noPad>
            <div style={{ padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ ...sg, color: "white", fontWeight: 800, fontSize: 13 }}>Pedido #1.247</span>
                <span style={{ ...dm, background: "rgba(139,47,201,.25)", border: "1px solid rgba(139,47,201,.65)", color: "#d8b4fe", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>Mesa 4</span>
              </div>
              {["2× Sushi Roll Salmón","1× Causa Rellena","3× Agua s/gas"].map(it => (
                <div key={it} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#c084f5", flexShrink: 0 }} />
                  <span style={{ ...dm, color: "rgba(255,255,255,.5)", fontSize: 12 }}>{it}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...dm, color: "rgba(255,255,255,.3)", fontSize: 11 }}>Total</span>
                <span style={{ ...sg, color: "white", fontWeight: 800, fontSize: 15 }}>$22.500</span>
              </div>
            </div>
          </G>
          <span style={{ ...dm, color: "rgba(255,255,255,.2)", fontSize: 10, marginLeft: 4 }}>hace 2 min</span>
        </div>
        {["Pedido enviado al KDS ✓","0% de comisión cobrada ✓","Cliente guardado en tu base ✓"].map(t => (
          <div key={t} style={{ alignSelf: "flex-end", background: "rgba(37,211,102,.15)", border: "1px solid rgba(37,211,102,.5)", borderRadius: "14px 14px 2px 14px", padding: "8px 12px", backdropFilter: "blur(8px)" }}>
            <span style={{ ...dm, color: "#4ade80", fontSize: 11, fontWeight: 600 }}>{t}</span>
          </div>
        ))}
      </div>
    </G>
    {/* Badges flotantes */}
    <div className="badge-float" style={{ position: "absolute", top: -10, right: -20, background: "rgba(239,68,68,.12)", backdropFilter: "blur(16px)", border: "1px solid rgba(239,68,68,.85)", borderRadius: 14, padding: "10px 16px", boxShadow: "0 0 30px rgba(239,68,68,.3),0 8px 32px rgba(0,0,0,.4)" }}>
      <p style={{ ...dm, color: "rgba(252,165,165,.8)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Rappi te cobraría</p>
      <p style={{ ...sg, color: "#f87171", fontWeight: 900, fontSize: 22, lineHeight: 1.2, textShadow: "0 0 20px rgba(239,68,68,.6)" }}>−$6.750</p>
    </div>
    <div className="badge-float2" style={{ position: "absolute", bottom: -10, left: -20, background: "rgba(37,211,102,.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(37,211,102,.85)", borderRadius: 14, padding: "10px 16px", boxShadow: "0 0 30px rgba(37,211,102,.25),0 8px 32px rgba(0,0,0,.4)" }}>
      <p style={{ ...dm, color: "rgba(74,222,128,.8)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Con PandaPOS</p>
      <p style={{ ...sg, color: "#4ade80", fontWeight: 900, fontSize: 22, lineHeight: 1.2, textShadow: "0 0 20px rgba(37,211,102,.6)" }}>$0 comisión</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   1. HERO
══════════════════════════════════════════════════════ */
const Hero = () => (
  <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 80, paddingBottom: 80, background: "#08080f", position: "relative", overflow: "hidden" }}>
    <Aurora />
    <Dots />
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full" style={{ zIndex: 1 }}>
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(139,47,201,.13)", border: "1px solid rgba(139,47,201,.65)", marginBottom: 28, backdropFilter: "blur(8px)", animation: "glow-v 3s ease-in-out infinite" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c084f5", boxShadow: "0 0 8px #c084f5", animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ ...dm, color: "rgba(216,180,254,.9)", fontSize: 12, fontWeight: 600 }}>Sistema operativo para restaurantes</span>
          </div>

          {/* Headline */}
          <h1 style={{ ...sg, fontSize: "clamp(2.7rem,5.2vw,4.6rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-.025em", color: "white", marginBottom: 18 }}>
            Las apps de delivery<br />
            <span style={{ background: "linear-gradient(135deg,#f87171,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 18px rgba(239,68,68,.5))" }}>te cobran hasta un 30%</span>
            <br />por cada pedido.
          </h1>

          {/* Sub */}
          <p style={{ ...dm, color: "rgba(255,255,255,.55)", fontSize: 18, lineHeight: 1.7, maxWidth: 480, marginBottom: 32 }}>
            Con PandaPOS vendes directo por{" "}
            <span style={{ color: "white", fontWeight: 700 }}>QR y WhatsApp</span>,
            automatizas tu operación y{" "}
            <span style={{ color: "#4ade80", fontWeight: 700 }}>recuperas tu margen.</span>
          </p>

          {/* Bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
            {[
              { icon: "🚫", t: "0% comisión por pedido", c: "#f87171" },
              { icon: "💬", t: "Pedidos directos por WhatsApp y QR", c: "#4ade80" },
              { icon: "⚡", t: "Automatización total del negocio", c: "#c084f5" },
            ].map(b => (
              <div key={b.t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{b.icon}</div>
                <span style={{ ...dm, color: "rgba(255,255,255,.75)", fontSize: 15, fontWeight: 500 }}>{b.t}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
            <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", padding: "15px 30px", borderRadius: 14, color: "white", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <MessageCircle size={17} /> Hablar por WhatsApp
            </Link>
            <Link href={WA} target="_blank" className="cta-pulse-v" style={{ ...sg, background: "rgba(139,47,201,.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(139,47,201,.75)", padding: "15px 30px", borderRadius: 14, color: "#d8b4fe", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              Ver demo <ArrowRight size={15} />
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { v: "0%", l: "comisión", c: "#f87171" },
              { v: "$7.900", l: "desde /mes", c: "#4ade80" },
              { v: "24/7", l: "automático", c: "#c084f5" },
            ].map(s => (
              <div key={s.l}>
                <p style={{ ...sg, color: s.c, fontWeight: 900, fontSize: 26, textShadow: `0 0 20px ${s.c}` }}>{s.v}</p>
                <p style={{ ...dm, color: "rgba(255,255,255,.28)", fontSize: 12 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup + Mascota */}
        <div className="hidden lg:block" style={{ position: "relative" }}>
          <Mockup />
          {/* Mascota PandaPOS — logo.png flotando con glow de marca */}
          <div className="panda-bounce" style={{ position: "absolute", bottom: -36, right: -28, width: 130, height: 130, filter: "drop-shadow(0 0 28px rgba(139,47,201,.65)) drop-shadow(0 0 12px rgba(45,212,191,.35))" }}>
            <img src="/logo.png" alt="PandaPOS" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   STATS BAR
══════════════════════════════════════════════════════ */
const StatsBar = () => (
  <div style={{ background: "rgba(255,255,255,.025)", borderTop: "1px solid rgba(255,255,255,.07)", borderBottom: "1px solid rgba(255,255,255,.07)", backdropFilter: "blur(8px)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 py-6">
        {[
          { v: "0%", l: "Comisión por pedido", c: "#f87171", g: "rgba(239,68,68,.5)" },
          { v: "30%", l: "Margen que recuperas", c: "#4ade80", g: "rgba(37,211,102,.5)" },
          { v: "5 min", l: "Para activar", c: "#60a5fa", g: "rgba(96,165,250,.5)" },
          { v: "24/7", l: "Opera solo, sin esfuerzo", c: "#c084f5", g: "rgba(139,47,201,.5)" },
        ].map((s, i) => (
          <div key={s.l} style={{ textAlign: "center", padding: "0 16px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
            <p style={{ ...sg, color: s.c, fontWeight: 900, fontSize: 30, textShadow: `0 0 24px ${s.g}`, lineHeight: 1 }}>{s.v}</p>
            <p style={{ ...dm, color: "rgba(255,255,255,.28)", fontSize: 11, marginTop: 6 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   2. SOLUCIÓN SIMPLE — 3 pasos
══════════════════════════════════════════════════════ */
const SectionSolution = () => (
  <section style={{ padding: "96px 0", background: "#08080f", position: "relative", overflow: "hidden" }} id="como-funciona">
    <Aurora cls="opacity-60" />
    <Dots op={0.5} />
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex: 1 }}>
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 56px" }}>
        <p style={{ ...dm, color: "#c084f5", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>La solución</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-.022em" }}>
          Tu canal. Tu margen.<br />Tus clientes.
        </h2>
        <p style={{ ...dm, color: "rgba(255,255,255,.38)", fontSize: 17, marginTop: 14, lineHeight: 1.65 }}>
          QR → Carta → Pedido → WhatsApp. Sin apps de por medio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { n: "01", icon: "📱", title: "Escanean tu QR", desc: "En la mesa, el packaging o la boleta. El cliente entra a tu menú en segundos — sin descargar nada.", bc: "rgba(139,47,201,.85)", anim: "glow-v", ic: "rgba(139,47,201,.85)", d: "0s" },
          { n: "02", icon: "🛒", title: "Ven tu carta y piden", desc: "Menú digital con fotos, variantes y precios. El pedido armado, confirmado, sin confusión ni llamadas.", bc: "rgba(56,189,248,.85)", anim: "glow-b", ic: "rgba(56,189,248,.85)", d: ".4s" },
          { n: "03", icon: "💬", title: "Llega directo a ti", desc: "El pedido llega confirmado a tu KDS y WhatsApp. Sin intermediarios, sin porcentaje, sin esperas.", bc: "rgba(37,211,102,.85)", anim: "glow-g", ic: "rgba(37,211,102,.85)", d: ".8s" },
        ].map(s => (
          <G key={s.n} bc={s.bc} anim={s.anim} delay={s.d} r="1rem">
            <div style={{ padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: s.ic, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 0 24px ${s.ic}` }}>{s.icon}</div>
                <span style={{ ...sg, color: "rgba(255,255,255,.08)", fontWeight: 900, fontSize: 32 }}>{s.n}</span>
              </div>
              <h3 style={{ ...sg, color: "white", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ ...dm, color: "rgba(255,255,255,.38)", fontSize: 13, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          </G>
        ))}
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   3. DIFERENCIADOR — Ciclo de boleta
══════════════════════════════════════════════════════ */
const SectionCycle = () => (
  <section style={{ padding: "96px 0", background: "#060609" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div>
          <p style={{ ...dm, color: "#c084f5", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14 }}>El ciclo que cambia todo</p>
          <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-.022em", marginBottom: 18 }}>
            Convierte cada boleta<br />en una nueva venta.
          </h2>
          <p style={{ ...dm, color: "rgba(255,255,255,.4)", fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>
            Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Sin que tú hagas nada. Sin comisión.
          </p>

          {/* Resultado destacado */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 12, background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.4)", marginBottom: 28, animation: "glow-g 3s ease-in-out infinite" }}>
            <img src="/logo.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(139,47,201,.5))" }} />
            <span style={{ ...sg, color: "#4ade80", fontSize: 13, fontWeight: 800 }}>Clientes que vuelven sin pagar publicidad</span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", padding: "13px 26px", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <MessageCircle size={15} /> Activar ciclo directo
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "🧾", label: "Entregas con QR impreso", desc: "Cada boleta lleva tu QR. El cliente se va con la puerta abierta.", bc: "rgba(139,47,201,.85)", anim: "glow-v", ic: "rgba(139,47,201,.85)", d: "0s" },
            { icon: "📲", label: "Escanea cuando quiere", desc: "Tu menú disponible las 24h. Sin llamar, sin intermediarios.", bc: "rgba(56,189,248,.85)", anim: "glow-b", ic: "rgba(56,189,248,.85)", d: ".5s" },
            { icon: "💬", label: "Nuevo pedido, cero comisión", desc: "Tú cobras el 100%. El margen es tuyo, como debe ser.", bc: "rgba(37,211,102,.85)", anim: "glow-g", ic: "rgba(37,211,102,.8)", d: "1s" },
          ].map((s, i) => (
            <G key={i} bc={s.bc} anim={s.anim} delay={s.d} r=".875rem">
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.ic, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, boxShadow: `0 0 20px ${s.ic}` }}>{s.icon}</div>
                <div>
                  <p style={{ ...sg, color: "white", fontWeight: 800, fontSize: 13 }}>{s.label}</p>
                  <p style={{ ...dm, color: "rgba(255,255,255,.35)", fontSize: 12, marginTop: 2 }}>{s.desc}</p>
                </div>
                <span style={{ ...sg, color: "rgba(255,255,255,.07)", fontWeight: 900, fontSize: 26, marginLeft: "auto" }}>{i + 1}</span>
              </div>
            </G>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   4. PRUEBA SOCIAL
══════════════════════════════════════════════════════ */
const SectionSocialProof = () => (
  <section style={{ padding: "96px 0", background: "#08080f", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(139,47,201,.1) 0%,transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
    <div className="max-w-3xl mx-auto px-5 sm:px-8" style={{ position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ ...dm, color: "#c084f5", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>Lo que dicen los que ya usan PandaPOS</p>
      </div>
      <G bc="rgba(139,47,201,.8)" anim="glow-v" r="1.5rem">
        <div style={{ padding: "48px 40px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={18} style={{ color: "#fbbf24", fill: "#fbbf24", filter: "drop-shadow(0 0 6px rgba(251,191,36,.6))" }} />)}
          </div>
          <blockquote style={{ ...sg, color: "white", fontSize: "clamp(1.05rem,2vw,1.3rem)", fontWeight: 700, lineHeight: 1.55, marginBottom: 20 }}>
            "Antes le pagábamos casi 28% entre comisiones y promos. Con PandaPOS, la mitad de los pedidos ya son directos por WhatsApp y ese margen volvió a la caja."
          </blockquote>
          {/* Resultado destacado */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 999, background: "rgba(37,211,102,.12)", border: "1px solid rgba(37,211,102,.5)", marginBottom: 28, animation: "glow-g 3s ease-in-out infinite" }}>
            <span style={{ ...sg, color: "#4ade80", fontSize: 13, fontWeight: 800 }}>→ Recuperamos el costo en el primer mes</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#8b2fc9,#7b21cc)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 16, boxShadow: "0 0 20px rgba(139,47,201,.5)" }}>M</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ ...sg, color: "white", fontWeight: 800, fontSize: 13 }}>María P.</p>
              <p style={{ ...dm, color: "rgba(255,255,255,.35)", fontSize: 11 }}>Dueña de dark kitchen · Santiago</p>
            </div>
          </div>
        </div>
      </G>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   5. SISTEMA COMPLETO — Features bento (beneficio > función)
══════════════════════════════════════════════════════ */
const FEATS = [
  {
    icon: <Monitor size={20} />, title: "KDS — Tu cocina nunca más pierde un pedido",
    desc: "Cada orden llega a la pantalla de cocina en tiempo real. Menos errores. Menos gritos. Más velocidad.",
    wide: true, bc: "rgba(139,47,201,.85)", anim: "glow-v", ic: "rgba(139,47,201,.85)", d: "0s",
  },
  {
    icon: <Bot size={20} />, title: "Bot WhatsApp — Vende mientras duermes",
    desc: "El bot arma el carrito, confirma el pedido y lo manda a cocina. Sin intervención humana, sin errores.",
    wide: false, bc: "rgba(37,211,102,.85)", anim: "glow-g", ic: "rgba(37,211,102,.85)", d: ".2s",
  },
  {
    icon: <ShoppingCart size={20} />, title: "Carta QR — Tu menú en cualquier lugar",
    desc: "Mesa, packaging, redes. El cliente escanea, elige y paga. Sin llamadas, sin confusión.",
    wide: false, bc: "rgba(56,189,248,.85)", anim: "glow-b", ic: "rgba(56,189,248,.85)", d: ".4s",
  },
  {
    icon: <Bike size={20} />, title: "Delivery — Control total del reparto",
    desc: "Asigna repartidores, define zonas con precios y sigue cada pedido en tiempo real.",
    wide: false, bc: "rgba(245,158,11,.85)", anim: "glow-a", ic: "rgba(245,158,11,.85)", d: ".6s",
  },
  {
    icon: <CreditCard size={20} />, title: "POS — Caja rápida, cero caos",
    desc: "Multipago, boleta térmica y mesas en un solo lugar. Menos colas, más rotación.",
    wide: false, bc: "rgba(239,68,68,.85)", anim: "glow-r", ic: "rgba(239,68,68,.85)", d: ".8s",
  },
  {
    icon: <BarChart3 size={20} />, title: "Panel — Sabe exactamente cuánto ganas",
    desc: "Ventas del día, ticket promedio, ranking de clientes. Toma decisiones con datos reales.",
    wide: true, bc: "rgba(56,189,248,.85)", anim: "glow-b", ic: "rgba(56,189,248,.85)", d: "1s",
  },
  {
    icon: <Bell size={20} />, title: "Notificaciones — Cada área recibe lo suyo",
    desc: "Mesero, cajero y rider ven solo lo que les corresponde. Menos ruido, más velocidad.",
    wide: false, bc: "rgba(217,70,239,.85)", anim: "glow-p", ic: "rgba(217,70,239,.85)", d: "1.2s",
  },
];

const SectionSystem = () => (
  <section style={{ padding: "96px 0", background: "#060609" }} id="sistema">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 56px" }}>
        {/* Mascota PandaPOS */}
        <div style={{ width: 72, height: 72, margin: "0 auto 16px", filter: "drop-shadow(0 0 20px rgba(139,47,201,.55))" }}>
          <img src="/logo.png" alt="PandaPOS" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <p style={{ ...dm, color: "#c084f5", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>Todo incluido</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-.022em" }}>
          Un sistema. Sin fricción.
        </h2>
        <p style={{ ...dm, color: "rgba(255,255,255,.35)", fontSize: 16, marginTop: 12 }}>
          Todo lo que necesitas para operar, vender y crecer — en una sola plataforma.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {FEATS.map(f => (
          <G key={f.title} bc={f.bc} anim={f.anim} delay={f.d} r="1rem"
            cls={f.wide ? "col-span-2" : ""}
            style={f.wide ? { gridColumn: "1/-1" } : {}}>
            <div style={{ padding: "24px", display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.ic, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: `0 0 28px ${f.ic}` }}>{f.icon}</div>
              <div style={{ maxWidth: f.wide ? 640 : "100%" }}>
                <h3 style={{ ...sg, color: "white", fontWeight: 800, fontSize: 15, marginBottom: 7 }}>{f.title}</h3>
                <p style={{ ...dm, color: "rgba(255,255,255,.38)", fontSize: 13, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          </G>
        ))}
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   6. BENEFICIOS — 5 pilares
══════════════════════════════════════════════════════ */
const BENEFITS = [
  { icon: <DollarSign size={22} />, title: "Más ventas", desc: "Canal directo disponible 24/7. Cada boleta es una oportunidad de venta futura.", c: "#4ade80", g: "rgba(37,211,102,.5)", anim: "glow-g", bc: "rgba(37,211,102,.7)" },
  { icon: <Shield size={22} />, title: "Menos errores", desc: "Pedidos directos al KDS. Sin reinterpretaciones, sin llamadas, sin confusión.", c: "#c084f5", g: "rgba(139,47,201,.5)", anim: "glow-v", bc: "rgba(139,47,201,.7)" },
  { icon: <Clock size={22} />, title: "Más velocidad", desc: "Del pedido al plato sin fricción. Tu equipo trabaja más rápido, tu mesa rota más.", c: "#60a5fa", g: "rgba(96,165,250,.5)", anim: "glow-b", bc: "rgba(56,189,248,.7)" },
  { icon: <TrendingUp size={22} />, title: "Control total", desc: "Datos reales de ventas, clientes y operación. Sabes qué funciona y qué no.", c: "#fbbf24", g: "rgba(251,191,36,.5)", anim: "glow-a", bc: "rgba(245,158,11,.7)" },
  { icon: <Users size={22} />, title: "Clientes propios", desc: "Base de datos tuya. Tus clientes no son de Rappi — son del restaurante.", c: "#f9a8d4", g: "rgba(249,168,212,.5)", anim: "glow-p", bc: "rgba(217,70,239,.7)" },
];

const SectionBenefits = () => (
  <section style={{ padding: "96px 0", background: "#08080f", position: "relative", overflow: "hidden" }}>
    <Aurora cls="opacity-50" />
    <Dots op={0.4} />
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex: 1 }}>
      <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 56px" }}>
        <p style={{ ...dm, color: "#c084f5", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>Por qué funciona</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-.022em" }}>
          Más ventas, menos caos.<br />Control de verdad.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map((b, i) => (
          <G key={b.title} bc={b.bc} anim={b.anim} delay={`${i * 0.15}s`} r="1rem">
            <div style={{ padding: "28px 24px" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: `${b.bc.replace(".7)", ".15)")}`, border: `1px solid ${b.bc}`, display: "flex", alignItems: "center", justifyContent: "center", color: b.c, marginBottom: 20, boxShadow: `0 0 24px ${b.g}` }}>
                {b.icon}
              </div>
              <h3 style={{ ...sg, color: "white", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{b.title}</h3>
              <p style={{ ...dm, color: "rgba(255,255,255,.4)", fontSize: 13, lineHeight: 1.65 }}>{b.desc}</p>
            </div>
          </G>
        ))}
        {/* Último bloque — comparativa rápida */}
        <G bc="rgba(239,68,68,.7)" anim="glow-r" r="1rem">
          <div style={{ padding: "28px 24px" }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", marginBottom: 20, boxShadow: "0 0 24px rgba(239,68,68,.5)" }}>
              <Zap size={22} />
            </div>
            <h3 style={{ ...sg, color: "white", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Sin intermediarios</h3>
            <p style={{ ...dm, color: "rgba(255,255,255,.4)", fontSize: 13, lineHeight: 1.65 }}>
              Uber Eats, Rappi y PedidosYa se llevan entre 18% y 30% de cada pedido. Tú no tienes por qué seguir pagando eso.
            </p>
          </div>
        </G>
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   7. PRECIOS
══════════════════════════════════════════════════════ */
const PLANS = [
  {
    name: "Basic", price: "$7.900",
    hook: "Empieza a cobrar directo",
    pitch: "Deja de pagar comisión desde hoy.",
    items: ["Carta QR con menú digital","Pedidos por WhatsApp","Gestión de mesas","Soporte de arranque"],
    cta: "Empezar con Basic",
    bc: "rgba(255,255,255,.18)", anim: "glow-v", badge: null,
    ctaBg: "rgba(255,255,255,.08)", ctaGlow: "none",
  },
  {
    name: "Pro", price: "$11.900",
    hook: "Control total del negocio",
    pitch: "Todo lo que necesitas para operar y escalar.",
    items: ["Todo de Basic","KDS de cocina","Bot de WhatsApp 24/7","Delivery con zonas","Panel de ventas y reportes"],
    cta: "Elegir Pro",
    bc: "rgba(139,47,201,1)", anim: "glow-v", badge: "Más elegido",
    ctaBg: "linear-gradient(135deg,#8b2fc9,#9b3de0)", ctaGlow: "0 0 30px rgba(139,47,201,.5)",
  },
  {
    name: "Prime", price: "$14.900",
    hook: "Escala sin límites",
    pitch: "Multi-sucursal, kiosko y pagos avanzados.",
    items: ["Todo de Pro","Multi-sucursal","Kiosko de autoatención","Pagos con Mercado Pago","Soporte prioritario"],
    cta: "Ir por Prime",
    bc: "rgba(245,158,11,.85)", anim: "glow-a", badge: null,
    ctaBg: "rgba(255,255,255,.08)", ctaGlow: "none",
  },
];

const SectionPricing = () => (
  <section id="planes" style={{ padding: "96px 0", background: "#060609", position: "relative", overflow: "hidden" }}>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex: 1 }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ ...dm, color: "#c084f5", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>Precios</p>
        <h2 style={{ ...sg, color: "white", fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-.022em" }}>
          Más barato que una semana<br />de comisiones.
        </h2>
        {/* Comparativa gancho */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, marginTop: 18, padding: "12px 20px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)" }}>
          <span style={{ ...dm, color: "rgba(239,68,68,.8)", fontSize: 13, fontWeight: 600 }}>Rappi: −$6.750/pedido</span>
          <span style={{ color: "rgba(255,255,255,.2)" }}>vs</span>
          <span style={{ ...sg, color: "#4ade80", fontSize: 13, fontWeight: 800 }}>PandaPOS: $7.900/mes completo</span>
        </div>
        <p style={{ ...dm, color: "rgba(255,255,255,.32)", fontSize: 16, marginTop: 14 }}>Elige un plan. Recupera margen. Cobra directo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(p => (
          <div key={p.name} style={{ position: "relative" }}>
            {p.badge && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#8b2fc9,#9b3de0)", boxShadow: "0 0 24px rgba(139,47,201,.7),0 4px 16px rgba(0,0,0,.4)", padding: "4px 18px", borderRadius: 999, color: "white", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", zIndex: 2, ...sg }}>
                {p.badge}
              </div>
            )}
            <G bc={p.bc} anim={p.anim} r="1.25rem" style={{ height: "100%" }}>
              <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Hook */}
                <p style={{ ...dm, color: p.name === "Pro" ? "#c084f5" : "rgba(255,255,255,.35)", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{p.hook}</p>
                <p style={{ ...sg, color: "white", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>{p.name}</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                  <span style={{ ...sg, color: "white", fontWeight: 900, fontSize: 38 }}>{p.price}</span>
                  <span style={{ ...dm, color: "rgba(255,255,255,.25)", fontSize: 13, paddingBottom: 6 }}>/mes</span>
                </div>
                <p style={{ ...dm, color: "rgba(255,255,255,.35)", fontSize: 13, marginBottom: 24 }}>{p.pitch}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, flex: 1 }}>
                  {p.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Check size={14} style={{ color: "#4ade80", flexShrink: 0, marginTop: 1, filter: "drop-shadow(0 0 4px rgba(74,222,128,.6))" }} />
                      <span style={{ ...dm, color: "rgba(255,255,255,.48)", fontSize: 13 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href={WA} target="_blank" style={{ ...sg, background: p.ctaBg, padding: "13px 20px", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", boxShadow: p.ctaGlow }}>
                  <MessageCircle size={14} /> {p.cta}
                </Link>
              </div>
            </G>
          </div>
        ))}
      </div>
      <p style={{ ...dm, color: "rgba(255,255,255,.18)", fontSize: 12, textAlign: "center", marginTop: 24 }}>¿Dudas sobre qué plan elegir? Hablamos por WhatsApp y te lo recomendamos en 2 minutos.</p>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   8. CTA FINAL
══════════════════════════════════════════════════════ */
const SectionFinalCTA = () => (
  <section style={{ padding: "120px 0", background: "#08080f", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 500, background: "radial-gradient(ellipse,rgba(139,47,201,.18) 0%,rgba(37,211,102,.07) 50%,transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
    <Dots op={0.35} />
    <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center" style={{ zIndex: 1 }}>
      {/* Mascota PandaPOS — grande, protagonista del CTA */}
      <div className="panda-bounce" style={{ width: 100, height: 100, margin: "0 auto 20px", filter: "drop-shadow(0 0 36px rgba(139,47,201,.7)) drop-shadow(0 0 16px rgba(45,212,191,.4))" }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      <h2 style={{ ...sg, color: "white", fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-.022em", marginBottom: 16 }}>
        Deja de pagar comisiones.{" "}
        <span style={{ background: "linear-gradient(135deg,#25D366,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 16px rgba(37,211,102,.45))" }}>
          Empieza hoy.
        </span>
      </h2>

      <p style={{ ...sg, color: "rgba(255,255,255,.55)", fontSize: 20, fontWeight: 600, marginBottom: 10, letterSpacing: "-.01em" }}>
        Más margen. Más control. Más ventas.
      </p>
      <p style={{ ...dm, color: "rgba(255,255,255,.35)", fontSize: 16, marginBottom: 44, lineHeight: 1.65 }}>
        Únete a los restaurantes que ya recuperaron su margen.
      </p>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <Link href={WA} target="_blank" className="cta-pulse" style={{ ...sg, background: "linear-gradient(135deg,#25D366,#1db954)", padding: "18px 44px", borderRadius: 16, color: "white", fontWeight: 900, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <MessageCircle size={20} /> Hablar por WhatsApp ahora
        </Link>
        <Link href={WA} target="_blank" className="cta-pulse-v" style={{ ...sg, background: "rgba(139,47,201,.15)", border: "1px solid rgba(139,47,201,.7)", backdropFilter: "blur(8px)", padding: "18px 36px", borderRadius: 16, color: "#d8b4fe", fontWeight: 800, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          Ver demo <ArrowRight size={16} />
        </Link>
      </div>
      <p style={{ ...dm, color: "rgba(255,255,255,.18)", fontSize: 12 }}>Sin contratos. Sin permanencia. Activa hoy.</p>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
const Footer = () => (
  <footer style={{ background: "#040407", borderTop: "1px solid rgba(255,255,255,.06)", padding: "36px 0" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: 800, fontSize: 16, textDecoration: "none", ...sg }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width: 28, height: 28, objectFit: "contain" }} />
        PandaPOS
      </Link>
      <p style={{ ...dm, color: "rgba(255,255,255,.18)", fontSize: 12 }}>© {new Date().getFullYear()} PandaPOS · Tu margen es tuyo.</p>
      <Link href={WA} target="_blank" style={{ ...dm, color: "#25D366", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
        <MessageCircle size={13} /> WhatsApp
      </Link>
    </div>
  </footer>
);

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080f", ...dm }}>
      <Animations />
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <StatsBar />
        <SectionSolution />
        <SectionCycle />
        <SectionSocialProof />
        <SectionSystem />
        <SectionBenefits />
        <SectionPricing />
        <SectionFinalCTA />
      </main>
      <Footer />
    </div>
  );
}
