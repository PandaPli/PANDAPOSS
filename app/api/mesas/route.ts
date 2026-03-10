import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const mesas = await prisma.mesa.findMany({
    where: {
      sala: rol === "ADMIN_GENERAL" ? undefined : { sucursalId: sucursalId ?? 0 },
    },
    include: {
      sala: { select: { nombre: true, sucursalId: true } },
      pedidos: {
        where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
        orderBy: { creadoEn: "desc" },
        take: 1,
        select: {
          id: true,
          creadoEn: true,
          _count: { select: { detalles: true } },
        },
      },
    },
    orderBy: [{ salaId: "asc" }, { nombre: "asc" }],
  });

  return NextResponse.json(mesas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "ADMIN_SUCURSAL") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { nombre, salaId, capacidad } = await req.json();
  if (!nombre || !salaId) {
    return NextResponse.json({ error: "Nombre y sala son requeridos" }, { status: 400 });
  }

  const mesa = await prisma.mesa.create({
    data: { nombre, salaId: Number(salaId), capacidad: Number(capacidad) || 4 },
    include: { sala: { select: { nombre: true } } },
  });
  return NextResponse.json(mesa, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, estado } = await req.json();
  const mesa = await prisma.mesa.update({
    where: { id },
    data: { estado },
  });
  return NextResponse.json(mesa);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "ADMIN_SUCURSAL") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  // Verificar que no tenga pedidos activos
  const pedidosActivos = await prisma.pedido.count({
    where: { mesaId: id, estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
  });
  if (pedidosActivos > 0) {
    return NextResponse.json({ error: "La mesa tiene pedidos activos" }, { status: 409 });
  }

  await prisma.mesa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
