import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const categoriaId = searchParams.get("categoria");

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(q ? { OR: [{ nombre: { contains: q } }, { codigo: { contains: q } }] } : {}),
      ...(categoriaId ? { categoriaId: Number(categoriaId) } : {}),
    },
    include: { categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { codigo, nombre, precio, costo, stock, stockMinimo, categoriaId, ivaActivo, ivaPorc, imagen, enMenu } = body;

  if (!codigo || !nombre || precio === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const producto = await prisma.producto.create({
    data: {
      codigo: codigo.toUpperCase(),
      nombre,
      precio,
      costo: costo || null,
      stock: stock || 0,
      stockMinimo: stockMinimo || 0,
      categoriaId: categoriaId || null,
      ivaActivo: ivaActivo || false,
      ivaPorc: ivaPorc || 0,
      imagen: imagen || null,
      enMenu: enMenu ?? true,
    },
  });

  return NextResponse.json(producto, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(producto);
}
