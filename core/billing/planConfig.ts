export type PlanTipo = "BASICO" | "PRO" | "PRIME";

export interface PlanFeatures {
  usuarios: number;
  cajas: number;
  productos: number;
  clientes: number;
  delivery: boolean;
  menuQR: boolean;
  correo: boolean;
  rrhh: boolean;
  propinas: boolean;
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
    rrhh: false,
    propinas: false,
  },
  PRO: {
    usuarios: 20,
    cajas: 2,
    productos: 500,
    clientes: 200,
    delivery: true,
    menuQR: true,
    correo: true,
    rrhh: true,
    propinas: false,
  },
  PRIME: {
    usuarios: 50,
    cajas: 5,
    productos: 2000,
    clientes: 1000,
    delivery: true,
    menuQR: true,
    correo: true,
    rrhh: true,
    propinas: true,
  },
};
