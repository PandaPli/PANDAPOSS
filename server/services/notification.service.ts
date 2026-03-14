export const NotificationService = {
  async notifyDeliveryCreated(input: { pedidoId: number; customerName: string; telefono: string }) {
    console.info("[NotificationService] delivery_created", input);
  },

  async notifyDeliveryStatusChange(input: { pedidoId: number; status: string; customerName?: string | null; telefono?: string | null }) {
    console.info("[NotificationService] delivery_status_changed", input);
  },
};

