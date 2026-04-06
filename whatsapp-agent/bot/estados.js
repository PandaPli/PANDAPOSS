// estados.js — Máquina de estados con persistencia en PandaPoss API
const api = require('../api');

const ESTADOS = {
  NUEVO: 'NUEVO',
  SALUDO: 'SALUDO',
  ORDENANDO: 'ORDENANDO',
  ESPERANDO_OBSERVACION: 'ESPERANDO_OBSERVACION',
  RETIRO_O_DELIVERY: 'RETIRO_O_DELIVERY',
  CONFIRMANDO_DIRECCION: 'CONFIRMANDO_DIRECCION',
  ESPERANDO_PAGO: 'ESPERANDO_PAGO',
  ESPERANDO_PALITOS: 'ESPERANDO_PALITOS',
  CONFIRMANDO_PEDIDO: 'CONFIRMANDO_PEDIDO',
  COMPLETADO: 'COMPLETADO',
};

// Cache local para reducir llamadas API (se invalida cada 60s por inactividad)
const _cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minuto

function _cacheKey(agenteId, telefono) { return `${agenteId}:${telefono}`; }

async function obtenerSesion(agenteId, telefono) {
  const key = _cacheKey(agenteId, telefono);
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  let sesion = await api.getSesion(agenteId, telefono).catch(() => null);
  if (!sesion) {
    sesion = {
      estado: ESTADOS.NUEVO,
      carritoJson: [],
      contextoJson: { tipoEntrega: null, direccionEntrega: null, metodoPago: null, palitos: null, observacion: null },
      historialJson: [],
    };
  } else {
    sesion.estado = sesion.estado || ESTADOS.NUEVO;
    sesion.carritoJson = sesion.carritoJson || [];
    sesion.contextoJson = sesion.contextoJson || { tipoEntrega: null, direccionEntrega: null, metodoPago: null, palitos: null, observacion: null };
    sesion.historialJson = sesion.historialJson || [];
  }
  _cache.set(key, { data: sesion, ts: Date.now() });
  return sesion;
}

async function guardarSesion(agenteId, telefono, sesion) {
  const key = _cacheKey(agenteId, telefono);
  _cache.set(key, { data: sesion, ts: Date.now() });
  api.putSesion(agenteId, telefono, {
    estado: sesion.estado,
    carritoJson: sesion.carritoJson,
    contextoJson: sesion.contextoJson,
    historialJson: sesion.historialJson,
  }).catch(e => console.error('[sesion] Error al guardar:', e.message));
}

async function actualizarEstado(agenteId, telefono, nuevoEstado) {
  const sesion = await obtenerSesion(agenteId, telefono);
  sesion.estado = nuevoEstado;
  await guardarSesion(agenteId, telefono, sesion);
  return sesion;
}

async function actualizarContexto(agenteId, telefono, campos) {
  const sesion = await obtenerSesion(agenteId, telefono);
  sesion.contextoJson = { ...sesion.contextoJson, ...campos };
  await guardarSesion(agenteId, telefono, sesion);
  return sesion;
}

async function agregarAlCarrito(agenteId, telefono, item) {
  const sesion = await obtenerSesion(agenteId, telefono);
  const carrito = sesion.carritoJson;
  const existing = carrito.find(i => i.nombre_producto === item.nombre_producto);
  if (existing) {
    existing.cantidad = (existing.cantidad || 1) + (item.cantidad || 1);
  } else {
    carrito.push({ ...item, cantidad: item.cantidad || 1 });
  }
  sesion.carritoJson = carrito;
  await guardarSesion(agenteId, telefono, sesion);
  return carrito;
}

async function limpiarSesion(agenteId, telefono) {
  const sesion = {
    estado: ESTADOS.SALUDO,
    carritoJson: [],
    contextoJson: { tipoEntrega: null, direccionEntrega: null, metodoPago: null, palitos: null, observacion: null },
    historialJson: [],
  };
  await guardarSesion(agenteId, telefono, sesion);
  return sesion;
}

async function agregarAlHistorial(agenteId, telefono, role, content) {
  const sesion = await obtenerSesion(agenteId, telefono);
  const hist = sesion.historialJson || [];
  hist.push({ role, content });
  sesion.historialJson = hist.slice(-20);
  await guardarSesion(agenteId, telefono, sesion);
}

module.exports = { ESTADOS, obtenerSesion, guardarSesion, actualizarEstado, actualizarContexto, agregarAlCarrito, limpiarSesion, agregarAlHistorial };
