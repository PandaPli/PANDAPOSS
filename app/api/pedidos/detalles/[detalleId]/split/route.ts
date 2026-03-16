import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/pedidos/detalles/[detalleId]/split
 *
 * Divide un DetallePedido en múltiples registros — uno por grupo de pago.
 * El registro original se actualiza con el primer split; los demás se crean nuevos.
 *
 * Body:
 *   splits: { grupo: string; cantidad: number }[]
 *
 * Response:
 *   splits: { grupo: string; cantidad: number; detalleId: number }[]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ detalleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { detalleId } = await params;
  const originalId = Number(detalleId);
  if (isNaN(originalId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json() as {
    splits: { grupo: string; cantidad: number }[];
  };

  const { splits } = body;

  if (!splits || splits.length < 2) {
    return NextResponse.json({ error: "Se necesitan al menos 2 grupos para dividir" }, { status: 400 });
  }

  if (splits.some((s) => s.cantidad < 1)) {
    return NextResponse.json({ error: "Cada grupo debe tener al menos 1 unidad" }, { status: 400 });
  }

  // Leer el detalle original
  const original = await prisma.detallePedido.findUnique({
    where: { id: originalId },
    select: {
      id: true,
      pedidoId: true,
      productoId: true,
      comboId: true,
      precio: true,
      descuento: true,
      observacion: true,
      cantidad: true,
    },
  });

  if (!original) {
    return NextResponse.json({ error: "Detalle no encontrado" }, { status: 404 });
  }

  // Validar que la suma de splits == cantidad original
  const totalSplit = splits.reduce((a, s) => a + s.cantidad, 0);
  if (totalSplit !== original.cantidad) {
    return NextResponse.json({
      error: `La suma de los splits (${totalSplit}) debe ser igual a la cantidad original (${original.cantidad})`,
    }, { status: 400 });
  }

  const [primerSplit, ...restSplits] = splits;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Actualizar el registro original con el primer split
    await tx.detallePedido.update({
      where: { id: originalId },
      data: {
        cantidad: primerSplit.cantidad,
        grupo: primerSplit.grupo,
      },
    });

    // 2. Crear nuevos registros para los splits restantes
    const nuevos = await Promise.all(
      restSplits.map((s) =>
        tx.detallePedido.create({
          data: {
            pedidoId: original.pedidoId,
            productoId: original.productoId,
            comboId: original.comboId,
            precio: original.precio,
            descuento: original.descuento ?? 0,
            observacion: original.observacion,
            cantidad: s.cantidad,
            grupo: s.grupo,
            pagado: false,
            cancelado: false,
          },
          select: { id: true },
        })
      )
    );

    return [
      { grupo: primerSplit.grupo, cantidad: primerSplit.cantidad, detalleId: originalId },
      ...restSplits.map((s, i) => ({
        grupo: s.grupo,
        cantidad: s.cantidad,
        detalleId: nuevos[i].id,
      })),
    ];
  });

  return NextResponse.json({ splits: result });
}
