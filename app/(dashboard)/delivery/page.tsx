import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeliveryClient } from "./DeliveryClient";
import { estimateDeliveryMinutes, getDeliveryTrackingStage, parseDeliveryObservation } from "@/lib/delivery";
import type { Rol } from "@/types";

export default async function DeliveryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const deliveryEnabled = (session.user as { delivery?: boolean })?.delivery ?? false;
  const userId = (session.user as { id?: number })?.id ?? 0;

  if (rol !== "ADMIN_GENERAL" && !deliveryEnabled && rol !== "DELIVERY") redirect("/panel");

  const pedidoWhere = {
    tipo: "DELIVERY" as const,
    ...(rol === "DELIVERY"
      ? { repartidorId: userId }
      : rol !== "ADMIN_GENERAL" && sucursalId
      ? { usuario: { sucursalId } }
      : {}),
  };

  const repartidorWhere = {
    rol: "DELIVERY" as const,
    status: "ACTIVO" as const,
    ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pedidos, repartidores] = await Promise.all([
    prisma.pedido.findMany({
      where: pedidoWhere,
      include: {
        usuario: { select: { nombre: true, sucursalId: true } },
        repartidor: { select: { nombre: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true, precio: true } },
            combo: { select: { nombre: true, precio: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 150,
    }),
    prisma.usuario.findMany({
      where: repartidorWhere,
      select: {
        id: true,
        nombre: true,
        usuario: true,
        sucursal: { select: { nombre: true } },
        pedidosRepartidor: {
          where: { tipo: "DELIVERY", estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
          select: { id: true, estado: true, direccionEntrega: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const activeOrders = pedidos.filter((pedido) => ["PENDIENTE", "EN_PROCESO", "LISTO"].includes(pedido.estado));
  const deliveredOrders = pedidos.filter((pedido) => pedido.estado === "ENTREGADO");
  const todayOrders = pedidos.filter((pedido) => pedido.creadoEn >= startOfToday && pedido.estado !== "CANCELADO");
  const enCamino = pedidos.filter((pedido) => pedido.estado === "LISTO" && pedido.repartidorId);
  const tiempoPromedio = estimateDeliveryMinutes(activeOrders.length, repartidores.length);
  const ventasDelivery = todayOrders.reduce((acc, pedido) => {
    const meta = parseDeliveryObservation(pedido.observacion);
    const subtotal = pedido.detalles.reduce((sum, detalle) => sum + Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0) * detalle.cantidad, 0);
    return acc + subtotal + meta.cargoEnvio;
  }, 0);

  const pedidosData = pedidos.map((pedido) => {
    const meta = parseDeliveryObservation(pedido.observacion);
    const subtotal = pedido.detalles.reduce((sum, detalle) => sum + Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0) * detalle.cantidad, 0);
    return {
      id: pedido.id,
      estado: pedido.estado,
      trackingStage: getDeliveryTrackingStage(pedido.estado as never, Boolean(pedido.repartidorId)),
      clienteNombre: meta.clienteNombre,
      telefonoCliente: pedido.telefonoCliente,
      direccionEntrega: pedido.direccionEntrega,
      referencia: meta.referencia,
      departamento: meta.departamento,
      metodoPago: meta.metodoPago,
      cargoEnvio: meta.cargoEnvio,
      subtotal,
      total: subtotal + meta.cargoEnvio,
      repartidorId: pedido.repartidorId,
      creadoEn: pedido.creadoEn.toISOString(),
      repartidor: pedido.repartidor,
      detalles: pedido.detalles.map((detalle) => ({
        id: detalle.id,
        cantidad: detalle.cantidad,
        nombre: detalle.producto?.nombre ?? detalle.combo?.nombre ?? "Item",
      })),
    };
  });

  const repartidoresData = repartidores.map((repartidor) => ({
    id: repartidor.id,
    nombre: repartidor.nombre,
    usuario: repartidor.usuario,
    sucursalNombre: repartidor.sucursal?.nombre ?? "Sin sucursal",
    activos: repartidor.pedidosRepartidor.length,
    estado: (repartidor.pedidosRepartidor.length > 0 ? "EN_REPARTO" : "DISPONIBLE") as "EN_REPARTO" | "DISPONIBLE",
    pedidos: repartidor.pedidosRepartidor.map((pedido) => ({
      id: pedido.id,
      estado: pedido.estado,
      direccionEntrega: pedido.direccionEntrega,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Delivery</h1>
        <p className="mt-1 text-sm text-surface-muted">Canal publico, despacho y seguimiento integrados con PandaPoss.</p>
      </div>
      <DeliveryClient
        pedidos={pedidosData}
        repartidores={repartidoresData}
        rol={rol ?? ""}
        stats={{
          pedidosHoy: todayOrders.length,
          enCamino: enCamino.length,
          tiempoPromedio,
          ventasDelivery,
          activos: activeOrders.length,
          entregados: deliveredOrders.length,
        }}
      />
    </div>
  );
}


