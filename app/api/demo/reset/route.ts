import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEMO_SUCURSAL_ID = 5;

/**
 * POST /api/demo/reset
 * Borra todos los datos transaccionales de la sucursal demo (ID 5).
 * Acceso: ADMIN_GENERAL desde sesión, o cron interno con CRON_SECRET header.
 * Conserva: productos, categorías, salas, mesas (solo resetea estado), usuarios.
 */
export async function POST(req: NextRequest) {
  // Autenticación: sesión admin O cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret) {
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else {
    const session = await getServerSession(authOptions);
    const rol = (session?.user as { rol?: string })?.rol;
    if (!session || rol !== "ADMIN_GENERAL") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  // 1. Obtener IDs de cajas y mesas vinculadas a la sucursal demo
  const cajas = await prisma.caja.findMany({
    where: { sucursalId: DEMO_SUCURSAL_ID },
    select: { id: true },
  });
  const cajaIds = cajas.map((c) => c.id);

  const salas = await prisma.sala.findMany({
    where: { sucursalId: DEMO_SUCURSAL_ID },
    select: { mesas: { select: { id: true } } },
  });
  const mesaIds = salas.flatMap((s) => s.mesas.map((m) => m.id));

  // 2. IDs de ventas a eliminar (por caja demo o usuario demo ID=13)
  const ventas = await prisma.venta.findMany({
    where: {
      OR: [
        { cajaId: { in: cajaIds } },
        { usuarioId: 13 },
      ],
    },
    select: { id: true },
  });
  const ventaIds = ventas.map((v) => v.id);

  // 3. Borrar en orden para respetar FK
  await prisma.$transaction(async (tx) => {
    // Kardex referencia ventas → borrar primero
    if (ventaIds.length > 0) {
      await tx.kardex.deleteMany({ where: { ventaId: { in: ventaIds } } });
    }

    // Ventas (cascade DetalleVenta + PagoVenta)
    if (ventaIds.length > 0) {
      await tx.venta.deleteMany({ where: { id: { in: ventaIds } } });
    }

    // Pedidos (cascade DetallePedido)
    await tx.pedido.deleteMany({
      where: {
        OR: [
          ...(cajaIds.length > 0 ? [{ cajaId: { in: cajaIds } }] : []),
          ...(mesaIds.length > 0 ? [{ mesaId: { in: mesaIds } }] : []),
          { usuarioId: 13 },
        ],
      },
    });

    // Arqueos y movimientos de caja
    if (cajaIds.length > 0) {
      await tx.arqueo.deleteMany({ where: { cajaId: { in: cajaIds } } });
      await tx.movimientoCaja.deleteMany({ where: { cajaId: { in: cajaIds } } });

      // Resetear cajas a CERRADA
      await tx.caja.updateMany({
        where: { id: { in: cajaIds } },
        data: {
          estado: "CERRADA",
          abiertaEn: null,
          cerradaEn: null,
          saldoInicio: 0,
          usuarioId: null,
        },
      });
    }

    // Resetear mesas a LIBRE
    if (mesaIds.length > 0) {
      await tx.mesa.updateMany({
        where: { id: { in: mesaIds } },
        data: { estado: "LIBRE" },
      });
    }

    // Eliminar clientes creados en la sucursal demo
    await tx.cliente.deleteMany({
      where: { sucursalId: DEMO_SUCURSAL_ID },
    });

    // Limpiar logs del usuario demo
    await tx.log.deleteMany({ where: { usuarioId: 13 } });
  });

  return NextResponse.json({
    ok: true,
    mensaje: "Demo reseteada correctamente",
    sucursalId: DEMO_SUCURSAL_ID,
    timestamp: new Date().toISOString(),
  });
}
