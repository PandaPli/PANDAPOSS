import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Ruta pública — no requiere autenticación
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sucursalId = searchParams.get("sucursal");

  // Filtro base para productos visibles en menú
  const productoWhere: Record<string, unknown> = {
    activo: true,
    enMenu: true,
  };

  if (sucursalId) {
    productoWhere.OR = [
      { sucursalId: Number(sucursalId) },
      { sucursalId: null },
    ];
  }

  const [categorias, productos, combos, configuracion, sucursal] = await Promise.all([
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where: productoWhere,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        imagen: true,
        categoriaId: true,
        ivaActivo: true,
        ivaPorc: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.combo.findMany({
      where: { activo: true, enMenu: true },
      select: {
        id: true,
        nombre: true,
        precio: true,
        imagen: true,
        categoriaId: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.configuracion.findFirst(),
    sucursalId
      ? prisma.sucursal.findUnique({
          where: { id: Number(sucursalId) },
          select: { nombre: true, direccion: true, telefono: true, simbolo: true },
        })
      : null,
  ]);

  return NextResponse.json({
    categorias,
    productos: productos.map((p) => ({
      ...p,
      precio: Number(p.precio),
      ivaPorc: Number(p.ivaPorc),
      tipo: "producto" as const,
    })),
    combos: combos.map((c) => ({
      ...c,
      precio: Number(c.precio),
      tipo: "combo" as const,
    })),
    negocio: {
      nombre: sucursal?.nombre ?? configuracion?.nombreEmpresa ?? "Menú",
      direccion: sucursal?.direccion ?? configuracion?.direccion ?? null,
      telefono: sucursal?.telefono ?? configuracion?.telefono ?? null,
      simbolo: sucursal?.simbolo ?? configuracion?.simbolo ?? "$",
    },
  });
}
