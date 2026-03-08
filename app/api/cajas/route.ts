import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cajas = await prisma.caja.findMany({
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

  const userId = (session.user as { id: number }).id;
  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const caja = await prisma.caja.create({
    data: {
      nombre,
      sucursalId: sucursalId || userSucursalId || 1,
    },
  });

  return NextResponse.json(caja, { status: 201 });
}
