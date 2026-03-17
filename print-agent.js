/**
 * PandaPoss — Agente de Impresión Local
 *
 * Instalar dependencia:   npm install socket.io-client
 * Ejecutar:               node print-agent.js
 *
 * Para que corra siempre en el PC:
 *   npm install -g pm2
 *   pm2 start print-agent.js --name "agente-impresora"
 *   pm2 startup
 *   pm2 save
 */

const { io } = require("socket.io-client");
const fs = require("fs");

// ──────────────────────────────────────────────
// CONFIGURACIÓN — ajustar por cada sucursal
// ──────────────────────────────────────────────
const SUCURSAL_ID = 1;                         // <-- ID de esta sucursal
const SERVER_URL  = "https://pandaposs.com";   // <-- URL del servidor
const PRINTER_PATH = "/dev/usb/lp0";           // <-- ruta de la impresora (Linux/Mac)
                                               //     En Windows usar algo como "\\\\?\\COM3"
// ──────────────────────────────────────────────

const socket = io(SERVER_URL, {
  path: "/api/socket/io",
  reconnectionDelay: 3000,
  reconnectionAttempts: Infinity,
});

socket.on("connect", () => {
  console.log(`[Agente] Conectado. Registrando sucursal ${SUCURSAL_ID}...`);
  socket.emit("printer:register", SUCURSAL_ID);
});

socket.on("printer:print", ({ content }) => {
  console.log("[Agente] Trabajo de impresión recibido");
  try {
    fs.writeFileSync(PRINTER_PATH, content);
    console.log("[Agente] Impreso OK");
  } catch (err) {
    console.error("[Agente] Error al imprimir:", err.message);
  }
});

socket.on("disconnect", () => {
  console.log("[Agente] Desconectado, reconectando...");
});
