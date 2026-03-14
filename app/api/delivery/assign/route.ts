import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryService } from "@/server/services/delivery.service";
import type { Rol } from "@/types";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    return NextResponse.json({ error: "No tienes permisos para asignar repartidores." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await DeliveryService.assignDriver({
      pedidoId: Number(body.pedidoId),
      repartidorId: body.repartidorId ? Number(body.repartidorId) : null,
      rol,
      sucursalId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PATCH /api/delivery/assign]", error);
    const message = error instanceof Error ? error.message : "No fue posible asignar repartidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

