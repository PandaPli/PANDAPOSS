import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const k = req.headers.get("x-agente-key");
  if (k !== process.env.AGENTE_API_KEY) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const agente = await prisma.agenteWsp.findUnique({ where: { id: Number(id) }, select: { sucursalId: true } });
  if (!agente) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  const body = await req.json();
  // body: { items, cliente: { telefono, nombre, direccion, referencia }, metodoPago, cargoEnvio, zonaDelivery, total }

  // Forward to the delivery order endpoint
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "https://pandaposs.com"}/api/delivery/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sucursalId: agente.sucursalId,
      items: body.items,
      cliente: body.cliente,
      metodoPago: body.metodoPago ?? "EFECTIVO",
      cargoEnvio: body.cargoEnvio ?? 0,
      zonaDelivery: body.zonaDelivery,
    }),
  });

  const data = await res.json();

  // Update AgenteCliente metrics after order
  if (res.ok && body.cliente?.telefono && body.total) {
    try {
      const existing = await prisma.agenteCliente.findUnique({
        where: { agenteId_telefono: { agenteId: Number(id), telefono: body.cliente.telefono } },
      });
      if (existing) {
        const newFreq = existing.frecuenciaCompra + 1;
        const newTotal = Number(existing.totalGastado) + Number(body.total);
        await prisma.agenteCliente.update({
          where: { id: existing.id },
          data: {
            frecuenciaCompra: newFreq,
            totalGastado: newTotal,
            ticketPromedio: newTotal / newFreq,
            ultimaCompra: new Date(),
          },
        });
        await prisma.agenteEvento.create({
          data: { clienteId: existing.id, tipo: "PEDIDO_CONFIRMADO", data: { pedidoId: data.pedidoId, total: body.total } },
        });
      }
    } catch (e) {
      console.error("[AgenteWsp] Error updating cliente metrics:", e);
    }
  }

  return NextResponse.json(data, { status: res.status });
}
