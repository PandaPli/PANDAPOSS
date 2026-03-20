import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildTicketBuffer, sendToThermal } from "@/server/services/print.service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { sucursalId, content } = await req.json();
  if (!sucursalId || !content) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // Buscar la IP configurada para la sucursal
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: Number(sucursalId) },
    select: { printerIp: true },
  });

  if (!sucursal?.printerIp) {
    return NextResponse.json({ error: "Sin impresora configurada" }, { status: 422 });
  }

  try {
    const buffer = buildTicketBuffer(content as string);
    await sendToThermal(sucursal.printerIp, buffer);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error de impresión";
    console.error("[Print]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
