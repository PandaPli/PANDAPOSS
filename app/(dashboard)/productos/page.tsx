import { prisma } from "@/lib/db";
import { ProductosClient } from "./ProductosClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";

async function getData(rol: Rol) {
  const [productos, categorias, sucursales] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoria.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
    rol === "ADMIN_GENERAL"
      ? prisma.sucursal.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
  ]);
  return { productos, categorias, sucursales };
}

export default async function ProductosPage() {
  const session = await getServerSession(authOptions);
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const rol = (session?.user as { rol?: Rol })?.rol ?? "CASHIER";
  const { productos, categorias, sucursales } = await getData(rol);

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
  }));

  return (
    <div className="space-y-6">
      <ProductosClient
        productos={data}
        categorias={categorias}
        sucursales={sucursales}
        rol={rol}
        simbolo={simbolo}
      />
    </div>
  );
}
