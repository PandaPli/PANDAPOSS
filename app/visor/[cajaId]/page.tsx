import type { Metadata } from "next";
import VisorClient from "./VisorClient";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Visor Cliente | PandaPOS",
};

interface Props {
  params: Promise<{ cajaId: string }>;
}

export default async function VisorPage({ params }: Props) {
  const { cajaId } = await params;
  const id = Number(cajaId);

  // Cargar logo y nombre de la sucursal a la que pertenece esta caja
  const caja = await prisma.caja.findUnique({
    where: { id },
    select: {
      sucursal: {
        select: { nombre: true, logoUrl: true },
      },
    },
  });

  const logoUrl         = caja?.sucursal?.logoUrl ?? null;
  const sucursalNombre  = caja?.sucursal?.nombre  ?? "";

  return (
    <VisorClient
      cajaId={id}
      logoUrl={logoUrl}
      sucursalNombreInit={sucursalNombre}
    />
  );
}
