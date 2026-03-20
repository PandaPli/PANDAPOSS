import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { nombre: true, logoUrl: true },
  });
  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  const nombre = branch?.nombre ?? "Carta Digital";

  return {
    title: `${nombre} — Pide en línea`,
    description: `Pide directamente de ${nombre}. Rápido, sin intermediarios.`,
    manifest: `/api/manifest?slug=${slug}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: nombre,
    },
    formatDetection: { telephone: false },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f97316",
};

export default function PedirSlugLayout({ children }: Props) {
  return <>{children}</>;
}
