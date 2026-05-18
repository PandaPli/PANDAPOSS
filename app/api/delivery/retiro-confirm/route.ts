import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VentaService } from "@/server/services/venta.service";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * POST /api/delivery/retiro-confirm
 * Endpoint público que permite al cliente confirmar que ya retiró su pedido.
 *
 * Requiere codigoEntrega (4 dígitos generado al crear el pedido de retiro)
 * para evitar que terceros confirmen retiros ajenos por fuerza bruta de pedidoId.
 *
 * Validaciones:
 * - Rate limit: 10 intentos por IP por minuto
 * - El pedido existe y es de tipo DELIVERY/retiro
 * - codigoEntrega coincide con el registrado en el pedido
 * - El estado actual es "LISTO"
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 intentos por IP por minuto
    const ip = getClientIp(req);
    const rl = rateLimit(`retiro-confirm:${ip}`, { max: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json() as { pedidoId?: number; codigoEntrega?: string };
    const pedidoId = Number(body.pedidoId);
    const codigoIngresado = typeof body.codigoEntrega === "string" ? body.codigoEntrega.trim() : "";

    if (!pedidoId) {
      return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        delivery: { select: { zonaDelivery: true, codigoEntrega: true } },
      },
    });

    if (!pedido || pedido.tipo !== "DELIVERY") {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Solo pedidos de retiro pueden auto-confirmarse
    if (!/retiro/i.test(pedido.delivery?.zonaDelivery ?? "")) {
      return NextResponse.json({ error: "Solo aplica a pedidos de retiro en local" }, { status: 400 });
    }

    // Validar codigoEntrega para prevenir enumeración de pedidos ajenos
    const codigoEsperado = pedido.delivery?.codigoEntrega;
    if (codigoEsperado && codigoIngresado !== codigoEsperado) {
      return NextResponse.json({ error: "Código de retiro incorrecto" }, { status: 403 });
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

    // Registrar venta para acumular puntos (awaited para serverless)
    await VentaService.registrarVentaOrdenEntregada(pedidoId, pedido.usuarioId);

    return NextResponse.json({ ok: true, estado: "ENTREGADO" });
  } catch (err) {
    console.error("[POST /api/delivery/retiro-confirm]", err);
    return NextResponse.json({ error: "Error al confirmar retiro" }, { status: 500 });
  }
}
