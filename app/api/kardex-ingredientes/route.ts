import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/kardex-ingredientes?take=100&tipo=ENTRADA|SALIDA|AJUSTE
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
      : sessionSucursalId ?? -1;

  const movimientos = await prisma.kardexIngrediente.findMany({
    where: {
      ...(tipo ? { tipo: tipo as "ENTRADA" | "SALIDA" | "AJUSTE" } : {}),
      ...(sucursalId ? { ingrediente: { sucursalId } } : {}),
    },
    include: {
      ingrediente: { select: { id: true, nombre: true, codigo: true, stock: true, unidad: true } },
    },
    orderBy: { creadoEn: "desc" },
    take,
  });

  return NextResponse.json(movimientos.map((k) => ({
    id: k.id,
    ingredienteId: k.ingredienteId,
    ingredienteNombre: k.ingrediente.nombre,
    ingredienteCodigo: k.ingrediente.codigo,
    stockActual: Number(k.ingrediente.stock),
    unidad: k.ingrediente.unidad,
    tipo: k.tipo,
    cantidad: Number(k.cantidad),
    motivo: k.motivo,
    compraId: k.compraId,
    creadoEn: k.creadoEn,
  })));
}

// POST /api/kardex-ingredientes — ajuste manual de stock de ingrediente
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

  const { ingredienteId, tipo, cantidad, motivo } = body as {
    ingredienteId: number;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    motivo: string;
  };

  if (!ingredienteId || !tipo || cantidad == null || !motivo?.trim()) {
    return NextResponse.json({ error: "Faltan campos: ingredienteId, tipo, cantidad, motivo" }, { status: 400 });
  }
  if (!["ENTRADA", "SALIDA", "AJUSTE"].includes(tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  if (Number(cantidad) <= 0) {
    return NextResponse.json({ error: "cantidad debe ser mayor a 0" }, { status: 400 });
  }

  const ingrediente = await prisma.ingrediente.findUnique({
    where: { id: Number(ingredienteId) },
    select: { id: true, sucursalId: true },
  });
  if (!ingrediente) return NextResponse.json({ error: "Ingrediente no encontrado" }, { status: 404 });
  if (rol !== "ADMIN_GENERAL" && ingrediente.sucursalId !== sessionSucursalId) {
    return NextResponse.json({ error: "Sin permisos para este ingrediente" }, { status: 403 });
  }

  const cant = Number(cantidad);

  const [kardex] = await prisma.$transaction([
    prisma.kardexIngrediente.create({
      data: { ingredienteId: Number(ingredienteId), tipo, cantidad: cant, motivo: motivo.trim() },
    }),
    tipo === "ENTRADA"
      ? prisma.ingrediente.update({ where: { id: Number(ingredienteId) }, data: { stock: { increment: cant } } })
      : tipo === "SALIDA"
        ? prisma.ingrediente.update({ where: { id: Number(ingredienteId) }, data: { stock: { decrement: cant } } })
        : prisma.ingrediente.update({ where: { id: Number(ingredienteId) }, data: { stock: cant } }),
  ]);

  return NextResponse.json(kardex, { status: 201 });
}
