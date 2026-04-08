import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = parseInt(params.id);
  if (isNaN(sucursalId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { puntosActivo: true, puntosPorMil: true, valorPunto: true },
  });

  if (!sucursal) return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });

  return NextResponse.json({
    puntosActivo: sucursal.puntosActivo,
    puntosPorMil: Number(sucursal.puntosPorMil),
    valorPunto: Number(sucursal.valorPunto),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = parseInt(params.id);
  if (isNaN(sucursalId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { puntosActivo, puntosPorMil, valorPunto } = body as {
    puntosActivo?: boolean;
    puntosPorMil?: number;
    valorPunto?: number;
  };

  const data: Record<string, unknown> = {};
  if (typeof puntosActivo === "boolean") data.puntosActivo = puntosActivo;
  if (typeof puntosPorMil === "number" && puntosPorMil >= 0) data.puntosPorMil = puntosPorMil;
  if (typeof valorPunto === "number" && valorPunto >= 0) data.valorPunto = valorPunto;

  const updated = await prisma.sucursal.update({
    where: { id: sucursalId },
    data,
    select: { puntosActivo: true, puntosPorMil: true, valorPunto: true },
  });

  return NextResponse.json({
    ok: true,
    puntosActivo: updated.puntosActivo,
    puntosPorMil: Number(updated.puntosPorMil),
    valorPunto: Number(updated.valorPunto),
  });
}
