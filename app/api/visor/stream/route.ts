import { NextRequest } from "next/server";
import { getVisorState, getVisorStateFromDisk, subscribeVisor } from "@/lib/visorBus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cajaId = Number(req.nextUrl.searchParams.get("c"));
  if (!cajaId || isNaN(cajaId)) {
    return new Response("Falta parámetro c (cajaId)", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Enviar estado actual inmediatamente (hidratación al conectar/reconectar)
      const current = getVisorState(cajaId);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(current)}\n\n`));

      let lastSentJson = JSON.stringify(current);

      // Suscribir a actualizaciones del mismo proceso (respuesta inmediata)
      const unsub = subscribeVisor(cajaId, (msg) => {
        const json = JSON.stringify(msg);
        lastSentJson = json;
        try {
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        } catch {
          unsub();
          clearInterval(filePoll);
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* ya cerrado */ }
        }
      });

      // Poll al disco cada 2 s — detecta cambios de otros workers PM2
      const filePoll = setInterval(() => {
        try {
          const diskState = getVisorStateFromDisk(cajaId);
          const json = JSON.stringify(diskState);
          if (json !== lastSentJson) {
            lastSentJson = json;
            controller.enqueue(encoder.encode(`data: ${json}\n\n`));
          }
        } catch {
          clearInterval(filePoll);
        }
      }, 2_000);

      // Heartbeat cada 20 s — detecta conexiones silenciosamente muertas
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(filePoll);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* ya cerrado */ }
      });
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
