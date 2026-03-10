import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { FeatureGate } from "@/components/FeatureGate";
import { CartaQRClient } from "./CartaQRClient";
import type { Rol } from "@/types";

export default async function CartaQRPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol        = (session.user as { rol?: Rol })?.rol;
  const menuQR     = (session.user as { menuQR?: boolean })?.menuQR ?? false;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  if (rol !== "ADMIN_GENERAL" && rol !== "ADMIN_SUCURSAL") redirect("/panel");

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

      <FeatureGate enabled={menuQR || rol === "ADMIN_GENERAL"} feature="Carta QR">
        <CartaQRClient salas={salaGroups} />
      </FeatureGate>
    </div>
  );
}
