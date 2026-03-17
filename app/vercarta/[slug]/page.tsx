import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import VerCartaClient from "./VerCartaClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { nombre: true },
  });
  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  return {
    title: branch ? `${branch.nombre} — Carta Digital` : "Carta Digital",
    description: branch
      ? `Revisa el catálogo completo de ${branch.nombre}`
      : "Catálogo online",
  };
}

export default async function VerCartaSlugPage({ params }: Props) {
  const { slug } = await params;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, direccion: true, logoUrl: true, simbolo: true, delivery: true },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  if (!branch) notFound();

  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    include: {
      productos: {
        where: {
          activo: true,
          enMenuQR: true,
          OR: [{ sucursalId: branch.id }, { sucursalId: null }],
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          imagen: true,
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });

  // Serializar Decimal → number para poder pasar al Client Component
  const safeCategorias = categorias
    .filter((c) => c.productos.length > 0)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      productos: c.productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        imagen: p.imagen,
      })),
    }));

  return (
    <VerCartaClient
      branch={branch}
      categorias={safeCategorias}
      slug={slug}
    />
  );
}
