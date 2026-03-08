import { prisma } from "@/lib/db";
import { MesasClient } from "./MesasClient";

async function getMesas() {
  return prisma.mesa.findMany({
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
  const mesas = await getMesas();

  // Serializar (Decimal → number)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Mesas</h1>
        <p className="text-zinc-500 text-sm mt-1">Estado actual de todas las mesas</p>
      </div>
      <MesasClient mesas={mesasData} />
    </div>
  );
}
