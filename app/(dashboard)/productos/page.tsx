import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductosClient } from "./ProductosClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = { title: "PP — Productos" };

async function getData(rol: string, sucursalId: number | null) {
  // Construir filtros de sucursal
  // Aislamiento estricto: ADMIN_GENERAL ve todo; demás solo ven su sucursal
  const sucFiltro = rol === "ADMIN_GENERAL" ? {} : (sucursalId ? { sucursalId } : { id: -1 });

  const [productos, categorias, sucursales] = await Promise.all([
    prisma.producto.findMany({
      where: { 
        activo: true,
        ...sucFiltro
      },
      include: {
        categoria: { select: { id: true, nombre: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    // Categorías filtradas: solo las que tienen productos de esta sucursal
    prisma.categoria.findMany({
      where: {
        activa: true,
        ...(rol !== "ADMIN_GENERAL" && sucursalId
          ? { productos: { some: { sucursalId } } }
          : {}),
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    }),
    prisma.sucursal.findMany({ 
      where: { activa: true, ...(rol === "ADMIN_GENERAL" ? {} : { id: sucursalId ?? -1 }) }, 
      orderBy: { nombre: "asc" } 
    }),
  ]);
  return { productos, categorias, sucursales };
}

export default async function ProductosPage() {
  const session = await getServerSession(authOptions);
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const rol = (session?.user as { rol?: string })?.rol ?? "";
  const sucursalId = (session?.user as { sucursalId?: number })?.sucursalId ?? null;
  const { productos, categorias, sucursales } = await getData(rol, sucursalId);

  const data = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    stock: Number(p.stock),
    stockMinimo: Number(p.stockMinimo),
    inventariable: p.inventariable,
    imagen: p.imagen,
    activo: p.activo,
    enMenu: p.enMenu,
    enMenuQR: p.enMenuQR,
    enKiosko: p.enKiosko,
    ivaActivo: p.ivaActivo,
    categoriaId: p.categoriaId,
    sucursalId: p.sucursalId,
    categoria: p.categoria ?? undefined,
    sucursal: p.sucursal ?? undefined,
  }));

  return (
    <div className="space-y-6">
      <ProductosClient productos={data} categorias={categorias} sucursales={sucursales} simbolo={simbolo} rol={rol} />
    </div>
  );
}
