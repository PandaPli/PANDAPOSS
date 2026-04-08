import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Calcula cuántos puntos gana un cliente por una compra.
 * puntosPorMil = puntos que se ganan por cada 1000 unidades de moneda.
 * Ej: puntosPorMil=10, total=2500 → gana 25 puntos.
 */
export function calcularPuntosGanados(total: number, puntosPorMil: number): number {
  return Math.floor((total * puntosPorMil) / 1000);
}

/**
 * Calcula el descuento monetario que equivale a N puntos.
 * valorPunto = cuánto vale 1 punto en moneda.
 */
export function calcularDescuentoPuntos(puntos: number, valorPunto: number): number {
  return puntos * valorPunto;
}

export const PuntosService = {
  /**
   * Registra puntos ganados por una venta dentro de una transacción Prisma.
   * Llama desde VentaService.create() pasando el tx activo.
   */
  async ganarPuntos(
    tx: Prisma.TransactionClient,
    clienteId: number,
    ventaId: number,
    puntos: number,
    total: number
  ) {
    if (puntos <= 0) return;

    await tx.cliente.update({
      where: { id: clienteId },
      data: { puntos: { increment: puntos } },
    });

    await tx.movimientoPuntos.create({
      data: {
        clienteId,
        ventaId,
        tipo: "GANADO",
        puntos,
        descripcion: `Compra por ${total} — +${puntos} pts`,
      },
    });
  },

  /**
   * Descuenta puntos canjeados en una venta dentro de una transacción Prisma.
   * Valida que el cliente tenga suficientes puntos.
   */
  async canjearPuntos(
    tx: Prisma.TransactionClient,
    clienteId: number,
    ventaId: number,
    puntos: number,
    descuento: number
  ) {
    if (puntos <= 0) return;

    // Validar saldo (lectura dentro de la tx para consistencia)
    const cliente = await tx.cliente.findUnique({
      where: { id: clienteId },
      select: { puntos: true, nombre: true },
    });

    if (!cliente) throw new Error("Cliente no encontrado.");
    if (cliente.puntos < puntos) {
      throw new Error(
        `El cliente no tiene suficientes puntos. Disponible: ${cliente.puntos}, solicitado: ${puntos}.`
      );
    }

    await tx.cliente.update({
      where: { id: clienteId },
      data: { puntos: { decrement: puntos } },
    });

    await tx.movimientoPuntos.create({
      data: {
        clienteId,
        ventaId,
        tipo: "CANJEADO",
        puntos: -puntos,
        descripcion: `Canje de ${puntos} pts = descuento ${descuento}`,
      },
    });
  },

  /**
   * Revierte puntos al anular una venta (fuera de tx, llamado post-anulación).
   */
  async revertirPorAnulacion(ventaId: number) {
    const movimientos = await prisma.movimientoPuntos.findMany({
      where: { ventaId },
    });

    if (movimientos.length === 0) return;

    await prisma.$transaction(async (tx) => {
      for (const mov of movimientos) {
        // Solo revertir si no fue ya anulado
        const yaAnulado = await tx.movimientoPuntos.findFirst({
          where: { ventaId, tipo: "ANULADO" },
        });
        if (yaAnulado) continue;

        const delta = -mov.puntos; // inverso del movimiento original
        await tx.cliente.update({
          where: { id: mov.clienteId },
          data: { puntos: { increment: delta } },
        });

        await tx.movimientoPuntos.create({
          data: {
            clienteId: mov.clienteId,
            ventaId,
            tipo: "ANULADO",
            puntos: delta,
            descripcion: `Reversión por anulación de venta #${ventaId}`,
          },
        });
      }
    });
  },

  /** Obtiene el historial de movimientos de un cliente. */
  async historial(clienteId: number) {
    return prisma.movimientoPuntos.findMany({
      where: { clienteId },
      orderBy: { creadoEn: "desc" },
      take: 50,
      select: {
        id: true,
        tipo: true,
        puntos: true,
        descripcion: true,
        creadoEn: true,
        ventaId: true,
      },
    });
  },

  /** Ajuste manual de puntos (admin). */
  async ajustar(clienteId: number, puntos: number, descripcion: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { puntos: true },
    });
    if (!cliente) throw new Error("Cliente no encontrado.");

    const nuevoPuntaje = cliente.puntos + puntos;
    if (nuevoPuntaje < 0) throw new Error("El ajuste dejaría el saldo en negativo.");

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id: clienteId },
        data: { puntos: { increment: puntos } },
      }),
      prisma.movimientoPuntos.create({
        data: {
          clienteId,
          tipo: "AJUSTE",
          puntos,
          descripcion: descripcion || `Ajuste manual: ${puntos > 0 ? "+" : ""}${puntos} pts`,
        },
      }),
    ]);
  },
};
