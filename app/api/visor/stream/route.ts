import { NextRequest } from "next/server";
import { getVisorState, subscribeVisor } from "@/lib/visorBus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cajaId = Number(req.nextUrl.searchParams.get("c"));
  if (!cajaId || isNaN(cajaId)) {
    return new Response("Falta parámetro c (cajaId)", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Enviar estado actual inmediatamente (hidratación al reconectar)
      const current = getVisorState(cajaId);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(current)}\n\n`));

      // Suscribir a actualizaciones en tiempo real
      const unsub = subscribeVisor(cajaId, (msg) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        } catch {
          // Stream cerrado — limpiar listener para no acumular callbacks muertos
          unsub();
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* ya cerrado */ }
        }
      });

      // Heartbeat cada 25s para mantener la conexión viva a través de proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      req.signal.addEventListener("abort", () => {
        unsub();
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
