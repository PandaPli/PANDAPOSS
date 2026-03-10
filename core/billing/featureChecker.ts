import { prisma } from "@/lib/db";
import { PLAN_LIMITS, type PlanTipo } from "./planConfig";

export type BillingFeature = "delivery" | "menuQR" | "correo";

/**
 * Verifica si una feature está disponible en el plan y activa en la sucursal.
 * ADMIN_GENERAL (sucursalId = null) siempre tiene acceso.
 */
export async function checkFeature(
  sucursalId: number | null,
  feature: BillingFeature
): Promise<{ allowed: boolean; error?: string }> {
  if (!sucursalId) return { allowed: true };

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { plan: true, delivery: true, menuQR: true, correoActivo: true },
  });

  if (!sucursal) return { allowed: false, error: "Sucursal no encontrada" };

  const plan = sucursal.plan as PlanTipo;
  const planKey = feature === "correo" ? "correo" : feature;

  if (!PLAN_LIMITS[plan][planKey]) {
    return {
      allowed: false,
      error: `La función "${feature}" no está disponible en el plan ${plan}. Requiere plan PRO.`,
    };
  }

  const active =
    feature === "delivery"  ? sucursal.delivery :
    feature === "menuQR"    ? sucursal.menuQR :
    sucursal.correoActivo;

  if (!active) {
    return { allowed: false, error: `La función "${feature}" está desactivada en esta sucursal.` };
  }

  return { allowed: true };
}
