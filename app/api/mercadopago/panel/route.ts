import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { startOfDay, subDays } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/mercadopago/panel?dias=7
// Devuelve resumen de pagos MP + lista de pedidos con estado MP.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sessionSucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;

  const { searchParams } = new URL(req.url);
  const dias = Math.min(Math.max(Number(searchParams.get("dias") ?? "7"), 1), 90);
  const desde = subDays(startOfDay(new Date()), dias - 1);

  const sucursalId =
    rol === "ADMIN_GENERAL"
      ? searchParams.get("sucursalId") ? Number(searchParams.get("sucursalId")) : undefined
      : sessionSucursalId ?? undefined;

  // Solo pedidos que pasaron por MP (tienen preferencia creada)
  const baseWhere = {
    mpPreferenceId: { not: null },
    creadoEn: { gte: desde },
    ...(sucursalId ? { usuario: { sucursalId } } : {}),
  } as const;

  const pedidos = await prisma.pedido.findMany({
    where: baseWhere,
    select: {
      id: true,
      numero: true,
      estado: true,
      mpStatus: true,
      mpPaymentId: true,
      creadoEn: true,
      detalles: { where: { cancelado: false }, select: { cantidad: true, precio: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: 200,
  });

  // Contadores por estado
  const resumen = {
    approved: 0,
    pending_payment: 0,
    abandoned: 0,
    fallidos: 0, // rejected/cancelled/refunded/charged_back
    total: pedidos.length,
    montoAprobado: 0,
  };

  const fallidos = ["rejected", "cancelled", "refunded", "charged_back"];

  const lista = pedidos.map((p) => {
    const monto = p.detalles.reduce((s, d) => s + Number(d.precio ?? 0) * d.cantidad, 0);
    const st = p.mpStatus ?? "sin_estado";

    if (st === "approved") { resumen.approved++; resumen.montoAprobado += monto; }
    else if (st === "pending_payment") resumen.pending_payment++;
    else if (st === "abandoned") resumen.abandoned++;
    else if (fallidos.includes(st)) resumen.fallidos++;

    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      mpStatus: st,
      mpPaymentId: p.mpPaymentId,
      monto,
      creadoEn: p.creadoEn,
    };
  });

  return NextResponse.json({ resumen, pedidos: lista, dias });
}
