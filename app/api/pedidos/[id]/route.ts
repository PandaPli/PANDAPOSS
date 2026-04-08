import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PedidoService } from "@/server/services/pedido.service";
import { NotificationService } from "@/server/services/notification.service";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id: Number(idStr) },
    include: {
      detalles: {
        include: {
          producto: true,
          combo: true,
        }
      }
    }
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(pedido);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const pedidoId = Number(idStr);
  const body = await req.json();

  // Leer datos de notificación antes de actualizar
  let sucursalIdParaNotif: number | null = null;
  let telefonoParaNotif: string | null = null;
  let esWhatsApp = false;

  if (body.estado === "EN_PROCESO") {
    const pedidoActual = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        telefonoCliente: true,
        observacion: true,
        usuario: { select: { sucursalId: true } },
        delivery: { select: { zonaDelivery: true } },
      },
    });

    if (pedidoActual?.telefonoCliente) {
      const esDeliveryWsp = pedidoActual.delivery?.zonaDelivery === "WhatsApp";
      const esMostradorWsp = pedidoActual.observacion?.includes("[WSP]") ?? false;

      if (esDeliveryWsp || esMostradorWsp) {
        esWhatsApp = true;
        telefonoParaNotif = pedidoActual.telefonoCliente;
        sucursalIdParaNotif = pedidoActual.usuario?.sucursalId ?? null;
      }
    }
  }

  const pedido = await PedidoService.update(pedidoId, body);

  // Notificar al cliente por WhatsApp si corresponde
  if (esWhatsApp && telefonoParaNotif && sucursalIdParaNotif) {
    await NotificationService.notifyDeliveryStatusChange({
      pedidoId,
      status: "EN_PROCESO",
      telefono: telefonoParaNotif,
      sucursalId: sucursalIdParaNotif,
      esWhatsApp: true,
    });
  }

  // Notificar KDS en tiempo real
  const globalForSocket = global as unknown as { io?: import("socket.io").Server };
  try {
    // Obtener sucursalId del pedido actualizado
    const pedidoInfo = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { usuario: { select: { sucursalId: true } } },
    });
    const sid = pedidoInfo?.usuario?.sucursalId ?? sucursalIdParaNotif;
    if (sid) {
      globalForSocket.io?.to(`sucursal_${sid}_kds`).emit("pedido:update", { id: pedidoId, estado: pedido.estado });
    }
  } catch { /* no bloquear */ }

  return NextResponse.json(pedido);
}
