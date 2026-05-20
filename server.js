/**
 * PandaPoss — Servidor Custom Next.js + Socket.IO
 *
 * Ejecutar:  node server.js
 * Dev:       node server.js (NODE_ENV=development por defecto)
 * Prod:      NODE_ENV=production node server.js
 *
 * SEGURIDAD: Socket.IO usa middleware JWT de NextAuth para autenticar
 * cada conexión. Los eventos solo se emiten a rooms de la sucursal
 * del usuario autenticado — nunca a rooms arbitrarias.
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");
const { getToken } = require("next-auth/jwt");

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3001", 10);

const app    = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // ─── Socket.IO (con autenticación JWT) ───────────────────
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Exponer globalmente para que los route handlers lo usen
  global.io = io;

  // Middleware: autenticar con JWT de NextAuth (misma lógica que realtime.ts)
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
        req: { headers: { cookie }, cookies: raw },
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: tokenName,
      });

      if (!token || !token.id) return next(new Error("No autorizado"));

      socket.data.userId = token.id;
      socket.data.sucursalId = token.sucursalId ?? null;
      socket.data.rol = token.rol;
      next();
    } catch {
      next(new Error("No autorizado"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data;
    console.log(`[Socket] Conectado: ${socket.id} (user=${auth.userId}, suc=${auth.sucursalId})`);

    // Solo permite unirse a rooms de su propia sucursal
    socket.on("join-room", (room) => {
      if (!auth.sucursalId) return;
      const allowed =
        room === `sucursal_${auth.sucursalId}_kds` ||
        room === `sucursal_${auth.sucursalId}_alertas` ||
        room === `printer_${auth.sucursalId}` ||
        room === `tenant_${auth.sucursalId}_kds` ||
        room === `tenant_${auth.sucursalId}_dispatch` ||
        room === `sucursal_${auth.sucursalId}_dispatch`;
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

    // Agente de impresión local — solo su propia sucursal
    socket.on("printer:register", (sucursalId) => {
      if (sucursalId !== auth.sucursalId) return;
      socket.join(`printer_${sucursalId}`);
      console.log(`[Printer] Agente registrado — sucursal ${sucursalId}`);
    });

    socket.on("kds:join", (sucursalId) => {
      if (sucursalId !== auth.sucursalId) return;
      socket.join(`sucursal_${sucursalId}_kds`);
    });

    socket.on("alertas:join", (sucursalId) => {
      if (sucursalId !== auth.sucursalId) return;
      socket.join(`sucursal_${sucursalId}_alertas`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Desconectado: ${socket.id}`);
    });
  });
  // ─────────────────────────────────────────────────────────

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> PandaPoss listo en http://localhost:${port}`);
  });
});
