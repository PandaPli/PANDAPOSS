import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryService } from "@/server/services/delivery.service";
import type { EstadoPedido, Rol } from "@/types";

const allowedStatuses: EstadoPedido[] = ["PENDIENTE", "EN_PROCESO", "LISTO", "ENTREGADO", "CANCELADO"];

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const userId = (session.user as { id: number }).id;

  try {
    const body = await req.json();
    const estado = body.estado as EstadoPedido;

    if (!allowedStatuses.includes(estado)) {
      return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
    }

    const result = await DeliveryService.updateStatus({
      pedidoId: Number(body.pedidoId),
      estado,
      rol,
      sucursalId,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PATCH /api/delivery/status]", error);
    const message = error instanceof Error ? error.message : "No fue posible actualizar el estado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

