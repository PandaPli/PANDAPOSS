import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientesClient } from "./ClientesClient";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const clientes = await prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  const plain = clientes.map((c) => ({
    id: c.id,
    rut: c.rut,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    direccion: c.direccion,
    activo: c.activo,
  }));

  return (
    <div className="space-y-6">
      <ClientesClient clientes={plain} />
    </div>
  );
}
