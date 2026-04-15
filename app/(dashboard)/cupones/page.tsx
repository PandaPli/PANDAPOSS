import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CuponesClient } from "./CuponesClient";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Cupones" };

export default async function CuponesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const cuponesActivo = (session.user as { cupones?: boolean }).cupones ?? false;

  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    redirect("/panel");
  }

  // Solo ADMIN_GENERAL o sucursales con plan PRIME acceden
  if (rol !== "ADMIN_GENERAL" && !cuponesActivo) {
    redirect("/panel");
  }

  const where = rol === "ADMIN_GENERAL" ? {} : { sucursalId: sucursalId! };
  const raw = await prisma.cupon.findMany({
    where,
    orderBy: { creadoEn: "desc" },
  });

  const cupones = raw.map((c) => ({ ...c, valor: Number(c.valor) }));

  return <CuponesClient cupones={cupones} sucursalId={sucursalId} />;
}
