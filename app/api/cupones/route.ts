import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// GET /api/cupones — listar cupones de la sucursal
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const rol = (session.user as { rol: Rol }).rol;

  const where = rol === "ADMIN_GENERAL" ? {} : { sucursalId: sucursalId! };

  const cupones = await prisma.cupon.findMany({
    where,
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(cupones);
}

// POST /api/cupones — crear cupon
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { codigo, descripcion, tipo, valor, usoMax, activo, venceEn } = body;

  if (!codigo || !tipo || valor == null) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const sid = body.sucursalId ? Number(body.sucursalId) : sucursalId;
  if (!sid) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });

  try {
    const cupon = await prisma.cupon.create({
      data: {
        sucursalId: sid,
        codigo: String(codigo).toUpperCase().trim(),
        descripcion: descripcion ?? null,
        tipo,
        valor: Number(valor),
        usoMax: usoMax ? Number(usoMax) : null,
        activo: activo ?? true,
        venceEn: venceEn ? new Date(venceEn) : null,
      },
    });
    return NextResponse.json(cupon, { status: 201 });
  } catch (e: unknown) {
    const isPrismaUnique = (e as { code?: string }).code === "P2002";
    if (isPrismaUnique) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 });
  }
}
