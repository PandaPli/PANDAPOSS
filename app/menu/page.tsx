import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import MenuClient from "./MenuClient";

interface Props {
  searchParams: Promise<{ sucursal?: string; mesa?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const sucursalId = params.sucursal ? Number(params.sucursal) : null;

  const [config, sucursal] = await Promise.all([
    prisma.configuracion.findFirst(),
    sucursalId
      ? prisma.sucursal.findUnique({ where: { id: sucursalId }, select: { nombre: true } })
      : null,
  ]);

  const nombre = sucursal?.nombre ?? config?.nombreEmpresa ?? "Menú";
  return {
    title: `Menú — ${nombre}`,
    description: `Consulta nuestro menú digital`,
  };
}

export default async function MenuPage({ searchParams }: Props) {
  const params = await searchParams;
  const sucursalId = params.sucursal ? Number(params.sucursal) : null;

  const productoWhere: Record<string, unknown> = { activo: true, enMenu: true };
  if (sucursalId) {
    productoWhere.OR = [{ sucursalId }, { sucursalId: null }];
  }

  const [categorias, productos, combos, configuracion, sucursal] = await Promise.all([
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where: productoWhere,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        imagen: true,
        categoriaId: true,
        ivaActivo: true,
        ivaPorc: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.combo.findMany({
      where: { activo: true, enMenu: true },
      select: { id: true, nombre: true, precio: true, imagen: true, categoriaId: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.configuracion.findFirst(),
    sucursalId
      ? prisma.sucursal.findUnique({
          where: { id: sucursalId },
          select: { nombre: true, direccion: true, telefono: true, simbolo: true },
        })
      : null,
  ]);

  // Unir productos y combos en un solo array
  const items = [
    ...productos.map((p) => ({
      ...p,
      precio: Number(p.precio),
      ivaPorc: Number(p.ivaPorc),
      tipo: "producto" as const,
    })),
    ...combos.map((c) => ({
      ...c,
      precio: Number(c.precio),
      tipo: "combo" as const,
      descripcion: null,
      ivaActivo: false,
      ivaPorc: 0,
    })),
  ];

  // Filtrar categorías que tienen al menos un ítem
  const catIds = new Set(items.map((i) => i.categoriaId));
  const categoriasConItems = categorias.filter((c) => catIds.has(c.id));

  const negocio = {
    nombre: sucursal?.nombre ?? configuracion?.nombreEmpresa ?? "Menú",
    direccion: sucursal?.direccion ?? configuracion?.direccion ?? null,
    telefono: sucursal?.telefono ?? configuracion?.telefono ?? null,
    simbolo: sucursal?.simbolo ?? configuracion?.simbolo ?? "$",
  };

  return (
    <MenuClient
      categorias={categoriasConItems}
      items={items}
      negocio={negocio}
    />
  );
}
