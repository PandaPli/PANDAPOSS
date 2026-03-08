import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const estado = searchParams.get("estado");

  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(tipo ? { tipo: tipo as never } : {}),
      ...(estado ? { estado: estado as never } : { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } }),
    },
    include: {
      mesa: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true } },
          combo: { select: { nombre: true } },
        },
      },
    },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { mesaId, cajaId, tipo, items, observacion } = body;

  const userId = (session.user as { id: number }).id;

  const pedido = await prisma.pedido.create({
    data: {
      mesaId: mesaId || null,
      cajaId: cajaId || null,
      usuarioId: userId,
      tipo: tipo || "COCINA",
      estado: "PENDIENTE",
      observacion,
      detalles: {
        create: items.map((item: { productoId?: number; comboId?: number; cantidad: number; observacion?: string }) => ({
          productoId: item.productoId || null,
          comboId: item.comboId || null,
          cantidad: item.cantidad,
          observacion: item.observacion || null,
        })),
      },
    },
    include: { detalles: true },
  });

  // Marcar mesa como ocupada
  if (mesaId) {
    await prisma.mesa.update({ where: { id: mesaId }, data: { estado: "OCUPADA" } });
  }

  return NextResponse.json(pedido, { status: 201 });
}
