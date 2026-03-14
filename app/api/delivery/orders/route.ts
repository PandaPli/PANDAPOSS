import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryService } from "@/server/services/delivery.service";
import type { Rol } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const rol = (session.user as { rol: Rol }).rol;
    const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
    const userId = (session.user as { id: number }).id;
    const { searchParams } = new URL(req.url);

    const data = await DeliveryService.listOrders({
      rol,
      sucursalId,
      userId,
      includeHistory: searchParams.get("history") === "true",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/delivery/orders]", error);
    const message = error instanceof Error ? error.message : "No fue posible listar pedidos delivery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

