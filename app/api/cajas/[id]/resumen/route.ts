import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CajaService } from "@/server/services/caja.service";
import { CajaRepo } from "@/server/repositories/caja.repo";
import type { Rol } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // C2: Validar que la caja pertenece a la sucursal del usuario
  if (rol !== "ADMIN_GENERAL") {
    const caja = await CajaRepo.findById(id);
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    if (caja.sucursalId !== sucursalId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const resumen = await CajaService.getResumenTurno(id);
    return NextResponse.json(resumen);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error calculando reporte Z";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
