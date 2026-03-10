import { prisma } from "@/lib/db";

interface ListOptions {
  sucursalId?: number | null;
  isAdmin: boolean;
}

export const CajaRepo = {
  async list({ sucursalId, isAdmin }: ListOptions) {
    return prisma.caja.findMany({
      where: !isAdmin && sucursalId ? { sucursalId } : undefined,
      include: {
        usuario: { select: { nombre: true } },
        sucursal: { select: { nombre: true } },
      },
      orderBy: { id: "asc" },
    });
  },

  async findById(id: number) {
    return prisma.caja.findUnique({ where: { id } });
  },

  async create(nombre: string, sucursalId: number) {
    return prisma.caja.create({ data: { nombre, sucursalId } });
  },
};
