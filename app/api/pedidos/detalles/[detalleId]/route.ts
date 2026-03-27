import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/pedidos/detalles/[detalleId]
 * Actualiza un ítem individual del pedido (cancelado, cantidad, observacion, grupo, pagado).
 * El KDS se actualizará en el próximo polling (cada 30s).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ detalleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { detalleId } = await params;
  const id = Number(detalleId);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const rol        = (session.user as { rol?: string }).rol;
  const sucursalId = (session.user as { sucursalId?: number | null }).sucursalId;

  // Verificar que el detalle pertenece a la sucursal del usuario (evita cross-sucursal)
  if (rol !== "ADMIN_GENERAL" && sucursalId) {
    const detalle = await prisma.detallePedido.findUnique({
      where: { id },
      select: { pedido: { select: { mesa: { select: { sala: { select: { sucursalId: true } } } } } } },
    });
    const detalleSucursalId = detalle?.pedido?.mesa?.sala?.sucursalId;
    if (detalleSucursalId && detalleSucursalId !== sucursalId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const body = await req.json() as {
    cancelado?: boolean;
    cantidad?: number;
    observacion?: string | null;
    grupo?: string | null;
    pagado?: boolean;
    compartido?: boolean;
    participantes?: string[] | null;
  };

  // Validaciones básicas
  if (body.cantidad !== undefined && body.cantidad < 1) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.cancelado !== undefined)     data.cancelado     = body.cancelado;
  if (body.cantidad !== undefined)      data.cantidad      = body.cantidad;
  if (body.observacion !== undefined)   data.observacion   = body.observacion;
  if (body.grupo !== undefined)         data.grupo         = body.grupo;
  if (body.pagado !== undefined)        data.pagado        = body.pagado;
  if (body.compartido !== undefined)    data.compartido    = body.compartido;
  if (body.participantes !== undefined) data.participantes = body.participantes;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const detalleAntes = await prisma.detallePedido.findUnique({
    where: { id },
    select: { pedidoId: true, cancelado: true, cantidad: true, producto: { select: { nombre: true } }, combo: { select: { nombre: true } } },
  });

  const detalle = await prisma.detallePedido.update({
    where: { id },
    data,
    include: {
      producto: { select: { nombre: true } },
      combo:    { select: { nombre: true } },
    },
  });

  // Auditoría de cancelación o modificación
  if (detalleAntes && (body.cancelado !== undefined || body.cantidad !== undefined)) {
    const nombreItem = detalleAntes.producto?.nombre ?? detalleAntes.combo?.nombre ?? "ítem";
    const usuarioId  = (session.user as { id?: number }).id ?? null;
    let desc = "";
    if (body.cancelado && !detalleAntes.cancelado) desc = `Cancelado: "${nombreItem}"`;
    else if (body.cantidad !== undefined && body.cantidad !== detalleAntes.cantidad)
      desc = `Cantidad "${nombreItem}": ${detalleAntes.cantidad} → ${body.cantidad}`;
    if (desc) {
      await prisma.eventoPedido.create({
        data: { pedidoId: detalleAntes.pedidoId, usuarioId: Number(usuarioId) || null, tipo: "ITEM", descripcion: desc },
      }).catch(() => {});
    }
  }

  return NextResponse.json(detalle);
}
