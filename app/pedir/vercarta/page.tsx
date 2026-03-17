import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";

interface Props {
  searchParams: Promise<{ sucursal?: string }>;
}

/**
 * /pedir/vercarta  →  redirige permanentemente a /vercarta (nueva URL canónica)
 */
export default async function VerCartaRedirectPage({ searchParams }: Props) {
  const { sucursal } = await searchParams;

  if (sucursal) {
    const sucursales = await prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
    });
    const found = sucursales.find((s) => String(s.id) === sucursal);
    if (found) redirect(`/vercarta/${createSlug(found.nombre)}`);
  }

  redirect("/vercarta");
}
