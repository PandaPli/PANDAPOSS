import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function auth(req: NextRequest) {
  return req.headers.get("x-agente-key") === process.env.AGENTE_API_KEY;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; telefono: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, telefono } = await params;

  // Sesion se guarda por clienteId — buscamos el cliente primero
  const cliente = await prisma.agenteCliente.findUnique({
    where: { agenteId_telefono: { agenteId: Number(id), telefono } },
    include: { sesiones: true },
  });
  const sesion = cliente?.sesiones?.[0] ?? null;
  return NextResponse.json(sesion);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; telefono: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, telefono } = await params;
  const body = await req.json();

  const cliente = await prisma.agenteCliente.upsert({
    where: { agenteId_telefono: { agenteId: Number(id), telefono } },
    update: {},
    create: { agenteId: Number(id), telefono },
  });

  const sesion = await prisma.agenteSesion.upsert({
    where: { clienteId: cliente.id },
    update: {
      estado: body.estado,
      carritoJson: body.carritoJson,
      contextoJson: body.contextoJson,
      historialJson: body.historialJson,
    },
    create: {
      clienteId: cliente.id,
      estado: body.estado,
      carritoJson: body.carritoJson,
      contextoJson: body.contextoJson,
      historialJson: body.historialJson,
    },
  });
  return NextResponse.json(sesion);
}
