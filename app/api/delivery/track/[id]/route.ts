import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedidoId = parseInt(id);

    if (isNaN(pedidoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const deliveryOrder = await prisma.pedidoDelivery.findUnique({
      where: { pedidoId },
      include: {
        repartidor: {
          include: {
            usuario: true,
          }
        },
        eventos: {
          orderBy: { creadoEn: 'desc' },
          take: 1
        }
      }
    });

    if (!deliveryOrder) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      status: deliveryOrder.estado,
      driver: deliveryOrder.repartidor?.usuario.nombre || null,
      eta: deliveryOrder.tiempoEstimado,
      lat: deliveryOrder.repartidor?.lat || null,
      lng: deliveryOrder.repartidor?.lng || null,
      lastEvent: deliveryOrder.eventos[0] || null
    });
  } catch (error) {
    console.error("Error fetching delivery tracking:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
