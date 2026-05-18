import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getToken } from "next-auth/jwt";
// import Redis from "ioredis"; // Descomentar al integrar clúster Redis

interface SocketAuth {
  userId: number;
  sucursalId: number | null;
  rol: string;
}

const globalForSocket = global as unknown as { io?: SocketIOServer };

export function initializeRealtimeEngine(httpServer: NetServer): SocketIOServer {
  if (globalForSocket.io) {
    return globalForSocket.io;
  }

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Middleware: autenticar con JWT de NextAuth
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie ?? "";
      const raw = Object.fromEntries(
        cookie.split(";").map((c) => {
          const [k, ...v] = c.trim().split("=");
          return [k, v.join("=")];
        })
      );
      const tokenName =
        raw["__Secure-next-auth.session-token"] !== undefined
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token";

      const token = await getToken({
        req: { headers: { cookie }, cookies: raw } as any,
        secret: process.env.NEXTAUTH_SECRET!,
        cookieName: tokenName,
      });

      if (!token || !token.id) return next(new Error("No autorizado"));

      (socket.data as SocketAuth).userId = token.id as number;
      (socket.data as SocketAuth).sucursalId = (token.sucursalId as number) ?? null;
      (socket.data as SocketAuth).rol = token.rol as string;
      next();
    } catch {
      next(new Error("No autorizado"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data as SocketAuth;
    console.log(`[Socket] Conectado: ${socket.id} (user=${auth.userId}, suc=${auth.sucursalId})`);

    // Solo permite unirse a rooms de su propia sucursal
    socket.on("join-room", (room: string) => {
      if (!auth.sucursalId) return;
      const allowed =
        room === `sucursal_${auth.sucursalId}_kds` ||
        room === `sucursal_${auth.sucursalId}_alertas` ||
        room === `printer_${auth.sucursalId}` ||
        room === `tenant_${auth.sucursalId}_kds` ||
        room === `tenant_${auth.sucursalId}_dispatch`;
      if (!allowed) return;
      socket.join(room);
    });

    socket.on("order:submit", (data) => {
      if (!auth.sucursalId) return;
      io.to(`tenant_${auth.sucursalId}_kds`).emit("order:created", data);
    });

    socket.on("driver:location", (data) => {
      if (auth.rol !== "DELIVERY" || !auth.sucursalId) return;
      io.to(`tenant_${auth.sucursalId}_dispatch`).emit("driver:location:update", {
        ...data,
        tenantId: auth.sucursalId,
        driverId: auth.userId,
      });

      if (Array.isArray(data.orderIds)) {
        for (const id of data.orderIds) {
          if (typeof id === "number" && id > 0) {
            io.to(`order_${id}_track`).emit("driver:location:update", {
              ...data,
              tenantId: auth.sucursalId,
              driverId: auth.userId,
            });
          }
        }
      }
    });

    socket.on("printer:register", (sucursalId: number) => {
      if (sucursalId !== auth.sucursalId) return;
      socket.join(`printer_${sucursalId}`);
    });

    socket.on("kds:join", (sucursalId: number) => {
      if (sucursalId !== auth.sucursalId) return;
      socket.join(`sucursal_${sucursalId}_kds`);
    });

    socket.on("alertas:join", (sucursalId: number) => {
      if (sucursalId !== auth.sucursalId) return;
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
