import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { VentaRepo } from "@/server/repositories/venta.repo";
import { VentaService } from "@/server/services/venta.service";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const page = Number(searchParams.get("page") ?? 1);

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

  const usuarioId = (session.user as { id: number }).id;
  const rol = (session.user as { rol: Rol }).rol;

  // C1: Caja obligatoria — verificar que existe y está ABIERTA
  // ADMIN_GENERAL puede omitirla (ventas de backoffice/corrección)
  if (rol !== "ADMIN_GENERAL") {
    if (!body.cajaId) {
      return NextResponse.json(
        { error: "Debes abrir una caja antes de registrar una venta." },
        { status: 400 }
      );
    }
    const caja = await prisma.caja.findUnique({
      where: { id: Number(body.cajaId) },
      select: { estado: true },
    });
    if (!caja || caja.estado !== "ABIERTA") {
      return NextResponse.json(
        { error: "La caja seleccionada no está abierta. Abre una caja primero." },
        { status: 400 }
      );
    }
  }

  try {
    const venta = await VentaService.create({
      cajaId: body.cajaId ? Number(body.cajaId) : null,
      clienteId: body.clienteId ? Number(body.clienteId) : null,
      usuarioId,
      pedidoId: body.pedidoId ? Number(body.pedidoId) : null,
      mesaId: body.mesaId ? Number(body.mesaId) : null,
      items: body.items,
      subtotal: Number(body.subtotal),
      descuento: Number(body.descuento ?? 0),
      impuesto: Number(body.impuesto ?? 0),
      total: Number(body.total),
      metodoPago: body.metodoPago,
      pagos: body.pagos,
      detalleIds: body.detalleIds ?? undefined,
      modoGrupo: body.modoGrupo ?? false,
      cuponId: body.cuponId ? Number(body.cuponId) : null,
      cuponCodigo: body.cuponCodigo ?? null,
    });
    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ventas]", error);

    if (error instanceof Error) {
      const status = error.message.includes("ya fue cobrada") ? 409 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "La orden ya fue cobrada. Recarga la mesa para continuar." }, { status: 409 });
    }

    return NextResponse.json({ error: "Error interno al registrar la venta" }, { status: 500 });
  }
}
