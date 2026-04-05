import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; telefono: string }> }) {
  const k = req.headers.get("x-agente-key");
  if (k !== process.env.AGENTE_API_KEY) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, telefono } = await params;
  const cliente = await prisma.agenteCliente.findUnique({
    where: { agenteId_telefono: { agenteId: Number(id), telefono } },
    include: {
      preferencias: { where: { activa: true }, orderBy: { peso: "desc" } },
      direcciones: { where: { activa: true }, orderBy: [{ esFavorita: "desc" }, { creadoEn: "desc" }] },
    },
  });
  if (!cliente) return NextResponse.json(null);
  return NextResponse.json(cliente);
}
