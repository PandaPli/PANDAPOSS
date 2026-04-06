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

  preguntarEntrega: () =>
    `¿Cómo lo quieres? 🐼\n*1* - Retiro en Aromos 371\n*2* - Delivery (te lo llevamos)`,

  pedirDireccion: () => `¿A qué dirección te lo enviamos? 📍`,

  preguntarSalsas: () =>
    `🫙 ¿Quieres agregarle salsas?\n(ej: soya, teriyaki, spicy, mayo)\nO escribe *no* para continuar`,

  preguntarPalitos: () => `🥢 ¿Palitos para cuántas personas?`,

  preguntarPago: (total) => total
    ? `Serian un total de *$${Number(total).toLocaleString('es-CL')}* 💰\n¿Cómo pagás? *Efectivo* · *Transferencia* · *Débito*`
    : `Okis! ¿Método de pago? 💳\n*Efectivo* · *Transferencia* · *Débito*`,

  datosBancarios: () =>
    `Transferencia a 👇\n• N° cuenta: *1022193723*\n• Rut: *767871538*\n• Banco: Mercado Pago\n• Tipo: Vista\n• Titular: Panda Gastronómico\n\nEnvíanos el comprobante 📸`,

  confirmarPedido: (carrito, total, tipoEntrega, direccion, pago, palitos, salsas) => {
    const fmt = (n) => `$${Number(n).toLocaleString('es-CL')}`;
    const lista = carrito.map(i => {
      const subtotal = fmt(Number(i.precio_unitario) * Number(i.cantidad));
      return `• ${i.nombre_producto} x${i.cantidad} — ${subtotal}`;
    }).join('\n');

    const entrega = tipoEntrega === 'retiro'
      ? `🏪 Retiro en Aromos 371`
      : `🛵 Delivery a ${direccion}`;

    const extras = [];
    if (salsas) extras.push(`🫙 Salsas: ${salsas}`);
    if (palitos) extras.push(`🥢 Palitos para: ${palitos} personas`);

    return [
      `*Mi pedido es:*\n`,
      lista,
      ``,
      entrega,
      `💳 ${pago || 'a confirmar'}`,
      extras.length ? extras.join('\n') : null,
      ``,
      `*Total: ${fmt(total)}*`,
      ``,
      `¿Confirmamos? Responde *sí* ✅`,
    ].filter(l => l !== null).join('\n');
  },

  // Mensaje inmediato al cliente tras confirmar (antes de que el humano acepte)
  pedidoEnviado: () =>
    [`Recibimos tu pedido! 🐼❤️ En breve lo confirmamos, gracias por tu paciencia.`,
     `Anotado! 🐼 Estamos revisando tu pedido y te avisamos en un momento.`],

  // Mensaje que llega al cliente CUANDO el humano acepta desde el panel
  pedidoAceptado: () =>
    `¡Aceptamos tu pedido! 🐼❤️ Estamos preparándolo, te avisamos cuando esté listo.`,

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
