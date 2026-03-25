import { getFreshSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { FeatureGate } from "@/components/FeatureGate";
import { CartaQRClient } from "./CartaQRClient";
import { PLAN_LIMITS } from "@/core/billing/planConfig";

export default async function CartaQRPage() {
  const user = await getFreshSessionUser();
  if (!user) return null;

  const rol = user.rol;
  const sucursalId = user.sucursalId;

  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") redirect("/panel");

  // Fetch live sucursal data for feature gates
  let liveMenuQR = false;
  if (sucursalId && rol !== "ADMIN_GENERAL") {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { menuQR: true, plan: true }
    });
    if (sucursal) {
      // Habilitado si el campo está activo O si el plan lo incluye
      liveMenuQR = sucursal.menuQR || PLAN_LIMITS[sucursal.plan]?.menuQR === true;
    }
  }

  // Cargar salas con sus mesas
  const salas = await prisma.sala.findMany({
    where: {
      activa: true,
      ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
    },
    include: {
      mesas: {
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, capacidad: true, salaId: true },
      },
    },
    orderBy: { nombre: "asc" },
  });

  // Inyectar sucursalId dentro de cada mesa para que el client pueda armar la URL
  const salaGroups = salas.map((sala) => ({
    nombre: sala.nombre,
    mesas: sala.mesas.map((m) => ({
      ...m,
      sala: { nombre: sala.nombre, sucursalId: sala.sucursalId },
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Carta QR</h1>
        <p className="text-surface-muted text-sm mt-1">
          Genera el QR de cada mesa — el cliente escanea y ve la carta digital
        </p>
      </div>

      <FeatureGate enabled={liveMenuQR || rol === "ADMIN_GENERAL"} feature="Carta QR">
        <CartaQRClient salas={salaGroups} />
      </FeatureGate>
    </div>
  );
}
