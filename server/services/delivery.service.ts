import { EstadoPedido as PrismaEstadoPedido } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildDeliveryObservation, estimateDeliveryMinutes, getDeliveryStageLabel, getDeliveryTrackingStage, parseDeliveryObservation } from "@/lib/delivery";
import { PedidoService } from "@/server/services/pedido.service";
import { DispatchService } from "@/server/services/dispatch.service";
import { NotificationService } from "@/server/services/notification.service";
import type { DeliveryCustomerInput, EstadoPedido, MetodoPago, Rol } from "@/types";
import { PLAN_LIMITS, type PlanTipo } from "@/core/billing/planConfig";
import { effectiveFeature } from "@/lib/plan";

interface ZonaConfig {
  nombre: string;
  costoCliente: number;
  pagoRider: number;
}

function generarCodigoEntrega(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface DeliveryItemInput {
  productoId?: number | null;
  nombre?: string;       // solo para productos libres
  precio?: number;       // solo para productos libres
  cantidad: number;
  observacion?: string;  // opciones / nota del ítem
}

interface DeliveryScope {
  rol: Rol;
  sucursalId: number | null;
  userId: number;
  includeHistory?: boolean;
}

const allowedPayments: MetodoPago[] = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];
const activeDeliveryStatuses: PrismaEstadoPedido[] = ["PENDIENTE", "EN_PROCESO", "LISTO"];

