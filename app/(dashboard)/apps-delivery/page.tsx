import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppsDeliveryClient } from "./AppsDeliveryClient";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Apps Delivery" };

const ALLOWED_ROLES: Rol[] = ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"];

export default async function AppsDeliveryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: Rol })?.rol;
  if (!rol || !ALLOWED_ROLES.includes(rol)) redirect("/panel");

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session.user as { simbolo?: string })?.simbolo ?? "$";

  const sucursalData = sucursalId
    ? await prisma.sucursal.findUnique({
        where: { id: sucursalId },
        select: { nombre: true },
      })
    : null;

  const sucursalNombre = sucursalData?.nombre ?? "bampai";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Apps Delivery</h1>
        <p className="mt-1 text-sm text-surface-muted">
          Imprime el ticket con nombre, monto y QR para pegar en las bolsas de Pedidos Ya / Uber Eats.
        </p>
      </div>
      <AppsDeliveryClient sucursalNombre={sucursalNombre} simbolo={simbolo} />
    </div>
  );
}
