import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.estadoPago === "string" && ["PENDIENTE", "AL_DIA", "ATRASADO", "GRATIS"].includes(body.estadoPago)) {
    data.estadoPago = body.estadoPago;
  }
  if (typeof body.mesesGratis === "number" && body.mesesGratis >= 0) {
    data.mesesGratis = Math.floor(body.mesesGratis);
  }
  if (body.fechaInicioPlan === null) {
    data.fechaInicioPlan = null;
  } else if (typeof body.fechaInicioPlan === "string") {
    data.fechaInicioPlan = new Date(body.fechaInicioPlan);
  }
  if (typeof body.notaPago === "string") {
    data.notaPago = body.notaPago.slice(0, 300);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin datos válidos" }, { status: 400 });
  }

  const updated = await prisma.sucursal.update({ where: { id }, data });
  return NextResponse.json({ ok: true, data: updated });
}
