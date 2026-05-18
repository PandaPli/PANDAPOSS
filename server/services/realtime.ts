import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
// import Redis from "ioredis"; // Descomentar al integrar clúster Redis

// Variable global para dev (evita leaks en HMR)
const globalForSocket = global as unknown as { io?: SocketIOServer };

/** Valida que `sucursalId` sea un entero positivo antes de unir a rooms */
function validarSucursalId(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function initializeRealtimeEngine(httpServer: NetServer): SocketIOServer {
  if (globalForSocket.io) {
    return globalForSocket.io;
  }

  // Restringir CORS al dominio de la app — en dev acepta localhost
  const allowedOrigins = process.env.NEXTAUTH_URL
    ? [process.env.NEXTAUTH_URL, "http://localhost:3000"]
    : ["http://localhost:3000"];

  /*
   * Option 1: Memory Adapter (Single Instance)
   * Option 2: Redis Adapter (Multi Instance/Serverless scale via @socket.io/redis-adapter)
   */

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    pingInterval: 25_000,
    pingTimeout: 60_000,
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);

    // Unirse a una sala arbitraria (solo usada internamente por módulos conocidos)
    socket.on("join-room", (room: string) => {
      if (typeof room !== "string" || room.length > 100) return;
      socket.join(room);
    });

    // Sala del KDS (pedidos en tiempo real)
    socket.on("kds:join", (raw: unknown) => {
      const sucursalId = validarSucursalId(raw);
      if (!sucursalId) return;
      socket.join(`sucursal_${sucursalId}_kds`);
    });

    // Abandonar sala del KDS (necesario al cambiar de sucursal sin reconectar)
    socket.on("kds:leave", (raw: unknown) => {
      const sucursalId = validarSucursalId(raw);
      if (!sucursalId) return;
      socket.leave(`sucursal_${sucursalId}_kds`);
    });

    // Sala de alertas operacionales (stock bajo, etc.)
    socket.on("alertas:join", (raw: unknown) => {
      const sucursalId = validarSucursalId(raw);
      if (!sucursalId) return;
      socket.join(`sucursal_${sucursalId}_alertas`);
    });

    // Sala de seguimiento de pedido individual (kiosko / cliente)
    socket.on("pedido:join", (raw: unknown) => {
      const pedidoId = validarSucursalId(raw); // misma validación: entero positivo
      if (!pedidoId) return;
      socket.join(`pedido_${pedidoId}_pago`);
    });

    // Agente de impresión local por sucursal
    socket.on("printer:register", (raw: unknown) => {
      const sucursalId = validarSucursalId(raw);
      if (!sucursalId) return;
      socket.join(`printer_${sucursalId}`);
      console.log(`[Printer] Agente registrado para sucursal ${sucursalId}`);
    });

    // Eventos de Repartidores (el endpoint REST /api/driver/location hace la emisión real;
    // este handler queda para clientes que aún usan socket directo)
    socket.on("driver:location", (data) => {
      const tenantId = validarSucursalId(data?.tenantId);
      if (!tenantId) return;
      io.to(`tenant_${tenantId}_dispatch`).emit("driver:location:update", data);
      if (Array.isArray(data.orderIds)) {
        data.orderIds.forEach((id: unknown) => {
          const oid = validarSucursalId(id);
          if (oid) io.to(`order_${oid}_track`).emit("driver:location:update", data);
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Desconectado: ${socket.id}`);
    });
  });

  globalForSocket.io = io;
  return io;
}

export function emitPrintJob(io: SocketIOServer, sucursalId: number, content: string) {
  io.to(`printer_${sucursalId}`).emit("printer:print", { content });
}
