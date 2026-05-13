import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDeliveryObservation } from "@/lib/delivery";
import { OrdenesHub } from "./OrdenesHub";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Ordenes" };

export default async function OrdenesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session.user as { simbolo?: string })?.simbolo ?? "$";

  const cajaAbierta = sucursalId
    ? await prisma.caja.findFirst({
        where: { estado: "ABIERTA", sucursalId },
        select: { abiertaEn: true },
        orderBy: { abiertaEn: "desc" },
      })
    : null;
  const turnoDesde = cajaAbierta?.abiertaEn ?? (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  })();

  const sucursalFilter = rol !== "ADMIN_GENERAL" && sucursalId
    ? { usuario: { sucursalId } }
    : {};

  const [pedidosDelivery, pedidosLlevar] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        tipo: "DELIVERY",
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        creadoEn: { gte: turnoDesde },
        ...sucursalFilter,
      },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true, precio: true } },
            combo: { select: { nombre: true, precio: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 50,
    }),
    prisma.pedido.findMany({
      where: {
        tipo: "MOSTRADOR",
        observacion: { contains: "PARA LLEVAR" },
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        creadoEn: { gte: turnoDesde },
        ...sucursalFilter,
      },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true, precio: true } },
            combo: { select: { nombre: true, precio: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 50,
    }),
  ]);

  const deliveryData = pedidosDelivery.map((p) => {
    const meta = parseDeliveryObservation(p.observacion);
    const total = p.detalles.reduce(
      (acc, d) => acc + Number(d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad, 0,
    ) + meta.cargoEnvio;
    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      clienteNombre: meta.clienteNombre,
      direccion: p.direccionEntrega,
      total,
      creadoEn: p.creadoEn.toISOString(),
      items: p.detalles.length,
    };
  });

  const llevarData = pedidosLlevar.map((p) => {
    const obs = p.observacion ?? "";
    const nombreMatch = obs.match(/👤\s*(.+?)(?:\s*·|$)/);
    const horaMatch = obs.match(/🕐\s*(.+?)(?:\s*·|$)/);
    const total = p.detalles.reduce(
      (acc, d) => acc + Number(d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad, 0,
    );
    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      clienteNombre: nombreMatch?.[1]?.trim() ?? "Sin nombre",
      horaRetiro: horaMatch?.[1]?.trim() ?? null,
      total,
      creadoEn: p.creadoEn.toISOString(),
      items: p.detalles.length,
    };
  });

  return (
    <OrdenesHub
      deliveryPedidos={deliveryData}
      llevarPedidos={llevarData}
      simbolo={simbolo}
    />
  );
}
