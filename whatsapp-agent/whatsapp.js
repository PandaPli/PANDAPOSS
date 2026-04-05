// whatsapp.js — Multi-instance Baileys manager
'use strict';

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs   = require('fs');
const api  = require('./api');
const { procesarMensaje } = require('./bot/bot');

const logger = pino({ level: 'silent' });
const instances = new Map(); // agenteId → socket

async function extraerTexto(msg) {
  const m = msg.message;
  if (!m) return null;
  return m.conversation
    || m.extendedTextMessage?.text
    || m.imageMessage?.caption
    || m.buttonsResponseMessage?.selectedDisplayText
    || m.listResponseMessage?.title
    || null;
}

function authDir(agenteId) {
  const dir = path.join(__dirname, '.auth', String(agenteId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function iniciarAgente(agente) {
  const agenteId = agente.id;
  const sucursal = agente.sucursal;

  if (instances.has(agenteId)) {
    console.log(`[WA ${agenteId}] Ya iniciado`);
    return;
  }

  console.log(`[WA ${agenteId}] Iniciando agente para ${sucursal?.nombre}...`);

  const { state, saveCreds } = await useMultiFileAuthState(authDir(agenteId));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: [`PandaPoss-${agenteId}`, 'Chrome', '1.0'],
  });

  instances.set(agenteId, sock);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      // Store QR in PandaPoss for dashboard display
      const QRCode = require('qrcode-terminal');
      QRCode.generate(qr, { small: true });
      console.log(`[WA ${agenteId}] QR generado — escanear en dashboard`);
      // Convert QR to base64 image via qrcode library if available
      try {
        const qrcode = require('qrcode');
        const qrBase64 = await qrcode.toDataURL(qr);
        await api.patchAgente(agenteId, {
          estado: 'ESPERANDO_QR',
          qrBase64,
          qrExpiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        });
      } catch {
        await api.patchAgente(agenteId, { estado: 'ESPERANDO_QR' }).catch(() => {});
      }
    }

    if (connection === 'open') {
      console.log(`[WA ${agenteId}] ✅ Conectado`);
      const jid = sock.user?.id;
      const telefono = jid ? jid.split(':')[0].split('@')[0] : null;
      await api.patchAgente(agenteId, {
        estado: 'CONECTADO',
        telefono,
        ultimaConex: new Date().toISOString(),
        qrBase64: null,
      }).catch(() => {});
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`[WA ${agenteId}] Desconectado (código ${code}). Reconectar: ${shouldReconnect}`);
      instances.delete(agenteId);
      await api.patchAgente(agenteId, { estado: shouldReconnect ? 'DESCONECTADO' : 'ERROR' }).catch(() => {});
      if (shouldReconnect) {
        setTimeout(() => iniciarAgente(agente), 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.key.remoteJid?.endsWith('@s.whatsapp.net')) continue; // skip groups

      const texto = await extraerTexto(msg);
      if (!texto || texto.trim().length === 0) continue;

      const telefono = msg.key.remoteJid.replace('@s.whatsapp.net', '');
      console.log(`[WA ${agenteId}] Msg de ${telefono}: ${texto.slice(0, 60)}`);

      try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
        const respuesta = await procesarMensaje({ agenteId, sucursal, telefono, texto });
        if (respuesta) {
          await sock.sendMessage(msg.key.remoteJid, { text: respuesta });
        }
      } catch (e) {
        console.error(`[WA ${agenteId}] Error procesando mensaje:`, e.message);
      }
    }
  });
}

async function detenerAgente(agenteId) {
  const sock = instances.get(agenteId);
  if (sock) {
    await sock.logout().catch(() => {});
    instances.delete(agenteId);
    await api.patchAgente(agenteId, { estado: 'DESCONECTADO' }).catch(() => {});
    console.log(`[WA ${agenteId}] Detenido`);
  }
}

module.exports = { iniciarAgente, detenerAgente, instances };
