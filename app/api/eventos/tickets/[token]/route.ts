import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    jwt.verify(token, process.env.NEXTAUTH_SECRET!);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const ticket = await prisma.ticketEvento.findUnique({
    where: { token },
    include: {
      evento: true,
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

  const qrDataUrl = await QRCode.toDataURL(token);

  return NextResponse.json({ ...ticket, qrDataUrl });
}
