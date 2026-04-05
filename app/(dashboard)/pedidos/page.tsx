import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PedidosClient } from "./PedidosClient";
import type { Rol } from "@/types";

/* Micro-mensajes por rol */
const WELCOME: Partial<Record<Rol, { emoji: string; msg: string }>> = {
  CHEF:    { emoji: "🍳", msg: "Hoy saldran platos perfectos." },
  BAR:     { emoji: "🍹", msg: "A mezclar felicidad!" },
  PASTRY:  { emoji: "🧁", msg: "Endulzando el dia!" },
};

async function getPedidos(rol: Rol | undefined, sucursalId: number | null) {
  const sucursalWhere =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { OR: [{ caja: { sucursalId } }, { mesa: { sala: { sucursalId } } }, { usuario: { sucursalId } }] }
      : {};

  return prisma.pedido.findMany({
    where: { ...sucursalWhere, estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
    include: {
      mesa: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      repartidor: { select: { nombre: true } },
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
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: Rol })?.rol;
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const pedidos = await getPedidos(rol, sucursalId);

  const data = pedidos.map((p) => ({
    id: p.id,
    numero: p.id,
    tipo: p.tipo as "COCINA" | "BAR" | "REPOSTERIA" | "DELIVERY" | "MOSTRADOR",
    estado: p.estado as "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO",
    observacion: p.observacion,
    meseroLlamado: p.meseroLlamado,
    direccionEntrega: p.direccionEntrega,
    telefonoCliente: p.telefonoCliente,
    repartidorId: p.repartidorId,
    creadoEn: p.creadoEn.toISOString(),
    mesa: p.mesa,
    usuario: p.usuario,
    repartidor: p.repartidor,
    detalles: p.detalles.map((d) => ({
      id: d.id,
      cantidad: d.cantidad,
      observacion: d.observacion,
      cancelado: d.cancelado ?? false,
      producto: d.producto,
      combo: d.combo,
    })),
  }));

  const welcome = rol ? WELCOME[rol] : null;

  return (
    <div className="-m-6 p-3">
      <PedidosClient pedidos={data} rol={rol} welcome={welcome} />
    </div>
  );
}
