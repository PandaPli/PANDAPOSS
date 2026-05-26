import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AiMemoryService } from "@/server/services/ai-memory.service";
import type { AiMemoryKind } from "@/server/services/ai-memory.types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { id: number; rol: string; sucursalId: number | null };
  if (!user.sucursalId && user.rol !== "ADMIN_GENERAL") {
    return NextResponse.json({ error: "Usuario sin sucursal" }, { status: 400 });
  }

  const body = await req.json();
  const sucursalId = Number(body.sucursalId ?? user.sucursalId);
  if (!sucursalId) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });

  try {
    const context = await AiMemoryService.buildContext({
      sucursalId,
      userId: user.id,
      query: String(body.query ?? ""),
      kinds: Array.isArray(body.kinds) ? (body.kinds as AiMemoryKind[]) : undefined,
    });

    return NextResponse.json({ ok: true, context });
  } catch (error: any) {
    console.error("[POST /api/ai-memory/context]", error);
    return NextResponse.json({ error: error?.message ?? "No se pudo construir contexto" }, { status: 400 });
  }
}
