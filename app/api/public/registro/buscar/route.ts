import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/public/registro/buscar?telefono=XXXXXXXX&sucursalId=6
// Busca un cliente por teléfono para prellenar el formulario de registro
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono")?.trim();
  const sucursalId = searchParams.get("sucursalId");

  if (!telefono || !sucursalId) {
    return NextResponse.json({ encontrado: false });
  }

  // Normalizar: quitar +56, 56, espacios — queda solo los 8-9 dígitos finales
  const telLimpio = telefono.replace(/^\+?56\s*9?\s*/, "").replace(/\D/g, "");

  if (telLimpio.length < 7) {
    return NextResponse.json({ encontrado: false });
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      telefono: { contains: telLimpio },
      sucursalId: Number(sucursalId),
    },
    select: {
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      fechaNacimiento: true,
      genero: true,
      codigoCumple: true,
    },
  });

  if (!cliente) {
    return NextResponse.json({ encontrado: false });
  }

  return NextResponse.json({
    encontrado: true,
    cliente: {
      nombre: cliente.nombre ?? "",
      email: cliente.email ?? "",
      direccion: cliente.direccion ?? "",
      genero: cliente.genero ?? "",
      fechaNacimiento: cliente.fechaNacimiento
        ? cliente.fechaNacimiento.toISOString().slice(0, 10)
        : "",
      tieneCupon: !!cliente.codigoCumple,
    },
  });
}
