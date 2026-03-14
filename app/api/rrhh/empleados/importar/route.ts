import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRrhhSession } from "@/lib/rrhh/session";
import { importUsuariosAsEmpleados } from "@/lib/rrhh/services";
import { requireNumber } from "@/lib/rrhh/validators";

function mapError(error: unknown) {
  const prismaCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (prismaCode === "P2021") {
    return NextResponse.json({ error: "RRHH aun no esta inicializado en la base de datos. Ejecuta prisma db push para crear sus tablas." }, { status: 503 });
  }
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (message.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  if (message.startsWith("INVALID_")) return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRrhhSession();
    const body = await request.json();
    const result = await importUsuariosAsEmpleados(prisma as any, session, requireNumber(body.sucursalId, "sucursalId"));
    return NextResponse.json(result);
  } catch (error) {
    return mapError(error);
  }
}
