import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRrhhSession } from "@/lib/rrhh/session";

export async function GET() {
  try {
    await getRrhhSession(); // auth check
    const cargos = await prisma.cargo.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(cargos);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
