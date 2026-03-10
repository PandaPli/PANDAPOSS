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

export const VentaService = {
  async create(input: CreateVentaInput) {
    const {
      cajaId, clienteId, usuarioId, pedidoId, mesaId,
      items, subtotal, descuento, impuesto, total, metodoPago, pagos,
    } = input;

    const count = await prisma.venta.count();
    const numero = `VTA-${String(count + 1).padStart(6, "0")}`;

    const venta = await prisma.$transaction(async (tx) => {
      // 1. Crear venta con sus detalles
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

      // 2. Registrar pagos (split-payment o retrocompatible)
      if (pagos && pagos.length > 0) {
        await Promise.all(
          pagos.map((pago) =>
            tx.pagoVenta.create({
              data: {
                ventaId: v.id,
                metodoPago: pago.metodoPago,
                monto: pago.monto,
                referencia: pago.referencia ?? null,
              },
            })
          )
        );
      } else {
        await tx.pagoVenta.create({
          data: { ventaId: v.id, metodoPago, monto: total },
        });
      }

      // 3. Decrementar stock + kardex por cada producto
      const productItems = items.filter((item) => item.productoId);
      await Promise.all(
        productItems.map((item) =>
          Promise.all([
            tx.producto.update({
              where: { id: item.productoId! },
              data: { stock: { decrement: item.cantidad } },
            }),
            tx.kardex.create({
              data: {
                productoId: item.productoId!,
                tipo: "SALIDA",
                cantidad: item.cantidad,
                motivo: "Venta",
                ventaId: v.id,
              },
            }),
          ])
        )
      );

      // 4. Liberar mesa si aplica
      if (mesaId) {
        await tx.mesa.update({
          where: { id: mesaId },
          data: { estado: "LIBRE" },
        });
      }

      return v;
    }, { timeout: 15000 });

    return {
      id: venta.id,
      numero: venta.numero,
      total: Number(venta.total),
      estado: venta.estado,
      creadoEn: venta.creadoEn,
    };
  },
};
