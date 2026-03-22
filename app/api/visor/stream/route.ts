import { NextRequest } from "next/server";
import { subscribeVisor, getVisorStateMem, type VisorMsg } from "@/lib/visorBus";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lee el estado del visor desde la DB (fuente de verdad para todos los workers) */
async function readVisorStateFromDB(cajaId: number): Promise<VisorMsg | null> {
  try {
    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
      select: { visorEstado: true },
    });
    if (!caja?.visorEstado) return null;
    return JSON.parse(caja.visorEstado) as VisorMsg;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const cajaId = Number(req.nextUrl.searchParams.get("c"));
  if (!cajaId || isNaN(cajaId)) {
    return new Response("Falta parámetro c (cajaId)", { status: 400 });
  }

  const encoder = new TextEncoder();

  // Estado inicial: DB primero, luego memoria del proceso
  const dbState  = await readVisorStateFromDB(cajaId);
  const initMsg: VisorMsg = dbState ?? getVisorStateMem(cajaId) ?? { type: "idle" };

  const stream = new ReadableStream({
    start(controller) {
      // Enviar estado actual inmediatamente al conectar/reconectar
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initMsg)}\n\n`));
      let lastSentJson = JSON.stringify(initMsg);

      // Suscribir a notificaciones del mismo proceso (respuesta instantánea)
      const unsub = subscribeVisor(cajaId, (msg) => {
        const json = JSON.stringify(msg);
        lastSentJson = json;
        try {
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        } catch {
          cleanup();
        }
      });

      // Poll DB cada 1 s — detecta cambios de OTROS workers PM2
      const dbPoll = setInterval(async () => {
        try {
          const state = await readVisorStateFromDB(cajaId);
          if (!state) return;
          const json = JSON.stringify(state);
          if (json !== lastSentJson) {
            lastSentJson = json;
            controller.enqueue(encoder.encode(`data: ${json}\n\n`));
          }
        } catch { /* poll silencioso */ }
      }, 1_000);

      // Heartbeat cada 20 s — detecta conexiones silenciosamente muertas
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`));
        } catch {
          cleanup();
        }
      }, 20_000);

      function cleanup() {
        unsub();
        clearInterval(dbPoll);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* ya cerrado */ }
      }

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
