"use client";

import Link from "next/link";
import {
  MessageCircle, ArrowRight, Zap, Monitor, Bot,
  ShoppingCart, Bike, CreditCard, BarChart3, Bell,
  Check, Star, TrendingUp, Shield, Clock, Users, DollarSign,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   BRAND TOKENS  — light theme, coherente con el sistema
   indigo: #6366f1  purple: #8b2fc9  teal: #1a5f57  wa: #25D366
───────────────────────────────────────────────────────────── */
const WA = "https://wa.me/56999011141?text=Hola%2C%20quiero%20ver%20una%20demo%20de%20PandaPOS";
const ou: React.CSSProperties = { fontFamily: "'Outfit', system-ui, sans-serif" };

/* ─────────────────────────────────────────────────────────────
   ESTILOS GLOBALES
───────────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; }

    @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1deg)} 55%{transform:translateY(-10px) rotate(1deg)} }
    @keyframes floatB { 0%,100%{transform:translateY(0) rotate(1deg)} 55%{transform:translateY(8px) rotate(-1deg)} }
    @keyframes floatM { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.03)} }
    @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes strike { from{width:0} to{width:100%} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pandaBounce { 0%,100%{transform:translateY(0) scale(1)} 45%{transform:translateY(-14px) scale(1.05)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes borderPulse {
      0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.25)}
      50%{box-shadow:0 0 0 6px rgba(99,102,241,0)}
    }

    .panda { animation: pandaBounce 3.2s ease-in-out infinite; }
    .float-a { animation: floatA 4s ease-in-out infinite; }
    .float-b { animation: floatB 4.5s ease-in-out infinite; }
    .float-m { animation: floatM 3.5s ease-in-out infinite; }

    /* Glass card — light */
    .card-light {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(24px) saturate(1.6);
      -webkit-backdrop-filter: blur(24px) saturate(1.6);
      border: 1px solid rgba(255,255,255,0.95);
      border-radius: 1rem;
      box-shadow: 0 4px 24px rgba(99,102,241,.07), 0 1px 4px rgba(0,0,0,.05);
      position: relative;
      overflow: hidden;
      transition: transform .22s ease, box-shadow .22s ease;
    }
    .card-light:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(99,102,241,.14), 0 2px 8px rgba(0,0,0,.07);
    }

    /* Variante con borde de color */
    .card-indigo  { border-color: rgba(99,102,241,.35) !important; box-shadow: 0 4px 24px rgba(99,102,241,.1), 0 0 0 1px rgba(99,102,241,.12); }
    .card-purple  { border-color: rgba(139,47,201,.3) !important;  box-shadow: 0 4px 24px rgba(139,47,201,.09), 0 0 0 1px rgba(139,47,201,.1); }
    .card-green   { border-color: rgba(37,211,102,.35) !important; box-shadow: 0 4px 24px rgba(37,211,102,.1), 0 0 0 1px rgba(37,211,102,.12); }
    .card-teal    { border-color: rgba(26,95,87,.3) !important;    box-shadow: 0 4px 24px rgba(26,95,87,.08), 0 0 0 1px rgba(26,95,87,.1); }
    .card-amber   { border-color: rgba(245,158,11,.3) !important;  box-shadow: 0 4px 24px rgba(245,158,11,.09), 0 0 0 1px rgba(245,158,11,.1); }
    .card-red     { border-color: rgba(239,68,68,.3) !important;   box-shadow: 0 4px 24px rgba(239,68,68,.09), 0 0 0 1px rgba(239,68,68,.1); }
    .card-sky     { border-color: rgba(56,189,248,.3) !important;  box-shadow: 0 4px 24px rgba(56,189,248,.09), 0 0 0 1px rgba(56,189,248,.1); }

    .card-light:hover.card-indigo { box-shadow: 0 12px 40px rgba(99,102,241,.22), 0 0 0 1px rgba(99,102,241,.25); }
    .card-light:hover.card-green  { box-shadow: 0 12px 40px rgba(37,211,102,.2),  0 0 0 1px rgba(37,211,102,.25); }
    .card-light:hover.card-purple { box-shadow: 0 12px 40px rgba(139,47,201,.18), 0 0 0 1px rgba(139,47,201,.22); }
    .card-light:hover.card-teal   { box-shadow: 0 12px 40px rgba(26,95,87,.18),   0 0 0 1px rgba(26,95,87,.22); }

    /* Botones */
    .btn-wa {
      background: linear-gradient(135deg,#25D366,#1aaa4f);
      box-shadow: 0 4px 18px rgba(37,211,102,.35);
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; border-radius: 12px;
      color: white; font-weight: 800; font-size: 15px;
      text-decoration: none; transition: transform .18s ease, box-shadow .18s ease;
      animation: borderPulse 2.5s ease-in-out infinite;
    }
    .btn-wa:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,211,102,.5); }

    .btn-indigo {
      background: linear-gradient(135deg,#6366f1,#4f46e5);
      box-shadow: 0 4px 18px rgba(99,102,241,.35);
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; border-radius: 12px;
      color: white; font-weight: 800; font-size: 15px;
      text-decoration: none; transition: transform .18s ease, box-shadow .18s ease;
    }
    .btn-indigo:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,.5); }

    .btn-ghost {
      background: rgba(99,102,241,.08);
      border: 1.5px solid rgba(99,102,241,.3);
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 26px; border-radius: 12px;
      color: #4f46e5; font-weight: 700; font-size: 15px;
      text-decoration: none; transition: all .18s ease;
    }
    .btn-ghost:hover { background: rgba(99,102,241,.14); transform: translateY(-1px); }

    /* Strikethrough */
    .strike-wrap { position:relative; display:inline-block; }
    .strike-wrap::after {
      content:''; position:absolute; left:0; top:50%;
      height:3px; background:#ef4444;
      box-shadow:0 0 8px rgba(239,68,68,.5);
      animation:strike 1s cubic-bezier(.77,0,.18,1) .9s forwards;
      width:0;
    }

    /* Gradiente de texto */
    .grad-brand {
      background: linear-gradient(135deg,#6366f1,#8b2fc9);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .grad-green {
      background: linear-gradient(135deg,#059669,#25D366);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .grad-red {
      background: linear-gradient(135deg,#ef4444,#f97316);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    /* Badge pill */
    .badge {
      display:inline-flex; align-items:center; gap:6px;
      padding:5px 13px; border-radius:999px; font-size:12px; font-weight:700;
    }

    /* Número stat */
    .stat-num {
      font-size:28px; font-weight:900; line-height:1;
    }

    @media(max-width:639px){
      .float-a { right:6px!important; top:-8px!important; }
      .float-b { left:6px!important; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────────────────────
   AURORA — versión light (blobs suaves sobre blanco)
───────────────────────────────────────────────────────────── */
const Aurora = ({ op = 1 }: { op?: number }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex:0, opacity:op }}>
    <div style={{ position:"absolute", top:"-15%", left:"-5%", width:800, height:700, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(99,102,241,.13) 0%,transparent 68%)", filter:"blur(70px)", animation:"pulse 7s ease-in-out infinite" }}/>
    <div style={{ position:"absolute", top:"30%", right:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(139,47,201,.1) 0%,transparent 70%)", filter:"blur(65px)", animation:"pulse 9s ease-in-out infinite", animationDelay:"2.5s" }}/>
    <div style={{ position:"absolute", bottom:"-15%", left:"25%", width:700, height:500, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(26,95,87,.08) 0%,rgba(45,212,191,.05) 55%,transparent 72%)", filter:"blur(70px)", animation:"pulse 8s ease-in-out infinite", animationDelay:"5s" }}/>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   PRIMITIVOS
───────────────────────────────────────────────────────────── */
const Card = ({
  children, cls = "", color = "", style = {}, noPad = false,
}: {
  children: React.ReactNode; cls?: string; color?: string;
  style?: React.CSSProperties; noPad?: boolean;
}) => (
  <div className={`card-light ${color} ${cls}`} style={style}>
    {noPad ? children : <div style={{ position:"relative" }}>{children}</div>}
  </div>
);

const Panda = ({ size = 80, cls = "" }: { size?: number; cls?: string }) => (
  <div className={`panda ${cls}`} style={{ width:size, height:size,
    filter:`drop-shadow(0 4px ${Math.round(size*.3)}px rgba(99,102,241,.4)) drop-shadow(0 0 ${Math.round(size*.12)}px rgba(139,47,201,.3))` }}>
    <img src="/logo.png" alt="PandaPOS" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
  </div>
);

const IconBox = ({ color, bg, children, size = 44 }: { color:string; bg:string; children:React.ReactNode; size?:number }) => (
  <div style={{ width:size, height:size, borderRadius:12, background:bg, border:`1px solid ${color}30`,
    display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0,
    boxShadow:`0 4px 16px ${color}22` }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
const Navbar = () => (
  <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200,
    backdropFilter:"blur(24px)", background:"rgba(255,255,255,.88)",
    borderBottom:"1px solid rgba(99,102,241,.1)",
    boxShadow:"0 1px 12px rgba(99,102,241,.07)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
      <Link href="/home" className="flex items-center gap-2.5" style={{ ...ou, color:"#0f172a", fontWeight:900, fontSize:18, textDecoration:"none" }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width:32, height:32, objectFit:"contain" }}/>
        <span>Panda<span style={{ color:"#6366f1" }}>POS</span></span>
      </Link>
      <div className="hidden md:flex items-center gap-7">
        {[["Cómo funciona","#como-funciona"],["Sistema","#sistema"],["Precios","#planes"]].map(([l,h])=>(
          <Link key={h} href={h} style={{ ...ou, color:"#64748b", fontSize:14, fontWeight:600, textDecoration:"none", transition:"color .18s" }}
            onMouseEnter={e=>(e.currentTarget.style.color="#0f172a")}
            onMouseLeave={e=>(e.currentTarget.style.color="#64748b")}>{l}</Link>
        ))}
        <Link href="#como-funciona" className="btn-ghost" style={{ padding:"8px 16px", fontSize:13 }}>Ver demo</Link>
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
    <div style={{ overflow:"hidden", background:"linear-gradient(90deg,#f0f0ff,#f5f0ff,#f0f5ff)",
      borderTop:"1px solid rgba(99,102,241,.12)", borderBottom:"1px solid rgba(99,102,241,.12)",
      padding:"9px 0", whiteSpace:"nowrap" }}>
      <div style={{ display:"inline-flex", animation:"ticker 28s linear infinite" }}>
        {d.map((t,i)=>(
          <span key={i} style={{ ...ou, display:"inline-flex", alignItems:"center", gap:8, padding:"0 22px",
            fontSize:12, fontWeight:700, letterSpacing:".04em",
            color: i%2===0 ? "#6366f1" : "#8b2fc9" }}>
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
  <div style={{ position:"relative", padding:"24px 0" }}>
    <div style={{ position:"absolute", inset:-40, background:"radial-gradient(ellipse,rgba(37,211,102,.12) 0%,rgba(99,102,241,.08) 50%,transparent 72%)", filter:"blur(40px)", borderRadius:"50%", pointerEvents:"none" }}/>

    <Card color="card-green" noPad style={{ boxShadow:"0 24px 80px rgba(0,0,0,.1), 0 0 0 1px rgba(37,211,102,.2)" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#f0faf4,#e8f8f0)", borderBottom:"1px solid rgba(37,211,102,.15)", padding:"12px 16px", display:"flex", alignItems:"center", gap:10, borderRadius:"1rem 1rem 0 0" }}>
        <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#25D366,#1aaa4f)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(37,211,102,.4)" }}>
          <MessageCircle size={15} color="white"/>
        </div>
        <div>
          <p style={{ ...ou, color:"#0f172a", fontSize:11, fontWeight:800 }}>Tu Restaurante · PandaPOS</p>
          <p style={{ ...ou, color:"#25D366", fontSize:9 }}>● en línea ahora</p>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:3 }}>
          {[0,1,2].map(i=><div key={i} style={{ width:4, height:4, borderRadius:"50%", background:"rgba(0,0,0,.15)" }}/>)}
        </div>
      </div>

      {/* Chat */}
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, background:"#f9fafb" }}>
        {/* Order card */}
        <div style={{ maxWidth:"88%" }}>
          <Card color="card-indigo" noPad style={{ background:"rgba(255,255,255,.95)" }}>
            <div style={{ padding:"12px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ ...ou, color:"#0f172a", fontWeight:800, fontSize:12 }}>Pedido #1.247</span>
                <span style={{ ...ou, background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.25)", color:"#6366f1", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:999 }}>Mesa 4</span>
              </div>
              {["2× Sushi Roll Salmón","1× Causa Rellena","3× Agua s/gas"].map(it=>(
                <div key={it} style={{ display:"flex", gap:5, marginBottom:4 }}>
                  <div style={{ width:3, height:3, borderRadius:"50%", background:"#6366f1", flexShrink:0, marginTop:5 }}/>
                  <span style={{ ...ou, color:"#64748b", fontSize:11 }}>{it}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid #f1f5f9", marginTop:9, paddingTop:9, display:"flex", justifyContent:"space-between" }}>
                <span style={{ ...ou, color:"#94a3b8", fontSize:10 }}>Total</span>
                <span style={{ ...ou, color:"#0f172a", fontWeight:900, fontSize:14 }}>$22.500</span>
              </div>
            </div>
          </Card>
          <span style={{ ...ou, color:"#94a3b8", fontSize:9, marginLeft:3 }}>hace 2 min</span>
        </div>
        {/* Confirmaciones */}
        {[
          { t:"Pedido enviado al KDS ✓", bg:"#dcfce7", c:"#16a34a", border:"#bbf7d0" },
          { t:"0% de comisión cobrada ✓", bg:"#dcfce7", c:"#16a34a", border:"#bbf7d0" },
          { t:"Cliente guardado en tu base ✓", bg:"#dcfce7", c:"#16a34a", border:"#bbf7d0" },
        ].map(m=>(
          <div key={m.t} style={{ alignSelf:"flex-end", background:m.bg, border:`1px solid ${m.border}`, borderRadius:"13px 13px 2px 13px", padding:"7px 11px" }}>
            <span style={{ ...ou, color:m.c, fontSize:10, fontWeight:700 }}>{m.t}</span>
          </div>
        ))}
      </div>
    </Card>

    {/* Badge Rappi */}
    <div className="float-a" style={{ position:"absolute", top:-14, right:-20,
      background:"#fff1f2", border:"1.5px solid #fca5a5", borderRadius:13,
      padding:"9px 14px", boxShadow:"0 8px 28px rgba(239,68,68,.2), 0 2px 8px rgba(0,0,0,.06)" }}>
      <p style={{ ...ou, color:"#ef4444", fontSize:8, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700 }}>Rappi te cobraría</p>
      <p style={{ ...ou, color:"#dc2626", fontWeight:900, fontSize:22, lineHeight:1.2 }}>−$6.750</p>
    </div>

    {/* Badge PandaPOS */}
    <div className="float-b" style={{ position:"absolute", bottom:-14, left:-20,
      background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:13,
      padding:"9px 14px", boxShadow:"0 8px 28px rgba(37,211,102,.18), 0 2px 8px rgba(0,0,0,.06)" }}>
      <p style={{ ...ou, color:"#16a34a", fontSize:8, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700 }}>Con PandaPOS</p>
      <p style={{ ...ou, color:"#15803d", fontWeight:900, fontSize:22, lineHeight:1.2 }}>$0 comisión</p>
    </div>
  </div>
);

const Hero = () => (
  <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", paddingTop:80, paddingBottom:64,
    background:"linear-gradient(160deg,#ffffff 0%,#f5f3ff 50%,#f0fdf4 100%)", position:"relative", overflow:"hidden" }}>
    <Aurora/>
    {/* Dot grid sutil */}
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"radial-gradient(circle,rgba(99,102,241,.08) 1px,transparent 1px)", backgroundSize:"30px 30px", zIndex:0 }}/>
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full" style={{ zIndex:1 }}>
      <div className="grid lg:grid-cols-2 gap-14 items-center">

        {/* LEFT */}
        <div>
          {/* Eyebrow */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999,
            background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.25)", marginBottom:28 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#6366f1", animation:"pulse 2s ease-in-out infinite" }}/>
            <span style={{ ...ou, color:"#4f46e5", fontSize:12, fontWeight:700 }}>Sistema operativo para restaurantes</span>
          </div>

          {/* H1 */}
          <h1 style={{ ...ou, fontSize:"clamp(2.6rem,5vw,4.4rem)", fontWeight:900, lineHeight:1.03, letterSpacing:"-.028em", color:"#0f172a", marginBottom:8 }}>
            Las apps de delivery<br/>
            <span className="grad-red">te cobran un{" "}
              <span className="strike-wrap">30%</span>
            </span><br/>
            por cada pedido.
          </h1>

          <p style={{ ...ou, color:"#475569", fontSize:17, lineHeight:1.72, maxWidth:490, marginBottom:32, marginTop:16 }}>
            Con PandaPOS vendes directo por{" "}
            <strong style={{ color:"#0f172a" }}>QR y WhatsApp</strong>,
            automatizas tu operación y{" "}
            <strong style={{ color:"#16a34a" }}>recuperas tu margen.</strong>
          </p>

          {/* Bullets */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:36 }}>
            {[
              { icon:<DollarSign size={16}/>, label:"0% comisión — cada pedido es tuyo al 100%", color:"#ef4444", bg:"#fff1f2" },
              { icon:<MessageCircle size={16}/>, label:"Pedidos directos por WhatsApp y QR", color:"#16a34a", bg:"#f0fdf4" },
              { icon:<Zap size={16}/>, label:"KDS, delivery y panel en una sola plataforma", color:"#6366f1", bg:"#f0f0ff" },
            ].map(b=>(
              <div key={b.label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:b.bg, border:`1px solid ${b.color}25`,
                  display:"flex", alignItems:"center", justifyContent:"center", color:b.color, flexShrink:0 }}>{b.icon}</div>
                <span style={{ ...ou, color:"#334155", fontSize:15, fontWeight:500 }}>{b.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:44 }}>
            <Link href={WA} target="_blank" className="btn-wa">
              <MessageCircle size={17}/> Hablar por WhatsApp
            </Link>
            <Link href={WA} target="_blank" className="btn-ghost">
              Ver demo <ArrowRight size={15}/>
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:28, flexWrap:"wrap", borderTop:"1px solid #e2e8f0", paddingTop:24 }}>
            {[
              { v:"0%",     l:"comisión",   c:"#ef4444" },
              { v:"$7.900", l:"desde /mes", c:"#16a34a" },
              { v:"24/7",   l:"automático", c:"#6366f1" },
            ].map(s=>(
              <div key={s.l}>
                <p style={{ ...ou, fontWeight:900, fontSize:24, lineHeight:1, color:s.c }}>{s.v}</p>
                <p style={{ ...ou, color:"#94a3b8", fontSize:11, marginTop:4 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="hidden lg:block" style={{ position:"relative" }}>
          <WAMockup/>
          <div style={{ position:"absolute", bottom:-36, right:-24 }}>
            <Panda size={118}/>
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
  <div style={{ background:"linear-gradient(90deg,#6366f1,#8b2fc9)", boxShadow:"0 4px 24px rgba(99,102,241,.3)" }}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {[
          { v:"0%",    l:"Comisión por pedido" },
          { v:"30%",   l:"Margen que recuperas" },
          { v:"5 min", l:"Para activar" },
          { v:"24/7",  l:"Opera solo" },
        ].map((s,i)=>(
          <div key={s.l} style={{ textAlign:"center", padding:"22px 16px", borderRight: i%2!==1 ? "1px solid rgba(255,255,255,.15)" : "none" }}>
            <p style={{ ...ou, fontWeight:900, fontSize:26, lineHeight:1, color:"white" }}>{s.v}</p>
            <p style={{ ...ou, color:"rgba(255,255,255,.75)", fontSize:11, marginTop:4 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 2 — SOLUCIÓN
───────────────────────────────────────────────────────────── */
const SectionSolution = () => (
  <section id="como-funciona" style={{ padding:"96px 0", background:"#ffffff", position:"relative", overflow:"hidden" }}>
    <Aurora op={0.5}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth:560, margin:"0 auto 52px" }}>
        <span style={{ ...ou, color:"#6366f1", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>La solución</span>
        <h2 style={{ ...ou, color:"#0f172a", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", marginTop:10 }}>
          Tu canal. Tu margen.<br/>Tus clientes.
        </h2>
        <p style={{ ...ou, color:"#64748b", fontSize:16, marginTop:12, lineHeight:1.65 }}>
          QR → Carta → Pedido → WhatsApp. Sin apps de por medio.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { n:"01", icon:"📱", t:"Escanean tu QR",      d:"En la mesa, el packaging o la boleta. El cliente entra a tu menú en segundos — sin descargar nada.", color:"card-indigo", ic:"#6366f1", ibg:"#f0f0ff" },
          { n:"02", icon:"🛒", t:"Ven tu carta y piden",d:"Menú digital con fotos, variantes y precios. El pedido armado, confirmado, sin confusión ni llamadas.", color:"card-sky",    ic:"#0ea5e9", ibg:"#f0f9ff" },
          { n:"03", icon:"💬", t:"Llega directo a ti",  d:"El pedido entra a tu KDS y WhatsApp al instante. Sin intermediarios, sin porcentaje, sin esperas.",  color:"card-green",  ic:"#16a34a", ibg:"#f0fdf4" },
        ].map(s=>(
          <Card key={s.n} color={s.color}>
            <div style={{ padding:"28px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <IconBox color={s.ic} bg={s.ibg} size={48}><span style={{ fontSize:22 }}>{s.icon}</span></IconBox>
                <span style={{ ...ou, color:"#e2e8f0", fontWeight:900, fontSize:36 }}>{s.n}</span>
              </div>
              <h3 style={{ ...ou, color:"#0f172a", fontWeight:800, fontSize:17, marginBottom:9 }}>{s.t}</h3>
              <p style={{ ...ou, color:"#64748b", fontSize:13, lineHeight:1.68 }}>{s.d}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 3 — CICLO
───────────────────────────────────────────────────────────── */
const SectionCycle = () => (
  <section style={{ padding:"96px 0", background:"#f8fafc" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <span style={{ ...ou, color:"#8b2fc9", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>El ciclo diferenciador</span>
          <h2 style={{ ...ou, color:"#0f172a", fontSize:"clamp(1.9rem,3.5vw,2.9rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", margin:"12px 0 16px" }}>
            Convierte cada boleta<br/>en una nueva venta.
          </h2>
          <p style={{ ...ou, color:"#475569", fontSize:16, lineHeight:1.72, marginBottom:24 }}>
            Imprime tu QR en la boleta. El cliente llega a casa, escanea y te vuelve a pedir por WhatsApp. Sin que tú hagas nada. Sin comisión.
          </p>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"11px 16px", borderRadius:12,
            background:"#f0fdf4", border:"1px solid #86efac", marginBottom:28 }}>
            <Panda size={28}/>
            <span style={{ ...ou, color:"#16a34a", fontSize:13, fontWeight:800 }}>Clientes que vuelven sin pagar publicidad</span>
          </div>
          <div>
            <Link href={WA} target="_blank" className="btn-wa">
              <MessageCircle size={15}/> Activar ciclo directo
            </Link>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:"🧾", t:"Entregas boleta con QR impreso", d:"Cada boleta lleva tu QR. El cliente se va con la puerta abierta.", color:"card-purple", ic:"#8b2fc9", ibg:"#faf0ff", n:1 },
            { icon:"📲", t:"Cliente escanea cuando quiere",  d:"Tu menú disponible las 24h. Sin llamar, sin intermediarios.",      color:"card-sky",    ic:"#0ea5e9", ibg:"#f0f9ff", n:2 },
            { icon:"💬", t:"Nuevo pedido, cero comisión",    d:"Tú cobras el 100%. El margen es tuyo, como debe ser.",             color:"card-green",  ic:"#16a34a", ibg:"#f0fdf4", n:3 },
          ].map(s=>(
            <Card key={s.n} color={s.color}>
              <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                <IconBox color={s.ic} bg={s.ibg} size={42}><span style={{ fontSize:18 }}>{s.icon}</span></IconBox>
                <div style={{ flex:1 }}>
                  <p style={{ ...ou, color:"#0f172a", fontWeight:800, fontSize:13 }}>{s.t}</p>
                  <p style={{ ...ou, color:"#64748b", fontSize:12, marginTop:2 }}>{s.d}</p>
                </div>
                <span style={{ ...ou, color:"#e2e8f0", fontWeight:900, fontSize:28, flexShrink:0 }}>{s.n}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 4 — TESTIMONIAL
───────────────────────────────────────────────────────────── */
const SectionTestimonial = () => (
  <section style={{ padding:"96px 0", background:"linear-gradient(160deg,#f5f3ff,#f0fdf4)", position:"relative", overflow:"hidden" }}>
    <Aurora op={0.4}/>
    <div className="max-w-2xl mx-auto px-5 sm:px-8" style={{ position:"relative", zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <span style={{ ...ou, color:"#6366f1", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Lo que dicen nuestros clientes</span>
      </div>
      <Card color="card-indigo" style={{ background:"rgba(255,255,255,.92)", borderRadius:"1.5rem" }}>
        <div style={{ padding:"44px 38px", textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:22 }}>
            {[...Array(5)].map((_,i)=><Star key={i} size={17} style={{ color:"#f59e0b", fill:"#f59e0b" }}/>)}
          </div>
          <blockquote style={{ ...ou, color:"#1e293b", fontSize:"clamp(1rem,1.9vw,1.22rem)", fontWeight:700, lineHeight:1.58, marginBottom:20 }}>
            "Antes le pagábamos casi 28% entre comisiones y promos. Con PandaPOS, la mitad de los pedidos ya son directos por WhatsApp y ese margen volvió a la caja."
          </blockquote>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:999,
            background:"#f0fdf4", border:"1px solid #86efac", marginBottom:26 }}>
            <span style={{ ...ou, color:"#16a34a", fontSize:13, fontWeight:800 }}>→ Recuperamos el costo en el primer mes</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:11 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b2fc9)",
              display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:16,
              boxShadow:"0 4px 16px rgba(99,102,241,.4)" }}>M</div>
            <div style={{ textAlign:"left" }}>
              <p style={{ ...ou, color:"#0f172a", fontWeight:800, fontSize:13 }}>María P.</p>
              <p style={{ ...ou, color:"#64748b", fontSize:11 }}>Dueña de dark kitchen · Santiago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 4.5 — PREVIEW DEL SISTEMA (imagen real)
   → Sube tu captura a /public/preview.png para que aparezca aquí
───────────────────────────────────────────────────────────── */
const SectionPreview = () => (
  <section style={{ padding:"80px 0 96px", background:"#ffffff", position:"relative", overflow:"hidden" }}>
    {/* Dot grid sutil */}
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"radial-gradient(circle,rgba(99,102,241,.06) 1px,transparent 1px)", backgroundSize:"30px 30px", zIndex:0 }}/>

    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>

      {/* Header — texto oscuro sobre fondo blanco */}
      <div style={{ textAlign:"center", maxWidth:560, margin:"0 auto 52px" }}>
        <span style={{ ...ou, color:"#6366f1", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Ve el sistema en acción</span>
        <h2 style={{ ...ou, color:"#0f172a", fontSize:"clamp(1.9rem,3.5vw,2.9rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", marginTop:10 }}>
          Todo desde una sola pantalla.
        </h2>
        <p style={{ ...ou, color:"#64748b", fontSize:16, marginTop:12, lineHeight:1.65 }}>
          Panel de ventas, KDS, pedidos y clientes — en tiempo real, sin pagar comisión.
        </p>
      </div>

      {/* Frame oscuro cinematográfico — la imagen destaca sobre fondo blanco */}
      <div style={{ maxWidth:960, margin:"0 auto", position:"relative" }}>

        {/* Glow brand detrás del frame */}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          width:"110%", height:"120%", pointerEvents:"none",
          background:"radial-gradient(ellipse,rgba(99,102,241,.22) 0%,rgba(139,47,201,.1) 45%,transparent 72%)",
          filter:"blur(55px)" }}/>

        {/* Device frame oscuro */}
        <div style={{ position:"relative", borderRadius:20, overflow:"hidden",
          background:"#0f172a",
          boxShadow:"0 40px 100px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.08)" }}>

          {/* Barra superior oscura — estilo app */}
          <div style={{ background:"#1e293b", borderBottom:"1px solid rgba(255,255,255,.07)",
            padding:"11px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", gap:6 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c=>(
                <div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c, opacity:.85 }}/>
              ))}
            </div>
            <div style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.09)",
              borderRadius:8, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
              maxWidth:320, margin:"0 auto" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", flexShrink:0 }}/>
              <span style={{ ...ou, color:"rgba(255,255,255,.5)", fontSize:11 }}>app.pandaposs.com/panel</span>
            </div>
            <div style={{ display:"flex", gap:5, marginLeft:"auto" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:14, height:2, borderRadius:1, background:"rgba(255,255,255,.15)" }}/>)}
            </div>
          </div>

          {/* Imagen — fondo oscuro del frame contiene la imagen */}
          <div style={{ position:"relative", width:"100%", aspectRatio:"16/9", minHeight:320,
            background:"linear-gradient(135deg,#0f172a 0%,#1a1035 50%,#0c1a0f 100%)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <img
              src="/preview.png"
              alt="PandaPOS Dashboard"
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
              }}
            />
            {/* Placeholder oscuro */}
            <div style={{ display:"none", position:"absolute", inset:0,
              flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18 }}>
              <div style={{ width:80, height:80, borderRadius:20,
                background:"rgba(99,102,241,.15)", border:"2px dashed rgba(99,102,241,.4)",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Monitor size={34} style={{ color:"#818cf8", opacity:.7 }}/>
              </div>
              <div style={{ textAlign:"center" }}>
                <p style={{ ...ou, color:"#a5b4fc", fontSize:14, fontWeight:700 }}>Guarda tu imagen como</p>
                <code style={{ ...ou, background:"rgba(255,255,255,.08)", color:"#e2e8f0",
                  padding:"4px 10px", borderRadius:6, fontSize:12, marginTop:6, display:"inline-block" }}>
                  /public/preview.png
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Badges flotantes — blancos sobre el frame oscuro */}
        <div className="float-a" style={{ position:"absolute", top:56, right:-20, zIndex:10,
          background:"white", border:"1.5px solid #bbf7d0", borderRadius:14,
          padding:"10px 16px", boxShadow:"0 12px 36px rgba(37,211,102,.2), 0 4px 12px rgba(0,0,0,.1)" }}>
          <p style={{ ...ou, color:"#94a3b8", fontSize:9, textTransform:"uppercase", letterSpacing:".1em", fontWeight:600, marginBottom:2 }}>Pedidos hoy</p>
          <p style={{ ...ou, color:"#16a34a", fontWeight:900, fontSize:24, lineHeight:1 }}>+147</p>
        </div>

        <div className="float-b" style={{ position:"absolute", bottom:56, left:-20, zIndex:10,
          background:"white", border:"1.5px solid #c7d2fe", borderRadius:14,
          padding:"10px 16px", boxShadow:"0 12px 36px rgba(99,102,241,.2), 0 4px 12px rgba(0,0,0,.1)" }}>
          <p style={{ ...ou, color:"#94a3b8", fontSize:9, textTransform:"uppercase", letterSpacing:".1em", fontWeight:600, marginBottom:2 }}>Comisión cobrada</p>
          <p style={{ ...ou, color:"#6366f1", fontWeight:900, fontSize:24, lineHeight:1 }}>$0</p>
        </div>

        {/* Badge inferior — prueba social */}
        <div className="float-m" style={{ position:"absolute", bottom:-18, left:"50%", transform:"translateX(-50%)", zIndex:10,
          background:"white", border:"1.5px solid #fde68a", borderRadius:14,
          padding:"9px 18px", boxShadow:"0 8px 28px rgba(245,158,11,.18), 0 4px 12px rgba(0,0,0,.08)",
          whiteSpace:"nowrap" }}>
          <p style={{ ...ou, color:"#d97706", fontSize:12, fontWeight:800, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:14 }}>⚡</span> 5 min para activar tu sistema
          </p>
        </div>
      </div>

    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 5 — SISTEMA
───────────────────────────────────────────────────────────── */
const FEATS = [
  { icon:<Monitor size={20}/>, t:"KDS — Tu cocina nunca pierde un pedido",    d:"Cada orden llega a pantalla en tiempo real. Menos errores, más velocidad.", wide:true,  color:"card-indigo", ic:"#6366f1", ibg:"#f0f0ff" },
  { icon:<Bot size={20}/>,      t:"Bot WhatsApp — Vende mientras duermes",      d:"El bot arma el carrito, confirma y manda a cocina. Sin intervención humana.", wide:false, color:"card-green",  ic:"#16a34a", ibg:"#f0fdf4" },
  { icon:<ShoppingCart size={20}/>, t:"Carta QR — Tu menú en cualquier lugar", d:"Mesa, packaging, redes. El cliente escanea, elige y pide. Sin llamadas.",    wide:false, color:"card-sky",    ic:"#0ea5e9", ibg:"#f0f9ff" },
  { icon:<Bike size={20}/>,     t:"Delivery — Control total del reparto",       d:"Asigna repartidores, define zonas y sigue cada pedido.",                       wide:false, color:"card-amber",  ic:"#d97706", ibg:"#fffbeb" },
  { icon:<CreditCard size={20}/>, t:"POS — Caja rápida, cero caos",            d:"Multipago, boleta térmica y mesas. Menos colas, más rotación.",               wide:false, color:"card-red",    ic:"#ef4444", ibg:"#fff1f2" },
  { icon:<BarChart3 size={20}/>, t:"Panel — Sabe exactamente cuánto ganas",    d:"Ventas del día, ticket promedio, ranking de clientes. Decisiones con datos.", wide:true,  color:"card-sky",    ic:"#0ea5e9", ibg:"#f0f9ff" },
  { icon:<Bell size={20}/>,     t:"Notificaciones — Cada área recibe lo suyo", d:"Mesero, cajero y rider ven solo lo que les corresponde.",                      wide:false, color:"card-purple", ic:"#8b2fc9", ibg:"#faf0ff" },
];

const SectionSystem = () => (
  <section id="sistema" style={{ padding:"96px 0", background:"#ffffff" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div style={{ textAlign:"center", maxWidth:540, margin:"0 auto 52px" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><Panda size={64}/></div>
        <span style={{ ...ou, color:"#1a5f57", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Todo incluido</span>
        <h2 style={{ ...ou, color:"#0f172a", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", marginTop:10 }}>
          Un sistema. Sin fricción.
        </h2>
        <p style={{ ...ou, color:"#64748b", fontSize:16, marginTop:11 }}>
          Todo lo que necesitas para operar, vender y crecer — en una sola plataforma.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATS.map(f=>(
          <Card key={f.t} color={f.color} cls={f.wide ? "sm:col-span-2" : ""}>
            <div style={{ padding:"22px", display:"flex", gap:16, alignItems:"flex-start" }}>
              <IconBox color={f.ic} bg={f.ibg} size={44}>{f.icon}</IconBox>
              <div>
                <h3 style={{ ...ou, color:"#0f172a", fontWeight:800, fontSize:15, marginBottom:7 }}>{f.t}</h3>
                <p style={{ ...ou, color:"#64748b", fontSize:13, lineHeight:1.65 }}>{f.d}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 6 — BENEFICIOS
───────────────────────────────────────────────────────────── */
const BENEFITS = [
  { icon:<DollarSign size={22}/>, t:"Más ventas",        d:"Canal directo disponible 24/7. Cada boleta es una oportunidad de venta futura.", color:"card-green",  ic:"#16a34a", ibg:"#f0fdf4" },
  { icon:<Shield size={22}/>,     t:"Menos errores",     d:"Pedidos directos al KDS. Sin reinterpretaciones, sin llamadas, sin confusión.",   color:"card-indigo", ic:"#6366f1", ibg:"#f0f0ff" },
  { icon:<Clock size={22}/>,      t:"Más velocidad",     d:"Del pedido al plato sin fricción. Tu equipo trabaja más rápido.",                 color:"card-sky",    ic:"#0ea5e9", ibg:"#f0f9ff" },
  { icon:<TrendingUp size={22}/>, t:"Control total",     d:"Datos reales de ventas, clientes y operación. Sabes qué funciona.",              color:"card-amber",  ic:"#d97706", ibg:"#fffbeb" },
  { icon:<Users size={22}/>,      t:"Clientes propios",  d:"Base de datos tuya. Tus clientes no son de Rappi — son del restaurante.",        color:"card-purple", ic:"#8b2fc9", ibg:"#faf0ff" },
  { icon:<Zap size={22}/>,        t:"Sin intermediarios",d:"Uber Eats y Rappi se llevan entre 18% y 30% de cada pedido. Eso termina hoy.",  color:"card-red",    ic:"#ef4444", ibg:"#fff1f2" },
];

const SectionBenefits = () => (
  <section style={{ padding:"96px 0", background:"#f8fafc", position:"relative", overflow:"hidden" }}>
    <Aurora op={0.45}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth:520, margin:"0 auto 52px" }}>
        <span style={{ ...ou, color:"#16a34a", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Por qué funciona</span>
        <h2 style={{ ...ou, color:"#0f172a", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", marginTop:10 }}>
          Más ventas, menos caos.<br/>Control de verdad.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map(b=>(
          <Card key={b.t} color={b.color}>
            <div style={{ padding:"26px 22px" }}>
              <IconBox color={b.ic} bg={b.ibg} size={50}>{b.icon}</IconBox>
              <h3 style={{ ...ou, color:"#0f172a", fontWeight:800, fontSize:18, margin:"18px 0 8px" }}>{b.t}</h3>
              <p style={{ ...ou, color:"#64748b", fontSize:13, lineHeight:1.65 }}>{b.d}</p>
            </div>
          </Card>
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
    cta:"Empezar con Basic",
    ctaStyle:{ background:"#f0fdfa", border:"1.5px solid #99f6e4", color:"#0f766e" } as React.CSSProperties,
    color:"card-teal", badge:null, accent:"#0f766e",
  },
  {
    name:"Pro", price:"$11.900", hook:"Control total del negocio",
    pitch:"Todo lo que necesitas para operar y escalar.",
    items:["Todo de Basic","KDS de cocina","Bot de WhatsApp 24/7","Delivery con zonas","Panel de ventas y reportes"],
    cta:"Elegir Pro",
    ctaStyle:{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow:"0 4px 18px rgba(99,102,241,.4)", color:"white" } as React.CSSProperties,
    color:"card-indigo", badge:"Más elegido", accent:"#6366f1",
  },
  {
    name:"Prime", price:"$14.900", hook:"Escala sin límites",
    pitch:"Multi-sucursal, kiosko y pagos avanzados.",
    items:["Todo de Pro","Multi-sucursal","Kiosko de autoatención","Pagos con Mercado Pago","Soporte prioritario"],
    cta:"Ir por Prime",
    ctaStyle:{ background:"#fffbeb", border:"1.5px solid #fcd34d", color:"#92400e" } as React.CSSProperties,
    color:"card-amber", badge:null, accent:"#d97706",
  },
];

const SectionPricing = () => (
  <section id="planes" style={{ padding:"96px 0", background:"#ffffff", position:"relative", overflow:"hidden" }}>
    <Aurora op={0.35}/>
    <div className="relative max-w-6xl mx-auto px-5 sm:px-8" style={{ zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:52 }}>
        <span style={{ ...ou, color:"#d97706", fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Precios transparentes</span>
        <h2 style={{ ...ou, color:"#0f172a", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, lineHeight:1.07, letterSpacing:"-.022em", marginTop:10 }}>
          Más barato que una semana<br/>de comisiones.
        </h2>
        <div style={{ display:"inline-flex", alignItems:"center", gap:14, marginTop:16, padding:"11px 18px", borderRadius:11,
          background:"#f8fafc", border:"1px solid #e2e8f0" }}>
          <span style={{ ...ou, color:"#ef4444", fontSize:13, fontWeight:600 }}>Rappi: −$6.750 por pedido</span>
          <span style={{ color:"#cbd5e1" }}>vs</span>
          <span style={{ ...ou, color:"#16a34a", fontSize:13, fontWeight:800 }}>PandaPOS: $7.900/mes completo</span>
        </div>
        <p style={{ ...ou, color:"#94a3b8", fontSize:15, marginTop:12 }}>Elige un plan. Recupera margen. Cobra directo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(p=>(
          <div key={p.name} style={{ position:"relative" }}>
            {p.badge && (
              <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)",
                background:"linear-gradient(135deg,#6366f1,#8b2fc9)", boxShadow:"0 4px 16px rgba(99,102,241,.5)",
                padding:"4px 17px", borderRadius:999, color:"white", fontSize:11, fontWeight:800,
                whiteSpace:"nowrap", zIndex:2, ...ou }}>{p.badge}</div>
            )}
            <Card color={p.color} style={{ height:"100%" }}>
              <div style={{ padding:"28px 22px", display:"flex", flexDirection:"column", height:"100%" }}>
                <span style={{ ...ou, color:p.accent, fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>{p.hook}</span>
                <p style={{ ...ou, color:"#0f172a", fontWeight:900, fontSize:22, margin:"6px 0 3px" }}>{p.name}</p>
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:6 }}>
                  <span style={{ ...ou, color:"#0f172a", fontWeight:900, fontSize:36 }}>{p.price}</span>
                  <span style={{ ...ou, color:"#94a3b8", fontSize:13, paddingBottom:5 }}>/mes</span>
                </div>
                <p style={{ ...ou, color:"#64748b", fontSize:12, marginBottom:22 }}>{p.pitch}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:22, flex:1 }}>
                  {p.items.map(it=>(
                    <div key={it} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <Check size={13} style={{ color:"#16a34a", flexShrink:0, marginTop:2 }}/>
                      <span style={{ ...ou, color:"#475569", fontSize:13 }}>{it}</span>
                    </div>
                  ))}
                </div>
                <Link href={WA} target="_blank" style={{ ...ou, ...p.ctaStyle, padding:"12px 18px", borderRadius:11,
                  fontWeight:800, fontSize:13, display:"inline-flex", alignItems:"center", justifyContent:"center",
                  gap:7, textDecoration:"none" }}>
                  <MessageCircle size={13}/> {p.cta}
                </Link>
              </div>
            </Card>
          </div>
        ))}
      </div>
      <p style={{ ...ou, color:"#94a3b8", fontSize:12, textAlign:"center", marginTop:20 }}>¿Dudas sobre qué plan elegir? Hablamos por WhatsApp en 2 minutos.</p>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   SECCIÓN 8 — CTA FINAL
───────────────────────────────────────────────────────────── */
const SectionCTA = () => (
  <section style={{ padding:"120px 0", background:"linear-gradient(160deg,#6366f1 0%,#8b2fc9 100%)", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(255,255,255,.07) 1px,transparent 1px)", backgroundSize:"30px 30px", pointerEvents:"none" }}/>
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:450, background:"radial-gradient(ellipse,rgba(255,255,255,.15) 0%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }}/>
    <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center" style={{ zIndex:1 }}>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}><Panda size={110}/></div>
      <h2 style={{ ...ou, color:"white", fontSize:"clamp(2.2rem,5vw,3.6rem)", fontWeight:900, lineHeight:1.05, letterSpacing:"-.025em", marginBottom:14 }}>
        Deja de pagar comisiones.<br/>Empieza hoy.
      </h2>
      <p style={{ ...ou, color:"rgba(255,255,255,.8)", fontSize:18, fontWeight:500, marginBottom:44, lineHeight:1.65 }}>
        Más margen. Más control. Más ventas.<br/>Únete a los restaurantes que ya recuperaron su margen.
      </p>
      <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:18 }}>
        <Link href={WA} target="_blank" className="btn-wa" style={{ fontSize:16, padding:"18px 40px", borderRadius:16 }}>
          <MessageCircle size={20}/> Hablar por WhatsApp
        </Link>
        <Link href={WA} target="_blank" style={{ ...ou, background:"rgba(255,255,255,.18)", backdropFilter:"blur(12px)",
          border:"1.5px solid rgba(255,255,255,.4)", padding:"18px 32px", borderRadius:16,
          color:"white", fontWeight:700, fontSize:15, display:"inline-flex", alignItems:"center", gap:8,
          textDecoration:"none", transition:"all .18s ease" }}
          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.28)")}
          onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.18)")}>
          Ver demo <ArrowRight size={16}/>
        </Link>
      </div>
      <p style={{ ...ou, color:"rgba(255,255,255,.5)", fontSize:12 }}>Sin contratos. Sin permanencia. Activa hoy.</p>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer style={{ background:"#0f172a", borderTop:"1px solid rgba(255,255,255,.06)", padding:"32px 0" }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
      <Link href="/home" style={{ display:"flex", alignItems:"center", gap:8, color:"white", fontWeight:800, fontSize:16, textDecoration:"none", ...ou }}>
        <img src="/logo.png" alt="PandaPOS" style={{ width:26, height:26, objectFit:"contain" }}/>
        <span>Panda<span style={{ color:"#818cf8" }}>POS</span></span>
      </Link>
      <p style={{ ...ou, color:"rgba(255,255,255,.3)", fontSize:12 }}>© {new Date().getFullYear()} PandaPOS · Tu margen es tuyo.</p>
      <Link href={WA} target="_blank" style={{ ...ou, color:"#4ade80", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, textDecoration:"none" }}>
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
    <div style={{ minHeight:"100vh", background:"#ffffff", ...ou }}>
      <Styles/>
      <Navbar/>
      <main>
        <Hero/>
        <Ticker/>
        <StatsBar/>
        <SectionSolution/>
        <SectionCycle/>
        <SectionTestimonial/>
        <SectionPreview/>
        <SectionSystem/>
        <SectionBenefits/>
        <SectionPricing/>
        <SectionCTA/>
      </main>
      <Footer/>
    </div>
  );
}
