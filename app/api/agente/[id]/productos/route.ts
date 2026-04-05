import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = req.headers.get("x-agente-key");
  if (!apiKey || apiKey !== process.env.AGENTE_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const agente = await prisma.agenteWsp.findUnique({ where: { id: Number(id) }, select: { sucursalId: true } });
  if (!agente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const productos = await prisma.producto.findMany({
    where: { sucursalId: agente.sucursalId, activo: true, enMenu: true },
    include: { categoria: { select: { nombre: true } } },
    orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }],
  });
  return NextResponse.json(productos);
}
