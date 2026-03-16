import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/demo-reset
 * Llamado por Vercel Cron cada día a las 04:00 UTC.
 * Delega al endpoint /api/demo/reset con el secreto interno.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/demo/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": process.env.CRON_SECRET ?? "",
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
