import { prisma } from "@/lib/db";
import { PLAN_LIMITS, type PlanTipo } from "./planConfig";

export type LimitResource = "usuarios" | "cajas" | "productos" | "clientes";

/**
 * Verifica si una sucursal puede crear más recursos del tipo indicado.
 * ADMIN_GENERAL (sucursalId = null) no tiene límite.
 */
export async function checkLimit(
  sucursalId: number | null,
  resource: LimitResource
): Promise<{ allowed: boolean; error?: string }> {
  if (!sucursalId) return { allowed: true };

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { plan: true },
  });

  if (!sucursal) return { allowed: false, error: "Sucursal no encontrada" };

  const plan = sucursal.plan as PlanTipo;
  const max = PLAN_LIMITS[plan][resource];

  let count = 0;
  if (resource === "usuarios") {
    count = await prisma.usuario.count({ where: { sucursalId, status: "ACTIVO" } });
  } else if (resource === "cajas") {
    count = await prisma.caja.count({ where: { sucursalId } });
  } else if (resource === "productos") {
    count = await prisma.producto.count({ where: { sucursalId, activo: true } });
  } else if (resource === "clientes") {
    count = await prisma.cliente.count({ where: { sucursalId, activo: true } });
  }

  if (count >= max) {
    return {
      allowed: false,
      error: `Límite del plan ${plan}: máximo ${max} ${resource}. Actualiza al plan PRO para continuar.`,
    };
  }

  return { allowed: true };
}
