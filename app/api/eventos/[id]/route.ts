import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const eventoId = parseInt(params.id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: {
      sucursal: { select: { id: true, nombre: true } },
      _count: { select: { tickets: true } },
    },
  });

  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  return NextResponse.json(evento);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const eventoId = parseInt(params.id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { nombre, descripcion, fecha, lugar, precio, capacidad, imagenUrl, activo } = body;

  const evento = await prisma.evento.update({
    where: { id: eventoId },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(fecha !== undefined && { fecha: new Date(fecha) }),
      ...(lugar !== undefined && { lugar }),
      ...(precio !== undefined && { precio: parseFloat(precio) }),
      ...(capacidad !== undefined && { capacidad: parseInt(capacidad) }),
      ...(imagenUrl !== undefined && { imagenUrl }),
      ...(activo !== undefined && { activo }),
    },
  });

  return NextResponse.json(evento);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const eventoId = parseInt(params.id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Check for paid/validated tickets
  const paidTickets = await prisma.ticketEvento.count({
    where: {
      eventoId,
      estado: { in: ["PAGADO", "VALIDADO"] },
    },
  });

  if (paidTickets > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay tickets pagados o validados" },
      { status: 409 }
    );
  }

  await prisma.ticketEvento.deleteMany({ where: { eventoId } });
  await prisma.evento.delete({ where: { id: eventoId } });

  return NextResponse.json({ ok: true });
}
