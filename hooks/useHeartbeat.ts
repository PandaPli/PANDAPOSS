"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const INTERVAL_MS = 60_000;

export function useHeartbeat() {
  const { data: session, status } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sucursalId = (session?.user as { sucursalId?: number | null } | undefined)?.sucursalId;

  useEffect(() => {
    if (status !== "authenticated" || !sucursalId) return;

    const ping = () => {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    };

    ping();
    intervalRef.current = setInterval(ping, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, sucursalId]);
}
