import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DeliveryClient } from "./DeliveryClient";
import type { Rol } from "@/types";

export default async function DeliveryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const delivery = (session.user as { delivery?: boolean })?.delivery ?? false;

  // Non-ADMIN_GENERAL without delivery feature → redirect
  if (rol !== "ADMIN_GENERAL" && !delivery) redirect("/panel");

  const sucursalWhere =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { OR: [{ caja: { sucursalId } }, { mesa: { sala: { sucursalId } } }] }
      : {};

  const [pedidos, repartidores] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        tipo: "DELIVERY",
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO", "ENTREGADO"] },
        ...(rol === "DELIVERY" && sucursalId ? { repartidorId: (session.user as { id?: number })?.id ?? undefined } : sucursalWhere),
      },
      include: {
        usuario: { select: { nombre: true } },
        repartidor: { select: { nombre: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 100,
    }),
    // Repartidores disponibles para asignar (solo admins)
    rol !== "DELIVERY"
      ? prisma.usuario.findMany({
          where: {
            rol: "DELIVERY",
            status: "ACTIVO",
            ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
          },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const data = pedidos.map((p) => ({
    id: p.id,
    estado: p.estado as "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO",
    observacion: p.observacion,
    direccionEntrega: p.direccionEntrega,
    telefonoCliente: p.telefonoCliente,
    repartidorId: p.repartidorId,
    creadoEn: p.creadoEn.toISOString(),
    usuario: p.usuario,
    repartidor: p.repartidor,
    detalles: p.detalles.map((d) => ({
      id: d.id,
      cantidad: d.cantidad,
      producto: d.producto,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Delivery</h1>
        <p className="text-surface-muted text-sm mt-1">Pedidos a domicilio</p>
      </div>
      <DeliveryClient pedidos={data} repartidores={repartidores} rol={rol ?? ""} />
    </div>
  );
}
