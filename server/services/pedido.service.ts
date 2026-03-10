import { prisma } from "@/lib/db";
import { Prisma, EstadoPedido } from "@prisma/client";
import { PedidoRepo } from "@/server/repositories/pedido.repo";

interface PedidoItem {
  productoId?: number | null;
  comboId?: number | null;
  cantidad: number;
  observacion?: string | null;
}

export interface CreatePedidoInput {
  mesaId?: number | null;
  cajaId?: number | null;
  usuarioId: number;
  tipo?: string;
  items: PedidoItem[];
  observacion?: string | null;
  direccionEntrega?: string | null;
  telefonoCliente?: string | null;
  repartidorId?: number | null;
}

export interface UpdatePedidoInput {
  estado?: string;
  meseroLlamado?: boolean;
  repartidorId?: number | null;
  direccionEntrega?: string | null;
  telefonoCliente?: string | null;
}

export const PedidoService = {
  async create(input: CreatePedidoInput) {
    const {
      mesaId, cajaId, usuarioId, tipo, items,
      observacion, direccionEntrega, telefonoCliente, repartidorId,
    } = input;

    const pedido = await prisma.pedido.create({
      data: {
        mesaId: mesaId ?? null,
        cajaId: cajaId ?? null,
        usuarioId,
        tipo: (tipo ?? "COCINA") as never,
        estado: "PENDIENTE",
        observacion: observacion ?? null,
        direccionEntrega: direccionEntrega ?? null,
        telefonoCliente: telefonoCliente ?? null,
        repartidorId: repartidorId ?? null,
        detalles: {
          create: items.map((item) => ({
            productoId: item.productoId ?? null,
            comboId: item.comboId ?? null,
            cantidad: item.cantidad,
            observacion: item.observacion ?? null,
          })),
        },
      },
      include: { detalles: true },
    });

    // Marcar mesa como ocupada
    if (mesaId) {
      await prisma.mesa.update({
        where: { id: mesaId },
        data: { estado: "OCUPADA" },
      });
    }

    return pedido;
  },

  async update(id: number, input: UpdatePedidoInput) {
    const { estado, meseroLlamado, repartidorId, direccionEntrega, telefonoCliente } = input;

    const data: Prisma.PedidoUncheckedUpdateInput = {};
    if (estado !== undefined) data.estado = estado as EstadoPedido;
    if (meseroLlamado !== undefined) data.meseroLlamado = meseroLlamado;
    if (repartidorId !== undefined) data.repartidorId = repartidorId ?? null;
    if (direccionEntrega !== undefined) data.direccionEntrega = direccionEntrega ?? null;
    if (telefonoCliente !== undefined) data.telefonoCliente = telefonoCliente ?? null;
    // Al entregar, limpiar llamada al mesero
    if (estado === "ENTREGADO") data.meseroLlamado = false;

    const pedido = await prisma.pedido.update({
      where: { id },
      data,
      include: { mesa: true },
    });

    // Auto-liberar mesa cuando no quedan pedidos activos
    if (estado === "ENTREGADO" && pedido.mesaId) {
      const pendientes = await PedidoRepo.countActivosByMesa(pedido.mesaId);
      if (pendientes === 0) {
        await prisma.mesa.update({
          where: { id: pedido.mesaId },
          data: { estado: "LIBRE" },
        });
      }
    }

    return pedido;
  },
};
