/**
 * PandaPoss — Agente de Impresión Local (Windows - Impresora Térmica USB)
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
const { exec } = require("child_process");

// ──────────────────────────────────────────────
// CONFIGURACIÓN — ajustar por cada sucursal
// ──────────────────────────────────────────────
const SUCURSAL_ID   = 1;                        // <-- ID de esta sucursal
const SERVER_URL    = "https://pandaposs.com";  // <-- URL del servidor
const PRINTER_NAME  = "EPSON TM-T20";          // <-- Nombre exacto de la impresora en Windows
                                                //     (Panel de Control → Dispositivos e impresoras)
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

  // Escribir contenido a archivo temporal y enviarlo a la impresora via Windows
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const tmpFile = path.join(os.tmpdir(), `panda_print_${Date.now()}.txt`);

  try {
    fs.writeFileSync(tmpFile, content, { encoding: "utf8" });
    // Enviar a impresora via comando Windows
    exec(`print /D:"${PRINTER_NAME}" "${tmpFile}"`, (err) => {
      if (err) {
        console.error("[Agente] Error al imprimir:", err.message);
      } else {
        console.log("[Agente] Impreso OK");
      }
      // Limpiar archivo temporal
      try { fs.unlinkSync(tmpFile); } catch {}
    });
  } catch (err) {
    console.error("[Agente] Error:", err.message);
  }
});

socket.on("disconnect", () => {
  console.log("[Agente] Desconectado, reconectando...");
});
