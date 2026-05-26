"use client";

import { SessionProvider } from "next-auth/react";
import { OfflineProvider } from "@/context/OfflineContext";
import { HeartbeatProvider } from "./HeartbeatProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfflineProvider>
        <HeartbeatProvider />
        {children}
      </OfflineProvider>
    </SessionProvider>
  );
}
