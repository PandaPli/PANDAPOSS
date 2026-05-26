import type { Server as SocketIOServer } from "socket.io";
import { AiMemoryService } from "@/server/services/ai-memory.service";

type AiPosEventPayload = {
  sucursalId: number;
  action: string;
  entity?: string;
  data?: unknown;
  createdAt?: string;
};

const globalForSocket = global as unknown as { io?: SocketIOServer };

export function emitAiPosEvent(payload: AiPosEventPayload) {
  const event = {
    ...payload,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  globalForSocket.io?.to(`sucursal_${payload.sucursalId}_ai`).emit("ai-pos:event", event);
  globalForSocket.io?.to(`sucursal_${payload.sucursalId}_kds`).emit("ai-pos:event", event);

  if (payload.entity === "pedido") {
    globalForSocket.io?.to(`sucursal_${payload.sucursalId}_kds`).emit("pedido:actualizado", payload.data);
  }

  if (payload.entity === "stock") {
    globalForSocket.io?.to(`sucursal_${payload.sucursalId}_alertas`).emit("stock:actualizado", payload.data);
  }

  void AiMemoryService.remember({
    sucursalId: payload.sucursalId,
    kind:
      payload.entity === "pedido"
        ? "order"
        : payload.entity === "kds"
        ? "kitchen"
        : payload.entity === "stock"
        ? "stock"
        : payload.entity === "mesa"
        ? "table"
        : "system",
    title: `Evento ${payload.action}`,
    content: JSON.stringify(payload.data ?? payload),
    metadata: { action: payload.action, entity: payload.entity },
    importance: payload.entity === "pedido" || payload.entity === "kds" ? 0.72 : 0.5,
  }).catch((error) => {
    console.error("[ai-memory:event]", error);
  });

  return event;
}
