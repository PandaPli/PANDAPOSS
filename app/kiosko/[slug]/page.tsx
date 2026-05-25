import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { KioskoClient } from "./KioskoClient";
import type { VitrinaItem } from "@/components/vitrina/VitrinaBanner";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function KioskoPage({ params }: Props) {
  const { slug } = await params;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: {
      id: true, nombre: true, logoUrl: true, simbolo: true, cartaBg: true,
      mpAccessToken: true, kioskPin: true,
      productoMesActivo: true, productoMesTitulo: true, productoMesPrecio: true,
      productoMes: { select: { id: true, nombre: true, precio: true, imagen: true, descripcion: true } },
      productoDiaActivo: true, productoDiaTitulo: true, productoDiaPrecio: true,
      productoDia: { select: { id: true, nombre: true, precio: true, imagen: true, descripcion: true } },
      ofertaFugazActivo: true, ofertaFugazPrecio: true, ofertaFugazHasta: true,
      ofertaFugazProd: { select: { id: true, nombre: true, precio: true, imagen: true, descripcion: true } },
    },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  if (!branch) notFound();

  const sucursalId = branch.id;

  const mpEnabled = Boolean(branch.mpAccessToken);

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

  // Armar items de vitrina
  const vitrinaItems: VitrinaItem[] = [];
  if (branch.productoMesActivo && branch.productoMes) {
    vitrinaItems.push({
      tipo: "mes", titulo: branch.productoMesTitulo ?? null,
      producto: { id: branch.productoMes.id, nombre: branch.productoMes.nombre,
        precio: Number(branch.productoMes.precio),
        precioEspecial: branch.productoMesPrecio ? Number(branch.productoMesPrecio) : null,
        imagen: branch.productoMes.imagen, descripcion: branch.productoMes.descripcion },
      hasta: null,
    });
  }
  if (branch.productoDiaActivo && branch.productoDia) {
    vitrinaItems.push({
      tipo: "dia", titulo: branch.productoDiaTitulo ?? null,
      producto: { id: branch.productoDia.id, nombre: branch.productoDia.nombre,
        precio: Number(branch.productoDia.precio),
        precioEspecial: branch.productoDiaPrecio ? Number(branch.productoDiaPrecio) : null,
        imagen: branch.productoDia.imagen, descripcion: branch.productoDia.descripcion },
      hasta: null,
    });
  }
  if (branch.ofertaFugazActivo && branch.ofertaFugazProd) {
    const hasta = branch.ofertaFugazHasta?.toISOString() ?? null;
    if (!hasta || new Date(hasta) > new Date()) {
      vitrinaItems.push({
        tipo: "fugaz", titulo: null,
        producto: { id: branch.ofertaFugazProd.id, nombre: branch.ofertaFugazProd.nombre,
          precio: Number(branch.ofertaFugazProd.precio),
          precioEspecial: branch.ofertaFugazPrecio ? Number(branch.ofertaFugazPrecio) : null,
          imagen: branch.ofertaFugazProd.imagen, descripcion: branch.ofertaFugazProd.descripcion },
        hasta,
      });
    }
  }

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
      vitrinaItems={vitrinaItems}
      kioskPin={branch.kioskPin ?? undefined}
    />
  );
}
