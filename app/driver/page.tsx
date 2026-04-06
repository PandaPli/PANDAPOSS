import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseDeliveryObservation } from "@/lib/delivery";
import { DriverDashboard } from "./DriverDashboard";

export const dynamic = "force-dynamic";

export default async function PwaDriverPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: number; nombre: string; rol: string };
  if (user.rol !== "DELIVERY") redirect("/");

  // Cargar pedidos asignados
  const pedidos = await prisma.pedido.findMany({
    where: {
      tipo: "DELIVERY",
      repartidorId: user.id,
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
    },
    include: {
      detalles: {
        include: {
          producto: { select: { nombre: true, precio: true } },
          combo: { select: { nombre: true, precio: true } },
        },
      },
      delivery: {
        select: {
          costoEnvio: true,
          pagoRider: true,
          zonaDelivery: true,
          codigoEntrega: true,
          estado: true,
        },
      },
      usuario: { select: { sucursal: { select: { nombre: true } } } },
    },
    orderBy: { creadoEn: "asc" },
  });

  // Ganancias de hoy
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const entregasHoy = await prisma.pedidoDelivery.findMany({
    where: {
      repartidor: { usuarioId: user.id },
      estado: "ENTREGADO",
      creadoEn: { gte: hoyInicio },
    },
    select: { pagoRider: true },
  });

  const gananciasHoy = entregasHoy.reduce((acc, e) => acc + Number(e.pagoRider ?? 0), 0);

  const pedidosData = pedidos.map((p) => {
    const meta = parseDeliveryObservation(p.observacion);
    const subtotal = p.detalles.reduce((acc, d) => {
      return acc + Number(d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad;
    }, 0);

    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      clienteNombre: meta.clienteNombre ?? p.telefonoCliente ?? "Cliente",
      telefonoCliente: p.telefonoCliente ?? "",
      direccionEntrega: p.direccionEntrega ?? "",
      referencia: meta.referencia ?? null,
      departamento: meta.departamento ?? null,
      metodoPago: meta.metodoPago ?? "EFECTIVO",
      subtotal,
      cargoEnvio: Number(p.delivery?.costoEnvio ?? 0),
      total: subtotal + Number(p.delivery?.costoEnvio ?? 0),
      pagoRider: Number(p.delivery?.pagoRider ?? 0),
      zonaDelivery: p.delivery?.zonaDelivery ?? null,
      codigoEntrega: p.delivery?.codigoEntrega ?? null,
      estadoDelivery: p.delivery?.estado ?? null,
      sucursalNombre: p.usuario.sucursal?.nombre ?? null,
      creadoEn: p.creadoEn.toISOString(),
      detalles: p.detalles.map((d) => ({
        cantidad: d.cantidad,
        nombre: d.producto?.nombre ?? d.combo?.nombre ?? "Item",
      })),
    };
  });

  return (
    <DriverDashboard
      riderNombre={user.nombre}
      pedidos={pedidosData}
      gananciasHoy={gananciasHoy}
      entregasHoy={entregasHoy.length}
    />
  );
}
