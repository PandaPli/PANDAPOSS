import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { CajaRepo } from "@/server/repositories/caja.repo";
import { checkLimit } from "@/core/billing/limitChecker";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const cajas = await CajaRepo.list({ sucursalId, isAdmin: rol === "ADMIN_GENERAL" });
  return NextResponse.json(cajas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { nombre, sucursalId } = await req.json();
  if (!nombre) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const effectiveSucursalId = sucursalId || userSucursalId || 1;

  const { allowed, error } = await checkLimit(effectiveSucursalId, "cajas");
  if (!allowed) return NextResponse.json({ error }, { status: 403 });

  const caja = await CajaRepo.create(nombre, effectiveSucursalId);
  return NextResponse.json(caja, { status: 201 });
}
