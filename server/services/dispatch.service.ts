import { prisma } from "@/lib/db";

export const DispatchService = {
  async suggestDriver(sucursalId: number | null) {
    if (!sucursalId) return null;

    const drivers = await prisma.usuario.findMany({
      where: {
        rol: "DELIVERY",
        status: "ACTIVO",
        sucursalId,
      },
      select: {
        id: true,
        nombre: true,
        pedidosRepartidor: {
          where: {
            tipo: "DELIVERY",
            estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
          },
          select: { id: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    if (drivers.length === 0) return null;

    const ranked = [...drivers].sort((a, b) => {
      const diff = a.pedidosRepartidor.length - b.pedidosRepartidor.length;
      if (diff !== 0) return diff;
      return a.nombre.localeCompare(b.nombre);
    });

    return {
      id: ranked[0].id,
      nombre: ranked[0].nombre,
      cargaActiva: ranked[0].pedidosRepartidor.length,
    };
  },

  async assignOrder(pedidoId: number, repartidorId: number | null) {
    return prisma.pedido.update({
      where: { id: pedidoId },
      data: { repartidorId },
      include: { repartidor: { select: { nombre: true } } },
    });
  },
};

