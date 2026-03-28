import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Estacion } from "@prisma/client";

// POST /api/categorias → crear nueva categoría
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const nombre: string = (body.nombre ?? "").trim();
  if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const estacion: Estacion = (body.estacion as Estacion) ?? "COCINA";

  // orden = al final
  const max = await prisma.categoria.aggregate({ _max: { orden: true } });
  const orden = (max._max.orden ?? 0) + 1;

  const categoria = await prisma.categoria.create({
    data: { nombre, estacion, orden },
  });

  return NextResponse.json(categoria, { status: 201 });
}
