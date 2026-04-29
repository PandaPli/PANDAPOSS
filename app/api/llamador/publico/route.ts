import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Endpoint público — solo devuelve números de orden LISTO por sucursal.
// No requiere autenticación: los datos son solo números de orden (sin PII).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sucursalId = Number(searchParams.get("sucursalId"));
  if (!sucursalId) return NextResponse.json({ error: "Falta sucursalId" }, { status: 400 });

  const desde = new Date(Date.now() - 8 * 60 * 60 * 1000);

  const pedidos = await prisma.pedido.findMany({
    where: {
      estado: "LISTO",
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
      observacion: true,
      listoEn: true,
      mesa: { select: { nombre: true } },
      delivery: { select: { zonaDelivery: true } },
    },
    orderBy: { listoEn: "asc" },
  });

  return NextResponse.json(pedidos);
}
