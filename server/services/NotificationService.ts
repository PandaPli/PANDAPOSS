import { EstadoDelivery } from "@prisma/client";

export class NotificationService {
  /**
   * Envía una notificación por WhatsApp o SMS al cliente.
   */
  static async notifyCustomer(telefono: string, nombreCliente: string, estado: EstadoDelivery) {
    let mensaje = "";

    switch (estado) {
      case EstadoDelivery.CONFIRMADO:
        mensaje = `Hola ${nombreCliente}, hemos recibido tu pedido y lo estamos preparando. 🍔`;
        break;
      case EstadoDelivery.EN_CAMINO:
        mensaje = `Hola ${nombreCliente}, ¡tu pedido está en camino! 🚚`;
        break;
      case EstadoDelivery.ENTREGADO:
        mensaje = `¡Gracias por elegir PandaPoss! Esperamos que disfrutes tu pedido. 🎉`;
        break;
      default:
        return;
    }

    // Aquí iría la integración real (ej: Twilio, WATI, Meta API)
    console.log(`[WhatsApp -> ${telefono}]: ${mensaje}`);
    return true;
  }
}
