import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;

  // Non-admin users only get operational fields (currency, tax) — not business PII
  const select = rol === "ADMIN_GENERAL"
    ? undefined
    : { id: true, moneda: true, simbolo: true, ivaPorc: true, nombreEmpresa: true, logoUrl: true } as const;

  const config = select
    ? await prisma.configuracion.findUnique({ where: { id: 1 }, select })
    : await prisma.configuracion.findUnique({ where: { id: 1 } });

  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { nombreEmpresa, rut, direccion, telefono, email, moneda, simbolo, ivaPorc, logoUrl, homePreviewUrl } = body;

  const config = await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {
      ...(nombreEmpresa    !== undefined ? { nombreEmpresa }              : {}),
      ...(rut              !== undefined ? { rut }                        : {}),
      ...(direccion        !== undefined ? { direccion }                  : {}),
      ...(telefono         !== undefined ? { telefono }                   : {}),
      ...(email            !== undefined ? { email }                      : {}),
      ...(moneda           !== undefined ? { moneda }                     : {}),
      ...(simbolo          !== undefined ? { simbolo }                    : {}),
      ...(ivaPorc          !== undefined ? { ivaPorc: Number(ivaPorc) }   : {}),
      ...(logoUrl          !== undefined ? { logoUrl }                    : {}),
      ...(homePreviewUrl   !== undefined ? { homePreviewUrl }             : {}),
    },
    create: {
      id: 1,
      nombreEmpresa: nombreEmpresa ?? "PandaPoss",
      moneda: moneda ?? "CLP",
      simbolo: simbolo ?? "$",
      ivaPorc: ivaPorc ?? 19,
    },
  });

  return NextResponse.json(config);
}
