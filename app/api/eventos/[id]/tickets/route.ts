import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const eventoId = parseInt(params.id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const tickets = await prisma.ticketEvento.findMany({
    where: { eventoId },
    include: {
      cliente: { select: { id: true, nombre: true, email: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventoId = parseInt(params.id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { clienteNombre, clienteEmail, clienteTelefono, clienteRut, metodoPago, referenciaPago } = body;

  if (!clienteNombre || !clienteEmail) {
    return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
  }

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { id: true, nombre: true, precio: true, capacidad: true, sucursalId: true, activo: true },
  });

  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (!evento.activo) return NextResponse.json({ error: "Evento no disponible" }, { status: 400 });

  if (evento.capacidad > 0) {
    const ticketsVendidos = await prisma.ticketEvento.count({
      where: { eventoId, estado: { in: ["PAGADO", "VALIDADO", "PENDIENTE_PAGO"] } },
    });
    if (ticketsVendidos >= evento.capacidad) {
      return NextResponse.json({ error: "Evento sin capacidad disponible" }, { status: 400 });
    }
  }

  // Find or create cliente
  let clienteId: number | null = null;
  try {
    let cliente = null;
    if (clienteRut) {
      cliente = await prisma.cliente.findFirst({
        where: { OR: [{ email: clienteEmail }, { rut: clienteRut }] },
      });
    } else {
      cliente = await prisma.cliente.findFirst({ where: { email: clienteEmail } });
    }

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombre: clienteNombre,
          email: clienteEmail,
          telefono: clienteTelefono ?? null,
          rut: clienteRut ?? null,
          sucursalId: evento.sucursalId,
        },
      });
    }
    clienteId = cliente.id;
  } catch {
    // If client creation fails (e.g. rut conflict), proceed without clienteId
    clienteId = null;
  }

  // Create a temporary ticket to get the ID, then generate token
  const ticket = await prisma.ticketEvento.create({
    data: {
      token: "TEMP",
      eventoId,
      clienteId,
      clienteNombre,
      clienteEmail,
      clienteTelefono: clienteTelefono ?? null,
      metodoPago: metodoPago ?? "EFECTIVO",
      estado: "PENDIENTE_PAGO",
      monto: evento.precio,
      referenciaPago: referenciaPago ?? null,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { ticketId: ticket.id, eventoId, sucursalId: evento.sucursalId },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "30d" }
  );

  // Update ticket with real token
  const updatedTicket = await prisma.ticketEvento.update({
    where: { id: ticket.id },
    data: { token },
  });

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(token);

  return NextResponse.json({ ...updatedTicket, qrDataUrl }, { status: 201 });
}
