import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/categorias/reorder  → { items: [{ id, orden }] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { items } = (await req.json()) as { items: { id: number; orden: number }[] };
  if (!Array.isArray(items)) return NextResponse.json({ error: "items requerido" }, { status: 400 });

  await prisma.$transaction(
    items.map(({ id, orden }) =>
      prisma.categoria.update({ where: { id }, data: { orden } })
    )
  );

  return NextResponse.json({ ok: true });
}
