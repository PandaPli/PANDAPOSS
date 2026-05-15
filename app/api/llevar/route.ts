import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PedidoService } from "@/server/services/pedido.service";
import { prisma } from "@/lib/db";

interface LlevarItem {
  productoId: number;
  cantidad: number;
  precio?: number;
  opciones?: { grupoId: number; grupoNombre: string; opcionId: number; opcionNombre: string; precio: number }[];
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id?: number })?.id;
  if (!userId) return NextResponse.json({ error: "Sin usuario" }, { status: 401 });

  const body = await req.json();
  const {
    items,
    nombreCliente,
    horaRetiro,
    clienteId,
    metodoPago,
    descuento,
    cuponId,
    cuponCodigo,
  } = body as {
    items: LlevarItem[];
    nombreCliente: string;
    horaRetiro?: string;
    clienteId?: number;
    metodoPago?: string;
    descuento?: number;
    cuponId?: number;
    cuponCodigo?: string;
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
    metodoPago ? `💳 ${metodoPago}` : null,
    descuento && descuento > 0 ? `🏷️ DESC:${descuento}` : null,
    cuponCodigo ? `🎟️ ${cuponCodigo}` : null,
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
        precio: i.precio ?? undefined,
        opciones: i.opciones ?? undefined,
      })),
      observacion: obs,
    });

    // Incrementar uso del cupón si aplica
    if (cuponId && cuponId > 0) {
      await prisma.cupon.update({
        where: { id: cuponId },
        data: { usoActual: { increment: 1 } },
      }).catch(() => { /* no bloquear si falla */ });
    }

    return NextResponse.json({ id: pedido.id, numero: pedido.numero, clienteId: clienteId ?? null }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
