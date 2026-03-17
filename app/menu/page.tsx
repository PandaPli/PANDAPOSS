import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MenuClient } from "./MenuClient";

interface Props {
  searchParams: Promise<{ sucursal?: string; mesa?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { sucursal } = await searchParams;
  const suc = sucursal ? await prisma.sucursal.findUnique({ where: { id: Number(sucursal) }, select: { nombre: true } }) : null;
  return { title: suc ? `Carta — ${suc.nombre}` : "Carta Digital" };
}

export default async function MenuPage({ searchParams }: Props) {
  const { sucursal: sucursalParam, mesa: mesaParam } = await searchParams;

  const sucursalId = sucursalParam ? Number(sucursalParam) : NaN;
  const mesaId     = mesaParam     ? Number(mesaParam)     : NaN;

  if (isNaN(sucursalId)) notFound();

  const [sucursal, mesa, categorias] = await Promise.all([
    prisma.sucursal.findUnique({
      where: { id: sucursalId, activa: true },
      select: { id: true, nombre: true, menuQR: true, simbolo: true },
    }),
    !isNaN(mesaId)
      ? prisma.mesa.findFirst({
          where: { id: mesaId, sala: { sucursalId } }, // Validar que la mesa pertenezca a esta sucursal
          select: { id: true, nombre: true },
        })
      : Promise.resolve(null),
    prisma.categoria.findMany({
      where: { activa: true },
      include: {
        productos: {
          where: {
            sucursalId,
            activo: true,
            enMenuQR: true,
            stock: { gte: 0 },
          },
          select: { id: true, nombre: true, precio: true, descripcion: true, imagen: true },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!sucursal || !sucursal.menuQR) notFound();

  // Filtrar categorías con al menos 1 producto
  const cats = categorias.filter((c) => c.productos.length > 0);

  // Convertir Decimal/Num a number para el cliente
  const safeCategorias = cats.map(c => ({
    id: c.id,
    nombre: c.nombre,
    productos: c.productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      descripcion: p.descripcion,
      imagen: p.imagen
    }))
  }));

  return (
    <MenuClient
      sucursalId={sucursal.id}
      sucursalNombre={sucursal.nombre}
      simbolo={sucursal.simbolo ?? "$"}
      mesaId={mesa?.id}
      mesaNombre={mesa?.nombre}
      categorias={safeCategorias}
    />
  );
}
