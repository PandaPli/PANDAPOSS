import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import type { RrhhSession } from "./permissions";

export async function getRrhhSession(): Promise<RrhhSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as { rol?: Rol }).rol;
  const userId = (session.user as { id?: number }).id;
  const sucursalId = (session.user as { sucursalId?: number | null }).sucursalId ?? null;

  if (!role || !userId) throw new Error("UNAUTHORIZED");

  const sucursalIds =
    role === "ADMIN_GENERAL"
      ? (await prisma.sucursal.findMany({ where: { activa: true }, select: { id: true } })).map((item) => item.id)
      : sucursalId
        ? [sucursalId]
        : [];

  return { userId, role, sucursalIds };
}
