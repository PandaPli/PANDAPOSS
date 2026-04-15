import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SucursalesClient } from "./SucursalesClient";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Sucursales" };

export default async function SucursalesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL") redirect("/panel");

  const sucursales = await prisma.sucursal.findMany({
    include: {
      _count: { select: { usuarios: true, cajas: true } },
    },
    orderBy: { orden: "asc" },
  });

  return (
    <div className="space-y-6">
      <SucursalesClient sucursales={sucursales} />
    </div>
  );
}
