import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { KioskoClient } from "./KioskoClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function KioskoPage({ params }: Props) {
  const { slug } = await params;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, logoUrl: true, simbolo: true, cartaBg: true },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  if (!branch) notFound();

  const sucursalId = branch.id;

  const sucMP = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { mpAccessToken: true },
  });
  const mpEnabled = Boolean(sucMP?.mpAccessToken);

  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    include: {
      productos: {
        where: {
          activo: true,
          enKiosko: true,
          OR: [{ sucursalId }, { sucursalId: null }],
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          imagen: true,
          variantes: {
            select: {
              id: true,
              nombre: true,
              requerido: true,
              tipo: true,
              opciones: {
                select: { id: true, nombre: true, precio: true },
                orderBy: { orden: "asc" },
              },
            },
            orderBy: { orden: "asc" },
          },
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { orden: "asc" },
  });

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
        variantes: p.variantes.map((g) => ({
          id: g.id,
          nombre: g.nombre,
          requerido: g.requerido,
          tipo: g.tipo,
          opciones: g.opciones.map((o) => ({
            id: o.id,
            nombre: o.nombre,
            precio: Number(o.precio),
          })),
        })),
      })),
    }));

  return (
    <KioskoClient
      sucursal={{
        id: sucursalId,
        nombre: branch.nombre,
        logoUrl: branch.logoUrl,
        simbolo: branch.simbolo,
        cartaBg: branch.cartaBg,
      }}
      categorias={safeCategorias}
      mpEnabled={mpEnabled}
    />
  );
}
