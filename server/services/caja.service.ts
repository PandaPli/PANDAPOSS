import { prisma } from "@/lib/db";
import { CajaRepo } from "@/server/repositories/caja.repo";

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

    // C2: Guard — abiertaEn nunca debería ser null en una caja ABIERTA
    if (!caja.abiertaEn) throw new Error("La caja no tiene fecha de apertura registrada.");

    const desde = caja.abiertaEn;
    const hasta = new Date(); // C2: cota superior explícita = ahora

    const ventasAgrupadas = await prisma.venta.groupBy({
      by: ["metodoPago"],
      _sum: { total: true },
      _count: { id: true },
      where: { cajaId: id, estado: "PAGADA", creadoEn: { gte: desde, lte: hasta } },
    });

    let totalVentas = 0;
    let totalEfectivo = 0;
    ventasAgrupadas.forEach((g) => {
      const sum = Number(g._sum.total ?? 0);
      totalVentas += sum;
      if (g.metodoPago === "EFECTIVO") totalEfectivo += sum;
    });

    const [ingresosAgr, retirosAgr] = await Promise.all([
      prisma.movimientoCaja.aggregate({
        _sum: { monto: true },
        where: { cajaId: id, tipo: "INGRESO", creadoEn: { gte: desde, lte: hasta } },
      }),
      prisma.movimientoCaja.aggregate({
        _sum: { monto: true },
        where: { cajaId: id, tipo: "RETIRO", creadoEn: { gte: desde, lte: hasta } },
      }),
    ]);

    const totalIngresos = Number(ingresosAgr._sum.monto ?? 0);
    const totalRetiros  = Number(retirosAgr._sum.monto  ?? 0);
    const esperadoEnGaveta =
      (Number(caja.saldoInicio) + totalEfectivo) + totalIngresos - totalRetiros;
    const diferencia = saldoFinal - esperadoEnGaveta;

    const arqueoAbierto = await prisma.arqueo.findFirst({
      where: { cajaId: id, cerradaEn: null },
      orderBy: { abiertaEn: "desc" },
    });

    const [cajaActualizada] = await prisma.$transaction([
      prisma.caja.update({
        where: { id },
        data: { estado: "CERRADA", cerradaEn: hasta, usuarioId: null },
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
                cerradaEn: hasta,
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

    // C2: Guard — protege el reporte si la apertura no fue registrada
    if (!caja.abiertaEn) throw new Error("La caja no tiene fecha de apertura registrada.");

    const desde = caja.abiertaEn;
    const hasta = new Date(); // C2: cota superior = este momento exacto

    const [desgloseVentas, totalizados, movIngresos, movRetiros, anuladas] = await Promise.all([
      prisma.venta.groupBy({
        by: ["metodoPago"],
        _sum: { total: true },
        _count: { id: true },
        where: { cajaId: id, estado: "PAGADA", creadoEn: { gte: desde, lte: hasta } },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { cajaId: id, estado: "PAGADA", creadoEn: { gte: desde, lte: hasta } },
      }),
      prisma.movimientoCaja.aggregate({
        _sum: { monto: true },
        _count: { id: true },
        where: { cajaId: id, tipo: "INGRESO", creadoEn: { gte: desde, lte: hasta } },
      }),
      prisma.movimientoCaja.aggregate({
        _sum: { monto: true },
        _count: { id: true },
        where: { cajaId: id, tipo: "RETIRO", creadoEn: { gte: desde, lte: hasta } },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { cajaId: id, estado: "ANULADA", creadoEn: { gte: desde, lte: hasta } },
      }),
    ]);

    // C3: Lista individual de movimientos para auditoría completa
    // Permite detectar retiros/ingresos cruzados entre cajas o movimientos sospechosos
    const detalleMovimientos = await prisma.movimientoCaja.findMany({
      where: { cajaId: id, creadoEn: { gte: desde, lte: hasta } },
      select: {
        id: true,
        tipo: true,
        monto: true,
        motivo: true,
        creadoEn: true,
        usuario: { select: { nombre: true } },
      },
      orderBy: { creadoEn: "asc" },
    });

    const breakdown: Record<string, { transacciones: number; dinero: number }> = {
      EFECTIVO:      { transacciones: 0, dinero: 0 },
      TARJETA:       { transacciones: 0, dinero: 0 },
      TRANSFERENCIA: { transacciones: 0, dinero: 0 },
      CREDITO:       { transacciones: 0, dinero: 0 },
      MIXTO:         { transacciones: 0, dinero: 0 },
    };
    desgloseVentas.forEach((b) => {
      breakdown[b.metodoPago] = {
        transacciones: b._count.id,
        dinero: Number(b._sum.total ?? 0),
      };
    });

    const sumIngresos = Number(movIngresos._sum.monto ?? 0);
    const sumRetiros  = Number(movRetiros._sum.monto  ?? 0);
    const dineroFisicoEsperado =
      (Number(caja.saldoInicio) + breakdown.EFECTIVO.dinero) + sumIngresos - sumRetiros;

    return {
      saldoApertura: Number(caja.saldoInicio),
      apertura: desde,
      ventasTotales: Number(totalizados._sum.total ?? 0),
      transaccionesTotales: totalizados._count.id,
      desgloseMediosDePago: breakdown,
      movimientos: {
        ingresos: sumIngresos,
        ingresosCantidad: movIngresos._count.id,
        retiros: sumRetiros,
        retirosCantidad: movRetiros._count.id,
        // C3: cada movimiento individual con usuario + motivo + hora
        detalle: detalleMovimientos.map((m) => ({
          id: m.id,
          tipo: m.tipo,
          monto: Number(m.monto),
          motivo: m.motivo,
          usuario: m.usuario?.nombre ?? "—",
          creadoEn: m.creadoEn,
        })),
      },
      fisicoTeorico: dineroFisicoEsperado,
      anulaciones: {
        dinero: Number(anuladas._sum.total ?? 0),
        cantidad: anuladas._count.id,
      },
    };
  },
};
