import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      cliente: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true } },
          combo: { select: { nombre: true } },
        },
      },
      pagos: { select: { metodoPago: true, monto: true } },
    },
  });

  if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  return NextResponse.json(venta);
}
