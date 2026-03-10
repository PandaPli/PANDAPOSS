import { prisma } from "@/lib/db";
import { ProductosClient } from "./ProductosClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getData(sucursalId: number | null, rol: string | null) {
  const [productos, categorias] = await Promise.all([
    prisma.producto.findMany({
      where: {
        activo: true,
        ...(rol !== "ADMIN_GENERAL" && sucursalId
          ? { OR: [{ sucursalId }, { sucursalId: null }] }
          : {}),
      },
      include: { categoria: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoria.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
  ]);
  return { productos, categorias };
}

export default async function ProductosPage() {
  const session = await getServerSession(authOptions);
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const sucursalId = (session?.user as { sucursalId?: number })?.sucursalId ?? null;
  const rol = (session?.user as { rol?: string })?.rol ?? null;
  const { productos, categorias } = await getData(sucursalId, rol);

  const data = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    precio: Number(p.precio),
    stock: Number(p.stock),
    stockMinimo: Number(p.stockMinimo),
    imagen: p.imagen,
    activo: p.activo,
    enMenu: p.enMenu,
    ivaActivo: p.ivaActivo,
    categoriaId: p.categoriaId,
    categoria: p.categoria ?? undefined,
    seccion: p.seccion ?? null,
  }));

  return (
    <div className="space-y-6">
      <ProductosClient productos={data} categorias={categorias} simbolo={simbolo} />
    </div>
  );
}
