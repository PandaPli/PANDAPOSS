import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MenuClient } from "./MenuClient";
import { effectiveFeature } from "@/lib/plan";

interface Props {
  searchParams: Promise<{ sucursal?: string; mesa?: string; estacionamiento?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { sucursal } = await searchParams;
  const suc = sucursal ? await prisma.sucursal.findUnique({ where: { id: Number(sucursal) }, select: { nombre: true } }) : null;
  return { title: suc ? `Carta — ${suc.nombre}` : "Carta Digital" };
}

export default async function MenuPage({ searchParams }: Props) {
  const { sucursal: sucursalParam, mesa: mesaParam, estacionamiento: estParam } = await searchParams;

  const sucursalId = sucursalParam ? Number(sucursalParam) : NaN;
  const mesaId     = mesaParam     ? Number(mesaParam)     : NaN;
  const estId      = estParam      ? Number(estParam)      : NaN;

  if (isNaN(sucursalId)) notFound();

  const [sucursal, mesa, estacionamiento, categorias] = await Promise.all([
    prisma.sucursal.findUnique({
      where: { id: sucursalId, activa: true },
      select: { id: true, nombre: true, menuQR: true, plan: true, simbolo: true },
    }),
    !isNaN(mesaId)
      ? prisma.mesa.findFirst({
          where: { id: mesaId, sala: { sucursalId } },
          select: { id: true, nombre: true },
        })
      : Promise.resolve(null),
    !isNaN(estId)
      ? prisma.estacionamiento.findFirst({
          where: { id: estId, sucursalId, activo: true },
          select: { id: true, numero: true },
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
      orderBy: { orden: "asc" },
    }),
  ]);

  if (!sucursal || !effectiveFeature(sucursal.plan, sucursal.menuQR)) notFound();

  const cats = categorias.filter((c) => c.productos.length > 0);

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
      estacionamientoId={estacionamiento?.id}
      estacionamientoNumero={estacionamiento?.numero}
      categorias={safeCategorias}
    />
  );
}
