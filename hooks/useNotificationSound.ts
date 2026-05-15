"use client";

import { useCallback, useRef } from "react";

/**
 * Genera un beep de notificación usando Web Audio API.
 * No requiere archivos de audio externos.
 */
export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef(0);

  const play = useCallback(() => {
    // Evitar spam: mínimo 2s entre sonidos
    const now = Date.now();
    if (now - lastPlayRef.current < 2000) return;
    lastPlayRef.current = now;

    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;

      // Tono 1: beep agudo
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Tono 2: segundo beep más agudo (después de pausa)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.value = 1100;
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.4);
    } catch {
      // Web Audio no disponible — silencioso
    }
  }, []);

  return play;
}
