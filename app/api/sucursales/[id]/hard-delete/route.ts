import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL")
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const sucursal = await prisma.sucursal.findUnique({ where: { id } });
  if (!sucursal) return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      // ── Recolectar IDs ────────────────────────────────────────────
      const usuariosRaw = await tx.usuario.findMany({ where: { sucursalId: id }, select: { id: true } });
      const usuarioIds = usuariosRaw.map((u) => u.id);

      const cajasRaw = await tx.caja.findMany({ where: { sucursalId: id }, select: { id: true } });
      const cajaIds = cajasRaw.map((c) => c.id);

      const salasRaw = await tx.sala.findMany({ where: { sucursalId: id }, select: { id: true } });
      const salaIds = salasRaw.map((s) => s.id);

      const mesasRaw = await tx.mesa.findMany({ where: { salaId: { in: salaIds } }, select: { id: true } });
      const mesaIds = mesasRaw.map((m) => m.id);

      const estRaw = await tx.estacionamiento.findMany({ where: { sucursalId: id }, select: { id: true } });
      const estIds = estRaw.map((e) => e.id);

      const pedidosRaw = await tx.pedido.findMany({
        where: {
          OR: [
            { usuarioId: { in: usuarioIds } },
            { cajaId: { in: cajaIds } },
            { mesaId: { in: mesaIds } },
            { estacionamientoId: { in: estIds } },
            ...(sucursal.tenantId ? [{ tenantId: sucursal.tenantId }] : []),
          ],
        },
        select: { id: true },
      });
      const pedidoIds = pedidosRaw.map((p) => p.id);

      const ventasRaw = await tx.venta.findMany({
        where: {
          OR: [
            { pedidoId: { in: pedidoIds } },
            { cajaId: { in: cajaIds } },
            { usuarioId: { in: usuarioIds } },
          ],
        },
        select: { id: true },
      });
      const ventaIds = ventasRaw.map((v) => v.id);

      // ── PRESERVAR: desvincular carta y clientes ───────────────────
      // Limpiar referencias circulares de la sucursal a productos primero
      await tx.sucursal.update({
        where: { id },
        data: { productoMesId: null, productoDiaId: null, ofertaFugazId: null },
      });
      // Desvincular productos (carta) — se quedan en BD sin sucursal
      await tx.producto.updateMany({
        where: { sucursalId: id },
        data: { sucursalId: null },
      });
      // Desvincular clientes — se quedan en BD sin sucursal
      await tx.cliente.updateMany({
        where: { sucursalId: id },
        data: { sucursalId: null },
      });

      // ── BORRAR en orden seguro ────────────────────────────────────

      // Evaluaciones (FK requerida a Pedido)
      await tx.evaluacion.deleteMany({ where: { sucursalId: id } });

      // Cadena delivery: EventoDelivery → PedidoDelivery
      const deliveriesRaw = await tx.pedidoDelivery.findMany({
        where: { pedidoId: { in: pedidoIds } },
        select: { id: true },
      });
      const deliveryIds = deliveriesRaw.map((d) => d.id);
      await tx.eventoDelivery.deleteMany({ where: { pedidoDeliveryId: { in: deliveryIds } } });
      await tx.pedidoDelivery.deleteMany({ where: { id: { in: deliveryIds } } });

      // Kardex de ventas (los de ajuste de stock quedan ligados a los productos que se preservan)
      await tx.kardex.deleteMany({ where: { ventaId: { in: ventaIds } } });

      // Puntos de clientes generados por estas ventas
      await tx.movimientoPuntos.deleteMany({ where: { ventaId: { in: ventaIds } } });

      // Ventas (cascade: detallesVenta, pagosVenta)
      await tx.venta.deleteMany({ where: { id: { in: ventaIds } } });

      // Pedidos (cascade: detallesPedido, eventosPedido)
      await tx.pedido.deleteMany({ where: { id: { in: pedidoIds } } });

      // Cajas y sus dependencias
      await tx.arqueo.deleteMany({ where: { cajaId: { in: cajaIds } } });
      await tx.movimientoCaja.deleteMany({ where: { cajaId: { in: cajaIds } } });
      await tx.caja.deleteMany({ where: { sucursalId: id } });

      // RRHH
      await tx.sesionActividad.deleteMany({ where: { sucursalId: id } });
      await tx.asistencia.deleteMany({ where: { sucursalId: id } });
      await tx.permisoRrhh.deleteMany({ where: { sucursalId: id } });
      await tx.vacacion.deleteMany({ where: { sucursalId: id } });
      await tx.turno.deleteMany({ where: { sucursalId: id } });
      await tx.empleado.deleteMany({ where: { sucursalId: id } });
      await tx.departamento.deleteMany({ where: { sucursalId: id } });

      // Agente WhatsApp y su cadena
      const agente = await tx.agenteWsp.findUnique({ where: { sucursalId: id }, select: { id: true } });
      if (agente) {
        await tx.agenteEvento.deleteMany({ where: { agenteId: agente.id } });
        await tx.agenteCliente.deleteMany({ where: { agenteId: agente.id } }); // cascade: sesiones, direcciones, preferencias
        await tx.agenteWsp.delete({ where: { id: agente.id } });
      }

      // Eventos y sus tickets
      const eventosRaw = await tx.evento.findMany({ where: { sucursalId: id }, select: { id: true } });
      const eventoIds = eventosRaw.map((e) => e.id);
      await tx.ticketEvento.deleteMany({ where: { eventoId: { in: eventoIds } } });
      await tx.evento.deleteMany({ where: { sucursalId: id } });

      // Logs de usuarios
      await tx.log.deleteMany({ where: { usuarioId: { in: usuarioIds } } });

      // Repartidores ligados a usuarios
      await tx.repartidor.deleteMany({ where: { usuarioId: { in: usuarioIds } } });

      // Cupones
      await tx.cupon.deleteMany({ where: { sucursalId: id } });

      // Ingredientes
      await tx.ingrediente.deleteMany({ where: { sucursalId: id } });

      // Usuarios
      await tx.usuario.deleteMany({ where: { sucursalId: id } });

      // Salas (Mesas en cascade)
      await tx.sala.deleteMany({ where: { sucursalId: id } });

      // Estacionamientos
      await tx.estacionamiento.deleteMany({ where: { sucursalId: id } });

      // Sucursal
      await tx.sucursal.delete({ where: { id } });
    }, { timeout: 30000 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("hard-delete sucursal:", err);
    return NextResponse.json({ error: "Error al eliminar la sucursal" }, { status: 500 });
  }
}
