import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/pedidos/detalles/[detalleId]
 * Actualiza un ítem individual del pedido (cancelado, cantidad, observacion).
 * El KDS se actualizará en el próximo polling (cada 30s).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ detalleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { detalleId } = await params;
  const id = Number(detalleId);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json() as {
    cancelado?: boolean;
    cantidad?: number;
    observacion?: string | null;
  };

  // Validaciones básicas
  if (body.cantidad !== undefined && body.cantidad < 1) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.cancelado !== undefined) data.cancelado = body.cancelado;
  if (body.cantidad !== undefined)  data.cantidad   = body.cantidad;
  if (body.observacion !== undefined) data.observacion = body.observacion;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const detalle = await prisma.detallePedido.update({
    where: { id },
    data,
    include: {
      producto: { select: { nombre: true } },
      combo:    { select: { nombre: true } },
    },
  });

  return NextResponse.json(detalle);
}
