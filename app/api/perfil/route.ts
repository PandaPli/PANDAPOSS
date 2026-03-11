import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UsuarioRepo } from "@/server/repositories/usuario.repo";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = (session.user as { id: number }).id;
  try {
    const u = await UsuarioRepo.update(id, {});
    return NextResponse.json(u);
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = (session.user as { id: number }).id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { nombre, password } = body as { nombre?: string; password?: string };
  const data: Record<string, unknown> = {};
  if (nombre) data.nombre = nombre.trim();

  try {
    const updated = await UsuarioRepo.update(id, data, password || undefined);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/perfil:", err);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
