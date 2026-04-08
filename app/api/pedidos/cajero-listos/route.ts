import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const pedidos = await prisma.pedido.findMany({
    where: {
      meseroLlamado: true,
      llamadoTipo: "CAJERO",
      estado: "LISTO",
      ...(sucursalId ? { usuario: { sucursalId } } : {}),
    },
    select: {
      id: true,
      numero: true,
      observacion: true,
      telefonoCliente: true,
    },
    orderBy: { listoEn: "desc" },
    take: 10,
  });

  return NextResponse.json(
    pedidos.map((p) => {
      // Intentar extraer nombre del cliente de la observacion
      let clienteNombre: string | null = null;
      if (p.observacion) {
        const match = p.observacion.match(/Cliente:\s*([^,\n|]+)/i);
        if (match) clienteNombre = match[1].replace(/\(.*?\)/, "").trim();
      }
      if (!clienteNombre && p.telefonoCliente) clienteNombre = p.telefonoCliente;
      return { id: p.id, numero: p.numero, clienteNombre };
    })
  );
}
