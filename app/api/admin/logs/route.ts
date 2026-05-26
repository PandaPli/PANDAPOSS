import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const rawOffset = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 50;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      take: limit,
      skip: offset,
      orderBy: { creadoEn: "desc" },
      include: {
        usuario: { select: { id: true, nombre: true, rol: true, sucursal: { select: { nombre: true } } } },
      },
    }),
    prisma.log.count(),
  ]);

  return NextResponse.json({ logs, total, limit, offset });
}
