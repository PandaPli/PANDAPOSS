import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ZonasDeliveryAdmin } from "./ZonasDeliveryAdmin";
import type { Rol } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "PP — Zonas Delivery" };

export default async function ZonasDeliveryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: number; rol: Rol; sucursalId: number | null };
  const permitidos: Rol[] = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"];
  if (!permitidos.includes(user.rol)) redirect("/");

  const sucursalId = user.sucursalId;
  if (!sucursalId) redirect("/");

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { id: true, nombre: true, zonasDelivery: true },
  });

  if (!sucursal) redirect("/");

  const zonas = (sucursal.zonasDelivery as { nombre: string; costoCliente: number; pagoRider: number }[] | null) ?? [];

  return (
    <ZonasDeliveryAdmin
      sucursalId={sucursal.id}
      sucursalNombre={sucursal.nombre}
      zonasIniciales={zonas}
    />
  );
}
