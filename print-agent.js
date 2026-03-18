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

const { io }    = require("socket.io-client");
const { exec }  = require("child_process");
const net       = require("net");
const fs        = require("fs");
const os        = require("os");
const path      = require("path");

// ══════════════════════════════════════════════════
// CONFIGURACIÓN — ajustar por cada sucursal
// ══════════════════════════════════════════════════

const SUCURSAL_ID  = 1;                         // ID de esta sucursal en el sistema
const SERVER_URL   = "https://pandaposs.com";   // URL del servidor PandaPoss

//  Tipo de conexión a la impresora:
//    "network" → Impresora en red (recomendado, más confiable)
//    "usb"     → Impresora USB conectada al PC
const PRINT_TYPE   = "usb";

//  Para PRINT_TYPE = "network":
const PRINTER_IP   = "192.168.1.100";          // IP de la impresora en la red local
const PRINTER_PORT = 9100;                       // Puerto RAW (EPSON usa 9100)

//  Para PRINT_TYPE = "usb":
const PRINTER_NAME = "EPSON TM-T20";           // Nombre exacto en Windows
                                                 // (Panel de Control → Dispositivos e impresoras)
// ══════════════════════════════════════════════════

// Comandos ESC/POS básicos
const ESC       = "\x1B";
const GS        = "\x1D";
const INIT      = ESC + "@";           // Inicializar impresora
const CUT_FULL  = GS + "V" + "\x00";  // Corte total de papel
const LF        = "\n";

/** Imprime vía red (TCP puerto 9100) — más confiable */
function printViaNetwork(rawBytes) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let errored = false;

    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      client.write(rawBytes, () => {
        client.destroy();
        resolve();
      });
    });

    client.on("error", (err) => {
      if (!errored) { errored = true; reject(err); }
    });

    client.setTimeout(5000, () => {
      if (!errored) { errored = true; client.destroy(); reject(new Error("Timeout de conexión")); }
    });
  });
}

/** Imprime vía USB usando comando Windows */
function printViaUsb(rawBytes) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `panda_${Date.now()}.prn`);
    fs.writeFileSync(tmpFile, rawBytes);
    exec(`print /D:"${PRINTER_NAME}" "${tmpFile}"`, (err) => {
      try { fs.unlinkSync(tmpFile); } catch { /* ignorar */ }
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Envuelve el contenido de texto con comandos ESC/POS */
function buildEscPosPayload(content) {
  // Buffer: init + contenido (latin1) + 3 avances + corte
  const parts = [
    Buffer.from(INIT, "binary"),
    Buffer.from(content, "utf8"),
    Buffer.from(LF + LF + LF, "binary"),
    Buffer.from(CUT_FULL, "binary"),
  ];
  return Buffer.concat(parts);
}

// ──────────────────────────────────────────────
// Conexión Socket.IO al servidor
// ──────────────────────────────────────────────

const socket = io(SERVER_URL, {
  path: "/api/socket/io",
  reconnectionDelay: 3000,
  reconnectionAttempts: Infinity,
});

socket.on("connect", () => {
  console.log(`[Agente] Conectado al servidor. Registrando sucursal ${SUCURSAL_ID}...`);
  socket.emit("printer:register", SUCURSAL_ID);
});

socket.on("printer:print", async ({ content }) => {
  console.log(`[Agente] Trabajo de impresión recibido (${content.length} chars)`);

  const payload = buildEscPosPayload(content);

  try {
    if (PRINT_TYPE === "network") {
      await printViaNetwork(payload);
    } else {
      await printViaUsb(payload);
    }
    console.log("[Agente] ✓ Impreso correctamente");
  } catch (err) {
    console.error("[Agente] ✗ Error al imprimir:", err.message);
  }
});

socket.on("disconnect", () => {
  console.log("[Agente] Desconectado del servidor — reconectando...");
});

socket.on("connect_error", (err) => {
  console.error("[Agente] Error de conexión:", err.message);
});
