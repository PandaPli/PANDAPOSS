import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EvaluacionesAdmin } from "./EvaluacionesAdmin";

export const metadata = { title: "PP — Evaluaciones" };

export default async function EvaluacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { rol: string };
  if (user.rol !== "ADMIN_GENERAL") redirect("/panel");

  return <EvaluacionesAdmin />;
}
