import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PedidoService } from "@/server/services/pedido.service";

interface LlevarItem {
  productoId: number;
  cantidad: number;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id?: number })?.id;
  if (!userId) return NextResponse.json({ error: "Sin usuario" }, { status: 401 });

  const body = await req.json();
  const { items, nombreCliente, horaRetiro, clienteId } = body as {
    items: LlevarItem[];
    nombreCliente: string;
    horaRetiro?: string;
    clienteId?: number;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Se requiere al menos un producto" }, { status: 400 });
  }
  if (!nombreCliente?.trim()) {
    return NextResponse.json({ error: "Se requiere el nombre del cliente" }, { status: 400 });
  }

  const obs = [
    "🥡 PARA LLEVAR",
    `👤 ${nombreCliente.trim()}`,
    horaRetiro ? `🕐 ${horaRetiro}` : null,
    clienteId ? `🆔 ${clienteId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  try {
    const pedido = await PedidoService.create({
      usuarioId: userId,
      tipo: "MOSTRADOR",
      items: items.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
      })),
      observacion: obs,
    });

    return NextResponse.json({ id: pedido.id, numero: pedido.numero, clienteId: clienteId ?? null }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
