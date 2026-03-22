import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CajaService } from "@/server/services/caja.service";
import { CajaRepo } from "@/server/repositories/caja.repo";
import type { Rol } from "@/types";

async function validateCajaOwnership(cajaId: number, rol: Rol, sucursalId: number | null) {
  if (rol === "ADMIN_GENERAL") return true;
  const caja = await CajaRepo.findById(cajaId);
  if (!caja) return null; // not found
  return caja.sucursalId === sucursalId ? true : false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const { action, saldoInicio, saldoFinal, observacion } = await req.json();
  const userId = (session.user as { id: number }).id;
  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // C1: Validar que la caja pertenece a la sucursal del usuario
  const ownership = await validateCajaOwnership(id, rol, sucursalId);
  if (ownership === null) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  if (ownership === false) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // Bug 2 fix: validar saldo numérico en ambas acciones
  if (action === "abrir") {
    const s = Number(saldoInicio ?? 0);
    if (isNaN(s) || s < 0 || !isFinite(s))
      return NextResponse.json({ error: "Saldo de inicio inválido" }, { status: 400 });
  }
  if (action === "cerrar") {
    const s = Number(saldoFinal ?? "");
    if (saldoFinal === undefined || saldoFinal === null || isNaN(s) || s < 0 || !isFinite(s))
      return NextResponse.json({ error: "Saldo final inválido" }, { status: 400 });
  }

  try {
    if (action === "abrir") {
      const caja = await CajaService.abrir(id, userId, saldoInicio ?? 0);
      return NextResponse.json(caja);
    }
    if (action === "cerrar") {
      const result = await CajaService.cerrar(id, saldoFinal ?? 0, observacion);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
