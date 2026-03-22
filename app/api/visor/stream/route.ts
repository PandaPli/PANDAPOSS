import { NextRequest } from "next/server";
import { getVisorState, subscribeVisor } from "@/lib/visorBus";

// Forzar modo Edge-compatible (streaming real)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sucursalId = Number(req.nextUrl.searchParams.get("s"));
  if (!sucursalId || isNaN(sucursalId)) {
    return new Response("Falta parámetro s (sucursalId)", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Enviar estado actual inmediatamente (hidratación)
      const current = getVisorState(sucursalId);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(current)}\n\n`)
      );

      // 2. Suscribir a actualizaciones en tiempo real
      const unsub = subscribeVisor(sucursalId, (msg) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
          );
        } catch {
          // Cliente cerró la conexión
        }
      });

      // 3. Heartbeat cada 25s para mantener la conexión viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // 4. Limpiar al desconectar
      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* ya cerrado */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // Nginx: deshabilitar buffer
    },
  });
}
