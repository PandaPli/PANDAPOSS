import { prisma } from "@/lib/db";

interface ListOptions {
  sucursalId?: number | null;
  isAdmin: boolean;
  tipo?: string | null;
  estado?: string | null;
}

export const PedidoRepo = {
  async list({ sucursalId, isAdmin, tipo, estado }: ListOptions) {
    // Filtrar desde que se abrió el turno actual (caja abierta).
    // Soporta turnos nocturnos que cruzan medianoche (ej: 20:00 → 04:00).
    // Fallback: inicio del día actual si no hay caja abierta.
    let turnoDesde: Date;
    if (sucursalId || isAdmin) {
      const cajaAbierta = await prisma.caja.findFirst({
        where: {
          estado: "ABIERTA",
          ...(sucursalId && !isAdmin ? { sucursalId } : {}),
        },
        orderBy: { abiertaEn: "desc" },
        select: { abiertaEn: true },
      });
      if (cajaAbierta?.abiertaEn) {
        turnoDesde = cajaAbierta.abiertaEn;
      } else {
        turnoDesde = new Date();
        turnoDesde.setHours(0, 0, 0, 0);
      }
    } else {
      turnoDesde = new Date();
      turnoDesde.setHours(0, 0, 0, 0);
    }

    return prisma.pedido.findMany({
      where: {
        creadoEn: { gte: turnoDesde },
        ...(tipo ? { tipo: tipo as never } : {}),
        ...(estado
          ? { estado: estado as never }
          : { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } }),
        ...(!isAdmin && sucursalId
          ? {
              OR: [
                { caja: { sucursalId } },
                { mesa: { sala: { sucursalId } } },
                { usuario: { sucursalId } },
                // Delivery público: el usuarioSistema puede ser de cualquier rol, buscar por delivery.repartidor.usuario.sucursalId también
                { delivery: { cliente: { sucursalId } } },
              ],
            }
          : {}),
      },
      include: {
        mesa: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
        repartidor: { select: { nombre: true } },
        delivery: { select: { zonaDelivery: true } },
        detalles: {
          include: {
            producto: {
              select: {
                nombre: true,
                categoria: { select: { estacion: true } },
              },
            },
            combo: {
              select: {
                nombre: true,
                categoria: { select: { estacion: true } },
              },
            },
          },
        },
      },
      orderBy: { creadoEn: "asc" },
    });
  },

  async countActivosByMesa(mesaId: number) {
    return prisma.pedido.count({
      where: {
        mesaId,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      },
    });
  },
};
