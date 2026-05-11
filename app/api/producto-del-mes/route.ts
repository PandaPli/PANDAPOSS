import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

const ALLOWED: Rol[] = ["ADMIN_GENERAL", "RESTAURANTE"];
const prodSelect = {
  id: true, nombre: true, descripcion: true, precio: true, imagen: true, codigo: true,
} as const;

// GET — ADMIN_GENERAL ve todas las sucursales; RESTAURANTE solo la suya
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol       = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  if (!ALLOWED.includes(rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const where = rol === "ADMIN_GENERAL"
    ? { activa: true }
    : { activa: true, id: sucursalId ?? -1 };

  const sucursales = await prisma.sucursal.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      productoMesActivo: true,
      productoMesId: true,
      productoMesTitulo: true,
      productoMes: { select: prodSelect },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(sucursales);
}

// PATCH — actualiza el producto del mes; RESTAURANTE solo puede editar su sucursal
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sesionSucId = (session.user as { sucursalId: number | null }).sucursalId;
  if (!ALLOWED.includes(rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await req.json();
  const { sucursalId, productoMesId, productoMesTitulo, productoMesActivo } = body;

  if (!sucursalId) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });

  // RESTAURANTE solo puede editar su propia sucursal
  if (rol !== "ADMIN_GENERAL" && Number(sucursalId) !== sesionSucId) {
    return NextResponse.json({ error: "Sin permiso para esta sucursal" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (productoMesId !== undefined) data.productoMesId = productoMesId ?? null;
  if (productoMesTitulo !== undefined) data.productoMesTitulo = productoMesTitulo || null;
  if (productoMesActivo !== undefined) data.productoMesActivo = productoMesActivo;

  const sucursal = await prisma.sucursal.update({
    where: { id: Number(sucursalId) },
    data,
    select: {
      id: true,
      nombre: true,
      productoMesActivo: true,
      productoMesId: true,
      productoMesTitulo: true,
      productoMes: {
        select: { id: true, nombre: true, descripcion: true, precio: true, imagen: true, codigo: true },
      },
    },
  });

  return NextResponse.json(sucursal);
}
