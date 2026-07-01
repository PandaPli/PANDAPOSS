import { prisma } from "@/lib/db";
import { NotificationService } from "./notification.service";
import { addMonths } from "date-fns";

export interface ReactivacionResult {
  procesados: number;
  cuponesCreados: number;
  mensajesEncolados: number;
  detalles: { clienteId: number; nombre: string; diasInactivo: number }[];
}

/**
 * Detecta clientes que fueron activos pero llevan entre 30 y 90 días sin
 * comprar, les crea un cupón de reactivación y les envía WhatsApp.
 *
 * Ventana 30-90 días: evita molestar a quien compró hace poco y evita
 * gastar cupones en clientes ya perdidos (>90 días).
 *
 * Idempotente: el código del cupón incluye año-mes, así un cliente recibe
 * como máximo un cupón de reactivación por mes.
 */
export async function reactivarClientesInactivos(): Promise<ReactivacionResult> {
  const ahora = new Date();
  const anioMes = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}`;

  // Clientes activos con teléfono cuya última venta está entre 30 y 90 días atrás.
  // Se agrupa por cliente tomando la fecha máxima de venta.
  const candidatos = await prisma.$queryRaw<
    { id: number; nombre: string; telefono: string | null; sucursalId: number | null; diasInactivo: number }[]
  >`
    SELECT c.id, c.nombre, c.telefono, c.sucursalId,
           DATEDIFF(NOW(), MAX(v.creadoEn)) AS diasInactivo
    FROM clientes c
    JOIN ventas v ON v.clienteId = c.id
    WHERE c.activo = 1
      AND c.telefono IS NOT NULL
    GROUP BY c.id, c.nombre, c.telefono, c.sucursalId
    HAVING diasInactivo BETWEEN 30 AND 90
    LIMIT 100
  `;

  const result: ReactivacionResult = {
    procesados: candidatos.length,
    cuponesCreados: 0,
    mensajesEncolados: 0,
    detalles: [],
  };

  for (const cliente of candidatos) {
    if (!cliente.sucursalId) continue;

    const codigoCupon = `VUELVE-${cliente.id}-${anioMes}`;

    const existe = await prisma.cupon.findFirst({
      where: { sucursalId: cliente.sucursalId, codigo: codigoCupon },
    });
    if (existe) continue;

    const venceEn = addMonths(ahora, 1);
    await prisma.cupon.create({
      data: {
        sucursalId: cliente.sucursalId,
        codigo: codigoCupon,
        descripcion: `Te extrañamos ${cliente.nombre.split(" ")[0]} 💙`,
        tipo: "PORCENTAJE",
        valor: 15,
        usoMax: 1,
        activo: true,
        venceEn,
      },
    });
    result.cuponesCreados++;

    if (cliente.telefono) {
      const agente = await prisma.agenteWsp.findFirst({
        where: { sucursalId: cliente.sucursalId, activo: true },
        select: { id: true },
      });
      if (agente) {
        const mensaje =
          `¡Hola ${cliente.nombre.split(" ")[0]}! Te extrañamos 💙 ` +
          `Vuelve y disfruta un 15% de descuento con el código *${codigoCupon}*. ` +
          `¡Válido por 1 mes, te esperamos!`;
        NotificationService.enqueueWsp(cliente.sucursalId, cliente.telefono, mensaje);
        result.mensajesEncolados++;
      }
    }

    result.detalles.push({
      clienteId: cliente.id,
      nombre: cliente.nombre,
      diasInactivo: Number(cliente.diasInactivo),
    });
    console.log(`[Reactivación] Cupón para ${cliente.nombre} (${cliente.diasInactivo}d inactivo)`);
  }

  return result;
}
