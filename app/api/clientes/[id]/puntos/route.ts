import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PuntosService } from "@/server/services/puntos.service";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

async function checkClienteOwnership(clienteId: number, session: any) {
  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  if (rol === "ADMIN_GENERAL") return null; // OK
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { sucursalId: true },
  });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  if (cliente.sucursalId !== sucursalId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  return null; // OK
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const clienteId = parseInt(id);
  if (isNaN(clienteId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Verificar ownership
  const ownershipError = await checkClienteOwnership(clienteId, session);
  if (ownershipError) return ownershipError;

  const [cliente, historial] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nombre: true, puntos: true },
    }),
    PuntosService.historial(clienteId),
  ]);

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({ puntos: cliente.puntos, historial });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const clienteId = parseInt(id);
  if (isNaN(clienteId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Verificar ownership
  const ownershipError = await checkClienteOwnership(clienteId, session);
  if (ownershipError) return ownershipError;

  const body = await req.json();
  const { puntos, descripcion } = body as { puntos: number; descripcion?: string };

  if (typeof puntos !== "number" || puntos === 0) {
    return NextResponse.json({ error: "puntos debe ser un número diferente de 0" }, { status: 400 });
  }

  await PuntosService.ajustar(clienteId, puntos, descripcion ?? "");

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { puntos: true },
  });

  return NextResponse.json({ ok: true, puntosActuales: cliente?.puntos });
}
