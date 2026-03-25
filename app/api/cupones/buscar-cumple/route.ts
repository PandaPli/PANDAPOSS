import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// GET /api/cupones/buscar-cumple?codigo=XXX
// Busca un cliente por su codigoCumple y retorna su fecha de nacimiento
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const codigo = req.nextUrl.searchParams.get("codigo")?.trim().toUpperCase();
  if (!codigo) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const where =
    rol === "ADMIN_GENERAL"
      ? { codigoCumple: codigo }
      : { codigoCumple: codigo, sucursalId: sucursalId! };

  const cliente = await prisma.cliente.findFirst({
    where,
    select: {
      id: true,
      nombre: true,
      telefono: true,
      fechaNacimiento: true,
      codigoCumple: true,
      activo: true,
    },
  });

  if (!cliente) {
    return NextResponse.json({ encontrado: false }, { status: 404 });
  }

  // ¿Hoy es su cumpleaños?
  let esCumpleHoy = false;
  if (cliente.fechaNacimiento) {
    const hoy = new Date();
    const cumple = new Date(cliente.fechaNacimiento);
    esCumpleHoy =
      hoy.getDate() === cumple.getDate() && hoy.getMonth() === cumple.getMonth();
  }

  return NextResponse.json({
    encontrado: true,
    cliente: {
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento
        ? cliente.fechaNacimiento.toISOString().slice(0, 10)
        : null,
      activo: cliente.activo,
    },
    esCumpleHoy,
  });
}
