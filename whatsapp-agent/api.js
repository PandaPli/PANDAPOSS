// api.js — Cliente para la API de PandaPoss
require('dotenv').config();
const fetch = require('node-fetch');

const BASE = process.env.PANDAPOSS_URL || 'https://pandaposs.com';
const KEY  = process.env.AGENTE_API_KEY || '';

function headers() {
  return { 'Content-Type': 'application/json', 'x-agente-key': KEY };
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

module.exports = {
  // Agentes activos
  listarAgentes: () => req('GET', '/api/agente'),
  getAgente: (id) => req('GET', `/api/agente/${id}`),
  patchAgente: (id, data) => req('PATCH', `/api/agente/${id}`, data),

  // Productos del menú
  getProductos: (agenteId) => req('GET', `/api/agente/${agenteId}/productos`),

  // Clientes
  getCliente: (agenteId, telefono) => req('GET', `/api/agente/${agenteId}/cliente/${encodeURIComponent(telefono)}`),
  upsertCliente: (agenteId, data) => req('POST', `/api/agente/${agenteId}/cliente`, data),

  // Sesiones
  getSesion: (agenteId, telefono) => req('GET', `/api/agente/${agenteId}/sesion/${encodeURIComponent(telefono)}`),
  putSesion: (agenteId, telefono, data) => req('PUT', `/api/agente/${agenteId}/sesion/${encodeURIComponent(telefono)}`, data),

  // Pedidos
  crearPedido: (agenteId, data) => req('POST', `/api/agente/${agenteId}/pedido`, data),
};
