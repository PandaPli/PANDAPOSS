import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pushVisorState, type VisorMsg } from "@/lib/visorBus";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body: VisorMsg & { cajaId?: number } = await req.json();

  if (!body.cajaId) {
    return NextResponse.json({ error: "Falta cajaId" }, { status: 400 });
  }

  const { cajaId, ...msg } = body;
  pushVisorState(cajaId, msg as VisorMsg);

  return NextResponse.json({ ok: true });
}
