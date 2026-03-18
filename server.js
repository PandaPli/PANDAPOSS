/**
 * PandaPoss — Servidor Custom Next.js + Socket.IO
 *
 * Ejecutar:  node server.js
 * Dev:       node server.js (NODE_ENV=development por defecto)
 * Prod:      NODE_ENV=production node server.js
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3001", 10);

const app    = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // ─── Socket.IO ───────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Exponer globalmente para que app/api/print/route.ts lo use
  global.io = io;

  io.on("connection", (socket) => {
    console.log(`[Socket] ${socket.id} conectado`);

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`[Socket] ${socket.id} unido a ${room}`);
    });

    socket.on("order:submit", (data) => {
      io.to(`tenant_${data.tenantId}_kds`).emit("order:created", data);
    });

    socket.on("driver:location", (data) => {
      io.to(`tenant_${data.tenantId}_dispatch`).emit("driver:location:update", data);
      (data.orderIds || []).forEach((id) => {
        io.to(`order_${id}_track`).emit("driver:location:update", data);
      });
    });

    // Agente de impresión local — se registra por sucursal
    socket.on("printer:register", (sucursalId) => {
      socket.join(`printer_${sucursalId}`);
      console.log(`[Printer] Agente registrado — sucursal ${sucursalId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] ${socket.id} desconectado`);
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
