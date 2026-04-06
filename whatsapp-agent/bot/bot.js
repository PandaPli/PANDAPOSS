// bot.js — BamPai Sushi WhatsApp Agent
'use strict';

const { ESTADOS, obtenerSesion, actualizarEstado, actualizarContexto, agregarAlCarrito, limpiarSesion, agregarAlHistorial } = require('./estados');
const { INTENCIONES, detectarIntencion, extraerItemsPedido } = require('./intentParser');
const { generarRespuesta, iaDisponible } = require('./llm');
const { get: msg } = require('./mensajes');
const api = require('../api');

const TEST = process.env.TEST_MODE === 'true';

// ── Horario BamPai ────────────────────────────────────────────────────────────
// Lunes: cerrado | Mar-Jue: 12-23 | Vie-Sáb: 12-00 | Dom: 12-18
function estaAbierto() {
  if (TEST) return true; // TEST_MODE ignora horario
  const ahora = new Date();
  const dia  = ahora.getDay(); // 0=dom, 1=lun, ..., 6=sáb
  const mins = ahora.getHours() * 60 + ahora.getMinutes();
  const HORARIOS = {
    0: [720, 1080], // dom 12:00-18:00
    1: null,        // lun cerrado
    2: [720, 1380], // mar 12:00-23:00
    3: [720, 1380],
    4: [720, 1380],
    5: [720, 1440], // vie 12:00-00:00
    6: [720, 1440], // sáb 12:00-00:00
  };
  const h = HORARIOS[dia];
  if (!h) return false;
  return mins >= h[0] && mins < h[1];
}

// ── Cache de productos ────────────────────────────────────────────────────────
const _productosCache = new Map();
const PRODUCTOS_TTL = 10 * 60 * 1000;

async function getProductos(agenteId) {
  const cached = _productosCache.get(agenteId);
  if (cached && Date.now() - cached.ts < PRODUCTOS_TTL) return cached.data;
  const productos = await api.getProductos(agenteId).catch(() => []);
  _productosCache.set(agenteId, { data: productos, ts: Date.now() });
  return productos;
}

function calcularTotal(carrito) {
  return carrito.reduce((acc, i) => acc + Number(i.precio_unitario) * Number(i.cantidad), 0);
}

function encontrarProducto(texto, productos) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return productos.find(p => {
    const n = p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.includes(n) || n.includes(t.split(' ')[0]);
  });
}

