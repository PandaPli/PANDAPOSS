"use client";

import { SessionProvider } from "next-auth/react";
import { OfflineProvider } from "@/context/OfflineContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfflineProvider>
        {children}
      </OfflineProvider>
    </SessionProvider>
  );
}
