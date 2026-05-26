import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AiPosService } from "@/server/services/ai-pos.service";

const READ_ROLES = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { id: number; rol: string; sucursalId: number | null };
  if (!READ_ROLES.includes(user.rol)) {
    return NextResponse.json({ error: "Sin permisos para consultar POS" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = await AiPosService.query(body, {
      userId: user.id,
      rol: user.rol,
      sucursalId: user.sucursalId,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("[POST /api/ai-pos/query]", error);
    return NextResponse.json({ error: error?.message ?? "No se pudo consultar PandaPoss" }, { status: 400 });
  }
}
