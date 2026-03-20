import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CuponesClient } from "./CuponesClient";
import type { Rol } from "@/types";

export default async function CuponesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
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
