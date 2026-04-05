// bot.js — Manejador principal del bot (adaptado de Malibu Smart para PandaPoss)
'use strict';

const { ESTADOS, obtenerSesion, actualizarEstado, agregarAlCarrito, limpiarSesion, agregarAlHistorial } = require('./estados');
const { INTENCIONES, detectarIntencion, extraerItemsPedido } = require('./intentParser');
const { generarRespuesta, iaDisponible } = require('./llm');
const { get: msg } = require('./mensajes');
const api = require('../api');

// Cache de productos por agente (se refresca cada 10 min)
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

async function procesarMensaje({ agenteId, sucursal, telefono, texto }) {
  const sesion  = await obtenerSesion(agenteId, telefono);
  const cliente = await api.getCliente(agenteId, telefono).catch(() => null);
  const productos = await getProductos(agenteId);

  await agregarAlHistorial(agenteId, telefono, 'user', texto);

  const { intencion } = detectarIntencion(texto);

  // ── CANCELAR ────────────────────────────────────────────────
  if (intencion === INTENCIONES.CANCELAR && sesion.estado !== ESTADOS.NUEVO) {
    await limpiarSesion(agenteId, telefono);
    return '¡Listo! Cancelé el pedido. ¿En qué más te puedo ayudar? 😊';
  }

  // ── VER MENÚ ────────────────────────────────────────────────
  if (intencion === INTENCIONES.VER_MENU) {
    const menuUrl = sucursal.slug ? `pandaposs.com/pedir/${sucursal.slug}` : null;
    const respuesta = msg('verMenu', menuUrl);
    await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
    return respuesta;
  }

  // ── SALUDO ──────────────────────────────────────────────────
  if (intencion === INTENCIONES.SALUDO || sesion.estado === ESTADOS.NUEVO) {
    await actualizarEstado(agenteId, telefono, ESTADOS.SALUDO);
    const respuesta = msg('bienvenida', cliente?.nombre?.split(' ')[0]);
    await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
    return respuesta;
  }

  // ── HACER PEDIDO ─────────────────────────────────────────────
  if (intencion === INTENCIONES.HACER_PEDIDO || intencion === INTENCIONES.OPCION_PEDIR) {
    const items = extraerItemsPedido(texto);
    if (items.length > 0) {
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
        await actualizarEstado(agenteId, telefono, ESTADOS.ORDENANDO);
        const respuesta = msg('pedidoRecibido', updatedSesion.carritoJson);
        await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
        return respuesta;
      }
    }
  }

  // ── RETIRO / DELIVERY ────────────────────────────────────────
  if (sesion.estado === ESTADOS.ORDENANDO) {
    if (intencion === INTENCIONES.RETIRO) {
      sesion.contextoJson = { ...sesion.contextoJson, tipoEntrega: 'retiro' };
      await actualizarEstado(agenteId, telefono, ESTADOS.CONFIRMANDO_PEDIDO);
      const total = calcularTotal(sesion.carritoJson);
      const respuesta = msg('confirmarPedido', sesion.carritoJson, total, 'retiro', null);
      await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
      return respuesta;
    }
    if (intencion === INTENCIONES.DELIVERY) {
      sesion.contextoJson = { ...sesion.contextoJson, tipoEntrega: 'delivery' };
      await actualizarEstado(agenteId, telefono, ESTADOS.RETIRO_O_DELIVERY);
      const respuesta = msg('pedirDireccion');
      await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
      return respuesta;
    }
    const respuesta = msg('preguntarEntrega');
    await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
    return respuesta;
  }

  // ── DIRECCIÓN ────────────────────────────────────────────────
  if (sesion.estado === ESTADOS.RETIRO_O_DELIVERY) {
    sesion.contextoJson = { ...sesion.contextoJson, direccionEntrega: texto.trim() };
    await actualizarEstado(agenteId, telefono, ESTADOS.CONFIRMANDO_PEDIDO);
    const total = calcularTotal(sesion.carritoJson);
    const respuesta = msg('confirmarPedido', sesion.carritoJson, total, 'delivery', texto.trim());
    await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
    return respuesta;
  }

  // ── CONFIRMAR PEDIDO ──────────────────────────────────────────
  if (sesion.estado === ESTADOS.CONFIRMANDO_PEDIDO && intencion === INTENCIONES.CONFIRMAR) {
    try {
      await api.crearPedido(agenteId, {
        items: sesion.carritoJson.map(i => ({
          nombre: i.nombre_producto,
          precio: i.precio_unitario,
          cantidad: i.cantidad,
        })),
        cliente: { telefono, nombre: cliente?.nombre, direccion: sesion.contextoJson?.direccionEntrega },
        tipoEntrega: sesion.contextoJson?.tipoEntrega ?? 'retiro',
        metodoPago: 'EFECTIVO',
        total: calcularTotal(sesion.carritoJson),
      });
      // Save address if delivery
      if (sesion.contextoJson?.direccionEntrega && sesion.contextoJson.tipoEntrega === 'delivery') {
        api.upsertCliente(agenteId, {
          telefono,
          ultimaCompra: new Date().toISOString(),
          direccion: { direccion: sesion.contextoJson.direccionEntrega, esFavorita: true },
        }).catch(() => {});
      }
      await limpiarSesion(agenteId, telefono);
      const respuesta = msg('pedidoEnviado');
      await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
      return respuesta;
    } catch (e) {
      console.error('[bot] Error al crear pedido:', e.message);
      return 'Hubo un problema al confirmar el pedido. Por favor escríbenos directamente. 🙏';
    }
  }

  // ── FALLBACK LLM ─────────────────────────────────────────────
  if (iaDisponible()) {
    const updatedSesion = await obtenerSesion(agenteId, telefono);
    const respuesta = await generarRespuesta(texto, sucursal, productos, updatedSesion);
    if (respuesta) {
      await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
      return respuesta;
    }
  }

  const respuesta = msg('noEntendido');
  await agregarAlHistorial(agenteId, telefono, 'assistant', respuesta);
  return respuesta;
}

module.exports = { procesarMensaje };
