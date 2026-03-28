import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientePerfilClient } from "./ClientePerfilClient";

export const metadata = { title: "Perfil Cliente — PandaPoss" };

export default async function ClientePerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  return <ClientePerfilClient clienteId={Number(id)} />;
}
