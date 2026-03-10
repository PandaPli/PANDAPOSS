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

  const pedido = await PedidoService.create({ ...body, usuarioId: userId });
  return NextResponse.json(pedido, { status: 201 });
}
