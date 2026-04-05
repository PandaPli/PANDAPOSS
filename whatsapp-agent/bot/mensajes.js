// mensajes.js — Plantillas de respuesta genéricas
const MSGS = {
  bienvenida: (nombre) => nombre
    ? [`Hola ${nombre}! 👋 Qué gusto verte de nuevo. ¿Qué se te antoja hoy? 😊`]
    : [`Hola! 👋 Bienvenid@ ¿En qué te puedo ayudar hoy?`, `Hola! 😊 ¿Qué se te antoja hoy?`],

  verMenu: (menuUrl) => menuUrl
    ? `Aquí puedes ver nuestro menú completo 👉 ${menuUrl}`
    : `¿Qué se te antoja? Cuéntame qué buscas y te ayudo 😊`,

  pedidoRecibido: (carrito) => {
    const lista = carrito.map(i => `• ${i.cantidad}x ${i.nombre_producto} — $${Number(i.precio_unitario * i.cantidad).toLocaleString('es-CL')}`).join('\n');
    return `Perfecto! Tengo anotado:\n${lista}\n\n¿Lo pedimos para delivery o retiro en el local? 🛵🏪`;
  },

  preguntarEntrega: () => `¿Cómo lo quieres?\n1️⃣ Delivery (te lo llevamos)\n2️⃣ Retiro en el local`,

  pedirDireccion: () => `¿A qué dirección te lo enviamos? 📍`,

  confirmarPedido: (carrito, total, tipoEntrega, direccion) => {
    const lista = carrito.map(i => `• ${i.cantidad}x ${i.nombre_producto}`).join('\n');
    const entrega = tipoEntrega === 'retiro' ? '🏪 Retiro en local' : `🛵 Delivery a ${direccion}`;
    return `Confirmemos tu pedido:\n${lista}\n\nTotal: $${Number(total).toLocaleString('es-CL')}\n${entrega}\n\n¿Confirmamos? Responde *SÍ* para enviar ✅`;
  },

  pedidoEnviado: () => `✅ Pedido confirmado! Ya lo estamos preparando. Te avisamos cuando esté listo 🍽️`,

  noEntendido: () => [`No entendí bien, ¿me lo puedes repetir?`, `Hmm, ¿podrías decirme eso de otra forma?`],

  horarioCerrado: (msg) => msg || `Por ahora estamos cerrados. Te esperamos pronto! 🕐`,

  carritoVacio: () => `Tu carrito está vacío. ¿Qué te gustaría pedir? 😊`,
};

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function get(key, ...args) {
  const val = MSGS[key]?.(...args);
  return Array.isArray(val) ? random(val) : (val || '');
}

module.exports = { MSGS, get };
