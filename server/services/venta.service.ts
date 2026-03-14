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
    } = input;

    const numero = generateVentaNumero();
    const aggregatedProductItems = aggregateProductItems(items);

    try {
      const venta = await prisma.$transaction(
        async (tx) => {
          if (pedidoId) {
            await ensurePedidoDisponible(tx, pedidoId);
          }

          const v = await tx.venta.create({
            data: {
              numero,
              cajaId: cajaId ?? null,
              clienteId: clienteId ?? null,
              usuarioId,
              pedidoId: pedidoId ?? null,
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
