import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

type Params = { params: Promise<{ id: string }> };

function isAdmin(rol: Rol) {
  return rol === "ADMIN_GENERAL";
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!isAdmin(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await req.json();
  const { nombre, direccion, telefono, email, simbolo, activa } = body;

  const data: Record<string, unknown> = {};
  if (nombre !== undefined) data.nombre = nombre.trim();
  if (direccion !== undefined) data.direccion = direccion?.trim() || null;
  if (telefono !== undefined) data.telefono = telefono?.trim() || null;
  if (email !== undefined) data.email = email?.trim() || null;
  if (simbolo !== undefined) data.simbolo = simbolo?.trim() || "$";
  if (activa !== undefined) data.activa = activa;

  const sucursal = await prisma.sucursal.update({
    where: { id },
    data,
  });

  return NextResponse.json(sucursal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!isAdmin(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id: idStr } = await params;
  const id = Number(idStr);

  const count = await prisma.usuario.count({ where: { sucursalId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene usuarios asignados. Desactívala en su lugar." },
      { status: 400 }
    );
  }

  const sucursal = await prisma.sucursal.update({
    where: { id },
    data: { activa: false },
  });

  return NextResponse.json(sucursal);
}
