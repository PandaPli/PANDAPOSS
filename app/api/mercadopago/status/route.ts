import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import type { Rol } from "@/types";

// GET /api/mercadopago/status?pedidoId=123
// Consulta el estado de pago MP de un pedido
export async function GET(req: NextRequest) {
  // Rate limiting — 30 req/min
  const ip = getClientIp(req);
  const rl = rateLimit(`mp:status:${ip}`, { max: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const pedidoId = Number(req.nextUrl.searchParams.get("pedidoId"));
  if (!pedidoId || isNaN(pedidoId)) {
    return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      mpStatus: true,
      mpPaymentId: true,
      caja: { select: { sucursalId: true } },
      mesa: { select: { sala: { select: { sucursalId: true } } } },
      usuario: { select: { sucursalId: true } },
    },
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Verificar que el pedido pertenezca a la sucursal del usuario
  const rol = (session.user as { rol: Rol }).rol;
  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  if (rol !== "ADMIN_GENERAL") {
    const pedidoSucursalId =
      pedido.caja?.sucursalId ??
      pedido.mesa?.sala?.sucursalId ??
      pedido.usuario?.sucursalId;
    if (pedidoSucursalId !== userSucursalId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  return NextResponse.json({
    status: pedido.mpStatus ?? "pending",
    paymentId: pedido.mpPaymentId,
  });
}
