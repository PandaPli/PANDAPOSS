/**
 * @deprecated Importa directamente desde @/core/billing/*
 * Este archivo existe solo para compatibilidad con imports existentes.
 */
export { PLAN_LIMITS, type PlanTipo, type PlanFeatures } from "@/core/billing/planConfig";
export { checkLimit, type LimitResource } from "@/core/billing/limitChecker";
export { checkFeature, type BillingFeature } from "@/core/billing/featureChecker";
