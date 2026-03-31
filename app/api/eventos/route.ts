import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const eventos = await prisma.evento.findMany({
    where: {
      ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
    },
    include: {
      sucursal: { select: { id: true, nombre: true } },
      _count: { select: { tickets: true } },
    },
    orderBy: { fecha: "asc" },
  });

  return NextResponse.json(eventos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const body = await req.json();
  const { nombre, descripcion, fecha, lugar, precio, capacidad, imagenUrl, sucursalId: sucursalIdBody } = body;

  if (!nombre || !fecha || precio == null) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const effectiveSucursalId = rol === "ADMIN_GENERAL" ? (sucursalIdBody ?? sucursalId) : sucursalId;
  if (!effectiveSucursalId) {
    return NextResponse.json({ error: "Sucursal no definida" }, { status: 400 });
  }

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: effectiveSucursalId },
    select: { tenantId: true },
  });

  if (!sucursal?.tenantId) {
    return NextResponse.json({ error: "Sucursal sin tenant" }, { status: 400 });
  }

  const evento = await prisma.evento.create({
    data: {
      nombre,
      descripcion: descripcion ?? null,
      fecha: new Date(fecha),
      lugar: lugar ?? null,
      precio: parseFloat(precio),
      capacidad: capacidad ? parseInt(capacidad) : 0,
      imagenUrl: imagenUrl ?? null,
      sucursalId: effectiveSucursalId,
      tenantId: sucursal.tenantId,
    },
  });

  return NextResponse.json(evento, { status: 201 });
}
