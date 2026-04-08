import { prisma } from "@/lib/db";
import { Prisma, EstadoPedido } from "@prisma/client";
import { PedidoRepo } from "@/server/repositories/pedido.repo";

interface PedidoItem {
  productoId?: number | null;
  comboId?: number | null;
  cantidad: number;
  observacion?: string | null;
  grupo?: string | null;
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
  llamadoTipo?: string | null;
  repartidorId?: number | null;
  direccionEntrega?: string | null;
  telefonoCliente?: string | null;
  nuevosItems?: PedidoItem[];
  usuarioId?: number | null;
}

// M3: Transiciones de estado válidas — máquina de estados explícita
const TRANSICIONES_VALIDAS: Partial<Record<EstadoPedido, EstadoPedido[]>> = {
  PENDIENTE:  ["EN_PROCESO", "CANCELADO"],
  EN_PROCESO: ["LISTO", "CANCELADO"],
  LISTO:      ["ENTREGADO", "CANCELADO"],
  ENTREGADO:  [],  // terminal
  CANCELADO:  [],  // terminal
};

export const PedidoService = {
  async create(input: CreatePedidoInput) {
    const {
      mesaId,
      cajaId,
      usuarioId,
      tipo,
      items,
      observacion,
      direccionEntrega,
      telefonoCliente,
      repartidorId,
    } = input;

    // Resolver precios actuales para guardarlos en cada detalle
    const productoIds = items.filter((i) => i.productoId).map((i) => i.productoId as number);
    const comboIds    = items.filter((i) => i.comboId).map((i) => i.comboId as number);

    const [productos, combos] = await Promise.all([
      productoIds.length > 0
        ? prisma.producto.findMany({ where: { id: { in: productoIds } }, select: { id: true, precio: true, nombre: true } })
        : [],
      comboIds.length > 0
        ? prisma.combo.findMany({ where: { id: { in: comboIds } }, select: { id: true, precio: true, nombre: true } })
        : [],
    ]);

    // A4: Validar que todos los productos/combos existen y tienen precio
    const precioProducto = new Map(productos.map((p) => [p.id, p.precio]));
    const precioCombo    = new Map(combos.map((c) => [c.id, c.precio]));

    for (const item of items) {
      if (item.productoId) {
        if (!precioProducto.has(item.productoId)) {
          throw new Error(`El producto con ID ${item.productoId} no existe o no está disponible.`);
        }
        if (precioProducto.get(item.productoId) === null) {
          const prod = productos.find((p) => p.id === item.productoId);
          throw new Error(`El producto "${prod?.nombre ?? item.productoId}" no tiene precio configurado.`);
        }
      }
      if (item.comboId) {
        if (!precioCombo.has(item.comboId)) {
          throw new Error(`El combo con ID ${item.comboId} no existe o no está disponible.`);
        }
      }
    }

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
            productoId:  item.productoId ?? null,
            comboId:     item.comboId ?? null,
            cantidad:    item.cantidad,
            observacion: item.observacion ?? null,
            grupo:       item.grupo ?? null,
            precio: item.productoId
              ? precioProducto.get(item.productoId)
              : item.comboId
              ? precioCombo.get(item.comboId)
              : null,
          })),
        },
      },
      include: { detalles: true },
    });

    // Usar el id como numero de orden (secuencial garantizado por autoincrement)
    const pedidoConNumero = await prisma.pedido.update({
      where: { id: pedido.id },
      data: { numero: pedido.id },
      include: { detalles: true },
    });

    if (mesaId) {
      await prisma.mesa.update({
        where: { id: mesaId },
        data: { estado: "OCUPADA" },
      });
    }

    return pedidoConNumero;
  },

  async update(id: number, input: UpdatePedidoInput) {
    const { estado, meseroLlamado, llamadoTipo, repartidorId, direccionEntrega, telefonoCliente } = input;

    // Leer el pedido actual para validaciones
    const pedidoActual = await prisma.pedido.findUnique({
      where: { id },
      select: { estado: true, mesaId: true, venta: { select: { id: true } }, numero: true },
    });

    if (!pedidoActual) throw new Error("Pedido no encontrado.");

    // M3: Validar transición de estado
    if (estado !== undefined) {
      const siguiente = estado as EstadoPedido;
      const permitidos = TRANSICIONES_VALIDAS[pedidoActual.estado as EstadoPedido] ?? [];
      if (!permitidos.includes(siguiente)) {
        throw new Error(
          `No se puede cambiar el estado de ${pedidoActual.estado} a ${siguiente}.`
        );
      }
    }

    // A5: No agregar ítems si el pedido está en estado terminal o ya tiene venta
    if (input.nuevosItems && input.nuevosItems.length > 0) {
      if (["ENTREGADO", "CANCELADO"].includes(pedidoActual.estado)) {
        throw new Error(`No se pueden agregar ítems a un pedido ${pedidoActual.estado}.`);
      }
      if (pedidoActual.venta) {
        throw new Error("No se pueden agregar ítems a un pedido que ya fue cobrado.");
      }
    }

    const data: Prisma.PedidoUncheckedUpdateInput = {};
    if (estado !== undefined) data.estado = estado as EstadoPedido;
    if (meseroLlamado !== undefined) data.meseroLlamado = meseroLlamado;
    if (llamadoTipo !== undefined) data.llamadoTipo = llamadoTipo ?? null;
    if (repartidorId !== undefined) data.repartidorId = repartidorId ?? null;
    if (direccionEntrega !== undefined) data.direccionEntrega = direccionEntrega ?? null;
    if (telefonoCliente !== undefined) data.telefonoCliente = telefonoCliente ?? null;
    if (estado === "ENTREGADO") { data.meseroLlamado = false; data.llamadoTipo = null; }

    // Capturar timestamps de preparación
    const now = new Date();
    if (estado === "EN_PROCESO") data.iniciadoEn = now;
    if (estado === "LISTO")      data.listoEn    = now;

    if (input.nuevosItems && input.nuevosItems.length > 0) {
      data.detalles = {
        create: input.nuevosItems.map((item) => ({
          productoId: item.productoId ?? null,
          comboId: item.comboId ?? null,
          cantidad: item.cantidad,
          observacion: item.observacion ?? null,
        })),
      };
    }

    const pedido = await prisma.pedido.update({
      where: { id },
      data,
      include: { mesa: true, detalles: true },
    });

    // Registrar evento de auditoría si hubo cambio de estado
    if (estado !== undefined) {
      const etiquetas: Record<string, string> = {
        EN_PROCESO: "Preparación iniciada",
        LISTO:      "Marcado como listo",
        ENTREGADO:  "Entregado",
        CANCELADO:  "Cancelado",
      };
      await prisma.eventoPedido.create({
        data: {
          pedidoId:   id,
          usuarioId:  input.usuarioId ?? null,
          tipo:       "ESTADO",
          descripcion: `${pedidoActual.estado} → ${estado}${etiquetas[estado] ? ` (${etiquetas[estado]})` : ""}`,
        },
      }).catch(() => { /* no bloquear si falla el log */ });
    }

    if (input.nuevosItems && input.nuevosItems.length > 0 && pedido.mesaId) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: "OCUPADA" },
      });
    }

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
