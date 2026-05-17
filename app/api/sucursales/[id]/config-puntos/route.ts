import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sucursalId = parseInt(id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sucursalId = parseInt(id);
  if (isNaN(sucursalId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { puntosActivo, puntosPorMil, valorPunto } = body as {
    puntosActivo?: boolean;
    puntosPorMil?: number;
    valorPunto?: number;
  };

  const data: Record<string, unknown> = {};
  if (typeof puntosActivo === "boolean") data.puntosActivo = puntosActivo;

  // Validación estricta: finito, no negativo, dentro de límites razonables.
  // Sin esto, valores como Infinity o NaN podrían romper cálculos de puntos.
  if (typeof puntosPorMil === "number") {
    if (!Number.isFinite(puntosPorMil) || puntosPorMil < 0 || puntosPorMil > 10000) {
      return NextResponse.json(
        { error: "puntosPorMil debe ser un número finito entre 0 y 10000" },
        { status: 400 }
      );
    }
    data.puntosPorMil = puntosPorMil;
  }
  if (typeof valorPunto === "number") {
    if (!Number.isFinite(valorPunto) || valorPunto < 0 || valorPunto > 100000) {
      return NextResponse.json(
        { error: "valorPunto debe ser un número finito entre 0 y 100000" },
        { status: 400 }
      );
    }
    data.valorPunto = valorPunto;
  }

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
