import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function auth(req: NextRequest) {
  const k = req.headers.get("x-agente-key");
  return k === process.env.AGENTE_API_KEY;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const agenteId = Number(id);
  const body = await req.json();
  const { telefono, nombre, ultimaCompra, direccion, preferencia } = body;

  const cliente = await prisma.agenteCliente.upsert({
    where: { agenteId_telefono: { agenteId, telefono } },
    update: {
      ...(nombre !== undefined && { nombre }),
      ...(ultimaCompra !== undefined && { ultimoPedido: new Date(ultimaCompra) }),
    },
    create: { agenteId, telefono, nombre },
    include: { preferencias: true, direcciones: true },
  });

  if (direccion) {
    await prisma.agenteDireccion.create({
      data: { clienteId: cliente.id, direccion: direccion.direccion, referencia: direccion.referencia },
    });
  }

  if (preferencia) {
    await prisma.agentePreferencia.create({
      data: { clienteId: cliente.id, texto: preferencia.texto ?? String(preferencia.valor ?? preferencia) },
    });
  }

  return NextResponse.json(cliente);
}
