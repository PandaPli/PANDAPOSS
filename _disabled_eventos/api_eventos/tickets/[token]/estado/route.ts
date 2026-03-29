import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { token } = await params;
  const body = await req.json();
  const { estado } = body;

  const validStates = ["PENDIENTE_PAGO", "PAGADO", "VALIDADO", "EXPIRADO"];
  if (!estado || !validStates.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const ticket = await prisma.ticketEvento.findUnique({ where: { token } });
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

  const updated = await prisma.ticketEvento.update({
    where: { token },
    data: {
      estado,
      ...(estado === "VALIDADO" && { validadoEn: new Date() }),
    },
  });

  return NextResponse.json(updated);
}
