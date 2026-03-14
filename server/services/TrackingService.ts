import { PrismaClient, EstadoDelivery } from "@prisma/client";

const prisma = new PrismaClient();

export class TrackingService {
  /**
   * Actualiza la ubicación en vivo de un repartidor.
   */
  static async updateDriverLocation(repartidorId: number, lat: number, lng: number) {
    return await prisma.repartidor.update({
      where: { id: repartidorId },
      data: { lat, lng }
    });
  }

  /**
   * Avanza el estado de un pedido y emite un evento de tracking.
   */
  static async updateDeliveryStatus(pedidoId: number, nuevoEstado: EstadoDelivery) {
    const delivery = await prisma.pedidoDelivery.update({
      where: { pedidoId },
      data: { estado: nuevoEstado }
    });

    const event = await prisma.eventoDelivery.create({
      data: {
        pedidoDeliveryId: delivery.id,
        estado: nuevoEstado
      }
    });

    return { delivery, event };
  }
}
