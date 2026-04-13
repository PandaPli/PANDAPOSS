import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeliveryClient } from "./DeliveryClient";
import { RepartidorView } from "./RepartidorView";
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

  // ── Vista repartidor ───────────────────────────────────────────────────────
  if (rol === "DELIVERY") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const riderPedidos = await prisma.pedido.findMany({
      where: { tipo: "DELIVERY", repartidorId: userId },
      include: {
        delivery: { select: { costoEnvio: true, pagoRider: true } },
        detalles: {
          include: {
            producto: { select: { precio: true } },
            combo:    { select: { precio: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 100,
    });

    const riderNombre = (session.user as { nombre?: string; name?: string })?.nombre
      ?? (session.user as { name?: string })?.name
      ?? "Repartidor";
    const simbolo = (session.user as { simbolo?: string })?.simbolo ?? "$";

    const pedidosRider = riderPedidos.map((p) => {
      const meta = parseDeliveryObservation(p.observacion);
      const subtotal = p.detalles.reduce(
        (acc, d) => acc + Number(d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad,
        0
      );
      return {
        id:               p.id,
        estado:           p.estado,
        clienteNombre:    meta.clienteNombre,
        telefonoCliente:  p.telefonoCliente,
        direccionEntrega: p.direccionEntrega,
        metodoPago:       meta.metodoPago,
        cargoEnvio:       Number(p.delivery?.costoEnvio ?? 0),
        pagoRider:        Number(p.delivery?.pagoRider  ?? 0),
        total:            subtotal + Number(p.delivery?.costoEnvio ?? 0),
        creadoEn:         p.creadoEn.toISOString(),
      };
    });

    return (
      <RepartidorView
        pedidos={pedidosRider}
        simbolo={simbolo}
        riderNombre={riderNombre}
      />
    );
  }
  // ── Fin vista repartidor ───────────────────────────────────────────────────

  const pedidoWhere = {
    tipo: "DELIVERY" as const,
    ...(rol !== "ADMIN_GENERAL" && sucursalId
      ? { usuario: { sucursalId } }
      : {}),
  };

  const repartidorWhere = {
    rol: "DELIVERY" as const,
    status: "ACTIVO" as const,
    ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
  };

  // Usar apertura de caja como inicio del turno (soporta turnos nocturnos)
  const cajaAbierta = sucursalId
    ? await prisma.caja.findFirst({
        where: { estado: "ABIERTA", sucursalId },
        orderBy: { abiertaEn: "desc" },
        select: { abiertaEn: true },
      })
    : null;
  const turnoDesde = cajaAbierta?.abiertaEn ?? (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  })();

  const simbolo       = (session.user as { simbolo?: string })?.simbolo ?? "$";
  const logoUrl       = (session.user as { logoUrl?: string | null })?.logoUrl ?? null;
  const sucursalNombreSession = (session.user as { name?: string })?.name ?? "";

  // Fetch zonas de delivery de la sucursal
  const sucursalData = sucursalId
    ? await prisma.sucursal.findUnique({
        where: { id: sucursalId },
        select: { nombre: true, zonasDelivery: true },
      })
    : null;

  interface ZonaDelivery { id: number; nombre: string; precio: number }
  const zonasDelivery: ZonaDelivery[] = Array.isArray(sucursalData?.zonasDelivery)
    ? (sucursalData!.zonasDelivery as unknown as ZonaDelivery[])
    : [];

  const [pedidos, repartidores, productos] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        ...pedidoWhere,
        creadoEn: { gte: turnoDesde },
      },
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
    prisma.producto.findMany({
      where: { activo: true, enMenu: true, ...(sucursalId ? { sucursalId } : {}) },
      include: { categoria: { select: { nombre: true } } },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    }),
  ]);

  const activeOrders = pedidos.filter((pedido) => ["PENDIENTE", "EN_PROCESO", "LISTO"].includes(pedido.estado));
  const deliveredOrders = pedidos.filter((pedido) => pedido.estado === "ENTREGADO");
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const todayOrders = pedidos.filter((pedido) => pedido.creadoEn >= startOfDay && pedido.estado !== "CANCELADO");
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
      meseroLlamado: pedido.meseroLlamado ?? false,
      llamadoTipo: pedido.llamadoTipo ?? null,
      detalles: pedido.detalles.map((detalle) => ({
        id: detalle.id,
        cantidad: detalle.cantidad,
        nombre: detalle.producto?.nombre ?? detalle.combo?.nombre ?? "Item",
        precio: Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0),
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
        productos={productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio),
          imagen: p.imagen,
          codigo: p.codigo,
          categoria: p.categoria ? { nombre: p.categoria.nombre } : undefined,
        }))}
        sucursalId={sucursalId}
        simbolo={simbolo}
        zonasDelivery={zonasDelivery}
        logoUrl={logoUrl}
        sucursalNombre={sucursalData?.nombre ?? sucursalNombreSession}
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


