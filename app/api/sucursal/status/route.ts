import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

/** GET /api/sucursal/status — estado de bloqueo/aviso de la sucursal activa */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const rol        = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;

  // Admin general nunca ve overlay
  if (rol === "ADMIN_GENERAL" || !sucursalId) {
    return NextResponse.json({ activa: true, notifAviso: false });
  }

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { activa: true, notifAviso: true, nombre: true },
  });

  if (!sucursal) return NextResponse.json({ activa: true, notifAviso: false });

  return NextResponse.json({
    activa:     sucursal.activa,
    notifAviso: sucursal.notifAviso,
    nombre:     sucursal.nombre,
  });
}
