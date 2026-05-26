"use client";

import { SessionProvider } from "next-auth/react";
import { OfflineProvider } from "@/context/OfflineContext";
import { HeartbeatProvider } from "./HeartbeatProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfflineProvider>
        <HeartbeatProvider />
        <ToastProvider>
          {children}
        </ToastProvider>
      </OfflineProvider>
    </SessionProvider>
  );
}
