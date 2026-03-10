import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { estado, meseroLlamado, repartidorId, direccionEntrega, telefonoCliente } = body;
  const { id: idStr } = await params;
  const id = Number(idStr);

  const data: Prisma.PedidoUncheckedUpdateInput = {};
  if (estado !== undefined) data.estado = estado;
  if (meseroLlamado !== undefined) data.meseroLlamado = meseroLlamado;
  if (repartidorId !== undefined) data.repartidorId = repartidorId || null;
  if (direccionEntrega !== undefined) data.direccionEntrega = direccionEntrega || null;
  if (telefonoCliente !== undefined) data.telefonoCliente = telefonoCliente || null;
  // Al entregar, limpiar llamada al mesero
  if (estado === "ENTREGADO") data.meseroLlamado = false;

  const pedido = await prisma.pedido.update({
    where: { id },
    data,
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
