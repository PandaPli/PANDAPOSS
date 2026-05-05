import type { Metadata } from "next";
import { getFreshSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PagosClient } from "./PagosClient";

export const metadata: Metadata = { title: "PP — Pagos" };

export default async function PagosPage() {
  const user = await getFreshSessionUser();
  if (!user || user.rol !== "ADMIN_GENERAL") redirect("/panel");

  const sucursales = await prisma.sucursal.findMany({
    select: {
      id: true,
      nombre: true,
      plan: true,
      creadoEn: true,
      activa: true,
      logoUrl: true,
      estadoPago: true,
      mesesGratis: true,
      fechaInicioPlan: true,
      notaPago: true,
      tenant: { select: { nombre: true } },
    },
    orderBy: { nombre: "asc" },
  });

  const plain = sucursales.map((s) => ({
    ...s,
    creadoEn: s.creadoEn.toISOString(),
    fechaInicioPlan: s.fechaInicioPlan?.toISOString() ?? null,
  }));

  return <PagosClient sucursales={plain} />;
}
