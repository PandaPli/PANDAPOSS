import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Endpoint público — devuelve pedidos activos (EN_PROCESO + LISTO) del turno actual.
// Sin auth: solo expone número de orden y estado (sin PII).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sucursalId = Number(searchParams.get("sucursalId"));
  if (!sucursalId) return NextResponse.json({ error: "Falta sucursalId" }, { status: 400 });

  // Desde apertura de caja o últimas 10 horas como fallback
  let desde: Date;
  try {
    const caja = await prisma.caja.findFirst({
      where: { estado: "ABIERTA", sucursalId },
      orderBy: { abiertaEn: "desc" },
      select: { abiertaEn: true },
    });
    desde = caja?.abiertaEn ?? new Date(Date.now() - 10 * 60 * 60 * 1000);
  } catch {
    desde = new Date(Date.now() - 10 * 60 * 60 * 1000);
  }

  const pedidos = await prisma.pedido.findMany({
    where: {
      estado: { in: ["EN_PROCESO", "LISTO"] },
      creadoEn: { gte: desde },
      AND: [
        { OR: [{ mpStatus: null }, { mpStatus: { not: "pending_payment" } }] },
        {
          OR: [
            { caja: { sucursalId } },
            { mesa: { sala: { sucursalId } } },
            { usuario: { sucursalId } },
            { delivery: { cliente: { sucursalId } } },
          ],
        },
      ],
    },
    select: {
      id: true,
      numero: true,
      tipo: true,
      estado: true,
      observacion: true,
      listoEn: true,
      mesa: { select: { nombre: true } },
      delivery: { select: { zonaDelivery: true } },
    },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json(pedidos);
}
