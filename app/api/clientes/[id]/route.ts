import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      direcciones: {
        orderBy: { id: "desc" },
      },
      ventas: {
        where: { estado: { in: ["PAGADA", "ANULADA"] } },
        orderBy: { creadoEn: "desc" },
        take: 50,
        select: {
          id:          true,
          numero:      true,
          total:       true,
          descuento:   true,
          metodoPago:  true,
          estado:      true,
          creadoEn:    true,
          detalles: {
            select: {
              nombre:    true,
              cantidad:  true,
              precio:    true,
              subtotal:  true,
              producto:  { select: { nombre: true } },
              combo:     { select: { nombre: true } },
            },
          },
        },
      },
    },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  // Control de acceso por sucursal
  if (rol !== "ADMIN_GENERAL" && sucursalId && cliente.sucursalId && cliente.sucursalId !== sucursalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Estadísticas rápidas
  const ventasPagadas = cliente.ventas.filter((v) => v.estado === "PAGADA");
  const totalGastado  = ventasPagadas.reduce((a, v) => a + Number(v.total), 0);
  const ticketPromedio = ventasPagadas.length ? totalGastado / ventasPagadas.length : 0;

  return NextResponse.json({
    ...cliente,
    stats: {
      totalCompras:   ventasPagadas.length,
      totalGastado,
      ticketPromedio,
      direccionesCount: cliente.direcciones.length,
    },
  });
}
