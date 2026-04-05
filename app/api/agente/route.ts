import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isPrime(plan: string) {
  return plan === "PRIME" || plan === "DEMO";
}

export async function GET(req: NextRequest) {
  // Autenticación por bot key (servicio local)
  const botKey = req.headers.get("x-agente-key");
  if (botKey && botKey === process.env.AGENTE_API_KEY) {
    // El bot obtiene solo los agentes activos de sucursales PRIME
    const agentes = await prisma.agenteWsp.findMany({
      where: { activo: true },
      include: { sucursal: { select: { nombre: true, plan: true, simbolo: true } } },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(agentes);
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = session.user as { rol?: string; sucursalId?: number };

  const where = user.rol !== "ADMIN_GENERAL" && user.sucursalId
    ? { sucursalId: user.sucursalId }
    : {};

  const agentes = await prisma.agenteWsp.findMany({
    where,
    include: {
      sucursal: { select: { nombre: true, plan: true, simbolo: true } },
      _count: { select: { clientes: true } },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(agentes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { sucursalId, activo } = await req.json();

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { plan: true },
  });
  if (!sucursal) return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
  if (!isPrime(sucursal.plan)) {
    return NextResponse.json({ error: "Requiere plan PRIME" }, { status: 403 });
  }

  const agente = await prisma.agenteWsp.upsert({
    where: { sucursalId },
    update: { activo },
    create: { sucursalId, activo: activo ?? false },
  });
  return NextResponse.json(agente);
}
