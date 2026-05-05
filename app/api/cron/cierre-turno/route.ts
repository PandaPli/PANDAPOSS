import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subHours } from "date-fns";

/**
 * GET /api/cron/cierre-turno
 * Vercel Cron — corre a las 06:00 UTC (03:00 Chile) todos los días.
 *
 * Cierra automáticamente todo lo que quedó abierto de un turno anterior:
 *  1. Pedidos PENDIENTE / EN_PROCESO con más de 12h → CANCELADO
 *  2. Mesas OCUPADA / CUENTA sin pedido activo → LIBRE
 *  3. Cajas ABIERTA con más de 16h → CERRADA
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const limite12h = subHours(ahora, 12);
  const limite16h = subHours(ahora, 16);

  // ── 1. Cancelar pedidos viejos ──────────────────────────────────────────
  const pedidosCancelados = await prisma.pedido.updateMany({
    where: {
      estado: { in: ["PENDIENTE", "EN_PROCESO"] },
      creadoEn: { lt: limite12h },
    },
    data: {
      estado: "CANCELADO",
    },
  });

  // ── 2. Liberar mesas sin pedido activo ─────────────────────────────────
  // Primero obtenemos las mesas que siguen ocupadas pero ya no tienen pedido activo
  const mesasOcupadas = await prisma.mesa.findMany({
    where: { estado: { in: ["OCUPADA", "CUENTA", "RESERVADA"] } },
    include: {
      pedidos: {
        where: { estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
        select: { id: true },
      },
    },
  });

  const mesasSinPedido = mesasOcupadas
    .filter((m) => m.pedidos.length === 0)
    .map((m) => m.id);

  const mesasLiberadas = mesasSinPedido.length > 0
    ? await prisma.mesa.updateMany({
        where: { id: { in: mesasSinPedido } },
        data: { estado: "LIBRE" },
      })
    : { count: 0 };

  // ── 3. Cerrar cajas abiertas hace más de 16h ────────────────────────────
  const cajasCerradas = await prisma.caja.updateMany({
    where: {
      estado: "ABIERTA",
      abiertaEn: { lt: limite16h },
    },
    data: {
      estado: "CERRADA",
      cerradaEn: ahora,
    },
  });

  const resumen = {
    ok: true,
    ejecutadoEn: ahora.toISOString(),
    pedidosCancelados: pedidosCancelados.count,
    mesasLiberadas: mesasLiberadas.count,
    cajasCerradas: cajasCerradas.count,
  };

  console.log("[cierre-turno]", resumen);
  return NextResponse.json(resumen);
}
