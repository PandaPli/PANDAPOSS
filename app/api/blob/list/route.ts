import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const result = await list({ limit: 1000, prefix: "productos/" });
  return NextResponse.json(result.blobs.map(b => ({ url: b.url, pathname: b.pathname, size: b.size })));
}
