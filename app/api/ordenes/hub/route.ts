import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDeliveryObservation } from "@/lib/delivery";
import type { Rol } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

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

  const detallesInclude = {
    where: { cancelado: false } as const,
    include: {
      producto: { select: { nombre: true, precio: true } },
      combo:    { select: { nombre: true, precio: true } },
    },
  } as const;

  const [pedidosDelivery, pedidosLlevar, pedidosMesa, pedidosKioskoComer] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        tipo: "DELIVERY",
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        creadoEn: { gte: turnoDesde },
        ...sucursalFilter,
      },
      include: { detalles: detallesInclude },
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
      include: { detalles: detallesInclude },
      orderBy: { creadoEn: "desc" },
      take: 50,
    }),
    prisma.pedido.findMany({
      where: {
        mesaId: { not: null },
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        creadoEn: { gte: turnoDesde },
        ...sucursalFilter,
      },
      include: {
        mesa: { select: { nombre: true } },
        detalles: detallesInclude,
      },
      orderBy: { creadoEn: "desc" },
      take: 50,
    }),
    prisma.pedido.findMany({
      where: {
        tipo: "MOSTRADOR",
        observacion: { contains: "KIOSKO" },
        NOT: { observacion: { contains: "PARA LLEVAR" } },
        mesaId: null,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        creadoEn: { gte: turnoDesde },
        ...sucursalFilter,
      },
      include: { detalles: detallesInclude },
      orderBy: { creadoEn: "desc" },
      take: 50,
    }),
  ]);

  const mapProductos = (detalles: typeof pedidosDelivery[0]["detalles"]) =>
    detalles.map((d) => ({
      nombre:   d.producto?.nombre ?? d.combo?.nombre ?? d.nombre ?? "Producto",
      cantidad: d.cantidad,
      precio:   Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0),
    }));

  const delivery = pedidosDelivery.map((p) => {
    const meta = parseDeliveryObservation(p.observacion);
    const subtotal = p.detalles.reduce(
      (acc, d) => acc + Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad, 0,
    );
    return {
      id: p.id, numero: p.numero, estado: p.estado,
      clienteNombre: meta.clienteNombre,
      direccion: p.direccionEntrega, telefono: p.telefonoCliente,
      total: subtotal + meta.cargoEnvio - meta.descuento,
      creadoEn: p.creadoEn.toISOString(), items: p.detalles.length,
      metodoPago: meta.metodoPago, cargoEnvio: meta.cargoEnvio,
      descuento: meta.descuento, tipo: "DELIVERY" as const,
      productos: mapProductos(p.detalles),
    };
  });

  const llevar = pedidosLlevar.map((p) => {
    const obs = p.observacion ?? "";
    const nombreMatch    = obs.match(/👤\s*(.+?)(?:\s*·|$)/);
    const horaMatch      = obs.match(/🕐\s*(.+?)(?:\s*·|$)/);
    const pagoMatch      = obs.match(/💳\s*(.+?)(?:\s*·|$)/);
    const descuentoMatch = obs.match(/🏷️\s*DESC:(\d+)/);
    const descuento      = descuentoMatch ? Number(descuentoMatch[1]) : 0;
    const subtotal = p.detalles.reduce(
      (acc, d) => acc + Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad, 0,
    );
    return {
      id: p.id, numero: p.numero, estado: p.estado,
      clienteNombre: nombreMatch?.[1]?.trim() ?? "Sin nombre",
      horaRetiro: horaMatch?.[1]?.trim() ?? null,
      total: Math.max(0, subtotal - descuento),
      creadoEn: p.creadoEn.toISOString(), items: p.detalles.length,
      metodoPago: pagoMatch?.[1]?.trim() ?? "EFECTIVO",
      cargoEnvio: 0, descuento, tipo: "RETIRO" as const,
      productos: mapProductos(p.detalles),
    };
  });

  const mesaReal = pedidosMesa.map((p) => {
    const subtotal = p.detalles.reduce(
      (acc, d) => acc + Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad, 0,
    );
    return {
      id: p.id, numero: p.numero, estado: p.estado,
      clienteNombre: (p as unknown as { mesa: { nombre: string } | null }).mesa?.nombre ?? "Mesa",
      mesaNombre: (p as unknown as { mesa: { nombre: string } | null }).mesa?.nombre ?? "Mesa",
      esKiosko: false,
      total: subtotal, creadoEn: p.creadoEn.toISOString(), items: p.detalles.length,
      metodoPago: "EFECTIVO", cargoEnvio: 0, descuento: 0,
      tipo: "MESA" as const,
      productos: mapProductos(p.detalles),
    };
  });

  const kiosko = pedidosKioskoComer.map((p) => {
    const obs = p.observacion ?? "";
    const nombreMatch = obs.match(/👤\s*(.+?)(?:\s*·|$)/);
    const subtotal = p.detalles.reduce(
      (acc, d) => acc + Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad, 0,
    );
    return {
      id: p.id, numero: p.numero, estado: p.estado,
      clienteNombre: nombreMatch?.[1]?.trim() ?? "Kiosko",
      mesaNombre: "Kiosko", esKiosko: true,
      total: subtotal, creadoEn: p.creadoEn.toISOString(), items: p.detalles.length,
      metodoPago: "EFECTIVO", cargoEnvio: 0, descuento: 0,
      tipo: "MESA" as const,
      productos: mapProductos(p.detalles),
    };
  });

  const mesa = [...mesaReal, ...kiosko].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
  );

  return NextResponse.json({ delivery, llevar, mesa });
}
