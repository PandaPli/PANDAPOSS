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

  // Verificar que la caja pertenece a la sucursal del usuario
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const caja = await prisma.caja.findUnique({
    where: { id: cajaId },
    select: { sucursalId: true },
  });
  if (!caja) {
    return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  }
  if (caja.sucursalId !== sucursalId) {
    return NextResponse.json({ error: "Sin permisos sobre esta caja" }, { status: 403 });
  }

  // 1. Persistir en DB — fiable en PM2 cluster (todos los workers comparten la misma DB)
  await prisma.caja.update({
    where: { id: cajaId },
    data: { visorEstado: JSON.stringify(msg) },
  });

  // 2. Notificar listeners del mismo proceso (respuesta inmediata sin polling)
  pushVisorStateMem(cajaId, msg as VisorMsg);

  return NextResponse.json({ ok: true });
}
