import { NextRequest, NextResponse } from "next/server";
import { DeliveryService } from "@/server/services/delivery.service";
import type { DeliveryCustomerInput, MetodoPago } from "@/types";

interface DeliveryItemInput {
  productoId?: number | null;
  nombre?: string;
  precio?: number;
  cantidad: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await DeliveryService.createPublicOrder({
      sucursalId: Number(body.sucursalId),
      items: Array.isArray(body.items) ? (body.items as DeliveryItemInput[]) : [],
      cliente: (body.cliente ?? {}) as DeliveryCustomerInput,
      metodoPago: body.metodoPago as MetodoPago,
      cargoEnvio: Number(body.cargoEnvio ?? 0),
      zonaDelivery: typeof body.zonaDelivery === "string" ? body.zonaDelivery : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/delivery/order]", error);
    const message = error instanceof Error ? error.message : "Error interno al crear el pedido delivery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

