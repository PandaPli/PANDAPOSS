import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

function isAdmin(rol: Rol) {
  return rol === "ADMIN_GENERAL";
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!isAdmin(rol)) return NextResponse.json({ error: "Sin permisos para reordenar" }, { status: 403 });

  try {
    const body = await req.json();
    const { orderIds } = body; // Array of IDs in the new order, e.g. [3, 1, 2]

    if (!Array.isArray(orderIds)) {
      return NextResponse.json({ error: "Faltan los IDs o formato incorrecto" }, { status: 400 });
    }

    // Process all updates in a single transaction
    await prisma.$transaction(
      orderIds.map((id, index) =>
        prisma.sucursal.update({
          where: { id: Number(id) },
          data: { orden: index },
        })
      )
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al reordenar sucursales:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
