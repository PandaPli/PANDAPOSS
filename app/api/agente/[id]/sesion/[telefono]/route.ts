import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function auth(req: NextRequest) {
  return req.headers.get("x-agente-key") === process.env.AGENTE_API_KEY;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; telefono: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, telefono } = await params;
  const sesion = await prisma.agenteSesion.findUnique({
    where: { agenteId_telefono: { agenteId: Number(id), telefono } },
  });
  return NextResponse.json(sesion);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; telefono: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, telefono } = await params;
  const body = await req.json();
  const sesion = await prisma.agenteSesion.upsert({
    where: { agenteId_telefono: { agenteId: Number(id), telefono } },
    update: { estado: body.estado, carritoJson: body.carritoJson, contextoJson: body.contextoJson, historialJson: body.historialJson, ultimaActiv: new Date() },
    create: { agenteId: Number(id), telefono, estado: body.estado ?? "NUEVO", carritoJson: body.carritoJson, contextoJson: body.contextoJson, historialJson: body.historialJson },
  });
  return NextResponse.json(sesion);
}
