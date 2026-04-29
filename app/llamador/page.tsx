import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LlamadorClient } from "./LlamadorClient";
import type { Rol } from "@/types";

export const metadata = { title: "Llamador de Órdenes · PandaPOS" };

// Página fuera del layout del dashboard — pantalla completa para TV/monitor
export default async function LlamadorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const isAdmin = rol === "ADMIN_GENERAL";

  let sucursalNombre = "PandaPOS";
  if (sucursalId) {
    const suc = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { nombre: true },
    });
    if (suc) sucursalNombre = suc.nombre;
  }

  let desde: Date;
  try {
    const caja = await prisma.caja.findFirst({
      where: {
        estado: "ABIERTA",
        ...(sucursalId && !isAdmin ? { sucursalId } : {}),
      },
      orderBy: { abiertaEn: "desc" },
      select: { abiertaEn: true },
    });
    desde = caja?.abiertaEn ?? new Date(Date.now() - 8 * 60 * 60 * 1000);
  } catch {
    desde = new Date(Date.now() - 8 * 60 * 60 * 1000);
  }

  const initialData = await prisma.pedido.findMany({
    where: {
      estado: "LISTO",
      creadoEn: { gte: desde },
      AND: [
        { OR: [{ mpStatus: null }, { mpStatus: { not: "pending_payment" } }] },
        ...(!isAdmin && sucursalId
          ? [{ OR: [
              { caja: { sucursalId } },
              { mesa: { sala: { sucursalId } } },
              { usuario: { sucursalId } },
              { delivery: { cliente: { sucursalId } } },
            ]}]
          : []),
      ],
    },
    select: {
      id: true,
      numero: true,
      tipo: true,
      observacion: true,
      listoEn: true,
      mesa: { select: { nombre: true } },
      delivery: { select: { zonaDelivery: true } },
    },
    orderBy: { listoEn: "asc" },
  });

  return (
    <LlamadorClient
      sucursalId={sucursalId}
      sucursalNombre={sucursalNombre}
      initialData={initialData.map(o => ({
        ...o,
        listoEn: o.listoEn?.toISOString() ?? null,
      }))}
    />
  );
}
