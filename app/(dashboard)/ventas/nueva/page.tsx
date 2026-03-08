import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NuevaVentaClient } from "./NuevaVentaClient";

async function getProductos(sucursalId: number | null) {
  return prisma.producto.findMany({
    where: { activo: true, ...(sucursalId ? { sucursalId } : {}) },
    include: { categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });
}

export default async function NuevaVentaPage() {
  const session = await getServerSession(authOptions);
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const userId = (session?.user as { id?: number })?.id ?? 0;

  const productos = await getProductos(sucursalId);

  const productosData = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    precio: Number(p.precio),
    imagen: p.imagen,
    stock: Number(p.stock),
    categoriaId: p.categoriaId,
    categoria: p.categoria ?? undefined,
  }));

  return (
    <NuevaVentaClient
      productos={productosData}
      simbolo={simbolo}
      usuarioId={userId}
    />
  );
}
