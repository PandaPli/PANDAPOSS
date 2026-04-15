import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportesClient } from "./ReportesClient";

export const metadata = { title: "PP — Reportes" };

export default async function ReportesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { rol: string; sucursalId?: number };
  const rolesPermitidos = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"];
  if (!rolesPermitidos.includes(user.rol)) redirect("/panel");

  return <ReportesClient />;
}
