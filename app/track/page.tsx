"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Search, Bike, ChefHat, CheckCircle2, Package2 } from "lucide-react";
import Link from "next/link";

export default function TrackIndexPage() {
  const router = useRouter();
  const [pedidoNum, setPedidoNum] = useState("");
  const [error, setError] = useState("");

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    const num = pedidoNum.trim().replace(/\D/g, "");
    if (!num) { setError("Ingresa un número de pedido."); return; }
    router.push(`/track/${num}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f172a 0%, #0c1a2e 50%, #0a1628 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>
      {/* Glow de fondo */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 40%, rgba(6,182,212,.12) 0%, rgba(99,102,241,.08) 45%, transparent 72%)",
        filter: "blur(60px)",
      }}/>

      {/* Tarjeta principal */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 460,
        background: "rgba(255,255,255,.04)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(6,182,212,.25)",
        borderRadius: 24,
        boxShadow: "0 0 0 1px rgba(6,182,212,.12), 0 40px 80px rgba(0,0,0,.4)",
        padding: "40px 36px",
        textAlign: "center",
      }}>
        {/* Ícono */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
          background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
          boxShadow: "0 8px 32px rgba(6,182,212,.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Navigation size={30} color="white"/>
        </div>

        <h1 style={{ color: "white", fontWeight: 900, fontSize: 26, marginBottom: 6, letterSpacing: "-.02em" }}>
          ODS
        </h1>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Ingresa el número de pedido para ver su estado en tiempo real.
        </p>

        {/* Steps decorativos */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {[
            { icon: <CheckCircle2 size={14}/>, label: "Confirmado", color: "#6366f1" },
            { icon: <ChefHat size={14}/>,      label: "Preparando", color: "#f59e0b" },
            { icon: <Bike size={14}/>,         label: "En camino",  color: "#06b6d4" },
            { icon: <Package2 size={14}/>,     label: "Entregado",  color: "#22c55e" },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${s.color}22`, border: `1px solid ${s.color}55`,
                display: "flex", alignItems: "center", justifyContent: "center", color: s.color,
              }}>{s.icon}</div>
              <span style={{ color: "rgba(255,255,255,.35)", fontSize: 9, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <form onSubmit={handleBuscar} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ej: 1247"
              value={pedidoNum}
              onChange={e => { setPedidoNum(e.target.value); setError(""); }}
              style={{
                width: "100%",
                background: "rgba(255,255,255,.06)",
                border: error ? "1.5px solid rgba(239,68,68,.6)" : "1.5px solid rgba(6,182,212,.3)",
                borderRadius: 14,
                padding: "14px 48px 14px 18px",
                color: "white",
                fontSize: 20,
                fontWeight: 800,
                outline: "none",
                letterSpacing: "0.05em",
                textAlign: "center",
                fontFamily: "inherit",
              }}
              autoFocus
            />
            <Search size={18} style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              color: "rgba(6,182,212,.5)", pointerEvents: "none",
            }}/>
          </div>

          {error && (
            <p style={{ color: "rgba(239,68,68,.9)", fontSize: 12, fontWeight: 600, margin: 0 }}>{error}</p>
          )}

          <button type="submit" style={{
            background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            boxShadow: "0 4px 18px rgba(6,182,212,.35)",
            border: "none", borderRadius: 14,
            padding: "14px 24px", color: "white",
            fontWeight: 800, fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit",
            transition: "opacity .18s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = ".88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <Navigation size={16}/> Ver estado del pedido
          </button>
        </form>

        {/* Link volver */}
        <Link href="/pedidos" style={{
          display: "inline-block", marginTop: 24,
          color: "rgba(255,255,255,.35)", fontSize: 12, textDecoration: "none",
          transition: "color .18s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.35)")}
        >
          ← Volver al KDS
        </Link>
      </div>

      {/* Tip */}
      <p style={{ color: "rgba(255,255,255,.2)", fontSize: 11, marginTop: 20, zIndex: 1 }}>
        El número de pedido aparece en la comanda y en la notificación al cliente.
      </p>
    </div>
  );
}
