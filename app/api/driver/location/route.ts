import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// PATCH /api/driver/location — actualiza posición GPS del rider
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "DELIVERY") return NextResponse.json({ error: "Solo para repartidores" }, { status: 403 });

  const userId = (session.user as { id: number }).id;
  const body = await req.json();
  const { lat, lng } = body as { lat: number; lng: number };

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat y lng requeridos" }, { status: 400 });
  }

  await prisma.repartidor.upsert({
    where: { usuarioId: userId },
    update: { lat, lng, estado: "EN_RUTA" },
    create: {
      usuarioId: userId,
      vehiculo: "No especificado",
      lat,
      lng,
      estado: "EN_RUTA",
    },
  });

  // Buscar pedidos activos del rider para emitir solo a las rooms correctas
  // (estados en los que aún tiene sentido trackear la ubicación)
  const pedidosActivos = await prisma.pedido.findMany({
    where: {
      repartidorId: userId,
      estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
    },
    select: { id: true, usuario: { select: { sucursalId: true } } },
  });

  const orderIds = pedidosActivos.map((p) => p.id);
  const sucursalIds = Array.from(
    new Set(pedidosActivos.map((p) => p.usuario?.sucursalId).filter((id): id is number => typeof id === "number"))
  );

  // Emitir por socket a rooms específicos (evita broadcast global)
  const globalForSocket = global as unknown as { io?: import("socket.io").Server };
  try {
    const payload = { riderId: userId, lat, lng, ts: Date.now(), orderIds };
    const io = globalForSocket.io;
    if (io) {
      // Despacho de cada sucursal con pedidos activos del rider
      for (const sId of sucursalIds) {
        io.to(`tenant_${sId}_dispatch`).emit("driver:location:update", payload);
      }
      // Cliente final de cada pedido en tracking
      for (const oId of orderIds) {
        io.to(`order_${oId}_track`).emit("driver:location:update", payload);
      }
    }
  } catch {
    // No bloquear si el socket falla
  }

  return NextResponse.json({ ok: true });
}
