import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pedidoId, nick, estrellas, comentario } = body;

    if (!pedidoId || !nick || !estrellas) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    if (estrellas < 1 || estrellas > 5) {
      return NextResponse.json({ error: "Estrellas inválidas" }, { status: 400 });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        usuario: { select: { sucursalId: true } },
        evaluacion: { select: { id: true } },
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (pedido.evaluacion) {
      return NextResponse.json({ error: "Ya evaluaste este pedido" }, { status: 409 });
    }

    const sucursalId = pedido.usuario.sucursalId;
    if (!sucursalId) {
      return NextResponse.json({ error: "Sin sucursal" }, { status: 400 });
    }

    const evaluacion = await prisma.evaluacion.create({
      data: {
        pedidoId,
        sucursalId,
        nick: nick.trim().slice(0, 60),
        estrellas,
        comentario: comentario?.trim().slice(0, 500) || null,
      },
    });

    return NextResponse.json(evaluacion, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, logoUrl: true },
  });

  const sucursal = sucursales.find((s) => createSlug(s.nombre) === slug);
  if (!sucursal) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const evaluaciones = await prisma.evaluacion.findMany({
    where: { sucursalId: sucursal.id },
    orderBy: { creadoEn: "desc" },
    take: 50,
    select: {
      id: true,
      nick: true,
      estrellas: true,
      comentario: true,
      creadoEn: true,
    },
  });

  const promedio =
    evaluaciones.length > 0
      ? evaluaciones.reduce((a, e) => a + e.estrellas, 0) / evaluaciones.length
      : 0;

  return NextResponse.json({
    sucursal: { nombre: sucursal.nombre, logoUrl: sucursal.logoUrl },
    promedio: Math.round(promedio * 10) / 10,
    total: evaluaciones.length,
    evaluaciones,
  });
}
