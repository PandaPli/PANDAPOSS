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
  const { telefono, nombre, totalGastado, frecuenciaCompra, ticketPromedio, ultimaCompra, direccion, preferencia } = body;

  const cliente = await prisma.agenteCliente.upsert({
    where: { agenteId_telefono: { agenteId, telefono } },
    update: {
      ...(nombre !== undefined && { nombre }),
      ...(totalGastado !== undefined && { totalGastado }),
      ...(frecuenciaCompra !== undefined && { frecuenciaCompra }),
      ...(ticketPromedio !== undefined && { ticketPromedio }),
      ...(ultimaCompra !== undefined && { ultimaCompra: new Date(ultimaCompra) }),
    },
    create: { agenteId, telefono, nombre },
    include: { preferencias: { where: { activa: true } }, direcciones: { where: { activa: true } } },
  });

  if (direccion) {
    await prisma.agenteDireccion.create({
      data: { clienteId: cliente.id, direccion: direccion.direccion, referencia: direccion.referencia, alias: direccion.alias, esFavorita: direccion.esFavorita ?? false },
    });
  }

  if (preferencia) {
    await prisma.agentePreferencia.upsert({
      where: { clienteId_tipo_clave: { clienteId: cliente.id, tipo: preferencia.tipo, clave: preferencia.clave } },
      update: { valor: preferencia.valor, peso: { increment: 1 } },
      create: { clienteId: cliente.id, tipo: preferencia.tipo, clave: preferencia.clave, valor: preferencia.valor, origen: preferencia.origen ?? "aprendido" },
    });
  }

  return NextResponse.json(cliente);
}
