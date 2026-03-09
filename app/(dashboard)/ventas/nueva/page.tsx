import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NuevaVentaClient } from "./NuevaVentaClient";

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

export default async function NuevaVentaPage() {
  const session = await getServerSession(authOptions);
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const userId = (session?.user as { id?: number })?.id ?? 0;
  const meseroNombre = session?.user?.name ?? "Cajero";

  const [productos, cajaAbierta] = await Promise.all([
    getProductos(sucursalId),
    getCajaAbierta(sucursalId),
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
      cajaId={cajaAbierta?.id}
      cajaNombre={cajaAbierta?.nombre}
      meseroNombre={meseroNombre}
    />
  );
}
