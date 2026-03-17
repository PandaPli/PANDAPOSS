import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRrhhSession } from "@/lib/rrhh/session";
import { createAsistencia, listAsistencias } from "@/lib/rrhh/services";
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
  if (message === "ASISTENCIA_DUPLICADA") {
    return NextResponse.json({ error: "Ya existe una asistencia registrada para este empleado en esa fecha." }, { status: 409 });
  }
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getRrhhSession();
    const sucursalId = request.nextUrl.searchParams.get("sucursalId");
    const data = await listAsistencias(prisma as any, session, sucursalId ? Number(sucursalId) : undefined);
    return NextResponse.json(data);
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRrhhSession();
    const body = await request.json();
    const asistencia = await createAsistencia(prisma as any, session, {
      sucursalId: requireNumber(body.sucursalId, "sucursalId"),
      empleadoId: requireNumber(body.empleadoId, "empleadoId"),
      fecha: requireString(body.fecha, "fecha"),
      horaEntrada: optionalString(body.horaEntrada),
      horaSalida: optionalString(body.horaSalida),
      estado: requireString(body.estado, "estado"),
      observacion: optionalString(body.observacion),
    });
    return NextResponse.json(asistencia, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
