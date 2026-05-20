import { NextRequest, NextResponse } from "next/server";
import { DeliveryService } from "@/server/services/delivery.service";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import type { DeliveryCustomerInput, MetodoPago } from "@/types";

interface DeliveryItemInput {
  productoId?: number | null;
  nombre?: string;
  precio?: number;
  cantidad: number;
}

export async function POST(req: NextRequest) {
  try {
    // P1: Rate limiting — 5 pedidos delivery por IP por minuto
    const ip = getClientIp(req);
    const rl = rateLimit(`public:delivery:${ip}`, { max: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await req.json();
    const result = await DeliveryService.createPublicOrder({
      sucursalId: Number(body.sucursalId),
      items: Array.isArray(body.items) ? (body.items as DeliveryItemInput[]) : [],
      cliente: (body.cliente ?? {}) as DeliveryCustomerInput,
      metodoPago: body.metodoPago as MetodoPago,
      cargoEnvio: Number(body.cargoEnvio ?? 0),
      zonaDelivery: typeof body.zonaDelivery === "string" ? body.zonaDelivery : undefined,
      cuponCodigo: typeof body.cuponCodigo === "string" ? body.cuponCodigo : null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/delivery/order]", error);
    const message = error instanceof Error ? error.message : "Error interno al crear el pedido delivery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

