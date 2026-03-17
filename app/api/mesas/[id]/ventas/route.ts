import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const mesaId = Number(id);
  if (!mesaId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const ventas = await prisma.venta.findMany({
    where: { pedido: { mesaId } },
    orderBy: { creadoEn: "desc" },
    take: 20,
    include: {
      usuario: { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true } },
          combo:    { select: { nombre: true } },
        },
        orderBy: { id: "asc" },
      },
      pagos: { select: { metodoPago: true, monto: true } },
      caja:  { select: { sucursal: { select: { simbolo: true, logoUrl: true } } } },
      pedido: { select: { mesa: { select: { nombre: true } } } },
    },
  });

  return NextResponse.json(ventas);
}
