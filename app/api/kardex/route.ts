import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/kardex?take=50&tipo=ENTRADA|SALIDA|AJUSTE
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sessionSucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? "100"), 500);

  const sucursalId =
    rol === "ADMIN_GENERAL"
      ? searchParams.get("sucursalId") ? Number(searchParams.get("sucursalId")) : undefined
      : sessionSucursalId ?? undefined;

  const movimientos = await prisma.kardex.findMany({
    where: {
      ...(tipo ? { tipo: tipo as "ENTRADA" | "SALIDA" | "AJUSTE" } : {}),
      ...(sucursalId ? { producto: { sucursalId } } : {}),
    },
    include: {
      producto: { select: { id: true, nombre: true, codigo: true, stock: true } },
    },
    orderBy: { creadoEn: "desc" },
    take,
  });

  return NextResponse.json(movimientos.map((k) => ({
    id: k.id,
    productoId: k.productoId,
    productoNombre: k.producto.nombre,
    productoCodigo: k.producto.codigo,
    stockActual: Number(k.producto.stock),
    tipo: k.tipo,
    cantidad: Number(k.cantidad),
    motivo: k.motivo,
    ventaId: k.ventaId,
    creadoEn: k.creadoEn,
  })));
}

// POST /api/kardex  — ajuste manual de stock
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sessionSucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;
  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const { productoId, tipo, cantidad, motivo } = body as {
    productoId: number;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    motivo: string;
  };

  if (!productoId || !tipo || cantidad == null || !motivo?.trim()) {
    return NextResponse.json({ error: "Faltan campos: productoId, tipo, cantidad, motivo" }, { status: 400 });
  }
  if (!["ENTRADA", "SALIDA", "AJUSTE"].includes(tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  if (Number(cantidad) <= 0) {
    return NextResponse.json({ error: "cantidad debe ser mayor a 0" }, { status: 400 });
  }

  // Verificar que el producto pertenece a la sucursal del usuario
  const producto = await prisma.producto.findUnique({
    where: { id: Number(productoId) },
    select: { id: true, sucursalId: true, stock: true },
  });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (rol !== "ADMIN_GENERAL" && producto.sucursalId !== sessionSucursalId) {
    return NextResponse.json({ error: "Sin permisos para este producto" }, { status: 403 });
  }

  const cant = Number(cantidad);

  const [kardex] = await prisma.$transaction([
    prisma.kardex.create({
      data: { productoId: Number(productoId), tipo, cantidad: cant, motivo: motivo.trim() },
    }),
    tipo === "ENTRADA"
      ? prisma.producto.update({ where: { id: Number(productoId) }, data: { stock: { increment: cant } } })
      : tipo === "SALIDA"
        ? prisma.producto.update({ where: { id: Number(productoId) }, data: { stock: { decrement: cant } } })
        : prisma.producto.update({ where: { id: Number(productoId) }, data: { stock: cant } }),
  ]);

  return NextResponse.json(kardex, { status: 201 });
}
