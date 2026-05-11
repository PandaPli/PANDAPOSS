import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductoDelMesClient } from "./ProductoDelMesClient";

export const metadata: Metadata = { title: "PP — Producto del Mes" };

export default async function ProductoDelMesPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: string })?.rol ?? "";

  if (rol !== "ADMIN_GENERAL") redirect("/panel");

  const [sucursales, productos] = await Promise.all([
    prisma.sucursal.findMany({
      where: { activa: true },
      select: {
        id: true,
        nombre: true,
        productoMesActivo: true,
        productoMesId: true,
        productoMesTitulo: true,
        productoMes: {
          select: { id: true, nombre: true, descripcion: true, precio: true, imagen: true, codigo: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, precio: true, imagen: true, codigo: true, categoria: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <ProductoDelMesClient
      sucursales={sucursales.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        productoMesActivo: s.productoMesActivo,
        productoMesId: s.productoMesId,
        productoMesTitulo: s.productoMesTitulo,
        productoMes: s.productoMes
          ? {
              id: s.productoMes.id,
              nombre: s.productoMes.nombre,
              descripcion: s.productoMes.descripcion,
              precio: Number(s.productoMes.precio),
              imagen: s.productoMes.imagen,
              codigo: s.productoMes.codigo,
            }
          : null,
      }))}
      productos={productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        imagen: p.imagen,
        codigo: p.codigo,
        categoria: p.categoria?.nombre ?? null,
      }))}
    />
  );
}
