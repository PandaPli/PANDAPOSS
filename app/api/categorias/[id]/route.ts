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

  const data: { estacion?: Estacion; nombre?: string; enMenu?: boolean; enMenuQR?: boolean } = {};
  if (body.estacion !== undefined) data.estacion = body.estacion as Estacion;
  if (body.nombre   !== undefined) data.nombre   = body.nombre;
  if (body.enMenu   !== undefined) data.enMenu   = body.enMenu;
  if (body.enMenuQR !== undefined) data.enMenuQR = body.enMenuQR;

  const categoria = await prisma.categoria.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(categoria);
}
