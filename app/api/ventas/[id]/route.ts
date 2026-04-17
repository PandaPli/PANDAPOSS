import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VentaService } from "@/server/services/venta.service";
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
      pagos: { select: { metodoPago: true, monto: true } },
      caja: { select: { nombre: true, sucursal: { select: { nombre: true, simbolo: true, logoUrl: true } } } },
      pedido: { select: { mesa: { select: { nombre: true } } } },
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

// ── A1: Anular venta ─────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // Solo ADMIN_GENERAL y RESTAURANTE pueden anular ventas
  if (!["ADMIN_GENERAL", "RESTAURANTE"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos para anular ventas" }, { status: 403 });
  }

  const { id } = await params;
  const ventaId = Number(id);
  if (!ventaId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();

  // ── Toggle boleta emitida ────────────────────────────────────────────────
  if (body.accion === "TOGGLE_BOLETA") {
    // Cualquier rol operativo puede marcar/desmarcar boleta
    if (!["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"].includes(rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      select: { boletaEmitida: true },
    });
    if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    const updated = await prisma.venta.update({
      where: { id: ventaId },
      data: { boletaEmitida: !venta.boletaEmitida },
      select: { boletaEmitida: true },
    });
    return NextResponse.json({ ok: true, boletaEmitida: updated.boletaEmitida });
  }

  if (body.accion !== "ANULAR") {
    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  }

  // Verificar que la venta pertenece a la sucursal del usuario
  if (rol !== "ADMIN_GENERAL" && sucursalId) {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      select: { caja: { select: { sucursalId: true } } },
    });
    if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    if (venta.caja && venta.caja.sucursalId !== sucursalId) {
      return NextResponse.json({ error: "Sin acceso a esta venta" }, { status: 403 });
    }
  }

  try {
    const result = await VentaService.anular(ventaId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al anular la venta" }, { status: 500 });
  }
}
