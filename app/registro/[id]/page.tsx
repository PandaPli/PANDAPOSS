import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { RegistroClient } from "./RegistroClient";

// Normaliza un nombre a slug: "BamPai" → "bampai", "Las Flores" → "lasflores"
function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

export default async function RegistroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let sucursal = null;

  // Intentar por ID numérico primero
  const numId = Number(id);
  if (!isNaN(numId)) {
    sucursal = await prisma.sucursal.findUnique({
      where: { id: numId },
      select: { id: true, nombre: true, activa: true, logoUrl: true },
    });
  }

  // Si no es número o no se encontró, buscar por slug (nombre normalizado)
  if (!sucursal) {
    const todas = await prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, activa: true, logoUrl: true },
    });
    sucursal = todas.find((s) => toSlug(s.nombre) === toSlug(id)) ?? null;
  }

  if (!sucursal || !sucursal.activa) notFound();

  return (
    <RegistroClient
      sucursalId={sucursal.id}
      sucursalNombre={sucursal.nombre}
      sucursalLogo={sucursal.logoUrl ?? null}
    />
  );
}
