import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
// import Redis from "ioredis"; // Descomentar al integrar clúster Redis

// Variable global para dev (evita leaks en HMR)
const globalForSocket = global as unknown as { io?: SocketIOServer };

export function initializeRealtimeEngine(httpServer: NetServer): SocketIOServer {
  if (globalForSocket.io) {
    return globalForSocket.io;
  }

  /* 
   * Option 1: Memory Adapter (Single Instance)
   * Option 2: Redis Adapter (Multi Instance/Serverless scale via @socket.io/redis-adapter)
   */

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);

    // Autenticar y Unir a Salas (Tenant / Roles)
    socket.on("join-room", (room: string) => {
      socket.join(room);
      console.log(`[Socket] ${socket.id} unido a ${room}`);
    });

    // Eventos KDS y Pedidos
    socket.on("order:submit", (data) => {
      // Retransmitir al tenant correspondiente
      io.to(`tenant_${data.tenantId}_kds`).emit("order:created", data);
    });

    // Eventos de Repartidores (Cada 5s emitirá location)
    socket.on("driver:location", (data) => {
      // Guardarlo en memoria/Redis
      // y emitir al Center de Despacho del restaurante
      io.to(`tenant_${data.tenantId}_dispatch`).emit("driver:location:update", data);
      
      // y emitir al cliente final si hay un pedido activo
      if (data.orderIds && data.orderIds.length > 0) {
        data.orderIds.forEach((id: number) => {
           io.to(`order_${id}_track`).emit("driver:location:update", data);
        });
      }
    });

    // Agente de impresión local por sucursal
    socket.on("printer:register", (sucursalId: number) => {
      socket.join(`printer_${sucursalId}`);
      console.log(`[Printer] Agente registrado para sucursal ${sucursalId}`);
    });

    // Sala del KDS (pedidos en tiempo real)
    socket.on("kds:join", (sucursalId: number) => {
      socket.join(`sucursal_${sucursalId}_kds`);
    });

    // Sala de alertas operacionales (stock bajo, etc.)
    socket.on("alertas:join", (sucursalId: number) => {
      socket.join(`sucursal_${sucursalId}_alertas`);
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
