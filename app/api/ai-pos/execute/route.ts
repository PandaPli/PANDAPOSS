import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AiPosService } from "@/server/services/ai-pos.service";

const WRITE_ROLES = ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "WAITER", "CHEF", "BAR"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { id: number; rol: string; sucursalId: number | null };
  if (!WRITE_ROLES.includes(user.rol)) {
    return NextResponse.json({ error: "Sin permisos para ejecutar acciones POS" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await AiPosService.execute(body, {
      userId: user.id,
      rol: user.rol,
      sucursalId: user.sucursalId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/ai-pos/execute]", error);
    return NextResponse.json({ error: error?.message ?? "No se pudo ejecutar la accion" }, { status: 400 });
  }
}
