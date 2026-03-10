import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

function isAdmin(rol: Rol) {
  return rol === "ADMIN_GENERAL";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!isAdmin(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const sucursales = await prisma.sucursal.findMany({
    include: {
      _count: { select: { usuarios: true, cajas: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(sucursales);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!isAdmin(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const { nombre, direccion, telefono, email, simbolo } = body;

  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const sucursal = await prisma.sucursal.create({
    data: {
      nombre: nombre.trim(),
      direccion: direccion?.trim() || null,
      telefono: telefono?.trim() || null,
      email: email?.trim() || null,
      simbolo: simbolo?.trim() || "$",
    },
  });

  // Auto-crear punto de atención Mesón + 30 mesas
  const sala = await prisma.sala.create({
    data: { nombre: "Mesón", sucursalId: sucursal.id },
  });
  await prisma.mesa.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      nombre: `Mesa ${i + 1}`,
      salaId: sala.id,
      capacidad: 4,
    })),
  });

  return NextResponse.json(sucursal, { status: 201 });
}
