import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: string })?.rol ?? "";
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const [usuarios, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        rol: { not: "ADMIN_GENERAL" },
        ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
      },
      include: { sucursal: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const plainUsuarios = usuarios.map(({ password, ...u }) => ({
    ...u,
    sucursal: u.sucursal ? { nombre: u.sucursal.nombre } : null,
  }));

  return (
    <div className="space-y-6">
      <UsuariosClient usuarios={plainUsuarios} sucursales={sucursales} />
    </div>
  );
}
