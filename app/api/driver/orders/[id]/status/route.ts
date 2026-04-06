import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

const VALID_ESTADOS = ["EN_PROCESO", "LISTO", "ENTREGADO"] as const;

// PATCH /api/driver/orders/[id]/status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "DELIVERY") return NextResponse.json({ error: "Solo para repartidores" }, { status: 403 });

  const userId = (session.user as { id: number }).id;
  const pedidoId = Number(params.id);
  const body = await req.json();
  const { estado } = body as { estado: string };

  if (!VALID_ESTADOS.includes(estado as typeof VALID_ESTADOS[number])) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, tipo: true, repartidorId: true, estado: true },
  });

  if (!pedido || pedido.tipo !== "DELIVERY") {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (pedido.repartidorId !== userId) {
    return NextResponse.json({ error: "No es tu pedido" }, { status: 403 });
  }

  if (pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO") {
    return NextResponse.json({ error: "El pedido ya está finalizado" }, { status: 400 });
  }

  const updated = await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: estado as "EN_PROCESO" | "LISTO" | "ENTREGADO" },
  });

  // Actualizar estado en PedidoDelivery también
  const estadoDeliveryMap: Record<string, string> = {
    EN_PROCESO: "EN_CAMINO",
    LISTO: "LISTO",
    ENTREGADO: "ENTREGADO",
  };

  await prisma.pedidoDelivery.updateMany({
    where: { pedidoId },
    data: { estado: estadoDeliveryMap[estado] as never },
  });

  return NextResponse.json({ id: updated.id, estado: updated.estado });
}
