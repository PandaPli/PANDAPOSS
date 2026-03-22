import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NuevaVentaClient } from "./NuevaVentaClient";
import type { CartItem, RondaPedido } from "@/types";

const PEDIDOS_ACTIVOS = ["PENDIENTE", "EN_PROCESO", "LISTO"] as const;

async function getProductos(sucursalId: number | null) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      enMenu: true,
      // Aislamiento estricto: solo productos de la sucursal del usuario
      ...(sucursalId ? { sucursalId } : {}),
    },
    include: { categoria: { select: { nombre: true, estacion: true } } },
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
    select: { simbolo: true, logoUrl: true, nombre: true, rut: true, telefono: true, direccion: true, giroComercial: true },
  });
}

async function getPedido(pedidoId?: number, mesaId?: number) {
  const detalleInclude = { include: { producto: true, combo: true } };

  // Buscar por pedidoId específico primero (para referencia directa)
  if (pedidoId && !isNaN(pedidoId)) {
    const p = await prisma.pedido.findFirst({
      where: { id: pedidoId, estado: { in: [...PEDIDOS_ACTIVOS] }, venta: null },
      include: { detalles: detalleInclude },
    });
    if (p) {
      // Igual que por mesaId: cargamos TODOS los pedidos activos de esa mesa
      const mesaIdTarget = p.mesaId ?? undefined;
      if (mesaIdTarget) return getAllPedidosMesa(mesaIdTarget);
    }
  }

  // Buscar por mesaId: cargar todos los pedidos activos de la mesa
  if (mesaId && !isNaN(mesaId)) {
    return getAllPedidosMesa(mesaId);
  }

  return null;
}

/** Carga todos los pedidos activos de una mesa y combina sus ítems */
async function getAllPedidosMesa(mesaId: number) {
  const pedidos = await prisma.pedido.findMany({
    where: {
      mesaId,
      estado: { in: [...PEDIDOS_ACTIVOS] },
      venta: null,
    },
    include: {
      detalles: {
        include: { producto: true, combo: true },
      },
    },
    orderBy: { creadoEn: "asc" }, // más antiguo primero
  });

  if (pedidos.length === 0) return null;

  // Combinar todos los ítems de todos los pedidos (todos guardado: true)
  const initialItems: CartItem[] = pedidos.flatMap((pedido) =>
    pedido.detalles.map((d) => {
      const item = d.producto || d.combo;
      return {
        id: item!.id,
        tipo: (d.productoId ? "producto" : "combo") as "producto" | "combo",
        codigo: item!.codigo,
        nombre: item!.nombre,
        precio: Number(item!.precio),
        cantidad: d.cantidad,
        observacion: d.observacion ?? undefined,
        imagen: item!.imagen ?? undefined,
        guardado: true,
        cancelado: d.cancelado ?? false,
        detalleId: d.id, // para sincronizar ediciones con KDS
      };
    })
  );

  // Construir historial de rondas (un pedido = una ronda)
  const rondas: RondaPedido[] = pedidos.map((pedido, idx) => ({
    pedidoId: pedido.id,
    numero: idx + 1,
    creadoEn: pedido.creadoEn.toISOString(),
    items: pedido.detalles.map((d) => ({
      nombre: d.producto?.nombre ?? d.combo?.nombre ?? "—",
      cantidad: d.cantidad,
      observacion: d.observacion ?? null,
      cancelado: d.cancelado ?? false,
    })),
  }));

  // Retornar con el pedido más reciente como referencia de ID
  const ultimo = pedidos[pedidos.length - 1];
  return { id: ultimo.id, mesaId, items: initialItems, rondas };
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

  const [productos, cajaAbierta, pedidoInfo, sucursalBranding, mesaInfo] = await Promise.all([
    getProductos(sucursalId),
    getCajaAbierta(sucursalId),
    getPedido(pedidoId, mesaId),
    getSucursalBranding(sucursalId),
    mesaId ? prisma.mesa.findUnique({ where: { id: mesaId }, select: { nombre: true } }) : null,
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
      mesaNombre={mesaInfo?.nombre ?? undefined}
      sucursalId={sucursalId}
      sucursalNombre={sucursalBranding?.nombre ?? null}
      sucursalRut={sucursalBranding?.rut ?? null}
      sucursalTelefono={sucursalBranding?.telefono ?? null}
      sucursalDireccion={sucursalBranding?.direccion ?? null}
      sucursalGiroComercial={sucursalBranding?.giroComercial ?? null}
    />
  );
}
