import { prisma } from "@/lib/db";

interface ListOptions {
  sucursalId?: number | null;
  isAdmin: boolean;
  limit: number;
  skip: number;
}

export const VentaRepo = {
  async list({ sucursalId, isAdmin, limit, skip }: ListOptions) {
    const where = !isAdmin && sucursalId ? { caja: { sucursalId } } : {};

    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        take: limit,
        skip,
        orderBy: { creadoEn: "desc" },
        include: {
          cliente: { select: { nombre: true } },
          usuario: { select: { nombre: true } },
          _count: { select: { detalles: true } },
        },
      }),
      prisma.venta.count({ where }),
    ]);

    return { ventas, total };
  },
};
