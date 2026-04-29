import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const isAdmin = rol === "ADMIN_GENERAL";

  // Ventana de tiempo: desde la caja abierta actual o las últimas 8 horas
  let desde: Date;
  try {
    const caja = await prisma.caja.findFirst({
      where: {
        estado: "ABIERTA",
        ...(sucursalId && !isAdmin ? { sucursalId } : {}),
      },
      orderBy: { abiertaEn: "desc" },
      select: { abiertaEn: true },
    });
    desde = caja?.abiertaEn ?? new Date(Date.now() - 8 * 60 * 60 * 1000);
  } catch {
    desde = new Date(Date.now() - 8 * 60 * 60 * 1000);
  }

  const pedidos = await prisma.pedido.findMany({
    where: {
      estado: "LISTO",
      creadoEn: { gte: desde },
      AND: [
        {
          OR: [
            { mpStatus: null },
            { mpStatus: { not: "pending_payment" } },
          ],
        },
        ...(!isAdmin && sucursalId
          ? [{
              OR: [
                { caja: { sucursalId } },
                { mesa: { sala: { sucursalId } } },
                { usuario: { sucursalId } },
                { delivery: { cliente: { sucursalId } } },
              ],
            }]
          : []),
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
