import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// GET /api/visor-pedidos?sucursalId=6
// Devuelve pedidos KIOSKO del turno actual agrupados por estado
export async function GET(req: NextRequest) {
  // Rate limiting — 30 req/min (pantalla de visor hace polling)
  const ip = getClientIp(req);
  const rl = rateLimit(`visor-pedidos:${ip}`, { max: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const sucursalId = Number(req.nextUrl.searchParams.get("sucursalId"));
  if (!sucursalId || isNaN(sucursalId) || sucursalId <= 0) {
    return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });
  }

  // Validar que la sucursal existe y está activa
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { id: true, activa: true },
  });
  if (!sucursal || !sucursal.activa) {
    return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
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

  // Parsear solo primer nombre del cliente (sin apellido) para el visor público
  const result = pedidos.map((p) => {
    const nombreMatch = p.observacion?.match(/👤\s*([^·]+)/);
    const nombreCompleto = nombreMatch ? nombreMatch[1].trim() : null;
    // Solo mostrar primer nombre para privacidad
    const nombre = nombreCompleto ? nombreCompleto.split(" ")[0] : null;
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
