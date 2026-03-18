import { PlanTipo } from "@prisma/client";

/**
 * Reglas de features por plan.
 * PRIME y PRO incluyen todas las funciones sin importar los toggles individuales.
 * BASICO y DEMO dependen de los toggles configurados manualmente.
 */

const PLAN_ALL_FEATURES: PlanTipo[] = [PlanTipo.PRIME, PlanTipo.PRO];

export function planIncludesFeature(plan: string): boolean {
  return PLAN_ALL_FEATURES.includes(plan as PlanTipo);
}

/** Devuelve el valor efectivo del toggle considerando el plan */
export function effectiveFeature(plan: string, toggle: boolean): boolean {
  return planIncludesFeature(plan) ? true : toggle;
}

/**
 * Filtro Prisma para obtener sucursales con una feature habilitada,
 * ya sea por toggle o por plan (PRIME/PRO).
 *
 * Uso: where: { activa: true, ...featureFilter("delivery") }
 */
export function featureFilter(field: "delivery" | "menuQR" | "correoActivo") {
  return {
    OR: [
      { [field]: true },
      { plan: PlanTipo.PRIME },
      { plan: PlanTipo.PRO },
    ],
  };
}
