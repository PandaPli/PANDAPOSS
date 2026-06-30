"use client";

import { useEffect, useRef } from "react";

const INTERVAL_MS = 2 * 60 * 1000; // cada 2 minutos

/**
 * Heartbeat que llama al endpoint de recovery de pagos MP atascados.
 * Complementa el cron de Vercel — funciona aunque el plan no soporte
 * crons frecuentes, y solo corre mientras alguien tiene el KDS abierto.
 *
 * El endpoint tiene rate limit global (1 req/90s) para que múltiples
 * tabs/KDS no martillen la API de MP.
 */
export function useMpRecovery() {
  const running = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;

    async function recover() {
      if (running.current || !active) return;
      running.current = true;
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await fetch("/api/mercadopago/recover-pending", {
          method: "POST",
          signal: controller.signal,
        });
      } catch {
        /* abort o red — no bloquear */
      } finally {
        running.current = false;
        abortRef.current = null;
      }
    }

    // Primera ejecución después de 30s (dar tiempo al mount)
    const timeout = setTimeout(recover, 30_000);
    const interval = setInterval(recover, INTERVAL_MS);

    return () => {
      active = false;
      clearTimeout(timeout);
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, []);
}
