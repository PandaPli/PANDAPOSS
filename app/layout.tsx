import type { Metadata } from "next";
import { Outfit, Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({ subsets: ["latin"] });

// Fuentes para la landing page pública
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-space-grotesk",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "PandaPoss — Punto de Venta",
  description: "Sistema POS para restaurantes — Zap Zapp Food SpA",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.className} ${spaceGrotesk.variable} ${dmSans.variable} antialiased bg-surface-bg text-surface-text`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
