import { EstadoPedido as PrismaEstadoPedido } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildDeliveryObservation, estimateDeliveryMinutes, getDeliveryStageLabel, getDeliveryTrackingStage, parseDeliveryObservation } from "@/lib/delivery";
import { PedidoService } from "@/server/services/pedido.service";
import { DispatchService } from "@/server/services/dispatch.service";
import { NotificationService } from "@/server/services/notification.service";
import type { DeliveryCustomerInput, EstadoPedido, MetodoPago, Rol } from "@/types";
import { PLAN_LIMITS, type PlanTipo } from "@/core/billing/planConfig";
import { effectiveFeature } from "@/lib/plan";

interface DeliveryItemInput {
  productoId?: number | null;
  nombre?: string;   // solo para productos libres
  precio?: number;   // solo para productos libres
  cantidad: number;
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
  }) {
    const { sucursalId, items, cliente, metodoPago, cargoEnvio = 0, zonaDelivery } = input;

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
      const precio = item.productoId
        ? Number(productosMap.get(Number(item.productoId))?.precio ?? 0)
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
          }),
          detalles: {
            create: items.map((item) => ({
              productoId: item.productoId ? Number(item.productoId) : null,
              cantidad: Number(item.cantidad),
              precio: item.productoId
                ? Number(productosMap.get(Number(item.productoId))?.precio ?? 0)
                : Number(item.precio ?? 0),
              observacion: !item.productoId && item.nombre ? `[LIBRE] ${item.nombre.trim()}` : undefined,
            }))
          }
        }
      });

      // 2. Crear o buscar Cliente
      let dbCliente = await tx.cliente.findFirst({
        where: { telefono: cliente.telefono.trim() }
      });
      if (!dbCliente) {
        dbCliente = await tx.cliente.create({
          data: {
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.trim(),
            sucursalId
          }
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

      // 5. Descontar stock — igual que ventas POS (puede quedar negativo, notificación vía socket)
      await Promise.all(
        items.map((item) =>
          tx.producto.update({
            where: { id: Number(item.productoId) },
            data: { stock: { decrement: Number(item.cantidad) } },
          })
        )
      );

      return pedido;
    });

    await NotificationService.notifyDeliveryCreated({
      pedidoId: result.id,
      customerName: cliente.nombre.trim(),
      telefono: cliente.telefono.trim(),
    });

    // Notificar stock bajo (misma lógica que ventas POS)
    const productoIds = items.map((i) => Number(i.productoId));
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
      total: subtotal + cargoEnvio,
      estimadoMinutos,
      trackingUrl: `/track/${result.id}`,
    };
  },

  async listOrders(scope: DeliveryScope) {
    const { rol, sucursalId, userId, includeHistory = false } = scope;

    const where = {
      tipo: "DELIVERY" as const,
      ...(rol === "DELIVERY"
        ? { repartidorId: userId }
        : rol !== "ADMIN_GENERAL" && sucursalId
        ? { usuario: { sucursalId } }
        : {}),
      ...(includeHistory ? {} : { estado: { in: activeDeliveryStatuses } }),
    };

    const [pedidos, activeCount, driverCount] = await Promise.all([
      prisma.pedido.findMany({
        where,
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
        const precio = Number(detalle.producto?.precio ?? detalle.combo?.precio ?? 0);
        return acc + precio * detalle.cantidad;
      }, 0);

      return {
        id: pedido.id,
        estado: pedido.estado,
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
        detalles: pedido.detalles.map((detalle) => ({
          id: detalle.id,
          cantidad: detalle.cantidad,
          nombre: detalle.producto?.nombre ?? detalle.combo?.nombre ?? "Item",
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
    return {
      id: updated.id,
      repartidorId: updated.repartidorId,
      repartidor: updated.repartidor,
    };
  },

  async updateStatus(input: { pedidoId: number; estado: EstadoPedido; rol: Rol; sucursalId: number | null; userId: number }) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: input.pedidoId },
      include: { usuario: { select: { sucursalId: true } } },
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

    await NotificationService.notifyDeliveryStatusChange({
      pedidoId: updated.id,
      status: updated.estado,
      customerName: meta.clienteNombre,
      telefono: updated.telefonoCliente,
    });

    return { id: updated.id, estado: updated.estado };
  },
};