export const DeliveryService = {
  async createPublicOrder(input: {
    sucursalId: number;
    items: DeliveryItemInput[];
    cliente: DeliveryCustomerInput;
    metodoPago: MetodoPago;
    cargoEnvio?: number;
    zonaDelivery?: string;
    descuento?: number;
    cuponId?: number | null;
    cuponCodigo?: string | null;
  }) {
    const { sucursalId, items, cliente, metodoPago, cargoEnvio = 0, zonaDelivery, descuento = 0, cuponId = null, cuponCodigo = null } = input;

    if (!allowedPayments.includes(metodoPago)) {
      throw new Error("Selecciona un metodo de pago valido.");
    }

    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { id: true, activa: true, delivery: true, plan: true },
    });

    if (!sucursal || !sucursal.activa) {
      throw new Error("Esta sucursal no está disponible.");
    }

    // El plan PRIME/PRO activa delivery automáticamente; otros necesitan toggle manual
    const planSoportaDelivery = PLAN_LIMITS[sucursal.plan as PlanTipo]?.delivery ?? false;
    const deliveryActivo = effectiveFeature(sucursal.plan, sucursal.delivery);
    if (!planSoportaDelivery || !deliveryActivo) {
      throw new Error("Esta sucursal no tiene delivery habilitado.");
    }

    const itemsRegulares = items.filter((i) => i.productoId);
    const itemsLibres    = items.filter((i) => !i.productoId);

    // Validar productos libres
    for (const item of itemsLibres) {
      if (!item.nombre?.trim()) throw new Error("El producto libre debe tener un nombre.");
      if (!item.precio || Number(item.precio) <= 0) throw new Error("El producto libre debe tener un precio válido.");
    }

    const productIds = itemsRegulares.map((item) => Number(item.productoId));
    const productos = productIds.length > 0 ? await prisma.producto.findMany({
      where: {
        id: { in: productIds },
        activo: true,
        OR: [{ sucursalId }, { sucursalId: null }],
      },
      select: { id: true, nombre: true, precio: true, stock: true },
    }) : [];

    if (productos.length !== productIds.length) {
      throw new Error("Uno o mas productos ya no estan disponibles.");
    }

    const productosMap = new Map(productos.map((producto) => [producto.id, producto]));

    for (const item of itemsRegulares) {
      const producto = productosMap.get(Number(item.productoId));
      if (!producto || Number(item.cantidad) <= 0) {
        throw new Error("El pedido contiene cantidades invalidas.");
      }
      // Stock bajo: se permite la venta. El restaurante recibe notificación vía socket.
    }

    const usuarioSistema = await prisma.usuario.findFirst({
      where: {
        sucursalId,
        status: "ACTIVO",
        rol: { in: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "WAITER", "SECRETARY"] },
      },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (!usuarioSistema) {
      throw new Error("No hay personal activo en la sucursal para recibir pedidos delivery.");
    }

    const subtotal = items.reduce((acc, item) => {
      const basePrice = item.productoId
        ? Number(productosMap.get(Number(item.productoId))?.precio ?? 0)
        : 0;
      // Usar el precio enviado por el frontend si incluye opciones (>= precio base)
      // Si no se envía precio, usar el de la BD
      const precio = item.productoId
        ? (item.precio != null && Number(item.precio) >= basePrice ? Number(item.precio) : basePrice)
        : Number(item.precio ?? 0);
      return acc + precio * Number(item.cantidad);
    }, 0);

    const [driversActivos, pedidosActivos] = await Promise.all([
      prisma.usuario.count({ where: { sucursalId, rol: "DELIVERY", status: "ACTIVO" } }),
      prisma.pedido.count({ where: { tipo: "DELIVERY", estado: { in: activeDeliveryStatuses }, usuario: { sucursalId } } }),
    ]);

    const estimadoMinutos = estimateDeliveryMinutes(pedidosActivos + 1, driversActivos);

    // Mover las operaciones de creacion a una transaccion atomica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el Pedido base (re-implementando PedidoService.create para la tx)
      const pedido = await tx.pedido.create({
        data: {
          tipo: "DELIVERY",
          estado: "PENDIENTE",
          usuarioId: usuarioSistema.id,
          direccionEntrega: cliente.direccion.trim(),
          telefonoCliente: cliente.telefono.trim(),
          observacion: buildDeliveryObservation({
            clienteNombre: cliente.nombre.trim(),
            referencia: cliente.referencia,
            departamento: cliente.departamento,
            metodoPago,
            cargoEnvio,
            descuento,
            cuponCodigo,
          }),
          detalles: {
            create: items.map((item) => ({
              productoId: item.productoId ? Number(item.productoId) : null,
              cantidad: Number(item.cantidad),
              precio: item.productoId
                ? (() => {
                    const base = Number(productosMap.get(Number(item.productoId))?.precio ?? 0);
                    return item.precio != null && Number(item.precio) >= base ? Number(item.precio) : base;
                  })()
                : Number(item.precio ?? 0),
              observacion: !item.productoId && item.nombre
                ? `[LIBRE] ${item.nombre.trim()}`
                : item.observacion?.trim() || undefined,
            }))
          }
        }
      });

      // 2. Crear o buscar Cliente
      // Solo buscamos por teléfono si es un número válido (≥12 chars: +56912345678)
      const telefonoValido = cliente.telefono.trim().length >= 12 ? cliente.telefono.trim() : null;
      let dbCliente = telefonoValido
        ? await tx.cliente.findFirst({ where: { telefono: telefonoValido } })
        : null;

      if (!dbCliente) {
        // Cliente nuevo: registrar con nombre, teléfono y dirección principal
        dbCliente = await tx.cliente.create({
          data: {
            nombre:    cliente.nombre.trim(),
            telefono:  telefonoValido,
            direccion: cliente.direccion.trim() || null,
            sucursalId,
          },
        });
      } else {
        // Cliente existente: actualizar nombre y dirección si cambió
        await tx.cliente.update({
          where: { id: dbCliente.id },
          data: {
            nombre:    cliente.nombre.trim(),
            direccion: cliente.direccion.trim() || null,
          },
        });
      }

      // 3. Crear direccion
      const dbDireccion = await tx.direccionCliente.create({
        data: {
          clienteId: dbCliente.id,
          calle: cliente.direccion.trim(),
          referencia: cliente.referencia,
          lat: null,
          lng: null
        }
      });

      // 4. Crear Delivery request
      await tx.pedidoDelivery.create({
        data: {
          pedidoId: pedido.id,
          clienteId: dbCliente.id,
          direccionId: dbDireccion.id,
          referencia: cliente.referencia,
          lat: null,
          lng: null,
          costoEnvio: cargoEnvio,
          zonaDelivery: zonaDelivery ?? null,
          tiempoEstimado: estimadoMinutos,
          estado: "CREADO"
        }
      });

      // 5. Descontar stock — solo para productos con ID (los libres no tienen stock en DB)
      const itemsConProducto = items.filter((item) => item.productoId);
      if (itemsConProducto.length > 0) {
        await Promise.all(
          itemsConProducto.map((item) =>
            tx.producto.update({
              where: { id: Number(item.productoId) },
              data: { stock: { decrement: Number(item.cantidad) } },
            })
          )
        );
      }

      return pedido;
    });

    await NotificationService.notifyDeliveryCreated({
      pedidoId: result.id,
      customerName: cliente.nombre.trim(),
      telefono: cliente.telefono.trim(),
    });

    // Notificar KDS en tiempo real
    const globalForSocket = global as unknown as { io?: import("socket.io").Server };
    try {
      globalForSocket.io?.to(`sucursal_${sucursalId}_kds`).emit("pedido:nuevo", { id: result.id });
    } catch { /* no bloquear */ }

    // Notificar stock bajo (misma lógica que ventas POS)
    const productoIds = items.filter((i) => i.productoId).map((i) => Number(i.productoId));
    const sinStock = await prisma.producto.findMany({
      where: { id: { in: productoIds }, stock: { lte: 0 } },
      select: { nombre: true, stock: true },
    });
    if (sinStock.length > 0) {
      const globalForSocket = global as unknown as { io?: import("socket.io").Server };
      try {
        globalForSocket.io
          ?.to(`sucursal_${sucursalId}_alertas`)
          .emit("stock:bajo", {
            sucursalId,
            alertas: sinStock.map((p) => ({ nombre: p.nombre, stock: Number(p.stock) })),
            ts: Date.now(),
          });
      } catch {
        // No bloquear si el socket falla
      }
    }

    return {
      id: result.id,
      estado: result.estado,
      subtotal,
      cargoEnvio,
      descuento,
      total: Math.max(0, subtotal + cargoEnvio - descuento),
      estimadoMinutos,
      trackingUrl: `/track/${result.id}`,
    };
  },

  async listOrders(scope: DeliveryScope) {
    const { rol, sucursalId, userId, includeHistory = false } = scope;

    // Usar apertura de caja como inicio del turno (soporta turnos nocturnos).
    // Fallback: inicio del día actual.
    let turnoDesde: Date;
    if (!includeHistory) {
      const cajaAbierta = sucursalId
        ? await prisma.caja.findFirst({
            where: { estado: "ABIERTA", sucursalId },
            orderBy: { abiertaEn: "desc" },
            select: { abiertaEn: true },
          })
        : null;
      if (cajaAbierta?.abiertaEn) {
        turnoDesde = cajaAbierta.abiertaEn;
      } else {
        turnoDesde = new Date();
        turnoDesde.setHours(0, 0, 0, 0);
      }
    } else {
      turnoDesde = new Date(0); // includeHistory: sin límite
    }

    const where = {
      tipo: "DELIVERY" as const,
      ...(rol === "DELIVERY"
        ? { repartidorId: userId }
        : rol !== "ADMIN_GENERAL" && sucursalId
        ? { usuario: { sucursalId } }
        : {}),
      ...(includeHistory
        ? {}
        : { estado: { in: activeDeliveryStatuses }, creadoEn: { gte: turnoDesde } }),
    };

    const [pedidos, activeCount, driverCount] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, sucursalId: true } },
          repartidor: { select: { nombre: true } },
          // zonaDelivery distingue delivery real de retiro en tienda
          // (el cliente lo setea en "Retiro en tienda" cuando elige modoRetiro
          // en /pedir). Sin este include, el ticket no puede saber el modo.
          delivery: { select: { zonaDelivery: true } },
          detalles: {
            select: {
              id: true,
              cantidad: true,
              observacion: true,
              precio: true,
              producto: { select: { nombre: true, precio: true } },
              combo: { select: { nombre: true, precio: true } },
            },
          },
        },
        orderBy: { creadoEn: "desc" },
        take: includeHistory ? 100 : 50,
      }),
      prisma.pedido.count({
        where: {
          tipo: "DELIVERY",
          estado: { in: activeDeliveryStatuses },
          ...(rol !== "ADMIN_GENERAL" && sucursalId ? { usuario: { sucursalId } } : {}),
        },
      }),
      prisma.usuario.count({
        where: {
          rol: "DELIVERY",
          status: "ACTIVO",
          ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
        },
      }),
    ]);

    const estimadoMinutos = estimateDeliveryMinutes(activeCount, driverCount);

    return pedidos.map((pedido) => {
      const meta = parseDeliveryObservation(pedido.observacion);
      const trackingStage = getDeliveryTrackingStage(pedido.estado as never, Boolean(pedido.repartidorId));
      const subtotal = pedido.detalles.reduce((acc, detalle) => {
        // productos libres guardan el precio directamente en detalle.precio
        const precio = Number(detalle.producto?.precio ?? detalle.combo?.precio ?? detalle.precio ?? 0);
        return acc + precio * detalle.cantidad;
      }, 0);

      return {
        id: pedido.id,
        estado: pedido.estado,
        meseroLlamado: pedido.meseroLlamado,
        llamadoTipo: pedido.llamadoTipo ?? null,
        trackingStage,
        trackingLabel: getDeliveryStageLabel(trackingStage),
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
        repartidor: pedido.repartidor,
        creadoEn: pedido.creadoEn,
        estimadoMinutos,
        zonaDelivery: pedido.delivery?.zonaDelivery ?? null,
        detalles: pedido.detalles.map((detalle) => ({
          id: detalle.id,
          cantidad: detalle.cantidad,
          nombre: detalle.producto?.nombre ?? detalle.combo?.nombre
            ?? (detalle.observacion?.startsWith("[LIBRE]") ? detalle.observacion.replace("[LIBRE] ", "") : null)
            ?? "Item",
          precio: Number(detalle.producto?.precio ?? detalle.combo?.precio ?? detalle.precio ?? 0),
        })),
      };
    });
  },

  async assignDriver(input: { pedidoId: number; repartidorId: number | null; rol: Rol; sucursalId: number | null }) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: input.pedidoId },
      include: { usuario: { select: { sucursalId: true } } },
    });

    if (!pedido || pedido.tipo !== "DELIVERY") {
      throw new Error("Pedido delivery no encontrado.");
    }

    if (input.rol !== "ADMIN_GENERAL" && input.sucursalId && pedido.usuario.sucursalId !== input.sucursalId) {
      throw new Error("Este pedido no pertenece a tu sucursal.");
    }

    let repartidorId = input.repartidorId;
    if (!repartidorId && input.sucursalId) {
      const suggested = await DispatchService.suggestDriver(input.sucursalId);
      repartidorId = suggested?.id ?? null;
    }

    if (repartidorId) {
      const repartidor = await prisma.usuario.findUnique({
        where: { id: repartidorId },
        select: { id: true, rol: true, status: true, sucursalId: true },
      });

      if (!repartidor || repartidor.rol !== "DELIVERY" || repartidor.status !== "ACTIVO") {
        throw new Error("Repartidor invalido.");
      }

      if (input.rol !== "ADMIN_GENERAL" && input.sucursalId && repartidor.sucursalId !== input.sucursalId) {
        throw new Error("El repartidor no pertenece a tu sucursal.");
      }
    }

    const updated = await DispatchService.assignOrder(input.pedidoId, repartidorId);

    // Al asignar un rider: generar código de entrega y setear pagoRider desde zona
    if (repartidorId) {
      const delivery = await prisma.pedidoDelivery.findUnique({
        where: { pedidoId: input.pedidoId },
        select: { id: true, zonaDelivery: true, codigoEntrega: true },
      });

      if (delivery) {
        // Generar código solo si no tiene uno aún
        const codigoEntrega = delivery.codigoEntrega ?? generarCodigoEntrega();

        // Buscar pagoRider desde la config de zonas de la sucursal
        let pagoRider: number | undefined;
        if (delivery.zonaDelivery) {
          const sucursalId = pedido.usuario.sucursalId;
          if (sucursalId) {
            const sucursal = await prisma.sucursal.findUnique({
              where: { id: sucursalId },
              select: { zonasDelivery: true },
            });
            const zonas = (sucursal?.zonasDelivery as ZonaConfig[] | null) ?? [];
            const zona = zonas.find((z) => z.nombre === delivery.zonaDelivery);
            if (zona?.pagoRider) pagoRider = zona.pagoRider;
          }
        }

        await prisma.pedidoDelivery.update({
          where: { id: delivery.id },
          data: {
            codigoEntrega,
            ...(pagoRider !== undefined ? { pagoRider } : {}),
            repartidorId: await prisma.repartidor.findUnique({ where: { usuarioId: repartidorId } }).then((r) => r?.id ?? undefined),
          },
        });
      }
    }

    return {
      id: updated.id,
      repartidorId: updated.repartidorId,
      repartidor: updated.repartidor,
    };
  },

  async updateStatus(input: { pedidoId: number; estado: EstadoPedido; rol: Rol; sucursalId: number | null; userId: number }) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: input.pedidoId },
      include: {
        usuario: { select: { sucursalId: true } },
        delivery: { select: { zonaDelivery: true } },
      },
    });

    if (!pedido || pedido.tipo !== "DELIVERY") {
      throw new Error("Pedido delivery no encontrado.");
    }

    if (input.rol === "DELIVERY" && pedido.repartidorId !== input.userId) {
      throw new Error("Solo puedes actualizar tus pedidos asignados.");
    }

    if (input.rol !== "ADMIN_GENERAL" && input.rol !== "DELIVERY" && input.sucursalId && pedido.usuario.sucursalId !== input.sucursalId) {
      throw new Error("Este pedido no pertenece a tu sucursal.");
    }

    const updated = await PedidoService.update(input.pedidoId, { estado: input.estado });
    const meta = parseDeliveryObservation(updated.observacion);
    const esWhatsApp = pedido.delivery?.zonaDelivery === "WhatsApp";

    await NotificationService.notifyDeliveryStatusChange({
      pedidoId: updated.id,
      status: updated.estado,
      customerName: meta.clienteNombre,
      telefono: updated.telefonoCliente,
      sucursalId: pedido.usuario.sucursalId,
      esWhatsApp,
    });

    return { id: updated.id, estado: updated.estado };
  },
};
