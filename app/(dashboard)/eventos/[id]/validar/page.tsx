import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Rol } from "@/types";
import { ValidarClient } from "./ValidarClient";

export default async function ValidarPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") redirect("/panel");

  const { id } = await params;
  return <ValidarClient eventoId={parseInt(id)} />;
}
