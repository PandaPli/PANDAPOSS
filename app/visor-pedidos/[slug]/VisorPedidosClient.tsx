"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PedidoVisor {
  id: number;
  numero: number;
  estado: string;
  nombre: string | null;
  creadoEn: string;
  listoEn: string | null;
}

interface Props {
  sucursalId: number;
  sucursalNombre: string;
  logoUrl: string | null;
}

export function VisorPedidosClient({ sucursalId, sucursalNombre, logoUrl }: Props) {
  const [preparando, setPreparando] = useState<PedidoVisor[]>([]);
  const [listos, setListos] = useState<PedidoVisor[]>([]);
  const [nuevosListos, setNuevosListos] = useState<Set<number>>(new Set());
  const prevListosRef = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await fetch(`/api/visor-pedidos?sucursalId=${sucursalId}`);
      const data = await res.json();
      setPreparando(data.preparando ?? []);

      const nuevos = (data.listos ?? []) as PedidoVisor[];
      setListos(nuevos);

      // Detectar nuevos pedidos listos para animación y sonido
      const nuevosIds = new Set(nuevos.map((p: PedidoVisor) => p.id));
      const recienListos = new Set<number>();
      nuevosIds.forEach((id) => {
        if (!prevListosRef.current.has(id)) recienListos.add(id);
      });
      if (recienListos.size > 0) {
        setNuevosListos(recienListos);
        // Reproducir sonido de notificación
        try { audioRef.current?.play(); } catch { /* silencioso */ }
        // Limpiar animación después de 8s
        setTimeout(() => setNuevosListos(new Set()), 8000);
      }
      prevListosRef.current = nuevosIds;
    } catch { /* reintentar en próximo ciclo */ }
  }, [sucursalId]);

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 5000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 bg-[#0a0a12] text-white select-none overflow-hidden flex flex-col">
      {/* Sonido de notificación (sin archivo, usa Web Audio) */}
      <audio ref={audioRef} preload="none">
        <source src="data:audio/wav;base64,UklGRl9vT19teleXRldmVmb3JtYXQAABAAAQABAADiAQAA" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-8 py-4 shrink-0 bg-white/5">
        <div className="flex items-center gap-4">
          {logoUrl
            ? <img src={logoUrl} alt={sucursalNombre} className="h-12 w-auto object-contain" />
            : <span className="text-2xl font-black">{sucursalNombre}</span>
          }
        </div>
        <p className="text-white/30 text-lg font-mono">{hora}</p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna izquierda: En preparación */}
        <div className="flex-1 flex flex-col border-r border-white/10">
          <div className="px-8 py-5 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-2xl font-black text-amber-400 uppercase tracking-[0.15em]">En Preparacion</h2>
            </div>
            <p className="text-white/30 text-sm mt-1">{preparando.length} pedido{preparando.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {preparando.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="text-4xl font-black text-white">#{p.numero}</p>
                  {p.nombre && <p className="text-sm text-white/40 mt-2 truncate">{p.nombre}</p>}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${p.estado === "EN_PROCESO" ? "bg-amber-400 animate-pulse" : "bg-white/20"}`} />
                    <p className="text-xs text-white/40 uppercase font-bold">
                      {p.estado === "EN_PROCESO" ? "Preparando..." : "En cola"}
                    </p>
                  </div>
                </div>
              ))}
              {preparando.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
                  <span className="text-5xl mb-4">🍳</span>
                  <p className="text-lg font-bold">Sin pedidos en preparacion</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: Listos */}
        <div className="w-[40%] flex flex-col bg-emerald-950/30">
          <div className="px-8 py-5 border-b border-emerald-500/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-[0.15em]">¡Listos!</h2>
            </div>
            <p className="text-emerald-400/40 text-sm mt-1">Retira tu pedido</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {listos.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl border-2 p-6 text-center transition-all ${
                    nuevosListos.has(p.id)
                      ? "border-emerald-400 bg-emerald-400/20 animate-pulse scale-105 shadow-[0_0_40px_rgba(52,211,153,0.3)]"
                      : "border-emerald-500/30 bg-emerald-500/10"
                  }`}
                >
                  <p className="text-6xl font-black text-emerald-300">#{p.numero}</p>
                  {p.nombre && <p className="text-lg text-emerald-200/60 mt-2 font-bold">{p.nombre}</p>}
                  <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mt-3">
                    {nuevosListos.has(p.id) ? "🔔 ¡LISTO!" : "RETIRAR"}
                  </p>
                </div>
              ))}
              {listos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-emerald-500/30">
                  <span className="text-5xl mb-4">✅</span>
                  <p className="text-lg font-bold">Sin pedidos listos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
