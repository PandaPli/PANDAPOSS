import { prisma } from "@/lib/db";
import { EstadoDelivery, EstadoRepartidor } from "@prisma/client";
import { calculateDistance } from "@/lib/geo";

export class DispatchService {
  /**
   * Encuentra el repartidor más cercano con menos pedidos activos.
   */
  static async autoAssignDriver(pedidoId: number, lat: number, lng: number) {
    // 1. Obtener repartidores disponibles en la zona
    const availableDrivers = await prisma.repartidor.findMany({
      where: {
        estado: EstadoRepartidor.DISPONIBLE,
      },
      include: { usuario: true }
    });

    if (availableDrivers.length === 0) {
      return null;
    }

    // 2. Ordenar por cercanía (Haversine) + pedidos activos
    let selectedDriver = availableDrivers.sort((a, b) => {
      if (a.pedidosActivos !== b.pedidosActivos) {
        return a.pedidosActivos - b.pedidosActivos;
      }
      
      if (a.lat && a.lng && b.lat && b.lng) {
        const distA = calculateDistance(lat, lng, a.lat, a.lng);
        const distB = calculateDistance(lat, lng, b.lat, b.lng);
        return distA - distB;
      }

      return 0;
    })[0];

    // 3. Asignar el pedido al repartidor usando una Transacción
    if (selectedDriver) {
      await prisma.$transaction(async (tx) => {
        const delivery = await tx.pedidoDelivery.update({
          where: { pedidoId },
          data: {
            repartidorId: selectedDriver.id,
            estado: EstadoDelivery.EN_CAMINO
          }
        });

        await tx.repartidor.update({
          where: { id: selectedDriver.id },
          data: {
            pedidosActivos: { increment: 1 },
            estado: EstadoRepartidor.EN_RUTA
          }
        });

        await tx.eventoDelivery.create({
          data: {
            pedidoDeliveryId: delivery.id,
            estado: EstadoDelivery.EN_CAMINO
          }
        });
      });

      return selectedDriver;
    }

    return null;
  }

  /**
   * Calcula el envío basado en la distancia.
   * 0-3km = $1500
   * 3-5km = $2500
   * >5km  = $3500
   */
  static calculateDeliveryFee(distanceKm: number) {
    if (distanceKm <= 3) return 1500;
    if (distanceKm <= 5) return 2500;
    return 3500;
  }
}
