import { prisma } from "@/lib/db";
import { estimateDeliveryMinutes, getDeliveryStageLabel, getDeliveryTrackingStage, parseDeliveryObservation } from "@/lib/delivery";

export const TrackingService = {
  async getPublicTracking(pedidoId: number) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        usuario: { select: { sucursalId: true } },
        repartidor: { select: { nombre: true } },
        delivery: { select: { codigoEntrega: true, estado: true, zonaDelivery: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true, precio: true } },
            combo: { select: { nombre: true, precio: true } },
          },
        },
      },
    });

    if (!pedido || pedido.tipo !== "DELIVERY") {
      throw new Error("Pedido delivery no encontrado.");
    }

    const meta = parseDeliveryObservation(pedido.observacion);
    const trackingStage = getDeliveryTrackingStage(pedido.estado as never, Boolean(pedido.repartidorId));
    const subtotal = pedido.detalles.reduce((acc, detalle) => {
      const precio = Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0);
      return acc + precio * detalle.cantidad;
    }, 0);

    const [pedidosActivos, driversActivos] = await Promise.all([
      prisma.pedido.count({
        where: {
          tipo: "DELIVERY",
          estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
          usuario: { sucursalId: pedido.usuario.sucursalId },
        },
      }),
      prisma.usuario.count({
        where: {
          rol: "DELIVERY",
          status: "ACTIVO",
          sucursalId: pedido.usuario.sucursalId,
        },
      }),
    ]);

    return {
      id: pedido.id,
      estado: pedido.estado,
      trackingStage,
      trackingLabel: getDeliveryStageLabel(trackingStage),
      clienteNombre: meta.clienteNombre,
      telefonoCliente: pedido.telefonoCliente,
      direccionEntrega: pedido.direccionEntrega,
      referencia: meta.referencia,
      departamento: meta.departamento,
      metodoPago: meta.metodoPago,
      cargoEnvio: meta.cargoEnvio,
      subtotal,
      total: subtotal + meta.cargoEnvio,
      repartidorNombre: pedido.repartidor?.nombre ?? null,
      // Mostrar código al cliente cuando el rider ya está en camino o llegó
      codigoEntrega: ["EN_PROCESO", "LISTO", "ENTREGADO"].includes(pedido.estado)
        ? (pedido.delivery?.codigoEntrega ?? null)
        : null,
      zonaDelivery: pedido.delivery?.zonaDelivery ?? null,
      creadoEn: pedido.creadoEn.toISOString(),
      estimadoMinutos: estimateDeliveryMinutes(pedidosActivos, driversActivos),
      detalles: pedido.detalles.map((detalle) => ({
        nombre: detalle.producto?.nombre ?? detalle.combo?.nombre ?? "Item",
        cantidad: detalle.cantidad,
        precio: Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0),
        subtotal: Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0) * detalle.cantidad,
      })),
    };
  },
};

