import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MetodoPago } from "@/types";

const globalForSocket = global as unknown as { io?: import("socket.io").Server };

function emitStockBajo(sucursalId: number, alertas: { nombre: string; stock: number }[]) {
  try {
    globalForSocket.io
      ?.to(`sucursal_${sucursalId}_alertas`)
      .emit("stock:bajo", { sucursalId, alertas, ts: Date.now() });
  } catch {
    // No bloquear la venta si el socket falla
  }
}

interface VentaItem {
  productoId?: number | null;
  comboId?: number | null;
  nombre?: string | null;
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
  sucursalId?: number | null;
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
  /** Cupón de descuento aplicado */
  cuponId?: number | null;
  cuponCodigo?: string | null;
}

function generateVentaNumero() {
  const timePart   = Date.now().toString(36).toUpperCase();
  const rand1      = Math.random().toString(36).slice(2, 5).toUpperCase();
  const rand2      = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VTA-${timePart}-${rand1}${rand2}`.slice(0, 20);
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
  // M2: SELECT FOR UPDATE bloquea la fila — la segunda transacción concurrente
  // espera a que la primera haga commit/rollback antes de leer.
  // Así se elimina la race condition de doble cobro de mesa.
  const rows = await tx.$queryRaw<{ id: number; estado: string; ventaId: number | null }[]>(
    Prisma.sql`SELECT id, estado, ventaId FROM pedidos WHERE id = ${pedidoId} LIMIT 1 FOR UPDATE`
  );

  const pedido = rows[0];

  if (!pedido) {
    throw new Error("La orden ya no existe o fue eliminada.");
  }

  if (pedido.ventaId !== null) {
    throw new Error("La orden ya fue cobrada. Recarga la mesa para continuar.");
  }

  if (!["PENDIENTE", "EN_PROCESO", "LISTO"].includes(pedido.estado)) {
    throw new Error("La orden ya no está disponible para cobro.");
  }
}

/**
 * Verifica si todos los ítems no cancelados de la mesa ya han sido pagados.
 * Si es así, cierra la mesa y marca todos los pedidos activos como ENTREGADO.
 */
async function checkAndCloseMesa(tx: Prisma.TransactionClient, mesaId: number) {
  try {
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
      // M1: updateMany con condición OCUPADA — idempotente y atómico.
      await tx.mesa.updateMany({
        where: { id: mesaId, estado: "OCUPADA" },
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
  } catch (err) {
    // No revertir la venta por un error de cierre de mesa — loguear y continuar
    console.error(`[VentaService] checkAndCloseMesa mesaId=${mesaId}:`, err);
  }
}

export const VentaService = {
  async create(input: CreateVentaInput) {
    const {
      cajaId,
      clienteId,
      usuarioId,
      sucursalId,
      pedidoId,
      mesaId,
      items,
      descuento,
      impuesto,
      total,
      metodoPago,
      pagos,
      detalleIds,
      modoGrupo,
      cuponId,
      cuponCodigo,
    } = input;

    // ── V3: Recalcular totales en el servidor ────────────────────────────────
    // Nunca confiar en subtotal/total enviados por el cliente
    const serverSubtotal = items.reduce(
      (acc, item) => acc + Number(item.precio) * Number(item.cantidad),
      0
    );
    const serverTotal =
      Math.round((serverSubtotal - Number(descuento) + Number(impuesto)) * 100) / 100;

    // Tolerancia de 2 centavos para errores de punto flotante en el cliente
    if (Math.abs(serverSubtotal - Number(input.subtotal)) > 0.02) {
      throw new Error("El subtotal no coincide con los ítems del carrito.");
    }
    if (Math.abs(serverTotal - Number(total)) > 0.02) {
      throw new Error("El total no coincide con el calculado en el servidor.");
    }

    // ── V4: Validar que la suma de pagos = total ─────────────────────────────
    if (pagos && pagos.length > 0) {
      const sumaPagos = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
      if (Math.abs(sumaPagos - serverTotal) > 0.02) {
        throw new Error("La suma de los pagos no coincide con el total de la venta.");
      }
    }

    const numero = generateVentaNumero();
    const aggregatedProductItems = aggregateProductItems(items);

    try {
      const venta = await prisma.$transaction(
        async (tx) => {
          // S1: isolationLevel ReadCommitted evita lecturas sucias.
          // El decrement de stock usa UPDATE SET stock = stock - N que es
          // atómico en MySQL — no requiere lock explícito adicional.
          if (pedidoId && !modoGrupo) {
            await ensurePedidoDisponible(tx, pedidoId);
          }

          // S2: En modo grupo, bloquear los detalleIds con SELECT FOR UPDATE
          // para eliminar la race condition de doble cobro concurrente.
          if (modoGrupo && detalleIds && detalleIds.length > 0) {
            const rows = await tx.$queryRaw<{ id: number; pagado: number }[]>(
              Prisma.sql`SELECT id, pagado FROM detalles_pedidos WHERE id IN (${Prisma.join(detalleIds)}) FOR UPDATE`
            );
            const yaPagadosLock = rows.filter((r) => Number(r.pagado) === 1);
            if (yaPagadosLock.length > 0) {
              throw new Error("Algunos ítems ya fueron cobrados. Recarga la mesa.");
            }
          }

          const v = await tx.venta.create({
            data: {
              numero,
              cajaId: cajaId ?? null,
              clienteId: clienteId ?? null,
              usuarioId,
              // En modo grupo: no linkeamos pedidoId (múltiples ventas por mesa)
              pedidoId: modoGrupo ? null : (pedidoId ?? null),
              subtotal: serverSubtotal,   // V3: usar valores del servidor
              descuento: descuento ?? 0,
              impuesto: impuesto ?? 0,
              total: serverTotal,          // V3: usar valores del servidor
              metodoPago,
              estado: "PAGADA",
              cuponId: cuponId ?? null,
              cuponCodigo: cuponCodigo ?? null,
              detalles: {
                create: items.map((item) => ({
                  productoId: item.productoId ?? null,
                  comboId: item.comboId ?? null,
                  nombre: item.nombre ?? null,
                  cantidad: item.cantidad,
                  precio: item.precio,
                  descuento: 0,
                  subtotal: Number(item.precio) * Number(item.cantidad),
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
              data: { ventaId: v.id, metodoPago, monto: serverTotal },
            });
          }

          // Incrementar uso del cupón si aplica
          if (cuponId) {
            await tx.cupon.update({
              where: { id: cuponId },
              data: { usoActual: { increment: 1 } },
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

            // Notificar al restaurante si algún producto quedó sin stock
            const productoIds = aggregatedProductItems.map((i) => i.productoId);
            const sinStock = await tx.producto.findMany({
              where: { id: { in: productoIds }, stock: { lte: 0 } },
              select: { nombre: true, stock: true },
            });
            if (sinStock.length > 0 && sucursalId) {
              emitStockBajo(
                sucursalId,
                sinStock.map((p) => ({ nombre: p.nombre, stock: Number(p.stock) }))
              );
            }
          }

          if (modoGrupo) {
            if (detalleIds && detalleIds.length > 0) {
              // V2: Validar que los detalleIds pertenecen a esta mesa
              if (mesaId) {
                const perteneceAMesa = await tx.detallePedido.count({
                  where: { id: { in: detalleIds }, pedido: { mesaId } },
                });
                if (perteneceAMesa !== detalleIds.length) {
                  throw new Error("Algunos ítems no pertenecen a esta mesa.");
                }
              }

              // V1: Verificar que ningún ítem ya fue cobrado (anti doble-pago)
              const yaPagados = await tx.detallePedido.count({
                where: { id: { in: detalleIds }, pagado: true },
              });
              if (yaPagados > 0) {
                throw new Error("Algunos ítems ya fueron cobrados. Recarga la mesa.");
              }

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
            // Modo normal: cerrar TODOS los pedidos activos de la mesa (no solo el último)
            if (mesaId) {
              // Marcar todos los pedidos activos de la mesa como ENTREGADO
              await tx.pedido.updateMany({
                where: {
                  mesaId,
                  estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
                },
                data: { estado: "ENTREGADO", meseroLlamado: false },
              });

              await tx.mesa.update({
                where: { id: mesaId },
                data: { estado: "LIBRE" },
              });
            } else if (pedidoId) {
              // Sin mesa: solo cerrar el pedido específico
              await tx.pedido.update({
                where: { id: pedidoId },
                data: { estado: "ENTREGADO", meseroLlamado: false },
              });
            }
          }

          return v;
        },
        { timeout: 15000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
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

  // ── A1: Anular venta y restaurar stock ──────────────────────────────────────
  async anular(ventaId: number) {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        detalles: {
          where: { productoId: { not: null } },
          select: { productoId: true, cantidad: true },
        },
      },
    });

    if (!venta) throw new Error("Venta no encontrada.");
    if (venta.estado === "ANULADA") throw new Error("La venta ya fue anulada.");
    if (venta.estado !== "PAGADA") throw new Error("Solo se pueden anular ventas PAGADAS.");

    // Agregar cantidades por producto (puede haber varios detalles del mismo)
    const porProducto = new Map<number, number>();
    for (const d of venta.detalles) {
      if (!d.productoId) continue;
      porProducto.set(d.productoId, (porProducto.get(d.productoId) ?? 0) + d.cantidad);
    }
    const productosAfectados = Array.from(porProducto.entries()).map(([productoId, cantidad]) => ({
      productoId,
      cantidad,
    }));

    await prisma.$transaction(async (tx) => {
      // 1. Restaurar stock
      await Promise.all(
        productosAfectados.map((p) =>
          tx.producto.update({
            where: { id: p.productoId },
            data: { stock: { increment: p.cantidad } },
          })
        )
      );

      // 2. Kardex inverso — ENTRADA por anulación
      if (productosAfectados.length > 0) {
        await tx.kardex.createMany({
          data: productosAfectados.map((p) => ({
            productoId: p.productoId,
            tipo: "ENTRADA",
            cantidad: p.cantidad,
            motivo: "Anulación de venta",
            ventaId,
          })),
        });
      }

      // 3. Marcar venta como ANULADA
      await tx.venta.update({
        where: { id: ventaId },
        data: { estado: "ANULADA" },
      });
    });

    return { id: ventaId, estado: "ANULADA" };
  },
};
