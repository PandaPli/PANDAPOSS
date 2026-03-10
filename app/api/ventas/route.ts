import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { VentaRepo } from "@/server/repositories/venta.repo";
import { VentaService } from "@/server/services/venta.service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const page  = Number(searchParams.get("page")  ?? 1);

  const { ventas, total } = await VentaRepo.list({
    sucursalId,
    isAdmin: rol === "ADMIN_GENERAL",
    limit,
    skip: (page - 1) * limit,
  });

  return NextResponse.json({ ventas, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  if (!body.items?.length) {
    return NextResponse.json({ error: "El carrito esta vacio" }, { status: 400 });
  }

  try {
    const venta = await VentaService.create({
      cajaId:    body.cajaId    ? Number(body.cajaId)    : null,
      clienteId: body.clienteId ? Number(body.clienteId) : null,
      usuarioId: Number(body.usuarioId),
      pedidoId:  body.pedidoId  ? Number(body.pedidoId)  : null,
      mesaId:    body.mesaId    ? Number(body.mesaId)    : null,
      items:     body.items,
      subtotal:  Number(body.subtotal),
      descuento: Number(body.descuento ?? 0),
      impuesto:  Number(body.impuesto  ?? 0),
      total:     Number(body.total),
      metodoPago: body.metodoPago,
      pagos:     body.pagos,
    });
    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ventas]", error);
    const message = error instanceof Error ? error.message : "Error interno al registrar la venta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
