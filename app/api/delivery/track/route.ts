import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/server/services/tracking.service";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 30 consultas por IP por minuto (polling frecuente pero acotado)
    const ip = getClientIp(req);
    const rl = rateLimit(`delivery:track:${ip}`, { max: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

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

