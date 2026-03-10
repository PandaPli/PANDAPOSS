import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { Rol } from "@/types";

interface ListOptions {
  sucursalId?: number | null;
  isAdmin: boolean;
}

interface CreateInput {
  nombre: string;
  usuario: string;
  password: string;
  email?: string | null;
  rol?: Rol;
  sucursalId?: number | null;
}

export const UsuarioRepo = {
  async list({ sucursalId, isAdmin }: ListOptions) {
    const rows = await prisma.usuario.findMany({
      where: {
        rol: { not: "ADMIN_GENERAL" },
        ...(!isAdmin && sucursalId ? { sucursalId } : {}),
      },
      include: { sucursal: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    });
    return rows.map(({ password: _, ...u }) => u);
  },

  async findByUsuario(usuario: string) {
    return prisma.usuario.findUnique({
      where: { usuario: usuario.toUpperCase() },
    });
  },

  async create(input: CreateInput) {
    const hash = await bcrypt.hash(input.password, 10);
    const created = await prisma.usuario.create({
      data: {
        nombre: input.nombre,
        usuario: input.usuario.toUpperCase(),
        password: hash,
        email: input.email ?? null,
        rol: input.rol ?? "WAITER",
        sucursalId: input.sucursalId ?? null,
      },
    });
    const { password: _, ...safe } = created;
    return safe;
  },

  async update(id: number, data: Record<string, unknown>, newPassword?: string) {
    const payload: Record<string, unknown> = { ...data };
    if (newPassword) payload.password = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.usuario.update({ where: { id }, data: payload });
    const { password: _, ...safe } = updated;
    return safe;
  },
};
