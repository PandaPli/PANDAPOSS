import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NuevaVentaClient } from "./NuevaVentaClient";
import type { CartItem } from "@/types";

async function getProductos(sucursalId: number | null) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      enMenu: true,
      // Mostrar productos de la sucursal Y productos globales (sucursalId null)
      ...(sucursalId
        ? { OR: [{ sucursalId }, { sucursalId: null }] }
        : {}),
    },
    include: { categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });
}

async function getCajaAbierta(sucursalId: number | null) {
  if (!sucursalId) return null;
  return prisma.caja.findFirst({
    where: { sucursalId, estado: "ABIERTA" },
    select: { id: true, nombre: true },
  });
}

async function getPedido(pedidoId: number | undefined) {
  if (!pedidoId || isNaN(pedidoId)) return null;
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      detalles: {
        include: {
          producto: true,
          combo: true,
        },
      },
    },
  });

  if (!pedido) return null;

  const initialItems: CartItem[] = pedido.detalles.map((d) => {
    const item = d.producto || d.combo;
    return {
      id: item!.id,
      tipo: d.productoId ? "producto" : "combo",
      codigo: item!.codigo,
      nombre: item!.nombre,
      precio: Number(item!.precio),
      cantidad: d.cantidad,
      observacion: d.observacion ?? undefined,
      imagen: item!.imagen ?? undefined,
      guardado: true,
    };
  });

  return { id: pedido.id, mesaId: pedido.mesaId, items: initialItems };
}

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function NuevaVentaPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const userId = (session?.user as { id?: number })?.id ?? 0;
  const meseroNombre = session?.user?.name ?? "Cajero";
  const userRol = (session?.user as { rol?: string })?.rol ?? undefined;

  const { pedido: pedidoIdParam } = await searchParams;

  const [productos, cajaAbierta, pedidoInfo] = await Promise.all([
    getProductos(sucursalId),
    getCajaAbierta(sucursalId),
    getPedido(pedidoIdParam ? Number(pedidoIdParam) : undefined),
  ]);

  const productosData = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    precio: Number(p.precio),
    imagen: p.imagen,
    stock: Number(p.stock),
    categoriaId: p.categoriaId,
    categoria: p.categoria ?? undefined,
  }));

  return (
    <NuevaVentaClient
      productos={productosData}
      simbolo={simbolo}
      usuarioId={userId}
      userRol={userRol}
      cajaId={cajaAbierta?.id}
      cajaNombre={cajaAbierta?.nombre}
      meseroNombre={meseroNombre}
      initialOrder={pedidoInfo}
    />
  );
}
