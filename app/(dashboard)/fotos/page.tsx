import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FotosClient } from "./FotosClient";

export const metadata: Metadata = { title: "PP — Fotos" };

export default async function FotosPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: string })?.rol ?? "";
  const sucursalId = (session?.user as { sucursalId?: number })?.sucursalId ?? null;

  const filtro = rol === "ADMIN_GENERAL" ? {} : sucursalId ? { sucursalId } : { id: -1 };

  const productos = await prisma.producto.findMany({
    where: { activo: true, ...filtro },
    select: { id: true, nombre: true, codigo: true, imagen: true, sucursal: { select: { nombre: true } } },
    orderBy: [{ imagen: "asc" }, { nombre: "asc" }],
  });

  return (
    <FotosClient
      productos={productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        imagen: p.imagen,
        sucursal: p.sucursal?.nombre ?? null,
      }))}
    />
  );
}
