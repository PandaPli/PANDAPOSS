import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/cron/limpieza
 * Vercel Cron — corre a las 05:00 UTC (02:00 Chile) todos los domingos.
 *
 * Purga tablas que crecen sin límite:
 *  - Log: registros > 90 días
 *  - EventoPedido: eventos > 180 días
 *  - AgenteSesion: sesiones inactivas > 30 días
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const hace90d = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
  const hace180d = new Date(ahora.getTime() - 180 * 24 * 60 * 60 * 1000);
  const hace30d = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [logs, eventos, sesiones] = await Promise.all([
    prisma.log.deleteMany({ where: { creadoEn: { lt: hace90d } } }),
    prisma.eventoPedido.deleteMany({ where: { creadoEn: { lt: hace180d } } }),
    prisma.agenteSesion.deleteMany({ where: { updatedAt: { lt: hace30d } } }),
  ]);

  const resumen = {
    ok: true,
    ejecutadoEn: ahora.toISOString(),
    logsPurgados: logs.count,
    eventosPurgados: eventos.count,
    sesionesPurgadas: sesiones.count,
  };

  console.log("[limpieza]", resumen);
  return NextResponse.json(resumen);
}
