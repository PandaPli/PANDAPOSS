import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/server/services/tracking.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = Number(searchParams.get("id"));

    if (!pedidoId) {
      return NextResponse.json({ error: "Debes indicar un pedido valido." }, { status: 400 });
    }

    const data = await TrackingService.getPublicTracking(pedidoId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/delivery/track]", error);
    const message = error instanceof Error ? error.message : "No fue posible obtener el seguimiento.";
    const status = message.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

