export type PlanTipo = "BASICO" | "PRO" | "PRIME" | "DEMO";

export interface PlanFeatures {
  usuarios: number;
  cajas: number;
  productos: number;
  clientes: number;
  delivery: boolean;
  menuQR: boolean;
  kiosko: boolean;
  correo: boolean;
  rrhh: boolean;
  propinas: boolean;
  cupones: boolean;
}

export const PLAN_LIMITS: Record<PlanTipo, PlanFeatures> = {
  BASICO: {
    usuarios: 10,
    cajas: 1,
    productos: 150,
    clientes: 100,
    delivery: false,
    menuQR: false,
    kiosko: false,
    correo: false,
    rrhh: false,
    propinas: false,
    cupones: false,
  },
  PRO: {
    usuarios: 20,
    cajas: 2,
    productos: 500,
    clientes: 200,
    delivery: true,
    menuQR: true,
    kiosko: false,
    correo: true,
    rrhh: true,
    propinas: false,
    cupones: false,
  },
  PRIME: {
    usuarios: 50,
    cajas: 5,
    productos: 2000,
    clientes: 1000,
    delivery: true,
    menuQR: true,
    kiosko: true,
    correo: true,
    rrhh: true,
    propinas: true,
    cupones: true,
  },
  DEMO: {
    usuarios: 99999,
    cajas: 99999,
    productos: 99999,
    clientes: 99999,
    delivery: true,
    menuQR: true,
    kiosko: true,
    correo: true,
    rrhh: true,
    propinas: true,
    cupones: true,
  },
};
