import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/visor-pedidos?sucursalId=6
// Devuelve pedidos KIOSKO del turno actual agrupados por estado
export async function GET(req: NextRequest) {
  const sucursalId = Number(req.nextUrl.searchParams.get("sucursalId"));
  if (!sucursalId || isNaN(sucursalId)) {
    return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });
  }

  // Usar apertura de caja como inicio del turno
  const cajaAbierta = await prisma.caja.findFirst({
    where: { estado: "ABIERTA", sucursalId },
    orderBy: { abiertaEn: "desc" },
    select: { abiertaEn: true },
  });

  const turnoDesde = cajaAbierta?.abiertaEn ?? (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // Obtener pedidos de kiosko (observacion contiene "KIOSKO")
  const pedidos = await prisma.pedido.findMany({
    where: {
      tipo: "MOSTRADOR",
      observacion: { contains: "KIOSKO" },
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      creadoEn: { gte: turnoDesde },
      usuario: { sucursalId },
    },
    select: {
      id: true,
      numero: true,
      estado: true,
      observacion: true,
      creadoEn: true,
      listoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  // Parsear nombre del cliente desde observacion
  const result = pedidos.map((p) => {
    const nombreMatch = p.observacion?.match(/👤\s*([^·]+)/);
    const nombre = nombreMatch ? nombreMatch[1].trim() : null;
    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      nombre,
      creadoEn: p.creadoEn,
      listoEn: p.listoEn,
    };
  });

  return NextResponse.json({
    preparando: result.filter((p) => p.estado === "PENDIENTE" || p.estado === "EN_PROCESO"),
    listos: result.filter((p) => p.estado === "LISTO"),
  });
}
