// ============================================================
// MALIBU SMART - Detector de Intenciones
// Entiende lo que el cliente escribio en lenguaje natural.
// Sin IA: regex + keywords. Rapido, predecible, testeable.
// ============================================================

/**
 * INTENCIONES DETECTABLES
 */
const INTENCIONES = {
  SALUDO: 'SALUDO',
  PEDIR_LO_MISMO: 'PEDIR_LO_MISMO',
  VER_MENU: 'VER_MENU',
  OPCION_CARTA: 'OPCION_CARTA',
  OPCION_PEDIR: 'OPCION_PEDIR',
  HACER_PEDIDO: 'HACER_PEDIDO',
  RETIRO: 'RETIRO',
  DELIVERY: 'DELIVERY',
  CONFIRMAR: 'CONFIRMAR',
  CANCELAR: 'CANCELAR',
  CONSULTA_TIEMPO: 'CONSULTA_TIEMPO',
  CONSULTA_ESTADO: 'CONSULTA_ESTADO',
  AGRADECIMIENTO: 'AGRADECIMIENTO',
  PAGO_DEBITO: 'PAGO_DEBITO',
  PAGO_EFECTIVO: 'PAGO_EFECTIVO',
  PAGO_TRANSFERENCIA: 'PAGO_TRANSFERENCIA',
  NUEVA_DIRECCION: 'NUEVA_DIRECCION',
  DESCONOCIDO: 'DESCONOCIDO',
};

// ------------------------------------------------------------
// PATRONES POR INTENCION
// ------------------------------------------------------------
const PATRONES = [
  {
    intencion: INTENCIONES.SALUDO,
    keywords: ['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos', 'hi', 'ola'],
  },
  {
    intencion: INTENCIONES.PEDIR_LO_MISMO,
    keywords: [
      'lo mismo',
      'lo de siempre',
      'el mismo pedido',
      'lo mismo de siempre',
      'repite',
      'igual que antes',
      'lo habitual',
      'mismo de siempre',
      'repetir pedido',
      'pedido anterior',
      'repetir el pedido',
      'el pedido de antes',
    ],
  },
  {
    intencion: INTENCIONES.VER_MENU,
    keywords: [
      'ver menu',
      'que tienen',
      'carta',
      'opciones',
      'que hay',
      'que ofrecen',
      'ver la carta',
      'me muestras',
      'muestrame',
      'ver carta',
      'la carta',
    ],
  },
  {
    intencion: INTENCIONES.OPCION_CARTA,
    exact: ['1'],
    keywords: ['opcion 1', 'ver carta', 'quiero ver la carta'],
  },
  {
    intencion: INTENCIONES.OPCION_PEDIR,
    exact: ['2'],
    keywords: ['opcion 2', 'pedir por aqui', 'pedir por aca'],
  },
  {
    intencion: INTENCIONES.RETIRO,
    keywords: [
      'retiro',
      'retira',
      'busco',
      'voy a buscar',
      'paro a buscar',
      'para buscar',
      'pick up',
      'para retirar',
      'lo retiro',
      'voy al local',
      'paso a buscar',
      'lo voy a buscar',
      'en el local',
    ],
  },
  {
    intencion: INTENCIONES.DELIVERY,
    keywords: ['delivery', 'despacho', 'envio', 'a domicilio', 'para la casa', 'me lo llevan', 'me lo mandan', 'me lo traen', 'lo mandan', 'lo llevan', 'domicilio'],
  },
  {
    intencion: INTENCIONES.CONFIRMAR,
    keywords: ['okis', 'dale', 'correcto', 'exacto', 'asi', 'confirmo', 'perfecto', 'de acuerdo', 'claro', 'yap', 'yep'],
    exact: ['si', 'ok', 'oki', 'ya', 'listo'],
  },
  {
    intencion: INTENCIONES.CANCELAR,
    keywords: ['cancela', 'cancelar', 'cancelar pedido', 'me arrepenti', 'no quiero', 'olvidalo'],
    exact: ['no'],
  },
  {
    intencion: INTENCIONES.CONSULTA_TIEMPO,
    keywords: ['cuanto demora', 'cuanto tarda', 'falta mucho', 'faltara mucho', 'cuanto falta', 'cuando llega', 'cuando esta', 'para cuando', 'cuanto tiempo', 'falta para'],
  },
  {
    intencion: INTENCIONES.CONSULTA_ESTADO,
    keywords: ['como va', 'en que va', 'ya esta', 'esta listo', 'status', 'estado del pedido', 'cual es mi pedido', 'ver pedido', 'ver mi pedido', 'que pedi', 'resumen del pedido', 'que tiene mi pedido'],
  },
  {
    intencion: INTENCIONES.AGRADECIMIENTO,
    keywords: ['gracias', 'muchas gracias', 'mil gracias', 'agradecido', 'agradecida', 'te pasaste', 'thanks'],
  },
  {
    intencion: INTENCIONES.PAGO_DEBITO,
    keywords: ['debito', 'tarjeta', 'con tarjeta', 'con debito'],
  },
  {
    intencion: INTENCIONES.PAGO_EFECTIVO,
    keywords: ['efectivo', 'cash', 'en efectivo', 'plata'],
  },
  {
    intencion: INTENCIONES.PAGO_TRANSFERENCIA,
    keywords: ['transferencia', 'transfer', 'transf'],
  },
];

