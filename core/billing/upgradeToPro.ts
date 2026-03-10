import { prisma } from "@/lib/db";

/**
 * Activa el plan PRO en una sucursal y habilita todas sus features.
 * Llamar cuando el cliente confirma el pago / upgrade.
 */
export async function upgradeSucursalToPro(sucursalId: number) {
  return prisma.sucursal.update({
    where: { id: sucursalId },
    data: {
      plan: "PRO",
      delivery:     true,
      menuQR:       true,
      correoActivo: true,
    },
  });
}

/**
 * Vuelve al plan BASICO y desactiva features PRO.
 * Llamar al expirar suscripción.
 */
export async function downgradeSucursalToBasico(sucursalId: number) {
  return prisma.sucursal.update({
    where: { id: sucursalId },
    data: {
      plan: "BASICO",
      delivery:     false,
      menuQR:       false,
      correoActivo: false,
    },
  });
}
