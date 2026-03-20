import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grupos = await prisma.varianteGrupo.findMany({
    where: { productoId: Number(id) },
    orderBy: { orden: "asc" },
    include: { opciones: { orderBy: { orden: "asc" } } },
  });
  return NextResponse.json(grupos);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const productoId = Number(id);
  const { grupos } = await req.json();

  await prisma.$transaction(async (tx) => {
    await tx.varianteGrupo.deleteMany({ where: { productoId } });
    for (let i = 0; i < (grupos ?? []).length; i++) {
      const g = grupos[i];
      await tx.varianteGrupo.create({
        data: {
          productoId,
          nombre: String(g.nombre).slice(0, 100),
          requerido: Boolean(g.requerido),
          tipo: g.tipo === "checkbox" ? "checkbox" : "radio",
          orden: i,
          opciones: {
            create: (g.opciones ?? []).map((o: { nombre: string; precio: number }, j: number) => ({
              nombre: String(o.nombre).slice(0, 100),
              precio: Number(o.precio) || 0,
              orden: j,
            })),
          },
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
