// mensajes.js — Personalidad BamPai Sushi
'use strict';

const MSGS = {
  bienvenida: (nombre) => nombre
    ? `Hola ${nombre}! que gusto verte de nuevo *#BamPaiLovers*! Que se te antoja hoy?`
    : `Hola! Bienvenid@ a *BamPai Sushi*\nEn que te puedo ayudar?`,

  cerrado: () =>
    `(ZzZzZzZ pandita duerme)\nHola *#BamPaiLovers* Por el Momento no estamos Disponibles.\nAgradecemos tu preferencia, te avisaremos apenas abramos nuestras puertas`,

  horario: () =>
    `Nuestro horario:\n- Lunes: *Cerrado*\n- Mar-Jue: 12:00 - 23:00\n- Vie-Sab: 12:00 - 00:00\n- Dom: 12:00 - 18:00`,

  verMenu: () =>
    `Aqui nuestra carta https://www.pandaposs.com/pedir/bampai`,

  preguntarEntrega: () =>
    `Como lo quieres?\n*Retiro* en Aromos 371\n*Delivery* (te lo llevamos)`,

  pedirDireccion: () => `A que direccion te lo enviamos?`,

  preguntarSalsas: () =>
    `Soya, Agridulce o Ambas?\nO escribe *no* para continuar`,

  preguntarPalitos: () => `Palitos para cuantas personas?`,

  preguntarPago: (total) => total
    ? `Serian un total de *$${Number(total).toLocaleString('es-CL')}*\nComo pagas? *Efectivo* / *Transferencia* / *Debito*`
    : `Okis! Metodo de pago?\n*Efectivo* / *Transferencia* / *Debito*`,

  datosBancarios: () =>
    `Transferencia a:\n- Cuenta: *1022193723*\n- Rut: *767871538*\n- Banco: Mercado Pago\n- Tipo: Vista\n- Titular: Panda Gastronomico\n\nEnvianos el comprobante`,

  confirmarPedido: (carrito, total, tipoEntrega, direccion, pago, palitos, salsas) => {
    const fmt = (n) => `$${Number(n).toLocaleString('es-CL')}`;
    const lista = carrito.map(i => {
      const subtotal = fmt(Number(i.precio_unitario) * Number(i.cantidad));
      return `- ${i.nombre_producto} x${i.cantidad} - ${subtotal}`;
    }).join('\n');

    const entrega = tipoEntrega === 'retiro'
      ? `Retiro en Aromos 371`
      : `Delivery a ${direccion}`;

    const extras = [];
    if (salsas) extras.push(`Salsas: ${salsas}`);
    if (palitos) extras.push(`Palitos para: ${palitos} personas`);

    return [
      `*Mi pedido es:*\n`,
      lista,
      ``,
      entrega,
      `${pago || 'a confirmar'}`,
      extras.length ? extras.join('\n') : null,
      ``,
      `*Total: ${fmt(total)}*`,
      ``,
      `Confirmamos? Responde *si*`,
    ].filter(l => l !== null).join('\n');
  },

  // Mensaje inmediato al cliente tras confirmar (antes de que el humano acepte)
  pedidoEnviado: (carrito, total, tipoEntrega, direccion, pago, nombre) => {
    const fmt = (n) => `$${Number(n).toLocaleString('es-CL')}`;
    const lista = carrito.map(i => {
      const subtotal = fmt(Number(i.precio_unitario) * Number(i.cantidad));
      const obs = i.observacion ? ` (${i.observacion})` : '';
      return `- ${i.nombre_producto} x${i.cantidad} - ${subtotal}${obs}`;
    }).join('\n');
    const entrega = tipoEntrega === 'retiro'
      ? `Retiro en Aromos 371`
      : `Delivery a ${direccion}`;
    const lines = [
      `*Pedido recibido!*`,
      ``,
      lista,
      ``,
      entrega,
    ];
    if (nombre) lines.push(`A nombre de: *${nombre}*`);
    lines.push(`Pago: *${pago || 'a confirmar'}*`);
    lines.push(`*Total: ${fmt(total)}*`);
    lines.push(`\nEn breve lo confirmamos, gracias por tu paciencia`);
    return lines.join('\n');
  },

  // Mensaje que llega al cliente CUANDO el humano acepta desde el panel
  pedidoAceptado: () =>
    `Aceptamos tu pedido! Estamos preparandolo, te avisamos cuando este listo.`,

  // -- TABLAS ------------------------------------------------------------------
  tablaInicio: (piezas, schema) => {
    const lineas = [`Perfecto para pedir tu *tabla ${piezas}* tienes que escoger:`];
    lineas.push(`- 1 *Avocado*`);
    lineas.push(`- 1 *California* (necesito 2 datos):`);
    lineas.push(`  *Envoltorio* (incluido): sesamo / Ciboulet / Merken / Amapola / CocoMerken`);
    lineas.push(`  _(cambiar a otro envoltorio: +$3.000)_`);
    lineas.push(`  *Relleno*: tori(pollo) / sake(salmon) / ebi(camaron) / fungi(champion) / kani(kanikama) / Aceitunas / Palmito / Choclo / Almendras / Palta`);
    if (schema.chesse)    lineas.push(`- 1 *Chesse Creme*`);
    if (schema.sake)      lineas.push(`- 1 *Sake*`);
    if (schema.hosomaki)  lineas.push(`- 1 *Hosomaki*`);
    if (schema.futomaki)  lineas.push(`- 1 *Futomaki*`);
    if (schema.hotrolls)  lineas.push(`- ${schema.hotrolls} *HotRolls*`);
    lineas.push(`\nEjemplo: _"sesamo con salmon"_`);
    return lineas.join('\n');
  },

  tablaFaltaEnvoltorio: () =>
    `Con que envoltorio quieres el California?\n_sesamo / Ciboulet / Merken / Amapola / CocoMerken_`,

  tablaFaltaRelleno: (envoltorio) =>
    `Okis ${envoltorio}! Y el relleno del California?\n_tori(pollo) / sake(salmon) / ebi(camaron) / fungi(champion) / kani(kanikama) / Aceitunas / Palmito / Choclo / Almendras / Palta_`,

  tablaCaliforniaOk: (piezas, envoltorio, relleno) =>
    `Okis! *Tabla ${piezas}* con California *${envoltorio}* + *${relleno}*. Anotado!\nAlgo mas o continuamos con el pedido?`,

  agradecimiento: () =>
    [`Okis!`, `Con gusto *#BamPaiLovers*!`, `Siempre!`],

  noEntendido: () =>
    `Aqui nuestra carta https://www.pandaposs.com/pedir/bampai`,
};

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function get(key, ...args) {
  const val = MSGS[key]?.(...args);
  return Array.isArray(val) ? random(val) : (val || '');
}

module.exports = { MSGS, get };
