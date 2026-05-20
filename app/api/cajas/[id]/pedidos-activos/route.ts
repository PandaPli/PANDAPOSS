import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ESTADOS_ACTIVOS = ["PENDIENTE", "EN_PROCESO", "LISTO"] as const;

async function getSucursalId(cajaId: number) {
  const caja = await prisma.caja.findUnique({
    where: { id: cajaId },
    select: { sucursalId: true },
  });
  return caja?.sucursalId ?? null;
}

function buildWhere(sucursalId: number | null) {
  return {
    estado: { in: [...ESTADOS_ACTIVOS] as never[] },
    venta: null,
    ...(sucursalId
      ? {
          OR: [
            { caja: { sucursalId } },
            { mesa: { sala: { sucursalId } } },
            { usuario: { sucursalId } },
            { delivery: { cliente: { sucursalId } } },
          ],
        }
      : {}),
  };
}

/** GET /api/cajas/[id]/pedidos-activos
 *  Devuelve los pedidos activos de la sucursal de esta caja. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const cajaId = Number(id);
  const sucursalId = await getSucursalId(cajaId);

  // Tenant isolation: verificar que la caja pertenece a la sucursal del usuario
  const rol = (session.user as { rol: string }).rol;
  if (rol !== "ADMIN_GENERAL") {
    const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;
    if (!sucursalId || sucursalId !== userSucursalId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const pedidos = await prisma.pedido.findMany({
    where: buildWhere(sucursalId),
    select: {
      id: true,
      tipo: true,
      estado: true,
      mesaId: true,
      mesa: { select: { nombre: true } },
      detalles: { select: { id: true } },
      creadoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json(pedidos);
}

/** DELETE /api/cajas/[id]/pedidos-activos
 *  Cancela todos los pedidos activos de la sucursal y libera las mesas afectadas.
 *  ACCIÓN IRREVERSIBLE — solo se invoca tras confirmación explícita del usuario. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // P5: Solo ADMIN_GENERAL y RESTAURANTE pueden cancelar masivamente pedidos
  const rol = (session.user as { rol: string }).rol;
  if (!["ADMIN_GENERAL", "RESTAURANTE"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos para cancelar pedidos masivamente" }, { status: 403 });
  }

  const { id } = await params;
  const cajaId = Number(id);
  const sucursalId = await getSucursalId(cajaId);

  // P5: Validar que la caja pertenece a la sucursal del usuario
  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  if (rol !== "ADMIN_GENERAL" && userSucursalId && sucursalId !== userSucursalId) {
    return NextResponse.json({ error: "No autorizado para esta sucursal" }, { status: 403 });
  }

  // Leer IDs antes de cancelar para poder liberar mesas
  const pedidos = await prisma.pedido.findMany({
    where: buildWhere(sucursalId),
    select: { id: true, mesaId: true },
  });

  if (pedidos.length === 0) {
    return NextResponse.json({ cancelados: 0, mesasLiberadas: 0 });
  }

  const ids = pedidos.map((p) => p.id);
  const mesaIds = [
    ...new Set(pedidos.map((p) => p.mesaId).filter((id): id is number => id !== null)),
  ];

  // Cancelar todos los pedidos activos
  await prisma.pedido.updateMany({
    where: { id: { in: ids } },
    data: { estado: "CANCELADO" },
  });

  // Liberar las mesas (LIBRE)
  if (mesaIds.length > 0) {
    await prisma.mesa.updateMany({
      where: { id: { in: mesaIds } },
      data: { estado: "LIBRE" },
    });
  }

  return NextResponse.json({ cancelados: ids.length, mesasLiberadas: mesaIds.length });
}
