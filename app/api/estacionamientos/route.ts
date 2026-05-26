import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { rol: string; sucursalId: number | null };
  if (!["ADMIN_GENERAL", "RESTAURANTE"].includes(user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const spots = await prisma.estacionamiento.findMany({
    where: {
      ...(user.rol !== "ADMIN_GENERAL" && user.sucursalId ? { sucursalId: user.sucursalId } : {}),
    },
    include: { sucursal: { select: { id: true, nombre: true } } },
    orderBy: { numero: "asc" },
  });

  return NextResponse.json(spots);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { rol: string; sucursalId: number | null };
  if (!["ADMIN_GENERAL", "RESTAURANTE"].includes(user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { numero, sucursalId } = body;

  if (!numero || typeof numero !== "string" || numero.trim().length === 0) {
    return NextResponse.json({ error: "Número de estacionamiento requerido" }, { status: 400 });
  }

  const targetSucursalId = user.rol === "ADMIN_GENERAL"
    ? Number(sucursalId)
    : user.sucursalId;

  if (!targetSucursalId) {
    return NextResponse.json({ error: "Sucursal requerida" }, { status: 400 });
  }

  const existing = await prisma.estacionamiento.findFirst({
    where: { numero: numero.trim(), sucursalId: targetSucursalId },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un estacionamiento con ese número" }, { status: 409 });
  }

  const spot = await prisma.estacionamiento.create({
    data: { numero: numero.trim(), sucursalId: targetSucursalId },
  });

  return NextResponse.json(spot, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { rol: string; sucursalId: number | null };
  if (!["ADMIN_GENERAL", "RESTAURANTE"].includes(user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const spot = await prisma.estacionamiento.findUnique({ where: { id } });
  if (!spot) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (user.rol !== "ADMIN_GENERAL" && spot.sucursalId !== user.sucursalId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // Verificar que no tenga pedidos activos antes de desactivar
  const pedidosActivos = await prisma.pedido.count({
    where: {
      estacionamientoId: id,
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
    },
  });

  if (pedidosActivos > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${pedidosActivos} pedido(s) activo(s).` },
      { status: 409 }
    );
  }

  // Soft-delete: desactivar en lugar de borrar para preservar historial
  await prisma.estacionamiento.update({ where: { id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
