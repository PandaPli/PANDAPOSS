import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AiMemoryService } from "@/server/services/ai-memory.service";
import type { AiMemoryKind } from "@/server/services/ai-memory.types";

const WRITE_ROLES = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { id: number; rol: string; sucursalId: number | null };
  if (!WRITE_ROLES.includes(user.rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const sucursalId = Number(body.sucursalId ?? user.sucursalId);
  if (!sucursalId) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });
  if (!body.title || !body.content || !body.kind) {
    return NextResponse.json({ error: "kind, title y content requeridos" }, { status: 400 });
  }

  try {
    const result = await AiMemoryService.remember({
      sucursalId,
      userId: user.id,
      kind: body.kind as AiMemoryKind,
      title: String(body.title),
      content: String(body.content),
      metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
      importance: typeof body.importance === "number" ? body.importance : 0.5,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("[POST /api/ai-memory/remember]", error);
    return NextResponse.json({ error: error?.message ?? "No se pudo guardar memoria" }, { status: 400 });
  }
}
