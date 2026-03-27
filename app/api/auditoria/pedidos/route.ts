import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

/**
 * GET /api/auditoria/pedidos
 * Historial de eventos de pedidos (cambios de estado, ítems cancelados, etc.)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const fecha  = searchParams.get("fecha");   // YYYY-MM-DD
  const limit  = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  let desde: Date | undefined;
  let hasta: Date | undefined;
  if (fecha) {
    desde = new Date(fecha);
    desde.setHours(0, 0, 0, 0);
    hasta = new Date(fecha);
    hasta.setHours(23, 59, 59, 999);
  } else {
    desde = new Date();
    desde.setDate(desde.getDate() - 1);
    desde.setHours(0, 0, 0, 0);
  }

  const eventos = await prisma.eventoPedido.findMany({
    where: {
      creadoEn: { gte: desde, ...(hasta ? { lte: hasta } : {}) },
      // Filtrar por sucursal vía el pedido
      ...(rol !== "ADMIN_GENERAL" && sucursalId
        ? {
            pedido: {
              OR: [
                { caja: { sucursalId } },
                { mesa: { sala: { sucursalId } } },
              ],
            },
          }
        : {}),
    },
    select: {
      id:          true,
      tipo:        true,
      descripcion: true,
      creadoEn:    true,
      pedido: {
        select: {
          id:     true,
          numero: true,
          tipo:   true,
          mesa:   { select: { nombre: true } },
        },
      },
      usuario: { select: { nombre: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: limit,
  });

  return NextResponse.json({ eventos });
}
