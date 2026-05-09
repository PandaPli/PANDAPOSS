import { prisma } from "@/lib/db";
import { subHours, subMinutes } from "date-fns";

interface ListOptions {
  sucursalId?: number | null;
  isAdmin: boolean;
  tipo?: string | null;
  estado?: string | null;
  completados?: boolean; // historial de LISTO + ENTREGADO últimas 24h
}

export const PedidoRepo = {
  async list({ sucursalId, isAdmin, tipo, estado, completados }: ListOptions) {
    const ahora = new Date();
    const sucursalFilter = sucursalId && !isAdmin ? { sucursalId } : {};

    // ── Include compartido ─────────────────────────────────────────────────
    const include = {
      mesa: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      repartidor: { select: { nombre: true } },
      delivery: { select: { zonaDelivery: true } },
      detalles: {
        include: {
          producto: {
            select: {
              nombre: true,
              categoria: { select: { estacion: true } },
            },
          },
          combo: {
            select: {
              nombre: true,
              categoria: { select: { estacion: true } },
            },
          },
        },
      },
    } as const;

    // ── AND filters compartidos ────────────────────────────────────────────
    // (1) Excluir pedidos de kiosko con pago MP pendiente.
    // IMPORTANTE: en SQL `mpStatus <> 'pending_payment'` NO matchea
    // las filas con mpStatus=NULL (null <> x evalua a null, no true).
    // Por eso hay que agregar `{ mpStatus: null }` explicito.
    // (2) Filtro por sucursal para usuarios no-admin.
    const commonAND = [
      {
        OR: [
          { mpStatus: null },
          { mpStatus: { not: "pending_payment" } },
        ],
      },
      ...(!isAdmin && sucursalId
        ? [
            {
              OR: [
                { caja: { sucursalId } },
                { mesa: { sala: { sucursalId } } },
                { usuario: { sucursalId } },
                { delivery: { cliente: { sucursalId } } },
              ],
            },
          ]
        : []),
    ];

    // ── Modo historial de completados ──────────────────────────────────────
    // Devuelve los últimos 50 pedidos LISTO o ENTREGADO de las últimas 24h,
    // sin depender del turno (para ver todo el historial del día).
    if (completados) {
      const hace24h = subHours(ahora, 24);
      return prisma.pedido.findMany({
        where: {
          creadoEn: { gte: hace24h },
          estado: { in: ["LISTO", "ENTREGADO"] },
          ...(tipo ? { tipo: tipo as never } : {}),
          AND: commonAND,
        },
        include,
        orderBy: { creadoEn: "desc" },
        take: 50,
      });
    }

    // ── Lógica de turno (estados activos) ─────────────────────────────────
    // Un turno comienza cuando abre la PRIMERA caja y termina cuando
    // cierran TODAS las cajas. Entre turnos hay una gracia de 30 min
    // (cuadratura). El KDS del nuevo turno hereda las mesas pendientes.
    // Hard cap: nunca mostrar más de 16h hacia atrás (seguridad si caja
    // quedó abierta por error varios días).
    let turnoDesde: Date;
    const limite16h = subHours(ahora, 16);

    // Primera caja abierta = inicio del turno actual
    const primeraAbierta = await prisma.caja.findFirst({
      where: { estado: "ABIERTA", ...sucursalFilter },
      orderBy: { abiertaEn: "asc" }, // la MÁS ANTIGUA = inicio de turno
      select: { abiertaEn: true },
    });

    if (primeraAbierta?.abiertaEn) {
      // Turno activo: desde cuando abrió la primera caja (cap 16h)
      turnoDesde = primeraAbierta.abiertaEn > limite16h
        ? primeraAbierta.abiertaEn
        : limite16h;
    } else {
      // Sin cajas abiertas: turno terminó.
      // Mostrar desde 30 min antes del cierre de la última caja
      // para que el nuevo turno vea las mesas pendientes heredadas.
      const ultimaCerrada = await prisma.caja.findFirst({
        where: { estado: "CERRADA", cerradaEn: { not: null }, ...sucursalFilter },
        orderBy: { cerradaEn: "desc" },
        select: { cerradaEn: true },
      });
      if (ultimaCerrada?.cerradaEn) {
        const desde30antesDelCierre = subMinutes(ultimaCerrada.cerradaEn, 30);
        turnoDesde = desde30antesDelCierre > limite16h ? desde30antesDelCierre : limite16h;
      } else {
        turnoDesde = subHours(ahora, 8); // fallback: últimas 8h
      }
    }

    return prisma.pedido.findMany({
      where: {
        creadoEn: { gte: turnoDesde },
        ...(tipo ? { tipo: tipo as never } : {}),
        ...(estado
          ? { estado: estado as never }
          : { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } }),
        // Usamos AND explicito para combinar dos OR independientes:
        //  (1) filtro anti-pending_payment
        //  (2) filtro por sucursal (si no es admin)
        AND: commonAND,
      },
      include,
      orderBy: { creadoEn: "asc" },
    });
  },

  async countActivosByMesa(mesaId: number) {
    return prisma.pedido.count({
      where: {
        mesaId,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      },
    });
  },
};
