import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;
  if (!sucursalId) {
    return NextResponse.json({ pedidosAtrasados: 0, stockBajo: 0, mpPendientes: 0, mesasCuenta: 0, total: 0 });
  }

  const hace15min = new Date(Date.now() - 15 * 60 * 1000);
  const hace10min = new Date(Date.now() - 10 * 60 * 1000);

  const [
    pedidosAtrasados,
    productosRaw,
    ingredientesRaw,
    mpPendientes,
    mesasCuenta,
  ] = await Promise.all([
    prisma.pedido.count({
      where: {
        estado: "PENDIENTE",
        tipo: { not: "DELIVERY" },
        creadoEn: { lte: hace15min },
        usuario: { sucursalId },
      },
    }),
    prisma.producto.findMany({
      where: { sucursalId, inventariable: true, activo: true, stockMinimo: { gt: 0 } },
      select: { stock: true, stockMinimo: true },
    }),
    prisma.ingrediente.findMany({
      where: { sucursalId, activo: true, stockMinimo: { gt: 0 } },
      select: { stock: true, stockMinimo: true },
    }),
    prisma.pedido.count({
      where: {
        mpStatus: "pending_payment",
        creadoEn: { lte: hace10min },
        usuario: { sucursalId },
      },
    }),
    prisma.mesa.count({
      where: { sala: { sucursalId }, estado: "CUENTA" },
    }),
  ]);

  const stockBajo =
    productosRaw.filter((p) => Number(p.stock) <= Number(p.stockMinimo)).length +
    ingredientesRaw.filter((i) => Number(i.stock) <= Number(i.stockMinimo)).length;

  return NextResponse.json({
    pedidosAtrasados,
    stockBajo,
    mpPendientes,
    mesasCuenta,
    total: pedidosAtrasados + stockBajo + mpPendientes + mesasCuenta,
  });
}
