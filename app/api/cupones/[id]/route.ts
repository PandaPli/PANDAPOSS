import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// PATCH /api/cupones/[id] — actualizar cupon
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id: paramId } = await params;
  const id = Number(paramId);
  const body = await req.json();

  const cupon = await prisma.cupon.update({
    where: { id },
    data: {
      ...(body.codigo !== undefined && { codigo: String(body.codigo).toUpperCase().trim() }),
      ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.valor !== undefined && { valor: Number(body.valor) }),
      ...(body.usoMax !== undefined && { usoMax: body.usoMax ? Number(body.usoMax) : null }),
      ...(body.activo !== undefined && { activo: body.activo }),
      ...(body.venceEn !== undefined && { venceEn: body.venceEn ? new Date(body.venceEn) : null }),
    },
  });

  return NextResponse.json(cupon);
}

// DELETE /api/cupones/[id] — eliminar cupon
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!["ADMIN_GENERAL", "RESTAURANTE"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.cupon.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
