import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Estacion } from "@prisma/client";

const ADMIN_ROLES = ["ADMIN_GENERAL", "RESTAURANTE"];

// PATCH /api/categorias/[id] → actualizar nombre o estacion
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: string }).rol;
  if (!ADMIN_ROLES.includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: { estacion?: Estacion; nombre?: string; enMenu?: boolean; enMenuQR?: boolean; orden?: number } = {};
  if (body.estacion !== undefined) data.estacion = body.estacion as Estacion;
  if (body.nombre   !== undefined) data.nombre   = body.nombre;
  if (body.enMenu   !== undefined) data.enMenu   = body.enMenu;
  if (body.enMenuQR !== undefined) data.enMenuQR = body.enMenuQR;
  if (body.orden    !== undefined) data.orden    = Number(body.orden);

  const categoria = await prisma.categoria.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(categoria);
}
