import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseDeliveryObservation } from "@/lib/delivery";
import { ActiveDeliveryClient } from "./ActiveDeliveryClient";

export const dynamic = "force-dynamic";

export default async function ActiveDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: number; rol: string };
  if (user.rol !== "DELIVERY") redirect("/");

  const { id } = await params;
  const pedidoId = Number(id);
  if (!pedidoId) notFound();

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
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
          lat: true,
          lng: true,
        },
      },
      usuario: { select: { sucursal: { select: { nombre: true, direccion: true } } } },
    },
  });

  if (!pedido || pedido.tipo !== "DELIVERY") notFound();
  if (pedido.repartidorId !== user.id) redirect("/driver");

  const meta = parseDeliveryObservation(pedido.observacion);
  const subtotal = pedido.detalles.reduce((acc, d) => {
    return acc + Number(d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad;
  }, 0);

  const data = {
    id: pedido.id,
    numero: pedido.numero,
    estado: pedido.estado,
    clienteNombre: meta.clienteNombre ?? pedido.telefonoCliente ?? "Cliente",
    telefonoCliente: pedido.telefonoCliente ?? "",
    direccionEntrega: pedido.direccionEntrega ?? "",
    referencia: meta.referencia ?? null,
    departamento: meta.departamento ?? null,
    metodoPago: meta.metodoPago ?? "EFECTIVO",
    subtotal,
    cargoEnvio: Number(pedido.delivery?.costoEnvio ?? 0),
    total: subtotal + Number(pedido.delivery?.costoEnvio ?? 0),
    pagoRider: Number(pedido.delivery?.pagoRider ?? 0),
    codigoEntrega: pedido.delivery?.codigoEntrega ?? null,
    estadoDelivery: pedido.delivery?.estado ?? null,
    clienteLat: pedido.delivery?.lat ?? null,
    clienteLng: pedido.delivery?.lng ?? null,
    sucursalNombre: pedido.usuario.sucursal?.nombre ?? null,
    sucursalDireccion: pedido.usuario.sucursal?.direccion ?? null,
    detalles: pedido.detalles.map((d) => ({
      cantidad: d.cantidad,
      nombre: d.producto?.nombre ?? d.combo?.nombre ?? "Item",
      precio: Number(d.producto?.precio ?? d.combo?.precio ?? 0),
    })),
  };

  return <ActiveDeliveryClient pedido={data} />;
}
