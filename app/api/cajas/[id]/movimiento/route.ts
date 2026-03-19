import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CajaRepo } from "@/server/repositories/caja.repo";
import type { Rol } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const cajaId = Number(idStr);
  const { tipo, monto, motivo } = await req.json();
  const usuarioId = (session.user as { id: number }).id;
  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  if (!tipo || !monto || !motivo)
    return NextResponse.json({ error: "Faltan datos obligatorios (tipo, monto, motivo)" }, { status: 400 });

  if (tipo !== "INGRESO" && tipo !== "RETIRO")
    return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 });

  const numMonto = Number(monto);
  if (isNaN(numMonto) || numMonto <= 0 || !isFinite(numMonto))
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });

  try {
    const caja = await CajaRepo.findById(cajaId);
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });

    // C3: Validar que la caja pertenece a la sucursal del usuario
    if (rol !== "ADMIN_GENERAL" && caja.sucursalId !== sucursalId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if (caja.estado === "CERRADA")
      return NextResponse.json({ error: "No se pueden hacer movimientos en una caja cerrada" }, { status: 400 });

    // A3: Leer estado dentro de la transacción para evitar race condition
    // (otra request podría cerrar la caja entre el check anterior y el insert)
    const movimiento = await prisma.$transaction(async (tx) => {
      const cajaActual = await tx.caja.findUnique({
        where: { id: cajaId },
        select: { estado: true },
      });
      if (!cajaActual || cajaActual.estado === "CERRADA") {
        throw new Error("No se pueden hacer movimientos en una caja cerrada");
      }
      return tx.movimientoCaja.create({
        data: { tipo, monto: numMonto, motivo, cajaId, usuarioId },
      });
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cajas/:id/movimiento]", error);
    if (error instanceof Error && error.message.includes("caja cerrada")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno al registrar el movimiento" }, { status: 500 });
  }
}
