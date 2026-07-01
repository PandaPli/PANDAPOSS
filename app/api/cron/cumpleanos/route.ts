import { NextRequest, NextResponse } from "next/server";
import { enviarCuponesCumpleanos } from "@/server/services/cumpleanos.service";

// GET /api/cron/cumpleanos
// Vercel Cron — todos los días a las 09:00 Chile (12:00 UTC)
// Detecta clientes con cumpleaños hoy y les envía cupón + WhatsApp.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await enviarCuponesCumpleanos();
  console.log(`[Cron cumpleaños] enviados=${result.enviados} omitidos=${result.omitidos}`);
  return NextResponse.json(result);
}
