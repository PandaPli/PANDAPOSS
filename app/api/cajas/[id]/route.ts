import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CajaService } from "@/server/services/caja.service";

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
