import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentAPI } from "@/lib/mercadopago";

// POST /api/mercadopago/webhook — recibe notificaciones IPN de Mercado Pago
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Solo nos interesa el tipo "payment"
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    const paymentId = String(body.data.id);

    // Buscar el pedido asociado: necesitamos el access token de la sucursal
    // MP envía external_reference = pedidoId
    // Primero consultamos el pago para obtener external_reference
    // Para eso necesitamos un access token — buscamos pedidos con mpPreferenceId
    // Approach: buscar todos los pedidos delivery recientes que tengan mpPreferenceId
    // y consultar MP con el token de su sucursal

    // Obtener sucursales con MP configurado
    const sucursales = await prisma.sucursal.findMany({
      where: { mpAccessToken: { not: null } },
      select: { id: true, mpAccessToken: true },
    });

    let paymentData: { status: string; external_reference: string } | null = null;
    let matchedToken: string | null = null;

    for (const suc of sucursales) {
      if (!suc.mpAccessToken) continue;
      try {
        const paymentAPI = getPaymentAPI(suc.mpAccessToken);
        const payment = await paymentAPI.get({ id: paymentId });
        if (payment?.external_reference) {
          paymentData = {
            status: payment.status ?? "unknown",
            external_reference: payment.external_reference,
          };
          matchedToken = suc.mpAccessToken;
          break;
        }
      } catch {
        // Token incorrecto para este pago, probar siguiente
        continue;
      }
    }

    if (!paymentData) {
      console.warn("[MP Webhook] No se pudo encontrar pago:", paymentId);
      return NextResponse.json({ ok: true });
    }

    const pedidoId = Number(paymentData.external_reference);
    if (!pedidoId || isNaN(pedidoId)) {
      return NextResponse.json({ ok: true });
    }

    // Actualizar estado de pago en el pedido
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        mpPaymentId: paymentId,
        mpStatus: paymentData.status,
      },
    });

    // Si el pago fue aprobado, notificar por socket
    if (paymentData.status === "approved") {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { usuario: { select: { sucursalId: true } } },
      });
      if (pedido?.usuario?.sucursalId) {
        const globalForSocket = global as unknown as { io?: import("socket.io").Server };
        try {
          globalForSocket.io
            ?.to(`sucursal_${pedido.usuario.sucursalId}_kds`)
            .emit("pago:mp", { pedidoId, status: "approved" });
        } catch { /* no bloquear */ }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/mercadopago/webhook]", error);
    return NextResponse.json({ ok: true }); // Siempre responder 200 a MP
  }
}
