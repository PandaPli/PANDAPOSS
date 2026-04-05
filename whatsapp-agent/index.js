// index.js — PandaPoss WhatsApp Agent Manager
// Corre localmente via PM2. Gestiona una instancia Baileys por sucursal PRIME activa.
'use strict';

require('dotenv').config();
const api = require('./api');
const { iniciarAgente, detenerAgente, instances } = require('./whatsapp');

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 30000;

console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║   🐼  PANDAPOSS WHATSAPP AGENT v1.0      ║');
console.log('║   Agentes WhatsApp multi-sucursal PRIME   ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log(`Servidor: ${process.env.PANDAPOSS_URL || 'https://pandaposs.com'}`);
console.log(`Poll interval: ${POLL_INTERVAL / 1000}s`);
console.log('');

async function sincronizarAgentes() {
  try {
    const agentes = await api.listarAgentes();
    const activos = agentes.filter(a => a.activo);
    const activoIds = new Set(activos.map(a => a.id));

    // Detener agentes que ya no están activos
    for (const [id] of instances) {
      if (!activoIds.has(id)) {
        console.log(`[Manager] Deteniendo agente ${id} (desactivado)`);
        await detenerAgente(id);
      }
    }

    // Iniciar agentes activos que no están corriendo
    for (const agente of activos) {
      if (!instances.has(agente.id)) {
        await iniciarAgente(agente);
      }
    }
  } catch (e) {
    console.error('[Manager] Error al sincronizar agentes:', e.message);
  }
}

// Arrange for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Manager] Cerrando agentes...');
  for (const [id] of instances) await detenerAgente(id);
  process.exit(0);
});

// Initial sync then poll
sincronizarAgentes();
setInterval(sincronizarAgentes, POLL_INTERVAL);
