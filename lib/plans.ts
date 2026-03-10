import { prisma } from "@/lib/db";

export type PlanTipo = "BASICO" | "PRO";

export const PLAN_LIMITS: Record<
  PlanTipo,
  { usuarios: number; cajas: number; productos: number; clientes: number; delivery: boolean; menuQR: boolean; correo: boolean }
> = {
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

/**
 * Verifica si una sucursal puede crear más recursos del tipo indicado.
 * ADMIN_GENERAL (sucursalId = null) no tiene límite.
 */
export async function checkLimit(
  sucursalId: number | null,
  resource: "usuarios" | "cajas" | "productos" | "clientes"
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

/**
 * Verifica si una feature está disponible y activa en la sucursal.
 */
export async function checkFeature(
  sucursalId: number | null,
  feature: "delivery" | "menuQR" | "correo"
): Promise<{ allowed: boolean; error?: string }> {
  if (!sucursalId) return { allowed: true };

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { plan: true, delivery: true, menuQR: true, correoActivo: true },
  });

  if (!sucursal) return { allowed: false, error: "Sucursal no encontrada" };

  const plan = sucursal.plan as PlanTipo;
  if (!PLAN_LIMITS[plan][feature === "correo" ? "correo" : feature]) {
    return { allowed: false, error: `La función "${feature}" no está disponible en el plan ${plan}. Requiere plan PRO.` };
  }

  const active =
    feature === "delivery" ? sucursal.delivery :
    feature === "menuQR" ? sucursal.menuQR :
    sucursal.correoActivo;

  if (!active) {
    return { allowed: false, error: `La función "${feature}" está desactivada en esta sucursal.` };
  }

  return { allowed: true };
}
