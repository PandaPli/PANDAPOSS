import { prisma } from "@/lib/db";
import { CajaRepo } from "@/server/repositories/caja.repo";
import type { MetodoPago } from "@prisma/client";

export const CajaService = {
  async abrir(id: number, userId: number, saldoInicio: number) {
    const caja = await CajaRepo.findById(id);
    if (!caja) throw new Error("Caja no encontrada");
    if (caja.estado === "ABIERTA") throw new Error("La caja ya está abierta");

    const [cajaActualizada] = await prisma.$transaction([
      prisma.caja.update({
        where: { id },
        data: {
          estado: "ABIERTA",
          saldoInicio,
          usuarioId: userId,
          abiertaEn: new Date(),
          cerradaEn: null,
        },
      }),
      prisma.arqueo.create({
        data: { cajaId: id, usuarioId: userId, saldoInicio },
      }),
    ]);

    return cajaActualizada;
  },

  async cerrar(id: number, saldoFinal: number, observacion?: string) {
    const caja = await CajaRepo.findById(id);
    if (!caja) throw new Error("Caja no encontrada");
    if (caja.estado === "CERRADA") throw new Error("La caja ya está cerrada");

    // Leer ventas usando group by para desglosar por Método de pago
    const ventasAgrupadas = await prisma.venta.groupBy({
      by: ["metodoPago"],
      _sum: { total: true },
      _count: { id: true },
      where: {
        cajaId: id,
        estado: "PAGADA",
        creadoEn: { gte: caja.abiertaEn ?? undefined },
      },
    });

    let totalVentas = 0;
    let totalEfectivo = 0;

    ventasAgrupadas.forEach((group) => {
      const sum = Number(group._sum.total ?? 0);
      totalVentas += sum;
      if (group.metodoPago === "EFECTIVO") {
        totalEfectivo += sum;
      }
    });

    // Calcular Movimientos Extras (Ingresos y Retiros)
    const movimientos = await prisma.movimientoCaja.aggregate({
      _sum: { monto: true },
      where: { cajaId: id, creadoEn: { gte: caja.abiertaEn ?? undefined } },
    });
    
    // Obtener los retiros e ingresos por separado
    const ingresosAgregados = await prisma.movimientoCaja.aggregate({
      _sum: { monto: true },
      where: { cajaId: id, tipo: "INGRESO", creadoEn: { gte: caja.abiertaEn ?? undefined } },
    });
    const retirosAgregados = await prisma.movimientoCaja.aggregate({
      _sum: { monto: true },
      where: { cajaId: id, tipo: "RETIRO", creadoEn: { gte: caja.abiertaEn ?? undefined } },
    });

    const totalIngresos = Number(ingresosAgregados._sum.monto ?? 0);
    const totalRetiros = Number(retirosAgregados._sum.monto ?? 0);

    // Nuevo paradigma: Solo el dinero en Efectivo debe cuadrar con el Cajón
    // (Fondo Inicial + Ventas Efectivo) + (Lo que ingresó extra de otra fuente) - (Lo que pagué o saqué de la caja)
    const esperadoEnGaveta = (Number(caja.saldoInicio) + totalEfectivo) + totalIngresos - totalRetiros;
    const diferencia = saldoFinal - esperadoEnGaveta;

    const arqueoAbierto = await prisma.arqueo.findFirst({
      where: { cajaId: id, cerradaEn: null },
      orderBy: { abiertaEn: "desc" },
    });

    const [cajaActualizada] = await prisma.$transaction([
      prisma.caja.update({
        where: { id },
        data: { estado: "CERRADA", cerradaEn: new Date(), usuarioId: null },
      }),
      ...(arqueoAbierto
        ? [
            prisma.arqueo.update({
              where: { id: arqueoAbierto.id },
              data: {
                saldoFinal,
                totalVentas,
                diferencia,
                observacion: observacion ?? null,
                cerradaEn: new Date(),
              },
            }),
          ]
        : []),
    ]);

    return { ...cajaActualizada, totalVentas, diferencia, totalEfectivo };
  },

  async getResumenTurno(id: number) {
    const caja = await CajaRepo.findById(id);
    if (!caja) throw new Error("Caja no encontrada");
    if (caja.estado === "CERRADA") throw new Error("Esta caja no está en un turno activo");

    // Recolectar estadísticas transaccionales desde la apertura
    const [desgloseVentas, totalizados, movIngresos, movRetiros] = await Promise.all([
      prisma.venta.groupBy({
        by: ["metodoPago"],
        _sum: { total: true },
        _count: { id: true },
        where: { cajaId: id, estado: "PAGADA", creadoEn: { gte: caja.abiertaEn ?? undefined } }
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { cajaId: id, estado: "PAGADA", creadoEn: { gte: caja.abiertaEn ?? undefined } }
      }),
      prisma.movimientoCaja.aggregate({
        _sum: { monto: true },
        _count: { id: true },
        where: { cajaId: id, tipo: "INGRESO", creadoEn: { gte: caja.abiertaEn ?? undefined } }
      }),
      prisma.movimientoCaja.aggregate({
        _sum: { monto: true },
        _count: { id: true },
        where: { cajaId: id, tipo: "RETIRO", creadoEn: { gte: caja.abiertaEn ?? undefined } }
      })
    ]);

    // Rescatar anulaciones para diagnóstico
    const anuladas = await prisma.venta.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { cajaId: id, estado: "ANULADA", creadoEn: { gte: caja.abiertaEn ?? undefined } }
    });

    const breakdown: Record<string, { transacciones: number; dinero: number }> = {
      EFECTIVO: { transacciones: 0, dinero: 0 },
      TARJETA: { transacciones: 0, dinero: 0 },
      TRANSFERENCIA: { transacciones: 0, dinero: 0 },
      CREDITO: { transacciones: 0, dinero: 0 },
      MIXTO: { transacciones: 0, dinero: 0 },
    };

    desgloseVentas.forEach((b) => {
      breakdown[b.metodoPago] = {
        transacciones: b._count.id,
        dinero: Number(b._sum.total ?? 0)
      };
    });

    const sumIngresos = Number(movIngresos._sum.monto ?? 0);
    const sumRetiros = Number(movRetiros._sum.monto ?? 0);

    const dineroFisicoEsperado = (Number(caja.saldoInicio) + breakdown.EFECTIVO.dinero) + sumIngresos - sumRetiros;

    return {
      saldoApertura: Number(caja.saldoInicio),
      apertura: caja.abiertaEn,
      ventasTotales: Number(totalizados._sum.total ?? 0),
      transaccionesTotales: totalizados._count.id,
      desgloseMediosDePago: breakdown,
      movimientos: {
        ingresos: sumIngresos,
        ingresosCantidad: movIngresos._count.id,
        retiros: sumRetiros,
        retirosCantidad: movRetiros._count.id
      },
      fisicoTeorico: dineroFisicoEsperado,
      anulaciones: {
        dinero: Number(anuladas._sum.total ?? 0),
        cantidad: anuladas._count.id
      }
    };
  }
};
