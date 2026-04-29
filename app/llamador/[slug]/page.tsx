import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { LlamadorPublicoClient } from "./LlamadorPublicoClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Llamador de Órdenes · PandaPOS" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LlamadorPublicoPage({ params }: Props) {
  const { slug } = await params;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
  });

  const branch = sucursales.find(s => createSlug(s.nombre) === slug);
  if (!branch) notFound();

  const sucursalId = branch.id;
  const desde = new Date(Date.now() - 8 * 60 * 60 * 1000);

  const initialData = await prisma.pedido.findMany({
    where: {
      estado: "LISTO",
      creadoEn: { gte: desde },
      AND: [
        { OR: [{ mpStatus: null }, { mpStatus: { not: "pending_payment" } }] },
        {
          OR: [
            { caja: { sucursalId } },
            { mesa: { sala: { sucursalId } } },
            { usuario: { sucursalId } },
            { delivery: { cliente: { sucursalId } } },
          ],
        },
      ],
    },
    select: {
      id: true,
      numero: true,
      tipo: true,
      observacion: true,
      listoEn: true,
      mesa: { select: { nombre: true } },
      delivery: { select: { zonaDelivery: true } },
    },
    orderBy: { listoEn: "asc" },
  });

  return (
    <LlamadorPublicoClient
      sucursalId={sucursalId}
      sucursalNombre={branch.nombre}
      initialData={initialData.map(o => ({
        ...o,
        listoEn: o.listoEn?.toISOString() ?? null,
      }))}
    />
  );
}
