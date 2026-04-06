import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotificationService } from "@/server/services/notification.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const k = req.headers.get("x-agente-key");
  if (k !== process.env.AGENTE_API_KEY) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const agenteId = Number(id);

  const agente = await prisma.agenteWsp.findUnique({
    where: { id: agenteId },
    select: { sucursalId: true },
  });
  if (!agente) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  const mensajes = NotificationService.drainWspQueue(agente.sucursalId);
  return NextResponse.json({ mensajes });
}
