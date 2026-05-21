import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeVoiceTool } from "@/lib/voice/executor";
import { rateLimit } from "@/lib/rateLimit";
import type { Rol } from "@/types";

/**
 * POST /api/voice/action
 *
 * Ejecuta una herramienta POS invocada por el modelo OpenAI Realtime.
 * El frontend intercepta el evento function_call del data channel WebRTC,
 * envia los argumentos aqui, y retransmite el resultado al modelo.
 *
 * Body: { name: string, arguments: Record<string, unknown> }
 * Response: { ok: boolean, message: string, data?: unknown }
 */

// Roles que pueden usar voz (excluir CHEF y BAR que solo ven KDS)
const VOICE_ROLES: Rol[] = ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "WAITER", "SECRETARY"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as { id: number; rol: Rol; sucursalId: number | null };

  // Rate limiting: 30 tool calls por minuto por usuario
  const rl = rateLimit(`voice:action:${user.id}`, { max: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas acciones de voz. Espera un momento." }, { status: 429 });
  }

  // Verificar rol
  if (!VOICE_ROLES.includes(user.rol)) {
    return NextResponse.json({ error: "Tu rol no tiene acceso a comandos de voz." }, { status: 403 });
  }

  let body: { name?: string; arguments?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { name, arguments: args } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Falta el nombre de la herramienta" }, { status: 400 });
  }

  const result = await executeVoiceTool(name, args ?? {}, {
    userId: user.id,
    sucursalId: user.sucursalId,
    rol: user.rol,
  });

  return NextResponse.json(result);
}
