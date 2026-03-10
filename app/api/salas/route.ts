import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (rol !== "ADMIN_GENERAL" && rol !== "ADMIN_SUCURSAL") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { nombre, sucursalIdOverride } = await req.json();
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const targetSucursalId =
    rol === "ADMIN_GENERAL" ? sucursalIdOverride : sucursalId;

  if (!targetSucursalId) {
    return NextResponse.json({ error: "Sucursal no definida" }, { status: 400 });
  }

  const sala = await prisma.sala.create({
    data: { nombre: nombre.trim(), sucursalId: Number(targetSucursalId) },
    select: { id: true, nombre: true },
  });

  return NextResponse.json(sala, { status: 201 });
}