// ------------------------------------------------------------
// PRODUCTOS DEL MENU
// ------------------------------------------------------------
const KEYWORDS_PRODUCTOS = [
  'roll',
  'rolls',
  'hot roll',
  'avocado',
  'california',
  'sake',
  'cheese cream',
  'futomaki',
  'acevichado',
  'rainbow',
  'sara',
  'duosuka',
  'chicken woo',
  'handroll',
  'hosomaki',
  'temaki',
  'handrolls',
  'temakis',
  'tabla',
  'tabla 20',
  'tabla 30',
  'tabla 40',
  'tabla 50',
  'tabla 60',
  'tabla 70',
  'tabla 80',
  'sushi burger',
  'sushiburger',
  'sushiburguer',
  'sushi burguer',
  'sushidog',
  'sushi dog',
  'bowl',
  'woki',
  'ramen',
  'burrito',
  'gyoza',
  'gyozas',
  'nachos',
  'bolitas',
  'fingers',
  'coca',
  'agua',
  'sprite',
  'fanta',
  'bebida',
  'salsa',
];

const ALIASES_PRODUCTO_TEXTO = [
  { regex: /\bandroids?\b/gi, reemplazo: 'handrolls' },
];

/**
 * Detecta la intencion principal del mensaje.
 * @param {string} mensaje
 * @returns {{ intencion: string, confianza: string, textoOriginal: string }}
 */
function detectarIntencion(mensaje) {
  const texto = normalizar(corregirAliasProductos(mensaje));

  if (esPedidoExplicito(texto)) {
    return {
      intencion: INTENCIONES.HACER_PEDIDO,
      confianza: 'alta',
      textoOriginal: mensaje,
    };
  }

  for (const patron of PATRONES) {
    if (patron.exact) {
      for (const keyword of patron.exact) {
        if (_coincideExacto(texto, keyword)) {
          return { intencion: patron.intencion, confianza: 'alta', textoOriginal: mensaje };
        }
      }
    }

    for (const keyword of patron.keywords || []) {
      if (texto.includes(normalizar(keyword))) {
        return {
          intencion: patron.intencion,
          confianza: 'alta',
          textoOriginal: mensaje,
        };
      }
    }
  }

  const esPregunta = texto.trim().endsWith('?') ||
    /^(que|como|cual|cuanto|donde|lleva|tiene|trae|es el|es la)\b/.test(texto);

  if (!esPregunta && pareceUnPedido(texto)) {
    return {
      intencion: INTENCIONES.HACER_PEDIDO,
      confianza: 'media',
      textoOriginal: mensaje,
    };
  }

  return {
    intencion: INTENCIONES.DESCONOCIDO,
    confianza: 'baja',
    textoOriginal: mensaje,
  };
}

