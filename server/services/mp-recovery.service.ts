import { prisma } from "@/lib/db";
import { getPaymentAPI } from "@/lib/mercadopago";
import { subMinutes, subHours } from "date-fns";

export interface RecoveryResult {
  pedidoId: number;
  action:
    | "recovered_approved"
    | "cancelled_rejected"
    | "cancelled_abandoned"
    | "still_pending"
    | "skipped_race";
}

/**
 * Busca pedidos con mpStatus="pending_payment" atascados (>5 min, <24h)
 * y consulta la API de MP para resolver su estado real.
 *
 * Idempotente: usa un update condicional (WHERE mpStatus = 'pending_payment')
 * para evitar race conditions con el webhook o con otro recovery corriendo
 * en paralelo.
 *
 * Retorna la cantidad de pedidos recuperados y los detalles de cada acción.
 */
export async function recoverPendingPayments(): Promise<{
  recovered: number;
  checked: number;
  details: RecoveryResult[];
}> {
  const ahora = new Date();
  const hace5min = subMinutes(ahora, 5);
  const hace24h = subHours(ahora, 24);
  const hace2h = subHours(ahora, 2);

  // Buscar pedidos atascados
  const atascados = await prisma.pedido.findMany({
    where: {
      mpStatus: "pending_payment",
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      creadoEn: { gte: hace24h, lte: hace5min },
      mpPreferenceId: { not: null },
    },
    select: {
      id: true,
      estado: true,
      creadoEn: true,
      usuario: { select: { sucursalId: true } },
    },
    take: 20,
  });

  if (atascados.length === 0) {
    return { recovered: 0, checked: 0, details: [] };
  }

  // Obtener sucursales con MP configurado
  const sucursales = await prisma.sucursal.findMany({
    where: { mpAccessToken: { not: null } },
    select: { id: true, mpAccessToken: true },
  });

  const details: RecoveryResult[] = [];
  let recovered = 0;

  for (const pedido of atascados) {
    let paymentStatus: string | null = null;
    let paymentId: string | null = null;

    // Consultar MP con cada token hasta encontrar el pago
    for (const suc of sucursales) {
      if (!suc.mpAccessToken) continue;
      try {
        const paymentAPI = getPaymentAPI(suc.mpAccessToken);
        const searchResult = await paymentAPI.search({
          options: {
            criteria: "desc",
            sort: "date_created",
            external_reference: String(pedido.id),
          },
        });
        const payments = searchResult?.results;
        if (payments && payments.length > 0) {
          paymentStatus = payments[0].status ?? null;
          paymentId = payments[0].id ? String(payments[0].id) : null;
          break;
        }
      } catch {
        continue;
      }
    }

    const statusesFallidos = ["rejected", "cancelled", "refunded", "charged_back"];

    if (paymentStatus === "approved") {
      // Update condicional: solo si sigue en pending_payment (evita race con webhook)
      const updated = await prisma.pedido.updateMany({
        where: { id: pedido.id, mpStatus: "pending_payment" },
        data: { mpStatus: "approved", mpPaymentId: paymentId },
      });

      if (updated.count === 0) {
        // El webhook u otra instancia ya lo actualizó — no duplicar
        details.push({ pedidoId: pedido.id, action: "skipped_race" });
        continue;
      }

      await prisma.eventoPedido.create({
        data: {
          pedidoId: pedido.id,
          usuarioId: null,
          tipo: "ESTADO",
          descripcion: "Pago MP recuperado (approved) — webhook no había llegado",
        },
      }).catch(() => {});

      // Notificar KDS por socket
      emitToKds(pedido.usuario?.sucursalId, pedido.id, "approved");

      recovered++;
      console.log(`[MP Recovery] Pedido ${pedido.id} recuperado — pago aprobado (paymentId: ${paymentId})`);
      details.push({ pedidoId: pedido.id, action: "recovered_approved" });
    } else if (paymentStatus && statusesFallidos.includes(paymentStatus)) {
      const updated = await prisma.pedido.updateMany({
        where: { id: pedido.id, mpStatus: "pending_payment" },
        data: { estado: "CANCELADO", mpStatus: paymentStatus, mpPaymentId: paymentId },
      });

      if (updated.count === 0) {
        details.push({ pedidoId: pedido.id, action: "skipped_race" });
        continue;
      }

      await prisma.eventoPedido.create({
        data: {
          pedidoId: pedido.id,
          usuarioId: null,
          tipo: "ESTADO",
          descripcion: `${pedido.estado} → CANCELADO (pago MP ${paymentStatus} — recuperado)`,
        },
      }).catch(() => {});

      console.log(`[MP Recovery] Pedido ${pedido.id} cancelado — pago ${paymentStatus}`);
      details.push({ pedidoId: pedido.id, action: "cancelled_rejected" });
    } else if (!paymentStatus && pedido.creadoEn < hace2h) {
      // Sin pago en MP y +2h → abandonado
      const updated = await prisma.pedido.updateMany({
        where: { id: pedido.id, mpStatus: "pending_payment" },
        data: { estado: "CANCELADO", mpStatus: "abandoned" },
      });

      if (updated.count === 0) {
        details.push({ pedidoId: pedido.id, action: "skipped_race" });
        continue;
      }

      await prisma.eventoPedido.create({
        data: {
          pedidoId: pedido.id,
          usuarioId: null,
          tipo: "ESTADO",
          descripcion: `${pedido.estado} → CANCELADO (pago MP abandonado — +2h sin pago)`,
        },
      }).catch(() => {});

      console.log(`[MP Recovery] Pedido ${pedido.id} cancelado — abandonado (+2h sin pago)`);
      details.push({ pedidoId: pedido.id, action: "cancelled_abandoned" });
    } else {
      details.push({ pedidoId: pedido.id, action: "still_pending" });
    }
  }

  if (recovered > 0) {
    console.log(`[MP Recovery] ${recovered} pedido(s) recuperados de ${atascados.length} revisados`);
  }

  return { recovered, checked: atascados.length, details };
}

/** Emite pago:mp al KDS de la sucursal via Socket.IO (si hay server corriendo) */
function emitToKds(sucursalId: number | undefined | null, pedidoId: number, status: string) {
  if (!sucursalId) return;
  const globalForSocket = global as unknown as { io?: import("socket.io").Server };
  try {
    globalForSocket.io
      ?.to(`sucursal_${sucursalId}_kds`)
      .emit("pago:mp", { pedidoId, status });
  } catch { /* no bloquear */ }
}
