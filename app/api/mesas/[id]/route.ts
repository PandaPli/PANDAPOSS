import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/mesas/[id] → lista de ítems activos de la mesa (para preview de borrado)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const mesaId = Number(id);

  const pedidos = await prisma.pedido.findMany({
    where: {
      mesaId,
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
    },
    include: {
      detalles: {
        where: { cancelado: false },
        include: {
          producto: { select: { nombre: true } },
          combo: { select: { nombre: true } },
        },
      },
    },
  });

  const items = pedidos.flatMap((p) =>
    p.detalles.map((d) => ({
      nombre: d.producto?.nombre ?? d.combo?.nombre ?? "Producto",
      cantidad: d.cantidad,
    }))
  );

  return NextResponse.json({ items });
}

// DELETE /api/mesas/[id] → cancela todos los pedidos activos y libera la mesa
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const mesaId = Number(id);

  await prisma.pedido.updateMany({
    where: {
      mesaId,
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
    },
    data: { estado: "CANCELADO" },
  });

  await prisma.mesa.update({
    where: { id: mesaId },
    data: { estado: "LIBRE" },
  });

  return NextResponse.json({ ok: true });
}
