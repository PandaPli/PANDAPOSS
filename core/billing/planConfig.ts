export type PlanTipo = "BASICO" | "PRO";

export interface PlanFeatures {
  usuarios: number;
  cajas: number;
  productos: number;
  clientes: number;
  delivery: boolean;
  menuQR: boolean;
  correo: boolean;
}

export const PLAN_LIMITS: Record<PlanTipo, PlanFeatures> = {
  BASICO: {
    usuarios: 10,
    cajas: 1,
    productos: 150,
    clientes: 100,
    delivery: false,
    menuQR: false,
    correo: false,
  },
  PRO: {
    usuarios: 20,
    cajas: 2,
    productos: 500,
    clientes: 200,
    delivery: true,
    menuQR: true,
    correo: true,
  },
};
