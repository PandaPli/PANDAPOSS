import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DeliveryOrderClient } from "./DeliveryOrderClient";
import { createSlug } from "@/lib/slug";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PedirDeliveryPage({ params }: Props) {
  const { slug } = await params;

  // We fetch all active delivery branches, then find the one whose slug matches
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true, delivery: true },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      logoUrl: true,
      simbolo: true,
      descripcionDelivery: true,
      instagram: true,
      facebook: true,
      whatsapp: true,
      tiktok: true,
    },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);

  if (!branch) {
    notFound();
  }

  const sucursalId = branch.id;

  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    include: {
      productos: {
        where: {
          activo: true,
          stock: { gt: 0 },
          OR: [{ sucursalId }, { sucursalId: null }],
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

  const safeCategorias = categorias
    .filter((categoria) => categoria.productos.length > 0)
    .map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      productos: categoria.productos.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        imagen: producto.imagen,
      })),
    }));

  return (
    <DeliveryOrderClient
      sucursal={branch}
      categorias={safeCategorias}
      slug={slug}
    />
  );
}
