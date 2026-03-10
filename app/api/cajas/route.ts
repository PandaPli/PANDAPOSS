import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { checkLimit } from "@/lib/plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const cajas = await prisma.caja.findMany({
    where: rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : undefined,
    include: {
      usuario: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(cajas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { nombre, sucursalId } = body;

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const effectiveSucursalId = sucursalId || userSucursalId || 1;
  const { allowed, error: limitError } = await checkLimit(effectiveSucursalId, "cajas");
  if (!allowed) return NextResponse.json({ error: limitError }, { status: 403 });

  const caja = await prisma.caja.create({
    data: {
      nombre,
      sucursalId: effectiveSucursalId,
    },
  });

  return NextResponse.json(caja, { status: 201 });
}
