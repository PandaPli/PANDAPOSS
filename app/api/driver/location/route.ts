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

  // Emitir por socket para que el restaurante y cliente vean la ubicación en tiempo real
  const globalForSocket = global as unknown as { io?: import("socket.io").Server };
  try {
    globalForSocket.io?.emit("driver:location", { riderId: userId, lat, lng, ts: Date.now() });
  } catch {
    // No bloquear si el socket falla
  }

  return NextResponse.json({ ok: true });
}
