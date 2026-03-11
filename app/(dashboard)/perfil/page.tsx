import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PerfilClient } from "./PerfilClient";
import type { Rol } from "@/types";

export const metadata = { title: "Mi Perfil — PandaPoss" };

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const id = (session.user as { id: number }).id;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, usuario: true, email: true, rol: true },
  });
  if (!usuario) redirect("/panel");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-text">Mi Perfil</h1>
        <p className="text-sm text-surface-muted mt-0.5">Actualiza tu nombre o contraseña</p>
      </div>
      <PerfilClient
        nombre={usuario.nombre}
        usuario={usuario.usuario}
        rol={usuario.rol as Rol}
        email={usuario.email}
      />
    </div>
  );
}