function extraerNumero(texto) {
  const match = texto.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function detectarMetodoPago(texto) {
  const t = texto.toLowerCase();
  if (/transfer|transf\b/.test(t)) return 'Transferencia';
  if (/debito|tarjeta|d[eé]bito/.test(t)) return 'Débito';
  if (/efectivo|cash|plata/.test(t)) return 'Efectivo';
  return null;
}

// Construye el string de referencia con salsas + palitos para enviar al KDS
function buildReferencia(ctx) {
  const partes = [];
  if (ctx.salsas) partes.push(`Salsas: ${ctx.salsas}`);
  if (ctx.palitos) partes.push(`Palitos: ${ctx.palitos}p`);
  return partes.join(' | ') || null;
}

// ── Procesador principal ──────────────────────────────────────────────────────
async function procesarMensaje({ agenteId, sucursal, telefono, texto }) {
  const sesion   = await obtenerSesion(agenteId, telefono);
  const cliente  = await api.getCliente(agenteId, telefono).catch(() => null);
  const productos = await getProductos(agenteId);

  if (TEST) console.log(`[TEST][bot] estado=${sesion.estado} carrito=${sesion.carritoJson.length} items`);

  await agregarAlHistorial(agenteId, telefono, 'user', texto);

  const { intencion } = detectarIntencion(texto);
  if (TEST) console.log(`[TEST][bot] intencion=${intencion}`);

  // ── CANCELAR ──────────────────────────────────────────────────────────────
  if (intencion === INTENCIONES.CANCELAR && sesion.estado !== ESTADOS.NUEVO && sesion.estado !== ESTADOS.SALUDO) {
    await limpiarSesion(agenteId, telefono);
    const r = '¡Listo! Cancelé el pedido. ¿En qué más te puedo ayudar? 🐼';
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── CERRADO ───────────────────────────────────────────────────────────────
  if (!estaAbierto()) {
    const r = msg('cerrado');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── VER MENÚ ──────────────────────────────────────────────────────────────
  if (intencion === INTENCIONES.VER_MENU) {
    const r = msg('verMenu');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── HORARIO ───────────────────────────────────────────────────────────────
  const textoNorm = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/horario|que hora|hasta que hora|cuando abren|cuando cierran|que dias/.test(textoNorm)) {
    const r = msg('horario');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── SALUDO / NUEVO ────────────────────────────────────────────────────────
  if (intencion === INTENCIONES.SALUDO || sesion.estado === ESTADOS.NUEVO) {
    await actualizarEstado(agenteId, telefono, ESTADOS.SALUDO);
    const r = msg('bienvenida', cliente?.nombre?.split(' ')[0]);
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── AGRADECIMIENTO ────────────────────────────────────────────────────────
  if (intencion === INTENCIONES.AGRADECIMIENTO) {
    const r = msg('agradecimiento');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── HACER PEDIDO (desde cualquier estado) ─────────────────────────────────
  if (intencion === INTENCIONES.HACER_PEDIDO || intencion === INTENCIONES.OPCION_PEDIR ||
      sesion.estado === ESTADOS.SALUDO || sesion.estado === ESTADOS.ORDENANDO) {
    const items = extraerItemsPedido(texto);
    for (const item of items) {
      const prod = encontrarProducto(item.texto, productos);
      if (prod) {
        await agregarAlCarrito(agenteId, telefono, {
          nombre_producto: prod.nombre,
          precio_unitario: Number(prod.precio),
          cantidad: item.cantidad || 1,
        });
      }
    }
    const updatedSesion = await obtenerSesion(agenteId, telefono);
    if (updatedSesion.carritoJson.length > 0) {
      await actualizarEstado(agenteId, telefono, ESTADOS.RETIRO_O_DELIVERY);
      const r = msg('preguntarEntrega');
      await agregarAlHistorial(agenteId, telefono, 'assistant', r);
      return r;
    }
  }

  // ── LEGACY: ESPERANDO OBSERVACIÓN (sesiones antiguas) ────────────────────
  if (sesion.estado === ESTADOS.ESPERANDO_OBSERVACION) {
    await actualizarEstado(agenteId, telefono, ESTADOS.RETIRO_O_DELIVERY);
    const r = msg('preguntarEntrega');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── RETIRO O DELIVERY ─────────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.RETIRO_O_DELIVERY) {
    if (intencion === INTENCIONES.RETIRO || /^1$/.test(texto.trim())) {
      await actualizarContexto(agenteId, telefono, { tipoEntrega: 'retiro' });
      await actualizarEstado(agenteId, telefono, ESTADOS.ESPERANDO_SALSAS);
      const r = msg('preguntarSalsas');
      await agregarAlHistorial(agenteId, telefono, 'assistant', r);
      return r;
    }
    if (intencion === INTENCIONES.DELIVERY || /^2$/.test(texto.trim())) {
      await actualizarContexto(agenteId, telefono, { tipoEntrega: 'delivery' });
      await actualizarEstado(agenteId, telefono, ESTADOS.CONFIRMANDO_DIRECCION);
      const r = msg('pedirDireccion');
      await agregarAlHistorial(agenteId, telefono, 'assistant', r);
      return r;
    }
    const r = msg('preguntarEntrega');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── CONFIRMANDO DIRECCIÓN ─────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.CONFIRMANDO_DIRECCION) {
    await actualizarContexto(agenteId, telefono, { direccionEntrega: texto.trim() });
    await actualizarEstado(agenteId, telefono, ESTADOS.ESPERANDO_SALSAS);
    const r = msg('preguntarSalsas');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── ESPERANDO SALSAS ──────────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.ESPERANDO_SALSAS) {
    const esNo = /^no$|^nada$|^sin salsa|^sin nada|^ok$|^oki$|^dale$/i.test(texto.trim());
    const salsas = esNo ? null : texto.trim();
    await actualizarContexto(agenteId, telefono, { salsas });
    await actualizarEstado(agenteId, telefono, ESTADOS.ESPERANDO_PALITOS);
    const r = msg('preguntarPalitos');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── ESPERANDO PALITOS ─────────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.ESPERANDO_PALITOS) {
    const esNo = /^no$|^nada$|^sin palito|^sin nada|^ok$|^oki$|^dale$|^0$/i.test(texto.trim());
    const palitos = esNo ? null : (extraerNumero(texto) ?? texto.trim());
    await actualizarContexto(agenteId, telefono, { palitos });
    await actualizarEstado(agenteId, telefono, ESTADOS.ESPERANDO_PAGO);
    const total = calcularTotal(sesion.carritoJson);
    const r = msg('preguntarPago', total);
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── ESPERANDO PAGO ────────────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.ESPERANDO_PAGO) {
    const metodoPago = detectarMetodoPago(texto);
    if (metodoPago) {
      await actualizarContexto(agenteId, telefono, { metodoPago });
      const updSesion = await obtenerSesion(agenteId, telefono);
      const ctx = updSesion.contextoJson;

      if (metodoPago === 'Transferencia') {
        // Mostrar datos bancarios y luego la confirmación del pedido
        await actualizarEstado(agenteId, telefono, ESTADOS.CONFIRMANDO_PEDIDO);
        const respBanco = msg('datosBancarios');
        const respConf  = msg('confirmarPedido',
          updSesion.carritoJson,
          calcularTotal(updSesion.carritoJson),
          ctx.tipoEntrega,
          ctx.direccionEntrega,
          metodoPago,
          ctx.palitos,
          ctx.salsas);
        await agregarAlHistorial(agenteId, telefono, 'assistant', respBanco);
        await agregarAlHistorial(agenteId, telefono, 'assistant', respConf);
        return `${respBanco}\n\n${respConf}`;
      }

      // Efectivo / Débito → directo a confirmar
      await actualizarEstado(agenteId, telefono, ESTADOS.CONFIRMANDO_PEDIDO);
      const r = msg('confirmarPedido',
        updSesion.carritoJson,
        calcularTotal(updSesion.carritoJson),
        ctx.tipoEntrega,
        ctx.direccionEntrega,
        metodoPago,
        ctx.palitos,
        ctx.salsas);
      await agregarAlHistorial(agenteId, telefono, 'assistant', r);
      return r;
    }
    // No detectó método de pago
    const r = msg('preguntarPago');
    await agregarAlHistorial(agenteId, telefono, 'assistant', r);
    return r;
  }

  // ── CONFIRMAR PEDIDO ──────────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.CONFIRMANDO_PEDIDO && intencion === INTENCIONES.CONFIRMAR) {
    // Bloquear estado ANTES de crear → evita doble pedido si llegan dos "si" rápido
    await actualizarEstado(agenteId, telefono, ESTADOS.COMPLETADO);
    try {
      const ctx = sesion.contextoJson;
      const referencia = buildReferencia(ctx);

      await api.crearPedido(agenteId, {
        items: sesion.carritoJson.map(i => ({
          nombre: i.nombre_producto,
          precio: i.precio_unitario,
          cantidad: i.cantidad,
        })),
        cliente: {
          telefono,
          nombre: cliente?.nombre,
          direccion: ctx.direccionEntrega,
          referencia,
        },
        tipoEntrega: ctx.tipoEntrega ?? 'retiro',
        metodoPago: ctx.metodoPago === 'Efectivo' ? 'EFECTIVO'
          : ctx.metodoPago === 'Transferencia' ? 'TRANSFERENCIA'
          : ctx.metodoPago === 'Débito' ? 'TARJETA' : 'EFECTIVO',
        total: calcularTotal(sesion.carritoJson),
      });

      // Guardar dirección del cliente si es delivery
      if (ctx.direccionEntrega && ctx.tipoEntrega === 'delivery') {
        api.upsertCliente(agenteId, {
          telefono,
          direccion: { direccion: ctx.direccionEntrega },
        }).catch(() => {});
      }

      await limpiarSesion(agenteId, telefono);
      const r = msg('pedidoEnviado');
      await agregarAlHistorial(agenteId, telefono, 'assistant', r);
      return r;
    } catch (e) {
      console.error('[bot] Error al crear pedido:', e.message);
      return 'Hubo un problema al confirmar el pedido. Por favor escríbenos directamente 🙏';
    }
  }

  // ── FALLBACK LLM ──────────────────────────────────────────────────────────
  if (iaDisponible()) {
    const updSesion = await obtenerSesion(agenteId, telefono);
    const r = await generarRespuesta(texto, sucursal, productos, updSesion);
    if (r) {
      await agregarAlHistorial(agenteId, telefono, 'assistant', r);
      return r;
    }
  }

  const r = msg('noEntendido');
  await agregarAlHistorial(agenteId, telefono, 'assistant', r);
  return r;
}

module.exports = { procesarMensaje };
