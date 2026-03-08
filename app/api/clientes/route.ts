import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
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
  const { nombre, email, telefono, direccion } = body;

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      email: email || null,
      telefono: telefono || null,
      direccion: direccion || null,
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
