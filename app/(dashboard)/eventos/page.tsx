import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { EventosClient } from "./EventosClient";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Eventos" };

export default async function EventosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") {
    redirect("/panel");
  }

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const [eventos, sucursales] = await Promise.all([
    prisma.evento.findMany({
      where: {
        ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
      },
      include: {
        sucursal: { select: { id: true, nombre: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.sucursal.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
  ]);

  const plain = eventos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    descripcion: e.descripcion,
    fecha: e.fecha.toISOString(),
    lugar: e.lugar,
    precio: Number(e.precio),
    capacidad: e.capacidad,
    imagenUrl: e.imagenUrl,
    activo: e.activo,
    sucursalId: e.sucursalId,
    tenantId: e.tenantId,
    creadoEn: e.creadoEn.toISOString(),
    sucursal: e.sucursal,
    _count: e._count,
  }));

  const plainSucursales = sucursales.map((s) => ({ id: s.id, nombre: s.nombre }));

  return (
    <EventosClient
      eventos={plain}
      sucursales={plainSucursales}
      rol={rol}
      sucursalId={sucursalId}
    />
  );
}
