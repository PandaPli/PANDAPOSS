import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { PLAN_LIMITS } from "@/core/billing/planConfig";

const PLANES_VALIDOS = Object.keys(PLAN_LIMITS) as string[];

type Params = { params: Promise<{ id: string }> };

function isAdmin(rol: Rol) {
  return rol === "ADMIN_GENERAL";
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sessionSucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { id: idStr } = await params;
  const id = Number(idStr);

  const esPropietario = rol === "RESTAURANTE" && sessionSucursalId === id;
  if (!isAdmin(rol) && !esPropietario) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { nombre, direccion, telefono, email, simbolo, activa, logoUrl, descripcionDelivery, instagram, facebook, whatsapp, tiktok, plan } = body as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  // RESTAURANTE solo puede actualizar su propio logo, descripción y redes sociales
  if (esPropietario && !isAdmin(rol)) {
    if (logoUrl !== undefined) data.logoUrl = (logoUrl as string) || null;
    if (descripcionDelivery !== undefined) data.descripcionDelivery = (descripcionDelivery as string)?.trim() || null;
    if (instagram !== undefined) data.instagram = (instagram as string)?.trim() || null;
    if (facebook !== undefined) data.facebook = (facebook as string)?.trim() || null;
    if (whatsapp !== undefined) data.whatsapp = (whatsapp as string)?.trim() || null;
    if (tiktok !== undefined) data.tiktok = (tiktok as string)?.trim() || null;
  } else {
    // ADMIN_GENERAL puede actualizar todo
    if (nombre !== undefined) data.nombre = (nombre as string).trim();
    if (direccion !== undefined) data.direccion = (direccion as string)?.trim() || null;
    if (telefono !== undefined) data.telefono = (telefono as string)?.trim() || null;
    if (email !== undefined) data.email = (email as string)?.trim() || null;
    if (simbolo !== undefined) data.simbolo = (simbolo as string)?.trim() || "$";
    if (activa !== undefined) data.activa = activa;
    if (logoUrl !== undefined) data.logoUrl = (logoUrl as string) || null;
    if (descripcionDelivery !== undefined) data.descripcionDelivery = (descripcionDelivery as string)?.trim() || null;
    if (instagram !== undefined) data.instagram = (instagram as string)?.trim() || null;
    if (facebook !== undefined) data.facebook = (facebook as string)?.trim() || null;
    if (whatsapp !== undefined) data.whatsapp = (whatsapp as string)?.trim() || null;
    if (tiktok !== undefined) data.tiktok = (tiktok as string)?.trim() || null;
    if (plan !== undefined) {
      if (!PLANES_VALIDOS.includes(plan as string)) {
        return NextResponse.json({ error: `Plan inválido. Valores permitidos: ${PLANES_VALIDOS.join(", ")}` }, { status: 400 });
      }
      data.plan = plan;
    }
  }

  try {
    const sucursal = await prisma.sucursal.update({
      where: { id },
      data,
    });
    return NextResponse.json(sucursal);
  } catch (err) {
    console.error("PATCH /api/sucursales/[id]:", err);
    return NextResponse.json({ error: "Error al actualizar sucursal" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!isAdmin(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id: idStr } = await params;
  const id = Number(idStr);

  const count = await prisma.usuario.count({ where: { sucursalId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene usuarios asignados. Desactívala en su lugar." },
      { status: 400 }
    );
  }

  const sucursal = await prisma.sucursal.update({
    where: { id },
    data: { activa: false },
  });

  return NextResponse.json(sucursal);
}
