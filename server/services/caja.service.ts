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

    // Calcular total de ventas del turno
    const agg = await prisma.venta.aggregate({
      _sum: { total: true },
      where: {
        cajaId: id,
        estado: "PAGADA",
        creadoEn: { gte: caja.abiertaEn ?? undefined },
      },
    });

    const totalVentas = Number(agg._sum.total ?? 0);
    const esperado = Number(caja.saldoInicio) + totalVentas;
    const diferencia = saldoFinal - esperado;

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

    return { ...cajaActualizada, totalVentas, diferencia };
  },
};
