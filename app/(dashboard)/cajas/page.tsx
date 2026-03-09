import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CajasClient } from "./CajasClient";
import type { Rol } from "@/types";

export default async function CajasPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const simbolo = (session.user as { simbolo?: string })?.simbolo ?? "$";
  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const where = rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {};

  const cajas = await prisma.caja.findMany({
    where,
    include: {
      usuario: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
    },
    orderBy: { id: "asc" },
  });

  const plain = cajas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    estado: c.estado as "ABIERTA" | "CERRADA",
    saldoInicio: Number(c.saldoInicio),
    usuarioId: c.usuarioId,
    abiertaEn: c.abiertaEn?.toISOString() ?? null,
    cerradaEn: c.cerradaEn?.toISOString() ?? null,
    usuario: c.usuario ? { nombre: c.usuario.nombre } : null,
    sucursal: c.sucursal ? { nombre: c.sucursal.nombre } : null,
  }));

  return (
    <div className="space-y-6">
      <CajasClient cajas={plain} simbolo={simbolo} />
    </div>
  );
}
