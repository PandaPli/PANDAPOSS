import { prisma } from "@/lib/db";

interface ListOptions {
  sucursalId?: number | null;
  isAdmin: boolean;
  tipo?: string | null;
  estado?: string | null;
}

export const PedidoRepo = {
  async list({ sucursalId, isAdmin, tipo, estado }: ListOptions) {
    return prisma.pedido.findMany({
      where: {
        ...(tipo ? { tipo: tipo as never } : {}),
        ...(estado
          ? { estado: estado as never }
          : { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } }),
        ...(!isAdmin && sucursalId
          ? { OR: [{ caja: { sucursalId } }, { mesa: { sala: { sucursalId } } }] }
          : {}),
      },
      include: {
        mesa: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
        repartidor: { select: { nombre: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true } },
            combo: { select: { nombre: true } },
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
