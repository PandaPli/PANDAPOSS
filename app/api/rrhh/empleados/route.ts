import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRrhhSession } from "@/lib/rrhh/session";
import { createEmpleado, listEmpleados } from "@/lib/rrhh/services";
import { optionalString, requireNumber, requireString } from "@/lib/rrhh/validators";

function mapError(error: unknown) {
  const prismaCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (prismaCode === "P2021") {
    return NextResponse.json({ error: "RRHH aun no esta inicializado en la base de datos. Ejecuta prisma db push para crear sus tablas." }, { status: 503 });
  }
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (message.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  if (message.startsWith("INVALID_") || message === "EMPLEADO_INVALIDO_PARA_SUCURSAL") {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getRrhhSession();
    const sucursalId = request.nextUrl.searchParams.get("sucursalId");
    const data = await listEmpleados(prisma as any, session, sucursalId ? Number(sucursalId) : undefined);
    return NextResponse.json(data);
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRrhhSession();
    const body = await request.json();
    const empleado = await createEmpleado(prisma as any, session, {
      sucursalId: requireNumber(body.sucursalId, "sucursalId"),
      departamentoId: body.departamentoId ? Number(body.departamentoId) : undefined,
      cargoId: body.cargoId ? Number(body.cargoId) : undefined,
      nombres: requireString(body.nombres, "nombres"),
      apellidos: requireString(body.apellidos, "apellidos"),
      documento: optionalString(body.documento),
      email: optionalString(body.email),
      telefono: optionalString(body.telefono),
      fechaIngreso: optionalString(body.fechaIngreso),
      salarioBase: body.salarioBase ? Number(body.salarioBase) : undefined,
    });
    return NextResponse.json(empleado, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
