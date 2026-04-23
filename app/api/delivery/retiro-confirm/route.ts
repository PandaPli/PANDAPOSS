import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/delivery/retiro-confirm
 * Endpoint público (sin auth) que permite al cliente confirmar
 * que ya retiró su pedido en local.
 *
 * Validaciones:
 * - El pedido existe y es de tipo DELIVERY
 * - Es un pedido de retiro (zonaDelivery contiene "retiro")
 * - El estado actual es "LISTO" (listo para retirar → puede pasar a ENTREGADO)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { pedidoId?: number };
    const pedidoId = Number(body.pedidoId);

    if (!pedidoId) {
      return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { delivery: { select: { zonaDelivery: true } } },
    });

    if (!pedido || pedido.tipo !== "DELIVERY") {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Solo pedidos de retiro pueden auto-confirmarse
    if (!/retiro/i.test(pedido.delivery?.zonaDelivery ?? "")) {
      return NextResponse.json({ error: "Solo aplica a pedidos de retiro en local" }, { status: 400 });
    }

    // Solo desde estado LISTO se puede pasar a ENTREGADO
    if (pedido.estado !== "LISTO") {
      if (pedido.estado === "ENTREGADO") {
        return NextResponse.json({ ok: true, estado: "ENTREGADO" });
      }
      return NextResponse.json(
        { error: "El pedido aún no está listo para retirar" },
        { status: 422 },
      );
    }

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

    return NextResponse.json({ ok: true, estado: "ENTREGADO" });
  } catch (err) {
    console.error("[POST /api/delivery/retiro-confirm]", err);
    return NextResponse.json({ error: "Error al confirmar retiro" }, { status: 500 });
  }
}
