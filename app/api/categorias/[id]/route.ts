import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Estacion } from "@prisma/client";

// PATCH /api/categorias/[id] → actualizar nombre o estacion
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data: { estacion?: Estacion; nombre?: string } = {};
  if (body.estacion !== undefined) data.estacion = body.estacion as Estacion;
  if (body.nombre   !== undefined) data.nombre   = body.nombre;

  const categoria = await prisma.categoria.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(categoria);
}
