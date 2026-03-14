import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono");
  const sucursalId = searchParams.get("sucursalId");

  if (!telefono || !sucursalId) {
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });
  }

  // Sanitizar teléfono para dejar solo números (opcional, pero buena práctica)
  const limpio = telefono.replace(/\D/g, "");
  
  // Buscar cliente por teléfono exacto en la sucursal
  const cliente = await prisma.cliente.findFirst({
    where: {
      telefono: { endsWith: limpio.slice(-8) }, // Buscar coincidencia flexible de los ultimos 8 digitos
      sucursalId: Number(sucursalId),
      activo: true,
    },
    include: {
      direcciones: {
        take: 1,
        orderBy: { id: "desc" }, // Tomar la ultima direccion insertada
      }
    }
  });

  if (!cliente) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json({
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    direccion: cliente.direcciones[0]?.calle || cliente.direccion || "",
    referencia: cliente.direcciones[0]?.referencia || "",
  });
}
