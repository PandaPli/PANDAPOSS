"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";

/* ─── Paleta ──────────────────────────────────────────────────────── */
const C = {
  darkest: "#49225B",
  dark: "#6E3482",
  mid: "#A56ABD",
  pale: "#E7DBEF",
  faint: "#F5EBFA",
  gold: "#FACC15",
  goldDim: "#D1D5DB",
} as const;

interface Evaluacion {
  id: number;
  nick: string;
  estrellas: number;
  comentario: string | null;
  creadoEn: string;
  pedidoId?: number;
  pedidoNumero?: number;
  clienteNombre?: string | null;
  clienteTelefono?: string | null;
}

interface Data {
  sucursal: { nombre: string; logoUrl: string | null };
  promedio: number;
  total: number;
  evaluaciones: Evaluacion[];
}

/* ─── Estrellas interactivas ─────────────────────────────────────── */
function StarRating({
  value,
  onChange,
  size = 36,
  interactive = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={(hover || value) >= i ? C.gold : C.goldDim}
          stroke={(hover || value) >= i ? "#EAB308" : "#9CA3AF"}
          strokeWidth={1.2}
          style={{
            cursor: interactive ? "pointer" : "default",
            transition: "all .18s ease",
            transform: (hover || value) >= i ? "scale(1.1)" : "scale(1)",
            filter: (hover || value) >= i ? "drop-shadow(0 0 6px rgba(250,204,21,.5))" : "none",
          }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i)}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Estrellitas mini (solo lectura) ───────────────────────────── */
function MiniStars({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill={value >= i ? C.gold : C.goldDim}
          stroke={value >= i ? "#EAB308" : "#9CA3AF"}
          strokeWidth={1.5}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

const STYLES = `
  @keyframes eva-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes eva-breathe {
    0%, 100% { opacity: .5;  transform: scale(1);    }
    50%       { opacity: .85; transform: scale(1.06); }
  }
  @keyframes eva-pop {
    0%   { transform: scale(.8); opacity: 0; }
    60%  { transform: scale(1.05);           }
    100% { transform: scale(1);  opacity: 1; }
  }
  .eva-card {
    animation: eva-fade-up .5s ease both;
    border-radius: 24px;
    border: 1px solid rgba(110,52,130,.14);
    background: white;
    box-shadow: 0 2px 12px rgba(73,34,91,.06), 0 8px 32px rgba(73,34,91,.04);
  }
  .eva-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; border-radius: 16px; border: none;
    background: linear-gradient(135deg, #6E3482, #49225B);
    padding: 16px 24px; font-size: 15px; font-weight: 900; color: white;
    cursor: pointer; transition: all .2s;
    box-shadow: 0 4px 18px rgba(110,52,130,.32);
  }
  .eva-btn:hover { opacity: .88; }
  .eva-btn:disabled { opacity: .5; cursor: not-allowed; }
  .eva-textarea {
    width: 100%; border-radius: 14px; border: 1.5px solid rgba(110,52,130,.2);
    background: #F5EBFA; padding: 14px 16px; font-size: 14px; font-family: inherit;
    color: #49225B; resize: none; outline: none; transition: border-color .2s;
  }
  .eva-textarea:focus { border-color: #6E3482; }
  .eva-input {
    width: 100%; border-radius: 14px; border: 1.5px solid rgba(110,52,130,.2);
    background: #F5EBFA; padding: 14px 16px; font-size: 14px; font-family: inherit;
    color: #49225B; outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .eva-input:focus { border-color: #6E3482; }
  .eva-success {
    animation: eva-pop .5s cubic-bezier(.34,1.56,.64,1) both;
  }
`;

export default function EvaluacionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const pedidoId = searchParams.get("pedido") ? Number(searchParams.get("pedido")) : null;

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nick, setNick] = useState("");
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/evaluacion?slug=${slug}`);
        if (!res.ok) return;
        const publicData = await res.json();

        const adminRes = await fetch("/api/evaluacion/admin");
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          const adminMap = new Map(
            adminData.evaluaciones.map((e: Evaluacion & { pedidoId: number }) => [e.id, e])
          );
          publicData.evaluaciones = publicData.evaluaciones.map((ev: Evaluacion) => {
            const extra = adminMap.get(ev.id);
            return extra ? { ...ev, ...extra } : ev;
          });
          setIsAdmin(true);
        }

        setData(publicData);
      } catch {}
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleSubmit() {
    if (!pedidoId || !nick.trim() || !estrellas) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/evaluacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, nick: nick.trim(), estrellas, comentario: comentario.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Error al enviar");
        return;
      }
      setSubmitted(true);
      const fresh = await fetch(`/api/evaluacion?slug=${slug}`);
      if (fresh.ok) setData(await fresh.json());
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(155deg, ${C.faint} 0%, ${C.pale} 48%, ${C.faint} 100%)` }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${C.pale}`, borderTopColor: C.dark, animation: "eva-pop 1s linear infinite" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(155deg, ${C.faint} 0%, ${C.pale} 48%, ${C.faint} 100%)`, fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <p style={{ color: C.mid, fontSize: 16, fontWeight: 700 }}>Restaurante no encontrado</p>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <main style={{
        minHeight: "100vh",
        background: `linear-gradient(155deg, ${C.faint} 0%, ${C.pale} 48%, ${C.faint} 100%)`,
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: C.darkest,
      }}>
        {/* Orb de fondo */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden>
          <div style={{
            position: "absolute", top: "-8%", left: "50%", transform: "translateX(-50%)",
            width: 640, height: 640, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(165,106,189,.16) 0%, transparent 65%)",
            filter: "blur(40px)", animation: "eva-breathe 5s ease-in-out infinite",
          }} />
        </div>

        <div style={{ position: "relative", margin: "0 auto", maxWidth: 520, padding: "32px 16px 88px" }}>

          {/* ── EVA + Header ── */}
          <div className="eva-card" style={{ padding: "32px 24px 28px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Image
                src="/eva.png"
                alt="Evalúanos"
                width={180}
                height={180}
                style={{ objectFit: "contain", animation: "eva-pop .6s cubic-bezier(.34,1.56,.64,1) both" }}
                priority
              />
            </div>

            <h1 style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 900, letterSpacing: "-0.025em", margin: "0 0 4px", color: C.darkest }}>
              {data.sucursal.nombre}
            </h1>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.mid, margin: "0 0 20px" }}>
              ¿Cómo fue tu experiencia?
            </p>

            {/* Promedio general */}
            {data.total > 0 && (
              <div style={{
                display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6,
                borderRadius: 20, background: C.faint, border: `1.5px solid rgba(110,52,130,.12)`,
                padding: "14px 28px",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: C.darkest, letterSpacing: "-0.03em" }}>
                    {data.promedio}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.mid }}>/5</span>
                </div>
                <StarRating value={Math.round(data.promedio)} size={22} />
                <p style={{ fontSize: 11, fontWeight: 700, color: C.mid, margin: 0 }}>
                  {data.total} evaluaci{data.total === 1 ? "ón" : "ones"}
                </p>
              </div>
            )}
          </div>

          {/* ── Formulario ── */}
          {pedidoId && !submitted && (
            <div className="eva-card" style={{ padding: "24px 22px", marginBottom: 16, animationDelay: ".1s" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.mid, margin: "0 0 16px" }}>
                Deja tu evaluación
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 6, display: "block" }}>
                    Tu nombre o nick
                  </label>
                  <input
                    className="eva-input"
                    placeholder="Ej: María, Juanito..."
                    maxLength={60}
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 8, display: "block" }}>
                    ¿Cuántas estrellas nos das?
                  </label>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <StarRating value={estrellas} onChange={setEstrellas} size={42} interactive />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 6, display: "block" }}>
                    Comentario (opcional)
                  </label>
                  <textarea
                    className="eva-textarea"
                    placeholder="Cuéntanos qué te pareció..."
                    rows={3}
                    maxLength={500}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", margin: 0, textAlign: "center" }}>
                    {error}
                  </p>
                )}

                <button
                  className="eva-btn"
                  disabled={!nick.trim() || !estrellas || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Enviando..." : "Enviar evaluación"}
                </button>
              </div>
            </div>
          )}

          {/* ── Éxito ── */}
          {submitted && (
            <div className="eva-card eva-success" style={{ padding: "28px 24px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 18, fontWeight: 900, color: C.dark, margin: "0 0 6px" }}>
                ¡Gracias por tu evaluación!
              </p>
              <p style={{ fontSize: 13, color: C.mid, margin: 0 }}>
                Tu opinión nos ayuda a mejorar
              </p>
            </div>
          )}

          {/* ── Lista de evaluaciones ── */}
          {data.evaluaciones.length > 0 && (
            <div className="eva-card" style={{ padding: "22px 20px", animationDelay: ".2s" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.mid, margin: "0 0 16px" }}>
                Evaluaciones recientes
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.evaluaciones.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      borderRadius: 16, border: `1px solid rgba(110,52,130,.10)`,
                      background: C.faint, padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.darkest }}>
                        {ev.nick}
                      </span>
                      <MiniStars value={ev.estrellas} />
                    </div>
                    {ev.comentario && (
                      <p style={{ fontSize: 13, color: C.dark, margin: "0 0 6px", lineHeight: 1.5 }}>
                        {ev.comentario}
                      </p>
                    )}
                    {/* Info admin — solo visible para ADMIN_GENERAL */}
                    {isAdmin && ev.pedidoId && (
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4,
                        padding: "6px 10px", borderRadius: 10,
                        background: "rgba(110,52,130,.06)", border: "1px solid rgba(110,52,130,.10)",
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark }}>
                          Pedido #{ev.pedidoId}
                        </span>
                        {ev.clienteNombre && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.mid }}>
                            · {ev.clienteNombre}
                          </span>
                        )}
                        {ev.clienteTelefono && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.mid }}>
                            · {ev.clienteTelefono}
                          </span>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: 10, color: C.mid, margin: 0 }}>
                      {new Date(ev.creadoEn).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
