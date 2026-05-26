import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PedidoService } from "@/server/services/pedido.service";
import { emitAiPosEvent } from "@/server/services/ai-pos.events";

type AiPosContext = {
  userId: number;
  rol: string;
  sucursalId: number | null;
};

type AiOrderItem = {
  productoId?: number;
  nombre?: string;
  cantidad: number;
  observacion?: string | null;
  opciones?: { grupoId: number; grupoNombre: string; opcionId: number; opcionNombre: string; precio: number }[];
  precio?: number;
};

type AiExecuteInput =
  | { action: "create_table"; salaId: number; nombre: string; capacidad?: number }
  | { action: "create_order"; mesaId: number; items: AiOrderItem[]; observacion?: string | null; tipo?: string }
  | { action: "add_items"; pedidoId?: number; mesaId?: number; items: AiOrderItem[]; observacion?: string | null }
  | { action: "cancel_items"; pedidoId?: number; mesaId?: number; productoId?: number; nombre?: string; cantidad?: number }
  | { action: "update_order_status"; pedidoId: number; estado: "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO" };

type AiQueryInput =
  | { query: "orders"; mesaId?: number; estado?: string }
  | { query: "stock"; q?: string; bajoStock?: boolean }
  | { query: "sales"; from?: string; to?: string }
  | { query: "kds"; estado?: string };

const assertSucursal = (context: AiPosContext) => {
  if (!context.sucursalId && context.rol !== "ADMIN_GENERAL") {
    throw new Error("Usuario sin sucursal asignada.");
  }
};

const getSucursalId = async (context: AiPosContext, explicitSucursalId?: number) => {
  if (context.rol === "ADMIN_GENERAL" && explicitSucursalId) return explicitSucursalId;
  assertSucursal(context);
  return context.sucursalId as number;
};

const ensureMesaInSucursal = async (mesaId: number, sucursalId: number) => {
  const mesa = await prisma.mesa.findFirst({
    where: { id: mesaId, sala: { sucursalId } },
    include: { sala: { select: { sucursalId: true, nombre: true } } },
  });

  if (!mesa) throw new Error("Mesa no encontrada en esta sucursal.");
  return mesa;
};

const findActivePedidoByMesa = async (mesaId: number) => {
  const pedido = await prisma.pedido.findFirst({
    where: { mesaId, estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
    orderBy: { creadoEn: "desc" },
    include: { detalles: true, mesa: true },
  });

  if (!pedido) throw new Error("No hay comanda activa para esta mesa.");
  return pedido;
};

const resolveItems = async (items: AiOrderItem[], sucursalId: number) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La accion requiere al menos un producto.");
  }

  const resolved = [];

  for (const item of items) {
    if (!item.cantidad || item.cantidad <= 0) {
      throw new Error("La cantidad debe ser mayor a cero.");
    }

    let productoId = item.productoId ?? null;

    if (!productoId && item.nombre) {
      const product = await prisma.producto.findFirst({
        where: {
          sucursalId,
          activo: true,
          OR: [{ nombre: { contains: item.nombre } }, { codigo: { contains: item.nombre } }],
        },
        select: { id: true },
      });
      productoId = product?.id ?? null;
    }

    if (!productoId) {
      throw new Error(`Producto no encontrado: ${item.nombre ?? "sin nombre"}`);
    }

    resolved.push({
      productoId,
      cantidad: item.cantidad,
      observacion: item.observacion ?? null,
      opciones: item.opciones ?? null,
      precio: item.precio ?? null,
    });
  }

  return resolved;
};

