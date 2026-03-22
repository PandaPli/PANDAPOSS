import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pushVisorStateMem, type VisorMsg } from "@/lib/visorBus";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body: VisorMsg & { cajaId?: number } = await req.json();

  if (!body.cajaId) {
    return NextResponse.json({ error: "Falta cajaId" }, { status: 400 });
  }

  const { cajaId, ...msg } = body;

  // 1. Persistir en DB — fiable en PM2 cluster (todos los workers comparten la misma DB)
  try {
    await prisma.caja.update({
      where: { id: cajaId },
      data: { visorEstado: JSON.stringify(msg) },
    });
  } catch {
    // Si la caja no existe o falla, seguimos — la notificación en memoria aún funciona
  }

  // 2. Notificar listeners del mismo proceso (respuesta inmediata sin polling)
  pushVisorStateMem(cajaId, msg as VisorMsg);

  return NextResponse.json({ ok: true });
}
