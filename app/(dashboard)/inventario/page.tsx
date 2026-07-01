import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InventarioClient } from "./InventarioClient";

export const metadata: Metadata = { title: "PP — Inventario" };
export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: string })?.rol ?? "";
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const sucFiltro =
    rol === "ADMIN_GENERAL" ? {} : sucursalId ? { sucursalId } : { id: -1 };

  const [movimientosRaw, productosStockBajoRaw, ingredientesStockBajoRaw, productosRaw] =
    await Promise.all([
      prisma.kardex.findMany({
        where: { producto: sucFiltro },
        include: { producto: { select: { nombre: true, codigo: true, stock: true } } },
        orderBy: { creadoEn: "desc" },
        take: 100,
      }),
      prisma.producto.findMany({
        where: { ...sucFiltro, inventariable: true, activo: true, stockMinimo: { gt: 0 } },
        select: { id: true, nombre: true, stock: true, stockMinimo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.ingrediente.findMany({
        where: { ...sucFiltro, activo: true, stockMinimo: { gt: 0 } },
        select: { id: true, nombre: true, stock: true, stockMinimo: true, unidad: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.producto.findMany({
        where: { ...sucFiltro, activo: true, inventariable: true },
        select: { id: true, nombre: true, codigo: true, stock: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

  const stockBajoProductos = productosStockBajoRaw.filter(
    (p) => Number(p.stock) <= Number(p.stockMinimo)
  );
  const stockBajoIngredientes = ingredientesStockBajoRaw.filter(
    (i) => Number(i.stock) <= Number(i.stockMinimo)
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <InventarioClient
        movimientos={movimientosRaw.map((k) => ({
          id: k.id,
          productoId: k.productoId,
          productoNombre: k.producto.nombre,
          productoCodigo: k.producto.codigo,
          stockActual: Number(k.producto.stock),
          tipo: k.tipo as "ENTRADA" | "SALIDA" | "AJUSTE",
          cantidad: Number(k.cantidad),
          motivo: k.motivo,
          ventaId: k.ventaId,
          creadoEn: k.creadoEn.toISOString(),
        }))}
        stockBajoProductos={stockBajoProductos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          stock: Number(p.stock),
          stockMinimo: Number(p.stockMinimo),
        }))}
        stockBajoIngredientes={stockBajoIngredientes.map((i) => ({
          id: i.id,
          nombre: i.nombre,
          stock: Number(i.stock),
          stockMinimo: Number(i.stockMinimo),
          unidad: i.unidad,
        }))}
        productos={productosRaw.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          stock: Number(p.stock),
        }))}
      />
    </div>
  );
}
