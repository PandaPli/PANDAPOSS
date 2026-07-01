import { prisma } from "@/lib/db";
import { NotificationService } from "./notification.service";
import { addMonths } from "date-fns";

export interface CumpleanosResult {
  enviados: number;
  omitidos: number;
  detalles: { clienteId: number; nombre: string; accion: "cupon_creado" | "ya_tenia_cupon" }[];
}

/**
 * Busca clientes con cumpleaños hoy, les crea un cupón de descuento y
 * encola un mensaje de WhatsApp si la sucursal tiene agente activo.
 *
 * Idempotente: el código del cupón incluye el año, así no se duplica
 * si el cron corre más de una vez en el día.
 */
export async function enviarCuponesCumpleanos(): Promise<CumpleanosResult> {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1; // 1-12
  const dia = hoy.getDate();
  const anio = hoy.getFullYear();

  // MySQL: filtrar por mes y día sin importar el año de nacimiento
  const clientesHoy = await prisma.$queryRaw<
    { id: number; nombre: string; telefono: string | null; sucursalId: number | null; tenantId: string | null }[]
  >`
    SELECT id, nombre, telefono, sucursalId, tenantId
    FROM clientes
    WHERE activo = 1
      AND fechaNacimiento IS NOT NULL
      AND MONTH(fechaNacimiento) = ${mes}
      AND DAY(fechaNacimiento)   = ${dia}
  `;

  if (clientesHoy.length === 0) {
    return { enviados: 0, omitidos: 0, detalles: [] };
  }

  const detalles: CumpleanosResult["detalles"] = [];
  let enviados = 0;
  let omitidos = 0;

  for (const cliente of clientesHoy) {
    if (!cliente.sucursalId) { omitidos++; continue; }

    const codigoCupon = `CUMPLE-${cliente.id}-${anio}`;

    // Verificar si ya tiene cupón este año
    const existe = await prisma.cupon.findFirst({
      where: { sucursalId: cliente.sucursalId, codigo: codigoCupon },
    });

    if (existe) {
      detalles.push({ clienteId: cliente.id, nombre: cliente.nombre, accion: "ya_tenia_cupon" });
      omitidos++;
      continue;
    }

    // Crear cupón: 10% de descuento, válido 1 mes, uso único
    const venceEn = addMonths(hoy, 1);
    await prisma.cupon.create({
      data: {
        sucursalId: cliente.sucursalId,
        codigo: codigoCupon,
        descripcion: `Feliz cumpleaños ${cliente.nombre.split(" ")[0]} 🎂`,
        tipo: "PORCENTAJE",
        valor: 10,
        usoMax: 1,
        activo: true,
        venceEn,
      },
    });

    // Encolar mensaje WhatsApp si el cliente tiene teléfono y la sucursal tiene agente
    if (cliente.telefono) {
      const agente = await prisma.agenteWsp.findFirst({
        where: { sucursalId: cliente.sucursalId, activo: true },
        select: { id: true },
      });

      if (agente) {
        const mensaje =
          `¡Feliz cumpleaños ${cliente.nombre.split(" ")[0]}! 🎂🎉 ` +
          `Te regalamos un 10% de descuento en tu próxima visita. ` +
          `Usa el código *${codigoCupon}* al pagar. ¡Válido por 1 mes!`;

        NotificationService.enqueueWsp(cliente.sucursalId, cliente.telefono, mensaje);
      }
    }

    detalles.push({ clienteId: cliente.id, nombre: cliente.nombre, accion: "cupon_creado" });
    enviados++;
    console.log(`[Cumpleaños] Cupón creado para ${cliente.nombre} (id: ${cliente.id})`);
  }

  return { enviados, omitidos, detalles };
}