export const AiPosService = {
  async execute(input: AiExecuteInput & { sucursalId?: number }, context: AiPosContext) {
    const sucursalId = await getSucursalId(context, input.sucursalId);

    switch (input.action) {
      case "create_table": {
        const sala = await prisma.sala.findFirst({ where: { id: input.salaId, sucursalId } });
        if (!sala) throw new Error("Sala no encontrada en esta sucursal.");

        const mesa = await prisma.mesa.create({
          data: {
            salaId: input.salaId,
            nombre: input.nombre,
            capacidad: input.capacidad ?? 4,
          },
        });

        emitAiPosEvent({ sucursalId, action: input.action, entity: "mesa", data: mesa });
        return { ok: true, mesa };
      }

      case "create_order": {
        await ensureMesaInSucursal(input.mesaId, sucursalId);
        const items = await resolveItems(input.items, sucursalId);
        const pedido = await PedidoService.create({
          mesaId: input.mesaId,
          usuarioId: context.userId,
          tipo: input.tipo ?? "COCINA",
          items,
          observacion: input.observacion ?? "Creado por PandaPOS AI",
        });

        emitAiPosEvent({ sucursalId, action: input.action, entity: "pedido", data: pedido });
        return { ok: true, pedido };
      }

      case "add_items": {
        const pedido = input.pedidoId
          ? await prisma.pedido.findFirst({
              where: {
                id: input.pedidoId,
                OR: [{ mesa: { sala: { sucursalId } } }, { usuario: { sucursalId } }],
              },
            })
          : await findActivePedidoByMesa(input.mesaId ?? 0);

        if (!pedido) throw new Error("Pedido no encontrado.");
        const items = await resolveItems(input.items, sucursalId);
        const updated = await PedidoService.update(pedido.id, {
          nuevosItems: items,
          usuarioId: context.userId,
          observacion: input.observacion ?? undefined,
        });

        emitAiPosEvent({ sucursalId, action: input.action, entity: "pedido", data: updated });
        return { ok: true, pedido: updated };
      }

      case "cancel_items": {
        const pedido = input.pedidoId
          ? await prisma.pedido.findFirst({
              where: { id: input.pedidoId, mesa: { sala: { sucursalId } } },
              include: { detalles: true },
            })
          : await findActivePedidoByMesa(input.mesaId ?? 0);

        if (!pedido) throw new Error("Pedido no encontrado.");

        const targetName = input.nombre?.toLowerCase();
        const candidates = pedido.detalles.filter((detalle) => {
          if (detalle.cancelado) return false;
          if (input.productoId && detalle.productoId === input.productoId) return true;
          if (targetName && detalle.nombre?.toLowerCase().includes(targetName)) return true;
          return false;
        });

        if (candidates.length === 0) throw new Error("Producto no encontrado en la comanda.");

        const remaining = input.cantidad ?? candidates.reduce((sum, item) => sum + item.cantidad, 0);
        let toCancel = remaining;

        for (const detalle of candidates) {
          if (toCancel <= 0) break;
          if (toCancel >= detalle.cantidad) {
            await prisma.detallePedido.update({ where: { id: detalle.id }, data: { cancelado: true } });
            toCancel -= detalle.cantidad;
          } else {
            await prisma.detallePedido.update({
              where: { id: detalle.id },
              data: {
                cantidad: detalle.cantidad - toCancel,
                observacion: [detalle.observacion, `Cancelado por IA: ${toCancel}`].filter(Boolean).join(" | "),
              },
            });
            toCancel = 0;
          }
        }

        const updated = await prisma.pedido.findUnique({
          where: { id: pedido.id },
          include: { detalles: true, mesa: true },
        });

        emitAiPosEvent({ sucursalId, action: input.action, entity: "pedido", data: updated });
        return { ok: true, pedido: updated };
      }

      case "update_order_status": {
        const updated = await PedidoService.update(input.pedidoId, {
          estado: input.estado,
          usuarioId: context.userId,
        });
        emitAiPosEvent({ sucursalId, action: input.action, entity: "kds", data: updated });
        return { ok: true, pedido: updated };
      }
    }
  },

  async query(input: AiQueryInput & { sucursalId?: number }, context: AiPosContext) {
    const sucursalId = await getSucursalId(context, input.sucursalId);

    switch (input.query) {
      case "orders":
        return prisma.pedido.findMany({
          where: {
            ...(input.mesaId ? { mesaId: input.mesaId } : {}),
            ...(input.estado ? { estado: input.estado as never } : {}),
            mesa: { sala: { sucursalId } },
          },
          include: { mesa: true, detalles: true },
          orderBy: { creadoEn: "desc" },
          take: 30,
        });

      case "stock":
        return prisma.producto.findMany({
          where: {
            sucursalId,
            activo: true,
            ...(input.q ? { nombre: { contains: input.q } } : {}),
            ...(input.bajoStock ? { stock: { lte: prisma.producto.fields.stockMinimo } } : {}),
          },
          select: { id: true, codigo: true, nombre: true, stock: true, stockMinimo: true, inventariable: true },
          orderBy: { nombre: "asc" },
          take: 50,
        });

      case "sales": {
        const from = input.from ? new Date(input.from) : new Date(new Date().setHours(0, 0, 0, 0));
        const to = input.to ? new Date(input.to) : new Date();
        const ventas = await prisma.venta.aggregate({
          where: {
            creadoEn: { gte: from, lte: to },
            estado: "PAGADA",
            usuario: { sucursalId },
          },
          _count: { id: true },
          _sum: { total: true, subtotal: true, descuento: true },
        });

        return {
          from,
          to,
          totalVentas: Number(ventas._sum.total ?? 0),
          subtotal: Number(ventas._sum.subtotal ?? 0),
          descuentos: Number(ventas._sum.descuento ?? 0),
          transacciones: ventas._count.id,
        };
      }

      case "kds":
        return prisma.pedido.findMany({
          where: {
            estado: input.estado ? (input.estado as never) : { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
            mesa: { sala: { sucursalId } },
          },
          include: { mesa: true, detalles: true },
          orderBy: { creadoEn: "asc" },
        });
    }
  },
};
