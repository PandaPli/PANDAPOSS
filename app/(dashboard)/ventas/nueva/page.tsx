import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NuevaVentaClient } from "./NuevaVentaClient";
import type { CartItem } from "@/types";

const PEDIDOS_ACTIVOS = ["PENDIENTE", "EN_PROCESO", "LISTO"] as const;

async function getProductos(sucursalId: number | null) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      enMenu: true,
      // Aislamiento estricto: solo productos de la sucursal del usuario
      ...(sucursalId ? { sucursalId } : {}),
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

async function getSucursalBranding(sucursalId: number | null) {
  if (!sucursalId) return null;
  return prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { simbolo: true, logoUrl: true },
  });
}

async function getPedido(pedidoId?: number, mesaId?: number) {
  let pedido = null;

  if (pedidoId && !isNaN(pedidoId)) {
    pedido = await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        estado: { in: [...PEDIDOS_ACTIVOS] },
        venta: null,
      },
      include: {
        detalles: {
          include: {
            producto: true,
            combo: true,
          },
        },
      },
    });
  }

  if (!pedido && mesaId && !isNaN(mesaId)) {
    pedido = await prisma.pedido.findFirst({
      where: {
        mesaId,
        estado: { in: [...PEDIDOS_ACTIVOS] },
        venta: null,
      },
      include: {
        detalles: {
          include: {
            producto: true,
            combo: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    });
  }

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
  const sessionSimbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const userId = (session?.user as { id?: number })?.id ?? 0;
  const meseroNombre = session?.user?.name ?? "Cajero";
  const sessionLogoUrl = (session?.user as { logoUrl?: string | null })?.logoUrl ?? null;
  const userRol = (session?.user as { rol?: string })?.rol ?? undefined;

  const params = await searchParams;
  const pedidoId = params.pedido ? Number(params.pedido) : undefined;
  const mesaId = params.mesa ? Number(params.mesa) : undefined;

  const [productos, cajaAbierta, pedidoInfo, sucursalBranding] = await Promise.all([
    getProductos(sucursalId),
    getCajaAbierta(sucursalId),
    getPedido(pedidoId, mesaId),
    getSucursalBranding(sucursalId),
  ]);

  const simbolo = sucursalBranding?.simbolo ?? sessionSimbolo;
  const logoUrl = sucursalBranding?.logoUrl ?? sessionLogoUrl;

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
      logoUrl={logoUrl}
    />
  );
}
