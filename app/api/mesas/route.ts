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

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { id, estado } = await req.json();
  if (!id || !estado) return NextResponse.json({ error: "id y estado requeridos" }, { status: 400 });

  // Validar estado contra enum — defensa en profundidad
  const ESTADOS_VALIDOS = ["LIBRE", "OCUPADA", "CUENTA", "RESERVADA"];
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: "Estado de mesa inválido" }, { status: 400 });
  }

  // Verificar que la mesa pertenece a la sucursal del usuario
  if (rol !== "ADMIN_GENERAL") {
    const mesa = await prisma.mesa.findUnique({
      where: { id: Number(id) },
      select: { sala: { select: { sucursalId: true } } },
    });
    if (!mesa) return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    if (mesa.sala.sucursalId !== userSucursalId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const mesa = await prisma.mesa.update({
    where: { id: Number(id) },
    data: { estado },
  });
  return NextResponse.json(mesa);
}
