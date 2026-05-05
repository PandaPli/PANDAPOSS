"use client";

import { useOffline } from "@/context/OfflineContext";
import { WifiOff, RefreshCw, CheckCircle2, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBar() {
  const { isOnline, pendingCount, syncing, lastSyncOk, triggerSync } = useOffline();
  const [showOk, setShowOk] = useState(false);

  // Mostrar "Sincronizado" brevemente tras un sync exitoso
  useEffect(() => {
    if (lastSyncOk > 0) {
      setShowOk(true);
      const t = setTimeout(() => setShowOk(false), 3500);
      return () => clearTimeout(t);
    }
  }, [lastSyncOk]);

  // ── Si todo está bien, no mostrar nada ──────────────────────────────────────
  if (isOnline && pendingCount === 0 && !showOk) return null;

  // ── Sincronizado OK ─────────────────────────────────────────────────────────
  if (isOnline && pendingCount === 0 && showOk) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold">
        <CheckCircle2 size={13} />
        {lastSyncOk} {lastSyncOk === 1 ? "registro sincronizado" : "registros sincronizados"} con el servidor
      </div>
    );
  }

  // ── Pendientes por sincronizar (online) ─────────────────────────────────────
  if (isOnline && pendingCount > 0) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500 text-white text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Wifi size={13} />
          <span>
            Conexión restaurada ·{" "}
            <strong>{pendingCount}</strong>{" "}
            {pendingCount === 1 ? "venta guardada" : "ventas guardadas"} sin sincronizar
          </span>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition shrink-0"
        >
          <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando…" : "Sincronizar ahora"}
        </button>
      </div>
    );
  }

  // ── Sin conexión ────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-red-600 text-white text-xs font-semibold">
      <div className="flex items-center gap-2">
        <WifiOff size={13} />
        <span>
          Sin conexión · Modo offline activo
          {pendingCount > 0 && (
            <> · <strong>{pendingCount}</strong>{" "}
              {pendingCount === 1 ? "venta guardada localmente" : "ventas guardadas localmente"}
            </>
          )}
        </span>
      </div>
      <span className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Guardando localmente
      </span>
    </div>
  );
}
