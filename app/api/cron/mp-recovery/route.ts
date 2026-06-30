import { NextRequest, NextResponse } from "next/server";
import { recoverPendingPayments } from "@/server/services/mp-recovery.service";

// GET /api/cron/mp-recovery
// Vercel Cron — cada 2 min busca pedidos con mpStatus="pending_payment"
// atascados y consulta la API de MP para recuperarlos.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await recoverPendingPayments();
  return NextResponse.json(result);
}
