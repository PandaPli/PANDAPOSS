import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const INACTIVITY_THRESHOLD_SEC = 120;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const user = session.user as { id: number; sucursalId: number | null };
  if (!user.id || !user.sucursalId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const userId = user.id;
  const sucursalId = user.sucursalId;
  const ahora = new Date();

  const sesionActiva = await prisma.sesionActividad.findFirst({
    where: { usuarioId: userId, activa: true },
    orderBy: { inicioEn: "desc" },
  });

  if (sesionActiva) {
    const segDesdeUltimoPing = Math.floor(
      (ahora.getTime() - sesionActiva.ultimoPing.getTime()) / 1000
    );

    if (segDesdeUltimoPing > INACTIVITY_THRESHOLD_SEC) {
      await prisma.sesionActividad.update({
        where: { id: sesionActiva.id },
        data: { activa: false },
      });

      const nueva = await prisma.sesionActividad.create({
        data: { usuarioId: userId, sucursalId },
      });
      return NextResponse.json({ ok: true, sesionId: nueva.id });
    }

    const nuevaDuracion = sesionActiva.duracionSeg + segDesdeUltimoPing;
    await prisma.sesionActividad.update({
      where: { id: sesionActiva.id },
      data: { ultimoPing: ahora, duracionSeg: nuevaDuracion },
    });
    return NextResponse.json({ ok: true, sesionId: sesionActiva.id });
  }

  const nueva = await prisma.sesionActividad.create({
    data: { usuarioId: userId, sucursalId },
  });
  return NextResponse.json({ ok: true, sesionId: nueva.id });
}
