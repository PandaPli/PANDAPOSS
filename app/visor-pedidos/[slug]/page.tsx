import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { VisorPedidosClient } from "./VisorPedidosClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VisorPedidosPage({ params }: Props) {
  const { slug } = await params;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, logoUrl: true },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  if (!branch) notFound();

  return (
    <VisorPedidosClient
      sucursalId={branch.id}
      sucursalNombre={branch.nombre}
      logoUrl={branch.logoUrl}
    />
  );
}
