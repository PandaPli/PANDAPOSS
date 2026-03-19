import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { featureFilter } from "@/lib/plan";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // P4: Rate limiting — 20 búsquedas por IP por minuto (anti-enumeración)
  const ip = getClientIp(req);
  const rl = rateLimit(`public:clientes:${ip}`, { max: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono");
  const sucursalId = searchParams.get("sucursalId");

  if (!telefono || !sucursalId)
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });

  const idNum = Number(sucursalId);
  if (isNaN(idNum)) return NextResponse.json({ error: "sucursalId inválido" }, { status: 400 });

  // C4: Solo sucursales activas con delivery habilitado (por plan o toggle)
  // Evita que endpoints públicos expongan datos de sucursales sin delivery
  const sucursal = await prisma.sucursal.findFirst({
    where: { id: idNum, activa: true, ...featureFilter("delivery") },
    select: { id: true },
  });
  if (!sucursal) return NextResponse.json(null, { status: 404 });

  // Sanitizar: solo los últimos 8 dígitos del teléfono
  const limpio = telefono.replace(/\D/g, "").slice(-8);
  if (limpio.length < 7) return NextResponse.json(null, { status: 404 });

  const cliente = await prisma.cliente.findFirst({
    where: {
      telefono: { endsWith: limpio },
      sucursalId: idNum,
      activo: true,
    },
    include: {
      direcciones: { take: 1, orderBy: { id: "desc" } },
    },
  });

  if (!cliente) return NextResponse.json(null, { status: 404 });

  // Devolver solo los campos necesarios para el formulario de delivery
  return NextResponse.json({
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    direccion: cliente.direcciones[0]?.calle ?? cliente.direccion ?? "",
    referencia: cliente.direcciones[0]?.referencia ?? "",
  });
}
