import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { id } = await params;
  const ventaId = Number(id);
  if (!ventaId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
    include: {
      cliente:  { select: { nombre: true, telefono: true } },
      usuario:  { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true, imagen: true } },
          combo:    { select: { nombre: true } },
        },
        orderBy: { id: "asc" },
      },
      caja: { select: { nombre: true, sucursal: { select: { nombre: true } } } },
    },
  });

  if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  // Verificar acceso por sucursal
  if (rol !== "ADMIN_GENERAL" && sucursalId && venta.caja?.sucursal) {
    const ventaSucursalId = await prisma.caja
      .findUnique({ where: { id: venta.cajaId! }, select: { sucursalId: true } })
      .then((c) => c?.sucursalId);
    if (ventaSucursalId !== sucursalId) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }
  }

  return NextResponse.json(venta);
}
