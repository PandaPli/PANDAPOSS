import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  sendToThermal,
  buildPrecuentaBuffer,
  buildBoletaBuffer,
  type PrecuentaData,
  type BoletaData,
} from "@/server/services/print.service";

export const runtime = "nodejs"; // net.Socket requiere Node.js runtime

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { sucursalId, type, data } = body as {
    sucursalId: number;
    type: "precuenta" | "boleta";
    data: PrecuentaData | BoletaData;
  };

  if (!sucursalId || !type || !data)
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: Number(sucursalId) },
    select: { printerIp: true },
  });

  if (!sucursal?.printerIp)
    return NextResponse.json({ error: "Sin impresora configurada" }, { status: 422 });

  try {
    const buffer = type === "precuenta"
      ? buildPrecuentaBuffer(data as PrecuentaData)
      : buildBoletaBuffer(data as BoletaData);

    await sendToThermal(sucursal.printerIp, buffer);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error de impresión";
    console.error("[print-receipt]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
