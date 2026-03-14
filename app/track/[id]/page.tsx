import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { estimateDeliveryMinutes, getDeliveryTrackingStage, parseDeliveryObservation } from "@/lib/delivery";
import { TrackOrderClient } from "./TrackOrderClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TrackOrderPage({ params }: Props) {
  const { id } = await params;
  const pedidoId = Number(id);

  if (!pedidoId) notFound();

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      usuario: { select: { sucursalId: true } },
      repartidor: { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true, precio: true } },
          combo: { select: { nombre: true, precio: true } },
        },
      },
    },
  });

  if (!pedido || pedido.tipo !== "DELIVERY") notFound();

  const meta = parseDeliveryObservation(pedido.observacion);
  const [pedidosActivos, driversActivos] = await Promise.all([
    prisma.pedido.count({
      where: {
        tipo: "DELIVERY",
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        usuario: { sucursalId: pedido.usuario.sucursalId },
      },
    }),
    prisma.usuario.count({
      where: { rol: "DELIVERY", status: "ACTIVO", sucursalId: pedido.usuario.sucursalId },
    }),
  ]);

  const subtotal = pedido.detalles.reduce((acc, detalle) => {
    const precio = Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0);
    return acc + precio * detalle.cantidad;
  }, 0);

  return (
    <TrackOrderClient
      initialData={{
        id: pedido.id,
        estado: pedido.estado,
        trackingStage: getDeliveryTrackingStage(pedido.estado as never, Boolean(pedido.repartidorId)),
        clienteNombre: meta.clienteNombre,
        telefonoCliente: pedido.telefonoCliente ?? "",
        direccionEntrega: pedido.direccionEntrega ?? "",
        referencia: meta.referencia ?? undefined,
        departamento: meta.departamento ?? undefined,
        metodoPago: meta.metodoPago,
        cargoEnvio: meta.cargoEnvio,
        subtotal,
        total: subtotal + meta.cargoEnvio,
        repartidorNombre: pedido.repartidor?.nombre ?? null,
        creadoEn: pedido.creadoEn.toISOString(),
        estimadoMinutos: estimateDeliveryMinutes(pedidosActivos, driversActivos),
        detalles: pedido.detalles.map((detalle) => ({
          nombre: detalle.producto?.nombre ?? detalle.combo?.nombre ?? "Item",
          cantidad: detalle.cantidad,
          precio: Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0),
          subtotal: Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0) * detalle.cantidad,
        })),
      }}
    />
  );
}

