import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAuthorized(req: NextRequest, session: any) {
  const apiKey = req.headers.get("x-agente-key");
  if (apiKey && apiKey === process.env.AGENTE_API_KEY) return true;
  return !!session;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(req, session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const agente = await prisma.agenteWsp.findUnique({
    where: { id: Number(id) },
    include: {
      sucursal: { select: { nombre: true, plan: true, simbolo: true, logoUrl: true } },
      _count: { select: { clientes: true } },
    },
  });
  if (!agente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(agente);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(req, session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["estado", "qrBase64", "qrExpiresAt", "telefono", "ultimaConex", "activo"] as const;
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  const agente = await prisma.agenteWsp.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(agente);
}
