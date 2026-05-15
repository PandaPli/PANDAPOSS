import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Ruta pública — sin auth, solo devuelve campos públicos de la home
export async function GET() {
  const config = await prisma.configuracion.findUnique({
    where: { id: 1 },
    select: { homePreviewUrl: true },
  });
  return NextResponse.json({ homePreviewUrl: config?.homePreviewUrl ?? null });
}
