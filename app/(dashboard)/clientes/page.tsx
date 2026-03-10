import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientesClient } from "./ClientesClient";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: string })?.rol ?? "";
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const [clientes, sucursales] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        activo: true,
        ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
      },
      include: { sucursal: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.sucursal.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
  ]);

  const plain = clientes.map((c) => ({
    id: c.id,
    rut: c.rut,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    direccion: c.direccion,
    activo: c.activo,
    sucursalId: c.sucursalId,
    sucursal: c.sucursal ?? undefined,
  }));

  return (
    <div className="space-y-6">
      <ClientesClient clientes={plain} sucursales={sucursales} rol={rol} sucursalIdSesion={sucursalId} />
    </div>
  );
}
