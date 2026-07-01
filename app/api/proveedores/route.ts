import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/proveedores — lista proveedores activos
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(proveedores);
}

// POST /api/proveedores — crear proveedor
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { nombre, rut, email, telefono } = (body ?? {}) as Record<string, string>;
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  try {
    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: nombre.trim(),
        rut: rut?.trim() || null,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
      },
    });
    return NextResponse.json(proveedor, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear proveedor (¿RUT duplicado?)" }, { status: 400 });
  }
}
