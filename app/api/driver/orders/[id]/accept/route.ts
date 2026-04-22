import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// POST /api/driver/orders/[id]/accept — rider toma un pedido sin asignar
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "DELIVERY") return NextResponse.json({ error: "Solo para repartidores" }, { status: 403 });

  const userId = (session.user as { id: number }).id;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const { id } = await params;
  const pedidoId = Number(id);

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { usuario: { select: { sucursalId: true } } },
  });

  if (!pedido || pedido.tipo !== "DELIVERY") {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Verificar que pertenece a la sucursal del rider
  if (sucursalId && pedido.usuario.sucursalId !== sucursalId) {
    return NextResponse.json({ error: "Pedido de otra sucursal" }, { status: 403 });
  }

  // Solo tomar si está sin asignar
  if (pedido.repartidorId !== null) {
    return NextResponse.json({ error: "Este pedido ya tiene repartidor asignado" }, { status: 409 });
  }

  // Generar código de entrega numérico de 4 dígitos
  const codigoEntrega = String(Math.floor(1000 + Math.random() * 9000));

  // Buscar el id del Repartidor record (puede no existir aún)
  const repartidorRecord = await prisma.repartidor.upsert({
    where: { usuarioId: userId },
    update: { estado: "EN_RUTA" },
    create: { usuarioId: userId, vehiculo: "No especificado", estado: "EN_RUTA" },
  });

  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedidoId },
      data: { repartidorId: userId },
    }),
    prisma.pedidoDelivery.updateMany({
      where: { pedidoId },
      data: {
        repartidorId: repartidorRecord.id,
        codigoEntrega,
        estado: "CONFIRMADO",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, codigoEntrega });
}
