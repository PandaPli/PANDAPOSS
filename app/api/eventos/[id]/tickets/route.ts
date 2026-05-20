import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const eventoId = parseInt(id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Verificar que el evento pertenece a la sucursal del usuario
  const rol = (session.user as { rol: string }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  if (rol !== "ADMIN_GENERAL" && sucursalId) {
    const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { sucursalId: true } });
    if (!evento || evento.sucursalId !== sucursalId) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }
  }

  const tickets = await prisma.ticketEvento.findMany({
    where: { eventoId },
    include: {
      cliente: { select: { id: true, nombre: true, email: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Rate limiting — 10 tickets por IP por minuto
  const ip = getClientIp(req);
  const rl = rateLimit(`tickets:create:${ip}`, { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { id } = await params;
  const eventoId = parseInt(id);
  if (isNaN(eventoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { clienteNombre, clienteEmail, clienteTelefono, clienteRut, metodoPago, referenciaPago } = body;

  if (!clienteNombre || !clienteEmail) {
    return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
  }

  // Sanitizar inputs
  const nombreClean = String(clienteNombre).trim().slice(0, 120);
  const emailClean = String(clienteEmail).trim().slice(0, 200).toLowerCase();

  // Usar transacción con SELECT FOR UPDATE para evitar race condition en capacidad
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock el evento para verificar capacidad atómicamente
      const [evento] = await tx.$queryRaw<Array<{
        id: number; nombre: string; precio: number; capacidad: number; sucursalId: number; activo: boolean;
      }>>(
        Prisma.sql`SELECT id, nombre, precio, capacidad, "sucursalId", activo FROM "Evento" WHERE id = ${eventoId} LIMIT 1 FOR UPDATE`
      );

      if (!evento) throw new Error("Evento no encontrado");
      if (!evento.activo) throw new Error("Evento no disponible");

      if (evento.capacidad > 0) {
        const ticketsVendidos = await tx.ticketEvento.count({
          where: { eventoId, estado: { in: ["PAGADO", "VALIDADO", "PENDIENTE_PAGO"] } },
        });
        if (ticketsVendidos >= evento.capacidad) {
          throw new Error("Evento sin capacidad disponible");
        }
      }

      // Find or create cliente
      let clienteId: number | null = null;
      try {
        let cliente = null;
        if (clienteRut) {
          cliente = await tx.cliente.findFirst({
            where: { OR: [{ email: emailClean }, { rut: clienteRut }] },
          });
        } else {
          cliente = await tx.cliente.findFirst({ where: { email: emailClean } });
        }

        if (!cliente) {
          cliente = await tx.cliente.create({
            data: {
              nombre: nombreClean,
              email: emailClean,
              telefono: clienteTelefono ? String(clienteTelefono).trim().slice(0, 20) : null,
              rut: clienteRut ? String(clienteRut).trim().slice(0, 15) : null,
              sucursalId: evento.sucursalId,
            },
          });
        }
        clienteId = cliente.id;
      } catch {
        clienteId = null;
      }

      const ticket = await tx.ticketEvento.create({
        data: {
          token: "TEMP",
          eventoId,
          clienteId,
          clienteNombre: nombreClean,
          clienteEmail: emailClean,
          clienteTelefono: clienteTelefono ? String(clienteTelefono).trim().slice(0, 20) : null,
          metodoPago: metodoPago ?? "EFECTIVO",
          estado: "PENDIENTE_PAGO",
          monto: evento.precio,
          referenciaPago: referenciaPago ? String(referenciaPago).trim().slice(0, 100) : null,
        },
      });

      const token = jwt.sign(
        { ticketId: ticket.id, eventoId, sucursalId: evento.sucursalId },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: "30d" }
      );

      const updatedTicket = await tx.ticketEvento.update({
        where: { id: ticket.id },
        data: { token },
      });

      return updatedTicket;
    });

    const qrDataUrl = await QRCode.toDataURL(result.token);
    return NextResponse.json({ ...result, qrDataUrl }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear ticket";
    const status = msg.includes("no encontrado") || msg.includes("no disponible") || msg.includes("sin capacidad") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
