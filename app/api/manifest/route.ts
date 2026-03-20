import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { nombre: true, logoUrl: true },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  const nombre = branch?.nombre ?? "Carta";
  const logoUrl = branch?.logoUrl;

  const icons = logoUrl
    ? [
        { src: logoUrl, sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: logoUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ]
    : [{ src: "/logo.png", sizes: "192x192", type: "image/png" }];

  const manifest = {
    name: nombre,
    short_name: nombre,
    description: `Pide en línea de ${nombre}`,
    start_url: `/pedir/${slug}`,
    scope: `/pedir/${slug}`,
    display: "standalone",
    background_color: "#f4efe7",
    theme_color: "#f97316",
    orientation: "portrait-primary",
    lang: "es",
    icons,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
