import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { recoverPendingPayments } from "@/server/services/mp-recovery.service";

// POST /api/mercadopago/recover-pending
// Heartbeat llamado desde el KDS cada ~2 min.
// Requiere sesión autenticada + rate limiting global.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Rate limit GLOBAL (no por IP): solo 1 ejecución cada 90s entre todos
  // los KDS abiertos. Evita martillar la API de MP si hay múltiples tabs.
  const rl = rateLimit("mp:recover:global", { max: 1, windowMs: 90_000 });
  if (!rl.allowed) {
    return NextResponse.json({ recovered: 0, throttled: true });
  }

  const result = await recoverPendingPayments();
  return NextResponse.json({ recovered: result.recovered, checked: result.checked });
}
