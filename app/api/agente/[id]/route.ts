import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_ROLES = ["ADMIN_GENERAL", "RESTAURANTE"];

function isApiKeyAuth(req: NextRequest) {
  const apiKey = req.headers.get("x-agente-key");
  return !!apiKey && apiKey === process.env.AGENTE_API_KEY;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isApiKeyAuth(req) && !session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const agente = await prisma.agenteWsp.findUnique({
    where: { id: Number(id) },
    include: {
      sucursal: { select: { nombre: true, plan: true, simbolo: true, logoUrl: true } },
      _count: { select: { clientes: true } },
    },
  });
  if (!agente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Si es por sesión (no API key), verificar que el agente pertenece a la sucursal del usuario
  if (!isApiKeyAuth(req) && session) {
    const rol = (session.user as { rol: string }).rol;
    const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
    if (!ADMIN_ROLES.includes(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    if (rol !== "ADMIN_GENERAL" && agente.sucursalId !== sucursalId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
  }

  return NextResponse.json(agente);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isApiKeyAuth(req) && !session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Si es por sesión (no API key), verificar permisos
  if (!isApiKeyAuth(req) && session) {
    const rol = (session.user as { rol: string }).rol;
    const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
    if (!ADMIN_ROLES.includes(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    if (rol !== "ADMIN_GENERAL") {
      const agente = await prisma.agenteWsp.findUnique({ where: { id: Number(id) }, select: { sucursalId: true } });
      if (!agente || agente.sucursalId !== sucursalId) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
    }
  }

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
