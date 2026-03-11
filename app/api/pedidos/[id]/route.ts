import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PedidoService } from "@/server/services/pedido.service";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  
  const pedido = await prisma.pedido.findUnique({
    where: { id: Number(idStr) },
    include: {
      detalles: {
        include: {
          producto: true,
          combo: true,
        }
      }
    }
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(pedido);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const body = await req.json();

  const pedido = await PedidoService.update(Number(idStr), body);
  return NextResponse.json(pedido);
}
