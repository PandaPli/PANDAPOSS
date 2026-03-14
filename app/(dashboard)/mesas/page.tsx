import { prisma } from "@/lib/db";
import { MesasClient } from "./MesasClient";
import { getFreshSessionUser } from "@/lib/auth";
import type { Rol } from "@/types";

async function getMesas(rol: Rol | undefined, sucursalId: number | null) {
  const where =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { sala: { sucursalId } }
      : {};

  return prisma.mesa.findMany({
    where,
    include: {
      sala: { select: { nombre: true } },
      pedidos: {
        where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
        orderBy: { creadoEn: "desc" },
        take: 1,
        select: {
          id: true,
          creadoEn: true,
          _count: { select: { detalles: true } },
        },
      },
    },
    orderBy: [{ salaId: "asc" }, { nombre: "asc" }],
  });
}

export default async function MesasPage() {
  const user = await getFreshSessionUser();
  if (!user) return null;

  const rol = user.rol as Rol;
  const sucursalId = user.sucursalId;
  const mesas = await getMesas(rol, sucursalId);

  // Serializar (Decimal → number)
  const mesasData = mesas.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    estado: m.estado as "LIBRE" | "OCUPADA" | "CUENTA" | "RESERVADA",
    capacidad: m.capacidad,
    salaId: m.salaId,
    sala: m.sala,
    pedidoActivo: m.pedidos[0]
      ? {
          id: m.pedidos[0].id,
          creadoEn: m.pedidos[0].creadoEn.toISOString(),
          _count: m.pedidos[0]._count,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Atención</h1>
        <p className="text-surface-muted text-sm mt-1">Puntos de atención y estado de mesas</p>
      </div>
      <MesasClient mesas={mesasData} />
    </div>
  );
}

