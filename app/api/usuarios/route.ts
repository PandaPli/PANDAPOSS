import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { Rol } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!["ADMIN_GENERAL", "ADMIN_SUCURSAL"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    include: { sucursal: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });

  // No enviar passwords
  const safe = usuarios.map(({ password, ...u }) => u);
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!["ADMIN_GENERAL", "ADMIN_SUCURSAL"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { nombre, usuario, password, email, rolUsuario, sucursalId } = body;

  if (!nombre || !usuario || !password) {
    return NextResponse.json({ error: "Nombre, usuario y contraseña son requeridos" }, { status: 400 });
  }

  const existe = await prisma.usuario.findUnique({ where: { usuario: usuario.toUpperCase() } });
  if (existe) {
    return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre,
      usuario: usuario.toUpperCase(),
      password: hash,
      email: email || null,
      rol: rolUsuario || "WAITER",
      sucursalId: sucursalId || null,
    },
  });

  const { password: _, ...safe } = nuevoUsuario;
  return NextResponse.json(safe, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!["ADMIN_GENERAL", "ADMIN_SUCURSAL"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { id, password, rolUsuario, ...rest } = body;

  const data: Record<string, unknown> = { ...rest };
  if (rolUsuario) data.rol = rolUsuario;
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const actualizado = await prisma.usuario.update({
    where: { id: Number(id) },
    data,
  });

  const { password: _, ...safe } = actualizado;
  return NextResponse.json(safe);
}
