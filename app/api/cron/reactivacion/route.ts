import { NextRequest, NextResponse } from "next/server";
import { reactivarClientesInactivos } from "@/server/services/reactivacion.service";

// GET /api/cron/reactivacion
// Vercel Cron — lunes a las 15:00 UTC (12:00 Chile)
// Detecta clientes inactivos (30-90 días) y les envía cupón de reactivación.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await reactivarClientesInactivos();
  console.log(`[Cron reactivación] procesados=${result.procesados} cupones=${result.cuponesCreados} mensajes=${result.mensajesEncolados}`);
  return NextResponse.json(result);
}
