import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import type { Rol } from "@/types";

// Redirige al llamador público de la sucursal del usuario.
export default async function LlamadorRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (sucursalId) {
    const suc = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { nombre: true },
    });
    if (suc) redirect(`/llamador/${createSlug(suc.nombre)}`);
  }

  // Admin general: usa la primera sucursal activa
  if (rol === "ADMIN_GENERAL") {
    const primera = await prisma.sucursal.findFirst({
      where: { activa: true },
      orderBy: { id: "asc" },
      select: { nombre: true },
    });
    if (primera) redirect(`/llamador/${createSlug(primera.nombre)}`);
  }

  redirect("/panel");
}
