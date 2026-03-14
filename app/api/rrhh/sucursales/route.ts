import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRrhhSession } from "@/lib/rrhh/session";
import { listSucursales } from "@/lib/rrhh/services";

function mapError(error: unknown) {
  const prismaCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (prismaCode === "P2021") {
    return NextResponse.json({ error: "RRHH aun no esta inicializado en la base de datos. Ejecuta prisma db push para crear sus tablas." }, { status: 503 });
  }
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (message.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function GET() {
  try {
    const session = await getRrhhSession();
    const data = await listSucursales(prisma as any, session);
    return NextResponse.json(data);
  } catch (error) {
    return mapError(error);
  }
}
