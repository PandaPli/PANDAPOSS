import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/pedidos/detalles
 * Crea un nuevo DetallePedido (usado para dividir cantidades entre grupos de pago).
 * Ejemplo: 10 bebidas → 5 para Grupo A (actualiza existente) + 5 para Grupo B (crea nuevo aquí).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json() as {
    pedidoId: number;
    productoId?: number | null;
    comboId?: number | null;
    cantidad: number;
    observacion?: string | null;
    grupo?: string | null;
  };

  if (!body.pedidoId || !body.cantidad || body.cantidad < 1) {
    return NextResponse.json({ error: "pedidoId y cantidad son obligatorios" }, { status: 400 });
  }
  if (!body.productoId && !body.comboId) {
    return NextResponse.json({ error: "Debe especificar productoId o comboId" }, { status: 400 });
  }

  const detalle = await prisma.detallePedido.create({
    data: {
      pedidoId:    body.pedidoId,
      productoId:  body.productoId ?? null,
      comboId:     body.comboId ?? null,
      cantidad:    body.cantidad,
      observacion: body.observacion ?? null,
      grupo:       body.grupo ?? null,
    },
    include: {
      producto: { select: { nombre: true, precio: true, imagen: true, codigo: true } },
      combo:    { select: { nombre: true, precio: true, imagen: true, codigo: true } },
    },
  });

  return NextResponse.json(detalle, { status: 201 });
}
