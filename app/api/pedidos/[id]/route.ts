import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { estado } = await req.json();
  const { id: idStr } = await params;
  const id = Number(idStr);

  const pedido = await prisma.pedido.update({
    where: { id },
    data: { estado },
    include: { mesa: true },
  });

  // Si se entrega, liberar mesa si no hay más pedidos
  if (estado === "ENTREGADO" && pedido.mesaId) {
    const pendientes = await prisma.pedido.count({
      where: {
        mesaId: pedido.mesaId,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      },
    });
    if (pendientes === 0) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: "LIBRE" },
      });
    }
  }

  return NextResponse.json(pedido);
}
