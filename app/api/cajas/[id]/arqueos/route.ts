import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CajaRepo } from "@/server/repositories/caja.repo";
import type { Rol } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const cajaId = Number(idStr);
  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // Validar pertenencia a la sucursal
  if (rol !== "ADMIN_GENERAL") {
    const caja = await CajaRepo.findById(cajaId);
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    if (caja.sucursalId !== sucursalId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const arqueos = await prisma.arqueo.findMany({
    where: { cajaId },
    include: { usuario: { select: { nombre: true } } },
    orderBy: { abiertaEn: "desc" },
    take: 30, // últimos 30 turnos
  });

  return NextResponse.json(
    arqueos.map((a) => ({
      id: a.id,
      abiertaEn: a.abiertaEn.toISOString(),
      cerradaEn: a.cerradaEn?.toISOString() ?? null,
      saldoInicio: Number(a.saldoInicio),
      saldoFinal: a.saldoFinal !== null ? Number(a.saldoFinal) : null,
      totalVentas: a.totalVentas !== null ? Number(a.totalVentas) : null,
      diferencia: a.diferencia !== null ? Number(a.diferencia) : null,
      observacion: a.observacion ?? null,
      cajero: a.usuario?.nombre ?? "—",
    }))
  );
}
