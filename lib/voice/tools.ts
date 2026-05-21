/**
 * Definiciones de herramientas POS para OpenAI Realtime.
 *
 * Cada herramienta describe una accion que el modelo puede invocar
 * durante una sesion de voz. Los argumentos se validan en el executor.
 */

export interface VoiceTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const POS_TOOLS: VoiceTool[] = [
  // ── 1. Crear pedido ──────────────────────────────────────
  {
    type: "function",
    name: "crear_pedido",
    description:
      "Crea un pedido nuevo. Puede ser para una mesa (ej: 'mesa 5') o para mostrador/llevar. " +
      "Cada item debe tener el nombre del producto y la cantidad.",
    parameters: {
      type: "object",
      properties: {
        mesa: {
          type: "string",
          description: "Nombre o numero de la mesa. Omitir para pedido de mostrador.",
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nombre: { type: "string", description: "Nombre del producto" },
              cantidad: { type: "number", description: "Cantidad (default 1)" },
              observacion: { type: "string", description: "Nota especial (sin sal, termino medio, etc.)" },
            },
            required: ["nombre"],
          },
          description: "Lista de productos a pedir",
        },
        observacion: {
          type: "string",
          description: "Observacion general del pedido",
        },
      },
      required: ["items"],
    },
  },

  // ── 2. Leer comanda ──────────────────────────────────────
  {
    type: "function",
    name: "leer_comanda",
    description:
      "Lee los pedidos activos de una mesa o busca un pedido por numero. " +
      "Devuelve los items, cantidades, precios y estado.",
    parameters: {
      type: "object",
      properties: {
        mesa: { type: "string", description: "Nombre o numero de la mesa" },
        numero: { type: "number", description: "Numero del pedido" },
      },
    },
  },

  // ── 3. Actualizar pedido ─────────────────────────────────
  {
    type: "function",
    name: "actualizar_pedido",
    description:
      "Cambia el estado de un pedido. Estados validos: EN_PROCESO, LISTO, ENTREGADO, CANCELADO.",
    parameters: {
      type: "object",
      properties: {
        numero: { type: "number", description: "Numero del pedido" },
        mesa: { type: "string", description: "Mesa para encontrar el pedido activo" },
        estado: {
          type: "string",
          enum: ["EN_PROCESO", "LISTO", "ENTREGADO", "CANCELADO"],
          description: "Nuevo estado del pedido",
        },
      },
      required: ["estado"],
    },
  },

  // ── 4. Cancelar producto de un pedido ────────────────────
  {
    type: "function",
    name: "cancelar_producto",
    description:
      "Cancela un producto especifico dentro de un pedido activo. " +
      "Busca por nombre del producto dentro del pedido.",
    parameters: {
      type: "object",
      properties: {
        numero: { type: "number", description: "Numero del pedido" },
        mesa: { type: "string", description: "Mesa para encontrar el pedido activo" },
        producto: { type: "string", description: "Nombre del producto a cancelar" },
        cantidad: { type: "number", description: "Cantidad a cancelar (default: toda la cantidad)" },
      },
      required: ["producto"],
    },
  },

  // ── 5. Consultar stock / productos ───────────────────────
  {
    type: "function",
    name: "consultar_stock",
    description:
      "Busca productos por nombre o categoria. Devuelve nombre, precio, stock y si esta activo.",
    parameters: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Nombre parcial del producto a buscar" },
        categoria: { type: "string", description: "Nombre de la categoria para filtrar" },
      },
    },
  },

  // ── 6. Consultar ventas ──────────────────────────────────
  {
    type: "function",
    name: "consultar_ventas",
    description:
      "Consulta el resumen de ventas por periodo: hoy, ayer, semana o mes.",
    parameters: {
      type: "object",
      properties: {
        periodo: {
          type: "string",
          enum: ["hoy", "ayer", "semana", "mes"],
          description: "Periodo a consultar (default: hoy)",
        },
      },
    },
  },

  // ── 7. Estado cocina / KDS ───────────────────────────────
  {
    type: "function",
    name: "estado_cocina",
    description:
      "Muestra el estado actual de la cocina: pedidos pendientes, en proceso y listos. " +
      "Puede filtrar por estacion (COCINA, BARRA, CUARTO_CALIENTE, MOSTRADOR).",
    parameters: {
      type: "object",
      properties: {
        estacion: {
          type: "string",
          enum: ["COCINA", "BARRA", "CUARTO_CALIENTE", "MOSTRADOR"],
          description: "Filtrar por estacion de trabajo",
        },
      },
    },
  },

  // ── 8. Estado mesas ──────────────────────────────────────
  {
    type: "function",
    name: "estado_mesas",
    description:
      "Muestra el estado actual de las mesas: libres, ocupadas, en cuenta y reservadas. " +
      "Puede filtrar por sala o por estado.",
    parameters: {
      type: "object",
      properties: {
        sala: { type: "string", description: "Nombre de la sala para filtrar" },
        estado: {
          type: "string",
          enum: ["LIBRE", "OCUPADA", "CUENTA", "RESERVADA"],
          description: "Filtrar por estado de mesa",
        },
      },
    },
  },
];
