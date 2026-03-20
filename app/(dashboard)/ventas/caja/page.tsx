import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CajaBasicaClient } from "./CajaBasicaClient";

const ALLOWED_ROLES = ["RESTAURANTE", "CASHIER"];

export default async function CajaBasicaPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: string })?.rol;

  if (!rol || !ALLOWED_ROLES.includes(rol)) {
    redirect("/panel");
  }

  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const usuarioId = (session?.user as { id?: number })?.id ?? 0;

  const [productos, cajaAbierta, sucursal] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true, enMenu: true, ...(sucursalId ? { sucursalId } : {}) },
      include: { categoria: { select: { nombre: true } } },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    }),
    sucursalId
      ? prisma.caja.findFirst({
          where: { sucursalId, estado: "ABIERTA" },
          select: { id: true, nombre: true },
        })
      : null,
    sucursalId
      ? prisma.sucursal.findUnique({
          where: { id: sucursalId },
          select: {
            simbolo: true,
            nombre: true,
            rut: true,
            telefono: true,
            direccion: true,
            giroComercial: true,
          },
        })
      : null,
  ]);

  return (
    <CajaBasicaClient
      productos={productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        codigo: p.codigo,
        imagen: p.imagen,
        categoria: p.categoria ? { nombre: p.categoria.nombre } : undefined,
      }))}
      simbolo={sucursal?.simbolo ?? "$"}
      cajaId={cajaAbierta?.id}
      cajaNombre={cajaAbierta?.nombre}
      usuarioId={usuarioId}
      sucursalNombre={sucursal?.nombre ?? null}
      sucursalRut={sucursal?.rut ?? null}
      sucursalTelefono={sucursal?.telefono ?? null}
      sucursalDireccion={sucursal?.direccion ?? null}
      sucursalGiroComercial={sucursal?.giroComercial ?? null}
    />
  );
}
