import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// GET /api/driver/earnings — ganancias del rider
// ?period=today|week|month  (default: today)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "DELIVERY") return NextResponse.json({ error: "Solo para repartidores" }, { status: 403 });

  const userId = (session.user as { id: number }).id;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "today";

  const now = new Date();
  let desde: Date;

  if (period === "week") {
    desde = new Date(now);
    desde.setDate(now.getDate() - 7);
    desde.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    desde = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else {
    // today
    desde = new Date(now);
    desde.setHours(0, 0, 0, 0);
  }

  const entregas = await prisma.pedidoDelivery.findMany({
    where: {
      repartidor: { usuarioId: userId },
      estado: "ENTREGADO",
      creadoEn: { gte: desde },
    },
    select: {
      id: true,
      pagoRider: true,
      zonaDelivery: true,
      creadoEn: true,
      pedido: { select: { numero: true, direccionEntrega: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  const total = entregas.reduce((acc, e) => acc + Number(e.pagoRider ?? 0), 0);
  const cantidad = entregas.length;

  // Agrupar por día para gráfico
  const porDia: Record<string, number> = {};
  for (const e of entregas) {
    const dia = e.creadoEn.toISOString().slice(0, 10);
    porDia[dia] = (porDia[dia] ?? 0) + Number(e.pagoRider ?? 0);
  }

  return NextResponse.json({
    period,
    total,
    cantidad,
    porDia,
    entregas: entregas.map((e) => ({
      id: e.id,
      pedidoNumero: e.pedido.numero,
      direccion: e.pedido.direccionEntrega,
      zona: e.zonaDelivery,
      pago: Number(e.pagoRider ?? 0),
      fecha: e.creadoEn.toISOString(),
    })),
  });
}
