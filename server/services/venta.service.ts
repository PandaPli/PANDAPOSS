import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MetodoPago } from "@/types";

interface VentaItem {
  productoId?: number | null;
  comboId?: number | null;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface PagoInput {
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string;
}

export interface CreateVentaInput {
  cajaId?: number | null;
  clienteId?: number | null;
  usuarioId: number;
  pedidoId?: number | null;
  mesaId?: number | null;
  items: VentaItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: MetodoPago;
  pagos?: PagoInput[];
  /** IDs de DetallePedido que se marcan como pagados (modo grupo) */
  detalleIds?: number[];
  /** Si true: no cierra automáticamente la mesa (hay más grupos por cobrar) */
  modoGrupo?: boolean;
}

function generateVentaNumero() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VTA-${timePart}${randomPart}`.slice(0, 20);
}

function aggregateProductItems(items: VentaItem[]) {
  const grouped = new Map<number, number>();

  for (const item of items) {
    if (!item.productoId) continue;
    grouped.set(item.productoId, (grouped.get(item.productoId) ?? 0) + item.cantidad);
  }

  return Array.from(grouped.entries()).map(([productoId, cantidad]) => ({ productoId, cantidad }));
}

async function ensurePedidoDisponible(tx: Prisma.TransactionClient, pedidoId: number) {
  const pedido = await tx.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      estado: true,
      venta: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!pedido) {
    throw new Error("La orden ya no existe o fue eliminada.");
  }

  if (pedido.venta) {
    throw new Error("La orden ya fue cobrada. Recarga la mesa para continuar.");
  }

  if (!["PENDIENTE", "EN_PROCESO", "LISTO"].includes(pedido.estado)) {
    throw new Error("La orden ya no esta disponible para cobro.");
  }
}

/**
 * Verifica si todos los ítems no cancelados de la mesa ya han sido pagados.
 * Si es así, cierra la mesa y marca todos los pedidos activos como ENTREGADO.
 */
async function checkAndCloseMesa(tx: Prisma.TransactionClient, mesaId: number) {
  // Buscar detalles activos (no cancelados, no pagados) de pedidos activos de la mesa
  const pendientes = await tx.detallePedido.count({
    where: {
      pedido: {
        mesaId,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        venta: null,
      },
      cancelado: false,
      pagado: false,
    },
  });

  if (pendientes === 0) {
    // Todos los grupos pagaron → cerrar mesa y marcar pedidos
    await tx.mesa.update({
      where: { id: mesaId },
      data: { estado: "LIBRE" },
    });

    await tx.pedido.updateMany({
      where: {
        mesaId,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        venta: null,
      },
      data: { estado: "ENTREGADO", meseroLlamado: false },
    });
  }
}

export const VentaService = {
  async create(input: CreateVentaInput) {
    const {
      cajaId,
      clienteId,
      usuarioId,
      pedidoId,
      mesaId,
      items,
      subtotal,
      descuento,
      impuesto,
      total,
      metodoPago,
      pagos,
      detalleIds,
      modoGrupo,
    } = input;

    const numero = generateVentaNumero();
    const aggregatedProductItems = aggregateProductItems(items);

    try {
      const venta = await prisma.$transaction(
        async (tx) => {
          // En modo grupo NO verificamos ni vinculamos el pedidoId
          if (pedidoId && !modoGrupo) {
            await ensurePedidoDisponible(tx, pedidoId);
          }

          const v = await tx.venta.create({
            data: {
              numero,
              cajaId: cajaId ?? null,
              clienteId: clienteId ?? null,
              usuarioId,
              // En modo grupo: no linkeamos pedidoId (múltiples ventas por mesa)
              pedidoId: modoGrupo ? null : (pedidoId ?? null),
              subtotal,
              descuento: descuento ?? 0,
              impuesto: impuesto ?? 0,
              total,
              metodoPago,
              estado: "PAGADA",
              detalles: {
                create: items.map((item) => ({
                  productoId: item.productoId ?? null,
                  comboId: item.comboId ?? null,
                  cantidad: item.cantidad,
                  precio: item.precio,
                  descuento: 0,
                  subtotal: item.subtotal,
                })),
              },
            },
          });

          if (pagos && pagos.length > 0) {
            await tx.pagoVenta.createMany({
              data: pagos.map((pago) => ({
                ventaId: v.id,
                metodoPago: pago.metodoPago,
                monto: pago.monto,
                referencia: pago.referencia ?? null,
              })),
            });
          } else {
            await tx.pagoVenta.create({
              data: { ventaId: v.id, metodoPago, monto: total },
            });
          }

          if (aggregatedProductItems.length > 0) {
            await Promise.all(
              aggregatedProductItems.map((item) =>
                tx.producto.update({
                  where: { id: item.productoId },
                  data: { stock: { decrement: item.cantidad } },
                })
              )
            );

            await tx.kardex.createMany({
              data: aggregatedProductItems.map((item) => ({
                productoId: item.productoId,
                tipo: "SALIDA",
                cantidad: item.cantidad,
                motivo: "Venta",
                ventaId: v.id,
              })),
            });
          }

          if (modoGrupo) {
            // Modo grupo: marcar los detalles específicos como pagados
            if (detalleIds && detalleIds.length > 0) {
              await tx.detallePedido.updateMany({
                where: { id: { in: detalleIds } },
                data: { pagado: true },
              });
            }
            // Verificar si la mesa puede cerrarse (todos los grupos pagaron)
            if (mesaId) {
              await checkAndCloseMesa(tx, mesaId);
            }
          } else {
            // Modo normal: cerrar pedido y mesa
            if (pedidoId) {
              await tx.pedido.update({
                where: { id: pedidoId },
                data: {
                  estado: "ENTREGADO",
                  meseroLlamado: false,
                },
              });
            }

            if (mesaId) {
              await tx.mesa.update({
                where: { id: mesaId },
                data: { estado: "LIBRE" },
              });
            }
          }

          return v;
        },
        { timeout: 15000 }
      );

      return {
        id: venta.id,
        numero: venta.numero,
        total: Number(venta.total),
        estado: venta.estado,
        creadoEn: venta.creadoEn,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("pedidoId")
      ) {
        throw new Error("La orden ya fue cobrada. Recarga la mesa para continuar.");
      }

      throw error;
    }
  },
};
