import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/mercadopago/status?pedidoId=123
// Consulta el estado de pago MP de un pedido
export async function GET(req: NextRequest) {
  const pedidoId = Number(req.nextUrl.searchParams.get("pedidoId"));
  if (!pedidoId || isNaN(pedidoId)) {
    return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { mpStatus: true, mpPaymentId: true },
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    status: pedido.mpStatus ?? "pending",
    paymentId: pedido.mpPaymentId,
  });
}
