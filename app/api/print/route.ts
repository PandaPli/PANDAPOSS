import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emitPrintJob } from "@/server/services/realtime";
import { Server as SocketIOServer } from "socket.io";

const globalForSocket = global as unknown as { io?: SocketIOServer };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { sucursalId, content } = await req.json();
  if (!sucursalId || !content) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  if (!globalForSocket.io) {
    return NextResponse.json({ error: "Socket no inicializado" }, { status: 500 });
  }

  emitPrintJob(globalForSocket.io, sucursalId, content);
  return NextResponse.json({ ok: true });
}
