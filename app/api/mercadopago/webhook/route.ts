import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentAPI } from "@/lib/mercadopago";
import { createHmac } from "crypto";

/**
 * Verifica la firma HMAC-SHA256 del webhook de Mercado Pago.
 * MP envía el header `x-signature` con formato: `ts=<ts>,v1=<hash>`
 * y `x-request-id`. La firma se calcula sobre `id:<dataId>;request-id:<requestId>;ts:<ts>;`
 * usando el webhook secret como clave HMAC.
 * Ref: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function verifyMPSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Si no hay secret configurado, aceptar (permite funcionar sin firma en dev)
    // En producción se debe configurar MP_WEBHOOK_SECRET
    console.warn("[MP Webhook] MP_WEBHOOK_SECRET no configurado — firma no verificada");
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  // Parsear ts y v1 del header
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  // Construir el manifest y calcular HMAC
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === hash;
}

// POST /api/mercadopago/webhook — recibe notificaciones IPN de Mercado Pago
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Solo nos interesa el tipo "payment"
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    const paymentId = String(body.data.id);

    // Verificar firma HMAC del webhook
    if (!verifyMPSignature(req, paymentId)) {
      console.warn("[MP Webhook] Firma inválida — rechazado", { paymentId });
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

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

    // Leer estado actual del pedido para decidir como actualizarlo
    const pedidoActual = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        estado: true,
        mpStatus: true,
        usuario: { select: { sucursalId: true } },
      },
    });

    if (!pedidoActual) {
      return NextResponse.json({ ok: true });
    }

    // Estados terminales de MP que indican que el cobro fracaso.
    // Si el pedido estaba pending_payment y MP devuelve uno de estos, lo
    // cancelamos automaticamente para que NO entre al KDS ni a Ventas.
    const statusesFallidos = ["rejected", "cancelled", "refunded", "charged_back"];
    const pagoFallido = statusesFallidos.includes(paymentData.status);
    const pagoAprobado = paymentData.status === "approved";

    // Si el pedido ya no esta en estado activo (p.ej. cancelado manualmente),
    // solo actualizamos el mpStatus sin tocar estado.
    const estadoActivo = ["PENDIENTE", "EN_PROCESO", "LISTO"].includes(pedidoActual.estado);

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        mpPaymentId: paymentId,
        mpStatus: paymentData.status,
        // Si el cobro fracaso y el pedido aun esta activo, lo cancelamos.
        // Esto lo saca del KDS (que filtra por estado IN [PENDIENTE,EN_PROCESO,LISTO])
        // y evita que la cocina prepare algo que nadie pago.
        ...(pagoFallido && estadoActivo ? { estado: "CANCELADO" as const } : {}),
      },
    });

    // Evento de auditoria si cancelamos por pago fallido
    if (pagoFallido && estadoActivo) {
      await prisma.eventoPedido.create({
        data: {
          pedidoId,
          usuarioId: null,
          tipo: "ESTADO",
          descripcion: `${pedidoActual.estado} → CANCELADO (pago MP ${paymentData.status})`,
        },
      }).catch(() => { /* no bloquear */ });
    }

    // Si el pago fue aprobado, notificar por socket
    if (pagoAprobado && pedidoActual.usuario?.sucursalId) {
      const globalForSocket = global as unknown as { io?: import("socket.io").Server };
      try {
        globalForSocket.io
          ?.to(`sucursal_${pedidoActual.usuario.sucursalId}_kds`)
          .emit("pago:mp", { pedidoId, status: "approved" });
      } catch { /* no bloquear */ }
    }

    // Si el pago fallo, notificar por socket para que el kiosko actualice
    // su pantalla (polling tambien lo detectaria, pero esto es instantaneo)
    if (pagoFallido && pedidoActual.usuario?.sucursalId) {
      const globalForSocket = global as unknown as { io?: import("socket.io").Server };
      try {
        globalForSocket.io
          ?.to(`sucursal_${pedidoActual.usuario.sucursalId}_kds`)
          .emit("pago:mp", { pedidoId, status: paymentData.status });
      } catch { /* no bloquear */ }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/mercadopago/webhook]", error);
    return NextResponse.json({ ok: true }); // Siempre responder 200 a MP
  }
}
