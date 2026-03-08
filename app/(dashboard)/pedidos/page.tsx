import { prisma } from "@/lib/db";
import { PedidosClient } from "./PedidosClient";

async function getPedidos() {
  return prisma.pedido.findMany({
    where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
    include: {
      mesa: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true } },
          combo: { select: { nombre: true } },
        },
      },
    },
    orderBy: { creadoEn: "asc" },
  });
}

export default async function PedidosPage() {
  const pedidos = await getPedidos();

  const data = pedidos.map((p) => ({
    id: p.id,
    numero: p.id,
    tipo: p.tipo as "COCINA" | "BAR" | "REPOSTERIA" | "DELIVERY" | "MOSTRADOR",
    estado: p.estado as "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO",
    observacion: p.observacion,
    creadoEn: p.creadoEn.toISOString(),
    mesa: p.mesa,
    usuario: p.usuario,
    detalles: p.detalles.map((d) => ({
      id: d.id,
      cantidad: d.cantidad,
      observacion: d.observacion,
      producto: d.producto,
      combo: d.combo,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
        <p className="text-zinc-500 text-sm mt-1">Sistema de visualización de cocina (KDS)</p>
      </div>
      <PedidosClient pedidos={data} />
    </div>
  );
}
