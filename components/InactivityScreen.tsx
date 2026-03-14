"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Shield, TrendingUp, Infinity, Pointer } from "lucide-react";

const INACTIVITY_MS = 60_000; // 60 segundos
const QR_URL = "https://pandaposs.com/home";

interface Props {
  children: React.ReactNode;
}

export function InactivityScreen({ children }: Props) {
  const [inactive, setInactive] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Genera el QR una sola vez ───────────────────────────────── */
  useEffect(() => {
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(QR_URL, {
        width: 220,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    });
  }, []);

  /* ── Timer de inactividad ────────────────────────────────────── */
  const resetTimer = useCallback(() => {
    if (inactive) setInactive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setInactive(true), INACTIVITY_MS);
  }, [inactive]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    timerRef.current = setTimeout(() => setInactive(true), INACTIVITY_MS);
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return (
    <>
      {children}

      {inactive && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden cursor-pointer select-none"
          style={{ background: "radial-gradient(ellipse 120% 100% at 50% -10%, #0e1a3a 0%, #060810 55%, #02040a 100%)" }}
          onClick={() => setInactive(false)}
        >
          {/* ── Aro de luz tipo portal ─────────────────────────────── */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {/* Aro exterior */}
            <div
              className="absolute rounded-full"
              style={{
                width: "min(130vw, 900px)",
                height: "min(130vw, 900px)",
                border: "1.5px solid transparent",
                background: "transparent",
                boxShadow:
                  "0 0 60px 4px rgba(0,220,200,0.18), inset 0 0 60px 4px rgba(140,60,220,0.18)",
                borderImage: "linear-gradient(135deg, rgba(0,220,200,0.55) 0%, rgba(140,60,220,0.45) 50%, rgba(0,220,200,0.15) 100%) 1",
              }}
            />
            {/* Glow suave central */}
            <div
              className="absolute"
              style={{
                width: "min(70vw, 500px)",
                height: "min(40vw, 280px)",
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(0,200,200,0.07) 0%, transparent 70%)",
                top: "20%",
              }}
            />
            {/* Punto de luz inferior */}
            <div
              className="absolute bottom-[18%] left-1/2 -translate-x-1/2"
              style={{
                width: 120,
                height: 6,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(100,140,255,0.9) 0%, rgba(180,80,255,0.5) 50%, transparent 100%)",
                filter: "blur(4px)",
              }}
            />
          </div>

          {/* ── Estrellas decorativas ──────────────────────────────── */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {[
              { top: "8%",  left: "12%", size: 2, opacity: 0.7 },
              { top: "15%", left: "75%", size: 3, opacity: 0.5 },
              { top: "22%", left: "30%", size: 1.5, opacity: 0.6 },
              { top: "35%", left: "88%", size: 2, opacity: 0.4 },
              { top: "60%", left: "5%",  size: 2.5, opacity: 0.5 },
              { top: "70%", left: "92%", size: 1.5, opacity: 0.6 },
              { top: "78%", left: "55%", size: 2, opacity: 0.3 },
              { top: "45%", left: "18%", size: 1, opacity: 0.7 },
              { top: "55%", left: "65%", size: 1.5, opacity: 0.5 },
              { top: "12%", left: "50%", size: 1, opacity: 0.4 },
            ].map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  top: s.top, left: s.left,
                  width: s.size, height: s.size,
                  opacity: s.opacity,
                }}
              />
            ))}
          </div>

          {/* ── LOGO ──────────────────────────────────────────────── */}
          <div className="relative z-10 mt-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="PandaPoss" width={44} height={44} className="drop-shadow-[0_0_8px_rgba(0,200,200,0.5)]" />
              <span className="text-3xl font-extrabold tracking-tight">
                <span className="text-white">Panda</span>
                <span className="text-cyan-400">Poss</span>
              </span>
            </div>
            <p className="text-xs font-semibold tracking-[0.3em] text-slate-400 uppercase">
              POS para Restaurantes
            </p>
          </div>

          {/* ── TEXTO PRINCIPAL ───────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
            <p className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              PANDA POSS ESTÁ
            </p>
            <p
              className="text-5xl font-black leading-none sm:text-6xl md:text-7xl"
              style={{
                background: "linear-gradient(90deg, #00e5d4 0%, #00cfff 50%, #00e5d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 0 18px rgba(0,220,200,0.6))",
              }}
            >
              INACTIVO
            </p>

            {/* Línea brillante */}
            <div
              className="my-1 h-px w-24 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, #00e5d4, transparent)" }}
            />

            <p className="text-base font-semibold text-slate-300 sm:text-lg md:text-xl">
              TOCA{" "}
              <span className="font-black text-white">LA PANTALLA</span>{" "}
              PARA
              <br />
              REGRESAR AL SISTEMA
            </p>
          </div>

          {/* ── QR ────────────────────────────────────────────────── */}
          <div className="relative z-10 mb-4 flex flex-col items-center gap-2">
            {qrDataUrl && (
              <div
                className="rounded-2xl overflow-hidden p-3 flex flex-col items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(0,220,200,0.25)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR PandaPoss"
                  width={110}
                  height={110}
                  className="rounded-xl"
                  style={{ imageRendering: "pixelated" }}
                />
                <p
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full"
                  style={{ background: "rgba(0,200,200,0.15)", color: "#00e5d4" }}
                >
                  SCANEA Y VISITA<br className="hidden sm:block" /> PANDAPOSS.COM/HOME
                </p>
              </div>
            )}
          </div>

          {/* ── FOOTER ────────────────────────────────────────────── */}
          <div
            className="relative z-10 w-full flex items-center justify-center gap-6 px-6 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { icon: <Pointer size={14} />, label: "TOCA" },
              { icon: <Shield size={14} />, label: "SEGURO" },
              { icon: <TrendingUp size={14} />, label: "ESCALABLE" },
              { icon: <Infinity size={14} />, label: "EFICIENTE" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                <span className="text-cyan-500/70">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
