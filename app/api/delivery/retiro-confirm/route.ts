import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VentaService } from "@/server/services/venta.service";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

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
    // P3: Rate limiting — 10 confirmaciones por IP por minuto
    const ip = getClientIp(req);
    const rl = rateLimit(`public:retiro-confirm:${ip}`, { max: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

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

    // Obtener usuarioId del pedido para la venta
    const pedidoFull = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { usuarioId: true },
    });

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

    // Registrar venta para acumular puntos (awaited para serverless)
    if (pedidoFull?.usuarioId) {
      await VentaService.registrarVentaOrdenEntregada(pedidoId, pedidoFull.usuarioId);
    }

    return NextResponse.json({ ok: true, estado: "ENTREGADO" });
  } catch (err) {
    console.error("[POST /api/delivery/retiro-confirm]", err);
    return NextResponse.json({ error: "Error al confirmar retiro" }, { status: 500 });
  }
}
