import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subHours, subMinutes } from "date-fns";

/**
 * GET /api/cron/cierre-turno
 * Vercel Cron — corre a las 06:00 UTC (03:00 Chile) todos los días.
 *
 * Lógica de turno:
 *  - El turno inicia cuando abre la primera caja y termina cuando cierran TODAS.
 *  - Hay 30 min de gracia entre turnos (cuadratura).
 *  - Las mesas con pedidos activos se heredan al nuevo turno (no se tocan).
 *
 * Acciones:
 *  1. Pedidos huérfanos (sin mesa, +12h) → CANCELADO
 *  2. Mesas OCUPADA/CUENTA sin ningún pedido activo → LIBRE
 *  3. Cajas ABIERTA con +16h y sin actividad reciente → CERRADA
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const limite12h = subHours(ahora, 12);
  const limite16h = subHours(ahora, 16);
  const limite30min = subMinutes(ahora, 30);

  // ── 1. Cancelar pedidos huérfanos ──────────────────────────────────────
  // Solo cancela pedidos SIN mesa y SIN delivery activo que llevan +12h.
  // Los pedidos de mesa se heredan al turno siguiente.
  const pedidosCancelados = await prisma.pedido.updateMany({
    where: {
      estado: { in: ["PENDIENTE", "EN_PROCESO"] },
      creadoEn: { lt: limite12h },
      mesaId: null,       // sin mesa = huérfano
      delivery: null,     // sin delivery activo
    },
    data: { estado: "CANCELADO" },
  });

  // ── 2. Liberar mesas sin ningún pedido activo ───────────────────────────
  // Las mesas que tienen pedidos pendientes o en proceso se heredan al turno
  // siguiente, por lo que NO se tocan aquí.
  const mesasOcupadas = await prisma.mesa.findMany({
    where: { estado: { in: ["OCUPADA", "CUENTA", "RESERVADA"] } },
    include: {
      pedidos: {
        where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
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

  // ── 3. Cerrar cajas abandonadas ─────────────────────────────────────────
  // Solo cierra cajas que llevan +16h abiertas Y no tuvieron actividad
  // en los últimos 30 min (ninguna venta reciente = turno terminado).
  const cajasAbiertas = await prisma.caja.findMany({
    where: {
      estado: "ABIERTA",
      abiertaEn: { lt: limite16h },
    },
    select: {
      id: true,
      ventas: {
        where: { creadoEn: { gte: limite30min } },
        select: { id: true },
        take: 1,
      },
    },
  });

  const cajasAbandonadas = cajasAbiertas
    .filter((c) => c.ventas.length === 0)
    .map((c) => c.id);

  const cajasCerradas = cajasAbandonadas.length > 0
    ? await prisma.caja.updateMany({
        where: { id: { in: cajasAbandonadas } },
        data: { estado: "CERRADA", cerradaEn: ahora },
      })
    : { count: 0 };

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
