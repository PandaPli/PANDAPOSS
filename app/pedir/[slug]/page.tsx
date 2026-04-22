import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DeliveryOrderClient } from "./DeliveryOrderClient";
import { createSlug } from "@/lib/slug";
import { featureFilter } from "@/lib/plan";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PedirDeliveryPage({ params }: Props) {
  const { slug } = await params;

  // We fetch all active delivery branches, then find the one whose slug matches
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true, ...featureFilter("delivery") },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      logoUrl: true,
      cartaBg: true,
      cartaTagline: true,
      cartaSaludo: true,
      simbolo: true,
      zonasDelivery: true,
      flayerUrl: true,
      flayerActivo: true,
    },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);

  if (!branch) {
    notFound();
  }

  const sucursalId = branch.id;

  // Verificar si la sucursal tiene MP configurado y si hay caja abierta
  const [sucMP, cajaAbierta] = await Promise.all([
    prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { mpAccessToken: true },
    }),
    prisma.caja.findFirst({
      where: { sucursalId, estado: "ABIERTA" },
      select: { id: true },
    }),
  ]);
  const mpEnabled = Boolean(sucMP?.mpAccessToken);
  const tiendaAbierta = Boolean(cajaAbierta);

  const categorias = await prisma.categoria.findMany({
    where: { activa: true, enMenuQR: true },
    include: {
      productos: {
        where: {
          activo: true,
          enMenuQR: true,
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
              orden: true,
              opciones: {
                select: { id: true, nombre: true, precio: true, orden: true },
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
        variantes: producto.variantes.map(g => ({
          id: g.id,
          nombre: g.nombre,
          requerido: g.requerido,
          tipo: g.tipo,
          opciones: g.opciones.map(o => ({
            id: o.id,
            nombre: o.nombre,
            precio: Number(o.precio),
          })),
        })),
      })),
    }));

  // Zonas configuradas por la sucursal o fallback vacío
  const zonasRaw = Array.isArray(branch.zonasDelivery) ? branch.zonasDelivery : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zonas = (zonasRaw as any[]).map((z) => ({ id: z.id, nombre: String(z.nombre), precio: Number(z.precio) }));

  return (
    <DeliveryOrderClient
      sucursal={branch}
      categorias={safeCategorias}
      slug={slug}
      zonas={zonas}
      flayerUrl={branch.flayerUrl ?? null}
      flayerActivo={branch.flayerActivo ?? false}
      mpEnabled={mpEnabled}
      tiendaAbierta={tiendaAbierta}
    />
  );
}