/**
 * Extrae items del pedido desde texto libre.
 * @param {string} mensaje
 * @returns {Array<{ cantidad: number, texto: string, esTabla: boolean, raw: string }>}
 */
function extraerItemsPedido(mensaje) {
  const texto = corregirAliasProductos((mensaje || '').toLowerCase());
  const items = [];

  const lineas = texto
    .split(/[\n,]|\sy\s/)
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 2);

  for (const linea of lineas) {
    const cantidad = extraerCantidad(linea);
    const textoLimpio = linea
      .replace(/^(hola+|holaa+|ola|buenas(?:\s+noches|\s+tardes|\s+dias)?|buen\s+dia|buenos\s+dias)\s+/i, '')
      .replace(/^(quisiera|quiero|me das|dame|porfavor|por favor|porfa|agrega|agrega)\s+/i, '')
      .replace(/^(\d+|un|una|dos|tres|cuatro|cinco)\s+/i, '')
      .replace(/\s+con\s+(retiro|delivery|despacho|envio|a domicilio)\b.*$/i, '')
      .replace(/\s+para\s+las?\s+\d{1,2}(?::\d{2})?(?:\s+de\s+la\s+\w+)?\b.*$/i, '')
      .trim();

    if (textoLimpio.length < 2) continue;

    items.push({
      cantidad,
      texto: textoLimpio,
      esTabla: /tabla/.test(textoLimpio),
      raw: linea,
    });
  }

  return items;
}

function mencionaTabla(mensaje) {
  const texto = corregirAliasProductos((mensaje || '').toLowerCase());
  return /tabla\s*\d+/.test(texto) ||
    /tabla de \d+/.test(texto) ||
    /tabla \d+ pz/.test(texto);
}

function extraerTamanoTabla(mensaje) {
  const match = (mensaje || '').match(/tabla\s*(?:de\s*)?(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function corregirAliasProductos(texto) {
  let corregido = texto || '';
  for (const { regex, reemplazo } of ALIASES_PRODUCTO_TEXTO) {
    corregido = corregido.replace(regex, reemplazo);
  }
  return corregido;
}

function pareceUnPedido(texto) {
  return KEYWORDS_PRODUCTOS.some((kw) => texto.includes(kw));
}

function esPedidoExplicito(texto) {
  const tieneProducto = pareceUnPedido(texto);
  if (!tieneProducto) return false;

  const tieneVerboPedido = /\b(quiero|quisiera|me das|dame|sumar|agrega|agregar|añade|anade|mandame|mándame)\b/.test(texto);
  const tieneCantidad = /(?:^|\s)(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+/.test(texto);

  return tieneVerboPedido || tieneCantidad;
}

function extraerCantidad(texto) {
  const numerosEscritos = {
    un: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
  };

  const matchNum = texto.match(/(?:^|\bquisiera\s|\bquiero\s|\bdame\s)(\d+)\s+/i);
  if (matchNum) return parseInt(matchNum[1], 10);

  for (const [palabra, numero] of Object.entries(numerosEscritos)) {
    if (texto.startsWith(`${palabra} `)) return numero;
    const regex = new RegExp(`(?:quisiera|quiero|dame)\\s+${palabra}\\s`, 'i');
    if (regex.test(texto)) return numero;
  }

  return 1;
}

function _coincideExacto(texto, keyword) {
  const normalizado = normalizar(keyword);
  if (/^\d+$/.test(normalizado)) {
    return texto === normalizado;
  }

  const regex = new RegExp(`(^|\\s)${escaparRegex(normalizado)}(\\s|$|[^a-z0-9])`, 'i');
  return regex.test(texto);
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  INTENCIONES,
  KEYWORDS_PRODUCTOS,
  detectarIntencion,
  extraerItemsPedido,
  mencionaTabla,
  extraerTamanoTabla,
  esPedidoExplicito,
  normalizar,
  corregirAliasProductos,
};
