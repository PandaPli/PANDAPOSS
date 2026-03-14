import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { RrhhClient } from "./RrhhClient";

const ALLOWED_ROLES: Rol[] = ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"];

export default async function RrhhPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const rol = (session.user as { rol?: Rol }).rol;
  const sucursalId = (session.user as { sucursalId?: number | null }).sucursalId ?? null;

  if (!rol || !ALLOWED_ROLES.includes(rol)) redirect("/panel");

  return <RrhhClient rol={rol} sucursalIdSesion={sucursalId} />;
}
