import { prisma } from "@/lib/db";
import { MesasClient } from "./MesasClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: Rol })?.rol;
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const [mesas, salas] = await Promise.all([
    getMesas(rol, sucursalId),
    prisma.sala.findMany({
      where: rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {},
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const mesasData = mesas.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    estado: m.estado as "LIBRE" | "OCUPADA" | "RESERVADA",
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

  const esAdmin = rol === "ADMIN_GENERAL" || rol === "ADMIN_SUCURSAL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Mesas</h1>
        <p className="text-surface-muted text-sm mt-1">Estado actual de todas las mesas</p>
      </div>
      <MesasClient mesas={mesasData} salas={salas} esAdmin={esAdmin} />
    </div>
  );
}
