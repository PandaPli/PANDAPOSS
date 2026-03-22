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

      // Heartbeat cada 20s — como dato real para que el cliente pueda
      // detectar si la conexión sigue viva (los comentarios SSE no son detectables)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

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
