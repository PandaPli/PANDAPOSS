import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pushVisorState, type VisorMsg } from "@/lib/visorBus";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sucursalId = (session.user as { sucursalId?: number | null }).sucursalId;
  if (!sucursalId) {
    return NextResponse.json({ error: "Sin sucursal" }, { status: 400 });
  }

  const body: VisorMsg = await req.json();
  pushVisorState(sucursalId, body);

  return NextResponse.json({ ok: true });
}
