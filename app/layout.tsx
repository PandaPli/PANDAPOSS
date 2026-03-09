import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PandaPoss — Punto de Venta",
  description: "Sistema POS para restaurantes — Zap Zapp Food SpA",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-surface-bg text-surface-text`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
