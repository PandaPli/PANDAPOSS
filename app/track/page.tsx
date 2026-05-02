"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Search, Bike, ChefHat, CheckCircle2, Package2 } from "lucide-react";
import Link from "next/link";

/* ── Paleta ──────────────────────────────────────────────────────── */
const C = {
  darkest:  "#49225B",
  dark:     "#6E3482",
  mid:      "#A56ABD",
  pale:     "#E7DBEF",
  faint:    "#F5EBFA",
} as const;

export default function TrackIndexPage() {
  const router = useRouter();
  const [pedidoNum, setPedidoNum] = useState("");
  const [error, setError]         = useState("");

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    const num = pedidoNum.trim().replace(/\D/g, "");
    if (!num) { setError("Ingresa un número de pedido."); return; }
    router.push(`/track/${num}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${C.faint} 0%, ${C.pale} 55%, ${C.faint} 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>

      {/* Glow suave */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 30%, rgba(110,52,130,.10) 0%, rgba(165,106,189,.05) 55%, transparent 78%)`,
      }}/>

      {/* Tarjeta principal */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 460,
        background: "white",
        border: `1px solid rgba(110,52,130,.18)`,
        borderRadius: 28,
        boxShadow: `0 4px 6px rgba(73,34,91,.04), 0 20px 60px rgba(73,34,91,.10)`,
        padding: "40px 36px",
        textAlign: "center",
      }}>

        {/* Ícono */}
        <div style={{
          width: 72, height: 72, borderRadius: 22, margin: "0 auto 24px",
          background: `linear-gradient(135deg, ${C.dark}, ${C.darkest})`,
          boxShadow: `0 8px 28px rgba(110,52,130,.35)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Navigation size={30} color="white"/>
        </div>

        <h1 style={{ color: C.darkest, fontWeight: 900, fontSize: 26, marginBottom: 6, letterSpacing: "-.02em" }}>
          ODS
        </h1>
        <p style={{ color: C.mid, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Ingresa el número de pedido para ver su estado en tiempo real.
        </p>

        {/* Steps decorativos */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {[
            { icon: <CheckCircle2 size={14}/>, label: "Confirmado" },
            { icon: <ChefHat size={14}/>,      label: "Preparando" },
            { icon: <Bike size={14}/>,         label: "En camino"  },
            { icon: <Package2 size={14}/>,     label: "Entregado"  },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                background: C.pale,
                border: `1.5px solid rgba(110,52,130,.22)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.dark,
              }}>{s.icon}</div>
              <span style={{ color: C.mid, fontSize: 9, fontWeight: 700, letterSpacing: ".04em" }}>{s.label}</span>
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
                background: C.faint,
                border: error
                  ? "1.5px solid rgba(220,38,38,.55)"
                  : `1.5px solid rgba(110,52,130,.28)`,
                borderRadius: 14,
                padding: "14px 48px 14px 18px",
                color: C.darkest,
                fontSize: 22,
                fontWeight: 800,
                outline: "none",
                letterSpacing: "0.06em",
                textAlign: "center",
                fontFamily: "inherit",
                transition: "border-color .18s",
                boxSizing: "border-box",
              }}
              autoFocus
            />
            <Search size={18} style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              color: C.mid, pointerEvents: "none",
            }}/>
          </div>

          {error && (
            <p style={{ color: "rgba(220,38,38,.85)", fontSize: 12, fontWeight: 600, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            style={{
              background: `linear-gradient(135deg, ${C.dark}, ${C.darkest})`,
              boxShadow: `0 4px 18px rgba(110,52,130,.32)`,
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
          color: C.mid, fontSize: 12, textDecoration: "none",
          transition: "color .18s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = C.dark)}
          onMouseLeave={e => (e.currentTarget.style.color = C.mid)}
        >
          ← Volver al KDS
        </Link>
      </div>

      {/* Tip */}
      <p style={{ color: C.mid, opacity: .6, fontSize: 11, marginTop: 20, zIndex: 1 }}>
        El número de pedido aparece en la comanda y en la notificación al cliente.
      </p>
    </div>
  );
}
