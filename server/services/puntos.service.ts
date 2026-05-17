import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

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

    // Lock pesimista: bloquear la fila del cliente para evitar que dos canjes
    // concurrentes lean el mismo saldo y permitan gastar puntos que no existen.
    const filas = await tx.$queryRaw<{ id: number; puntos: number; nombre: string }[]>(
      Prisma.sql`SELECT id, puntos, nombre FROM clientes WHERE id = ${clienteId} LIMIT 1 FOR UPDATE`
    );
    const cliente = filas[0];

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
   * Revierte puntos al anular una venta.
   * Acepta un tx externo (transacción de anulación) para garantizar atomicidad.
   * Si no se pasa tx, crea su propia transacción (backward-compatible).
   */
  async revertirPorAnulacion(ventaId: number, externalTx?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) => {
      // Lock atómico: verificar que no exista ya una reversión para esta venta
      const yaAnulado = await tx.movimientoPuntos.findFirst({
        where: { ventaId, tipo: "ANULADO" },
      });
      if (yaAnulado) return;

      const movimientos = await tx.movimientoPuntos.findMany({
        where: { ventaId, tipo: { in: ["GANADO", "CANJEADO"] } },
      });

      if (movimientos.length === 0) return;

      for (const mov of movimientos) {
        const delta = -mov.puntos;
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
    };

    if (externalTx) {
      await run(externalTx);
    } else {
      await prisma.$transaction(run);
    }
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

  /** Ajuste manual de puntos (admin). Registra usuario para auditoría. */
  async ajustar(
    clienteId: number,
    puntos: number,
    descripcion: string,
    audit?: { usuarioId: number; usuarioNombre?: string }
  ) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { puntos: true },
    });
    if (!cliente) throw new Error("Cliente no encontrado.");

    const nuevoPuntaje = cliente.puntos + puntos;
    if (nuevoPuntaje < 0) throw new Error("El ajuste dejaría el saldo en negativo.");

    // Prefijo de auditoría en la descripción (MovimientoPuntos no tiene columna
    // usuarioId, así que dejamos rastro en el texto + entrada en tabla Log)
    const auditPrefix = audit?.usuarioNombre
      ? `[user:${audit.usuarioId}/${audit.usuarioNombre}] `
      : audit?.usuarioId
      ? `[user:${audit.usuarioId}] `
      : "";
    const descFinal = `${auditPrefix}${descripcion || `Ajuste manual: ${puntos > 0 ? "+" : ""}${puntos} pts`}`;

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
          descripcion: descFinal,
        },
      }),
      ...(audit?.usuarioId
        ? [
            prisma.log.create({
              data: {
                usuarioId: audit.usuarioId,
                accion: `puntos.ajustar cliente=${clienteId} delta=${puntos > 0 ? "+" : ""}${puntos} desc="${descripcion ?? ""}"`,
              },
            }),
          ]
        : []),
    ]);
  },
};
