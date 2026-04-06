// mensajes.js — Personalidad BamPai Sushi 🐼❤️
'use strict';

const MSGS = {
  bienvenida: (nombre) => nombre
    ? `Hola ${nombre}! 🐼❤️ qué gusto verte de nuevo *#BamPaiLovers*! ¿Qué se te antoja hoy?`
    : `Hola! Bienvenid@ a *BamPai Sushi* 🐼❤️\n¿En qué te puedo ayudar?`,

  cerrado: () =>
    `(ZzZzZzZ pandita duerme) 😴\nHola *#BamPaiLovers* Por el Momento no estamos Disponibles.\nAgradecemos tu preferencia, te avisaremos apenas abramos nuestras puertas 🐼❤️`,

  horario: () =>
    `Nuestro horario ⏰:\n• Lunes: *Cerrado*\n• Mar-Jue: 12:00 – 23:00\n• Vie-Sáb: 12:00 – 00:00\n• Dom: 12:00 – 18:00`,

  verMenu: () =>
    `Aquí nuestra carta 🍣 👉 pandaposs.com/pedir/BamPai`,

  pedidoRecibido: (carrito) => {
    const lista = carrito.map(i => `• ${i.cantidad}x ${i.nombre_producto}`).join('\n');
    return `Okis! Tengo anotado 🐼:\n${lista}\n\n¿Lo pedimos para *delivery* o *retiro* en el local? 🛵🏪`;
  },

  pedirObservacion: (carrito) => {
    const lista = carrito.map(i => `• ${i.cantidad}x ${i.nombre_producto}`).join('\n');
    return `Anotado! 🐼\n${lista}\n\n¿Alguna observación? (salsas, sin alga, sin picante, etc.)\nO escribe *no* para continuar 👇`;
  },

  preguntarEntrega: () =>
    `¿Cómo lo quieres? 🐼\n*1* - Retiro en Aromos 371\n*2* - Delivery (te lo llevamos)`,

  pedirDireccion: () => `¿A qué dirección te lo enviamos? 📍`,

  preguntarPago: (total) => total
    ? `Serian un total de *$${Number(total).toLocaleString('es-CL')}* 💰\n¿Cómo pagás? *Efectivo* · *Transferencia* · *Débito*`
    : `Okis! ¿Método de pago? 💳\n*Efectivo* · *Transferencia* · *Débito*`,

  datosBancarios: () =>
    `Transferencia a 👇\n• N° cuenta: *1022193723*\n• Rut: *767871538*\n• Banco: Mercado Pago\n• Tipo: Vista\n• Titular: Panda Gastronómico\n\nEnvíanos el comprobante 📸`,

  preguntarPalitos: () => `🥢 palitos para cuántas personas va a necesitar?`,

  confirmarPedido: (carrito, total, tipoEntrega, direccion, pago, palitos) => {
    const lista = carrito.map(i => `• ${i.cantidad}x ${i.nombre_producto}`).join('\n');
    const entrega = tipoEntrega === 'retiro'
      ? `🏪 Retiro en Aromos 371`
      : `🛵 Delivery a ${direccion}`;
    const palosTexto = palitos ? `\n🥢 Palitos para: ${palitos} personas` : '';
    return `Confirmemos tu pedido 🐼:\n${lista}\n\nTotal: *$${Number(total).toLocaleString('es-CL')}*\n${entrega}\nPago: *${pago || 'a confirmar'}*${palosTexto}\n\n¿Confirmamos? Responde *sí* ✅`;
  },

  pedidoEnviado: () =>
    [`✅ *ATENCION estamos haciendo tu pedido* 🐼❤️\nTe avisamos cuando esté listo!`,
     `Maraviloso!! 🐼❤️ *estamos preparando tu pedido*\nTe avisamos cuando esté listo para retiro/despacho!`],

  agradecimiento: () =>
    [`Okis! 🐼❤️`, `Con gusto *#BamPaiLovers*! 🐼`, `Siempre! 🐼❤️`],

  noEntendido: () =>
    [`Hmm no te entendí bien, ¿me lo repites? 🐼`, `¿Cómo así? cuéntame más 😊`],
};

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function get(key, ...args) {
  const val = MSGS[key]?.(...args);
  return Array.isArray(val) ? random(val) : (val || '');
}

module.exports = { MSGS, get };
