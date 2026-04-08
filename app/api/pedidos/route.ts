import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { PedidoRepo } from "@/server/repositories/pedido.repo";
import { PedidoService } from "@/server/services/pedido.service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const pedidos = await PedidoRepo.list({
    sucursalId,
    isAdmin: rol === "ADMIN_GENERAL",
    tipo:   searchParams.get("tipo"),
    estado: searchParams.get("estado"),
  });

  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as { id: number }).id;

  // Validar ítems: al menos 1, cantidad > 0
  const items: { cantidad?: number }[] = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "El pedido debe tener al menos un ítem." }, { status: 400 });
  }
  if (items.some((i) => !i.cantidad || i.cantidad <= 0)) {
    return NextResponse.json({ error: "La cantidad de cada ítem debe ser mayor a 0." }, { status: 400 });
  }

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const pedido = await PedidoService.create({ ...body, usuarioId: userId });

  // Notificar KDS en tiempo real
  const globalForSocket = global as unknown as { io?: import("socket.io").Server };
  try {
    if (sucursalId) {
      globalForSocket.io?.to(`sucursal_${sucursalId}_kds`).emit("pedido:nuevo", { id: pedido.id });
    }
  } catch { /* no bloquear */ }

  return NextResponse.json(pedido, { status: 201 });
}
