"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
} from "react";
import { syncAll, getPendingCount } from "@/lib/offline/queue";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface OfflineCtx {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSyncOk: number;   // cuántas se sincronizaron en la última pasada
  triggerSync: () => Promise<void>;
  refreshPending: () => Promise<void>;
}

const OfflineContext = createContext<OfflineCtx>({
  isOnline: true,
  pendingCount: 0,
  syncing: false,
  lastSyncOk: 0,
  triggerSync: async () => {},
  refreshPending: async () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncOk, setLastSyncOk] = useState(0);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch { /* IndexedDB puede no estar listo */ }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const { ok } = await syncAll();
      if (ok > 0) setLastSyncOk(ok);
      await refreshPending();
    } finally {
      setSyncing(false);
      syncingRef.current = false;
    }
  }, [refreshPending]);

  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);
    refreshPending();

    // Registro del Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Escuchar cambios de conexión
    function handleOnline() {
      setIsOnline(true);
      // Esperar 1.5 s para que la conexión estabilice antes de sincronizar
      setTimeout(() => {
        triggerSync();
      }, 1500);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    // Escuchar encolas desde offlineFetch
    async function handleQueued() {
      await refreshPending();
    }
    // Escuchar sincronización exitosa
    async function handleSynced() {
      await refreshPending();
    }

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pp:offline:queued", handleQueued);
    window.addEventListener("pp:offline:synced", handleSynced);

    // Sincronizar al montar si ya hay pendientes y hay conexión
    if (navigator.onLine) {
      setTimeout(triggerSync, 3000);
    }

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pp:offline:queued", handleQueued);
      window.removeEventListener("pp:offline:synced", handleSynced);
    };
  }, [refreshPending, triggerSync]);

  return (
    <OfflineContext.Provider value={{
      isOnline, pendingCount, syncing, lastSyncOk, triggerSync, refreshPending,
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useOffline() {
  return useContext(OfflineContext);
}
