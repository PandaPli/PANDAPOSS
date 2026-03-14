import { getFreshSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const user = await getFreshSessionUser();
  if (!user) return null;

  const rol = user.rol;
  const sucursalId = user.sucursalId;

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
      <UsuariosClient usuarios={plainUsuarios} sucursales={sucursales} rol={rol} />
    </div>
  );
}
