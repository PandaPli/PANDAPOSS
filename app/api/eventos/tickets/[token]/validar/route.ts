import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { token } = await params;

  let decoded: { ticketId: number; eventoId: number; sucursalId: number };
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as typeof decoded;
  } catch {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
  }

  void decoded;

  const ticket = await prisma.ticketEvento.findUnique({
    where: { token },
    include: {
      evento: true,
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

  if (ticket.estado === "PENDIENTE_PAGO") {
    return NextResponse.json({ error: "Ticket pendiente de pago, no puede validarse" }, { status: 400 });
  }

  if (ticket.estado === "EXPIRADO") {
    return NextResponse.json({ error: "Ticket expirado" }, { status: 400 });
  }

  if (ticket.estado === "VALIDADO" && ticket.usosRealizados >= ticket.usosMax) {
    return NextResponse.json({ error: "Ticket ya utilizado al máximo" }, { status: 400 });
  }

  const newUsos = ticket.usosRealizados + 1;
  const nuevoEstado = newUsos >= ticket.usosMax ? "VALIDADO" : "PAGADO";

  const updatedTicket = await prisma.ticketEvento.update({
    where: { id: ticket.id },
    data: {
      usosRealizados: newUsos,
      estado: nuevoEstado,
      validadoEn: new Date(),
    },
    include: {
      evento: true,
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
    },
  });

  return NextResponse.json({ ok: true, ticket: updatedTicket, cliente: updatedTicket.cliente, evento: updatedTicket.evento });
}
