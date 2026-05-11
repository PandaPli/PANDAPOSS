import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductoDelMesClient } from "./ProductoDelMesClient";

export const metadata: Metadata = { title: "PP — Producto del Mes" };

const ALLOWED = ["ADMIN_GENERAL", "RESTAURANTE"];

export default async function ProductoDelMesPage() {
  const session = await getServerSession(authOptions);
  const rol        = (session?.user as { rol?: string })?.rol ?? "";
  const sucursalId = (session?.user as { sucursalId?: number })?.sucursalId ?? null;

  if (!ALLOWED.includes(rol)) redirect("/panel");

  // ADMIN_GENERAL ve todas las sucursales; RESTAURANTE solo la suya
  const sucFiltro = rol === "ADMIN_GENERAL" ? { activa: true } : { activa: true, id: sucursalId ?? -1 };
  // Productos: RESTAURANTE solo ve los de su sucursal
  const prodFiltro = rol === "ADMIN_GENERAL" ? { activo: true } : { activo: true, sucursalId: sucursalId ?? -1 };

  const [sucursales, productos] = await Promise.all([
    prisma.sucursal.findMany({
      where: sucFiltro,
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
      where: prodFiltro,
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
