// Cola en memoria para mensajes WhatsApp salientes.
// Persiste mientras el servidor esté corriendo; se drena al ser consumida por el agente.
const wspQueue = new Map<number, Array<{ telefono: string; pedidoId: number; mensaje: string }>>();

export const NotificationService = {
  async notifyDeliveryCreated(input: { pedidoId: number; customerName: string; telefono: string }) {
    console.info("[NotificationService] delivery_created", input);
  },

  async notifyDeliveryStatusChange(input: {
    pedidoId: number;
    status: string;
    customerName?: string | null;
    telefono?: string | null;
    sucursalId?: number | null;
    esWhatsApp?: boolean;
  }) {
    console.info("[NotificationService] delivery_status_changed", input);

    // Sólo notificar cuando el humano acepta un pedido que vino por WhatsApp
    if (
      input.status === "EN_PROCESO" &&
      input.esWhatsApp &&
      input.telefono &&
      input.sucursalId
    ) {
      const queue = wspQueue.get(input.sucursalId) ?? [];
      queue.push({
        telefono: input.telefono,
        pedidoId: input.pedidoId,
        mensaje: "¡Aceptamos tu pedido! 🐼❤️ Estamos preparándolo, te avisamos cuando esté listo.",
      });
      wspQueue.set(input.sucursalId, queue);
      console.info("[NotificationService] queued wsp ack for telefono", input.telefono);
    }
  },

  /** El agente consume y drena la cola para su sucursal */
  drainWspQueue(sucursalId: number) {
    const items = wspQueue.get(sucursalId) ?? [];
    wspQueue.set(sucursalId, []);
    return items;
  },
};
