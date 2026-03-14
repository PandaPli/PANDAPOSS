import { prisma } from "@/lib/db";
import { EstadoDelivery } from "@prisma/client";
import { calculateDistance } from "@/lib/geo";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface OrderToRoute {
  pedidoId: number;
  location: Coordinate;
}

export class RouteOptimizerService {
  /**
   * Ordena una lista de pedidos considerando la menor distancia desde el origen (restaurante)
   * hacia cada punto subsiguiente, logrando la ruta mas eficiente (Greedy approach).
   */
  static optimizeRoute(restaurantLoc: Coordinate, orders: OrderToRoute[]): OrderToRoute[] {
    if (orders.length <= 1) return orders;

    const unassigned = [...orders];
    const optimized: OrderToRoute[] = [];
    let currentPos = restaurantLoc;

    while (unassigned.length > 0) {
      // Find the nearest order to the current position
      unassigned.sort((a, b) => {
        const da = calculateDistance(currentPos.lat, currentPos.lng, a.location.lat, a.location.lng);
        const db = calculateDistance(currentPos.lat, currentPos.lng, b.location.lat, b.location.lng);
        return da - db;
      });

      // Pick nearest
      const nextOrder = unassigned.shift()!;
      optimized.push(nextOrder);
      
      // Update current position for next iteration
      currentPos = nextOrder.location;
    }

    return optimized;
  }

  /**
   * Calcula el ETA (Estimated Time of Arrival) considerando:
   * 1. Tiempo de preparación en cocina
   * 2. Distancia en MRU
   * 3. Factor de trafico simulado (o extraido de APIs de Mapas)
   */
  static calculatePredictiveETA(prepMinutes: number, distanceKm: number, numPedidosEnCola: number): number {
    const driverSpeedKmh = 30; // 30 km/h en ciudad
    const distanceTimeObj = (distanceKm / driverSpeedKmh) * 60; // minutos por trayecto
    
    // Penalizacion de trafico estática basada en cola (Simulada)
    const trafficFactor = numPedidosEnCola * 2; // +2 mins por cada pedido atorado
    const handlingTime = 3; // tiempo entregando y estacionando
    
    return Math.round(prepMinutes + distanceTimeObj + trafficFactor + handlingTime);
  }
}
