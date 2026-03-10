import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { checkLimit } from "@/core/billing/limitChecker";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
      ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q } },
              { email: { contains: q } },
              { telefono: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { nombre, email, telefono, direccion, sucursalId: sucursalIdBody } = body;

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalIdSesion = (session.user as { sucursalId: number | null }).sucursalId;
  const effectiveSucursalId = rol === "ADMIN_GENERAL" ? (sucursalIdBody || null) : sucursalIdSesion;
  const { allowed, error: limitError } = await checkLimit(effectiveSucursalId, "clientes");
  if (!allowed) return NextResponse.json({ error: limitError }, { status: 403 });

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      email: email || null,
      telefono: telefono || null,
      direccion: direccion || null,
      sucursalId: effectiveSucursalId,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  const cliente = await prisma.cliente.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(cliente);
}
