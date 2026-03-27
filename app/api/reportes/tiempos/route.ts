import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

/**
 * GET /api/reportes/tiempos
 * Retorna tiempo promedio de preparación por estación (tipo de pedido).
 * Requiere iniciadoEn y listoEn en el modelo Pedido.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const dias = Math.min(Number(searchParams.get("dias") ?? 7), 90);
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  // Pedidos con ambos timestamps en el rango
  const pedidos = await prisma.pedido.findMany({
    where: {
      creadoEn:   { gte: desde },
      iniciadoEn: { not: null },
      listoEn:    { not: null },
      estado:     { in: ["LISTO", "ENTREGADO"] },
      ...(rol !== "ADMIN_GENERAL" && sucursalId
        ? {
            OR: [
              { caja: { sucursalId } },
              { mesa: { sala: { sucursalId } } },
            ],
          }
        : {}),
    },
    select: {
      tipo:       true,
      creadoEn:   true,
      iniciadoEn: true,
      listoEn:    true,
    },
  });

  // Agrupar por tipo
  const grupos: Record<string, { espera: number[]; preparacion: number[]; total: number[] }> = {};

  for (const p of pedidos) {
    if (!p.iniciadoEn || !p.listoEn) continue;
    const tipo   = p.tipo;
    const espera = (p.iniciadoEn.getTime() - p.creadoEn.getTime()) / 60000;       // min
    const prep   = (p.listoEn.getTime()    - p.iniciadoEn.getTime()) / 60000;     // min
    const total  = (p.listoEn.getTime()    - p.creadoEn.getTime()) / 60000;       // min

    if (!grupos[tipo]) grupos[tipo] = { espera: [], preparacion: [], total: [] };
    grupos[tipo].espera.push(espera);
    grupos[tipo].preparacion.push(prep);
    grupos[tipo].total.push(total);
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;

  const resultado = Object.entries(grupos).map(([tipo, { espera, preparacion, total }]) => ({
    tipo,
    cantidad:      espera.length,
    esperaPromedio: avg(espera),
    prepPromedio:   avg(preparacion),
    totalPromedio:  avg(total),
  }));

  return NextResponse.json({ dias, desde, resultado });
}
