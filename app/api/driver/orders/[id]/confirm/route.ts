import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// POST /api/driver/orders/[id]/confirm
// Rider entrega el código que recibió del cliente para confirmar la entrega
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "DELIVERY") return NextResponse.json({ error: "Solo para repartidores" }, { status: 403 });

  const userId = (session.user as { id: number }).id;
  const { id } = await params;
  const pedidoId = Number(id);
  const body = await req.json();
  const { codigo } = body as { codigo: string };

  if (!codigo?.trim()) {
    return NextResponse.json({ error: "Debes ingresar el código de entrega" }, { status: 400 });
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { delivery: { select: { codigoEntrega: true } } },
  });

  if (!pedido || pedido.tipo !== "DELIVERY") {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (pedido.repartidorId !== userId) {
    return NextResponse.json({ error: "No es tu pedido" }, { status: 403 });
  }

  if (!pedido.delivery?.codigoEntrega) {
    return NextResponse.json({ error: "Este pedido no tiene código de entrega asignado" }, { status: 400 });
  }

  if (pedido.delivery.codigoEntrega.toUpperCase() !== codigo.trim().toUpperCase()) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 422 });
  }

  // Código correcto — marcar como ENTREGADO
  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: "ENTREGADO" },
    }),
    prisma.pedidoDelivery.updateMany({
      where: { pedidoId },
      data: { estado: "ENTREGADO" },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Entrega confirmada" });
}
