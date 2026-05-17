import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PedidoService } from "@/server/services/pedido.service";
import { VentaService } from "@/server/services/venta.service";
import { prisma } from "@/lib/db";
import type { MetodoPago } from "@/types";

const METODOS_PAGO_VALIDOS: MetodoPago[] = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO", "MIXTO"];
function toMetodoPago(m?: string): MetodoPago {
  return METODOS_PAGO_VALIDOS.includes(m as MetodoPago) ? (m as MetodoPago) : "EFECTIVO";
}

interface LlevarItem {
  productoId: number;
  cantidad: number;
  precio?: number;
  opciones?: { grupoId: number; grupoNombre: string; opcionId: number; opcionNombre: string; precio: number }[];
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id?: number })?.id;
  if (!userId) return NextResponse.json({ error: "Sin usuario" }, { status: 401 });
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const body = await req.json();
  const {
    items,
    nombreCliente,
    horaRetiro,
    clienteId,
    metodoPago,
    descuento,
    cuponId,
    cuponCodigo,
  } = body as {
    items: LlevarItem[];
    nombreCliente: string;
    horaRetiro?: string;
    clienteId?: number;
    metodoPago?: string;
    descuento?: number;
    cuponId?: number;
    cuponCodigo?: string;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Se requiere al menos un producto" }, { status: 400 });
  }
  if (!nombreCliente?.trim()) {
    return NextResponse.json({ error: "Se requiere el nombre del cliente" }, { status: 400 });
  }

  // Obtener caja abierta de la sucursal para vincular pedido y venta a cuadratura
  const cajaAbierta = sucursalId
    ? await prisma.caja.findFirst({
        where: { estado: "ABIERTA", sucursalId },
        select: { id: true },
        orderBy: { abiertaEn: "desc" },
      })
    : null;

  const obs = [
    "🥡 PARA LLEVAR",
    `👤 ${nombreCliente.trim()}`,
    horaRetiro ? `🕐 ${horaRetiro}` : null,
    metodoPago ? `💳 ${metodoPago}` : null,
    descuento && descuento > 0 ? `🏷️ DESC:${descuento}` : null,
    cuponCodigo ? `🎟️ ${cuponCodigo}` : null,
    clienteId ? `🆔 ${clienteId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  try {
    const pedido = await PedidoService.create({
      usuarioId: userId,
      cajaId: cajaAbierta?.id ?? undefined,
      tipo: "MOSTRADOR",
      items: items.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precio: i.precio ?? undefined,
        opciones: i.opciones ?? undefined,
      })),
      observacion: obs,
    });

    // Incrementar uso del cupón si aplica
    if (cuponId && cuponId > 0) {
      await prisma.cupon.update({
        where: { id: cuponId },
        data: { usoActual: { increment: 1 } },
      }).catch(() => { /* no bloquear si falla */ });
    }

    // ── Registrar Venta (siempre) para cuadratura de caja y puntos ──────────
    try {
      const detalles = await prisma.detallePedido.findMany({
        where: { pedidoId: pedido.id },
        select: { productoId: true, comboId: true, cantidad: true, precio: true },
      });
      const subtotal = detalles.reduce((acc, d) => acc + Number(d.precio ?? 0) * d.cantidad, 0);
      const desc = descuento && descuento > 0 ? descuento : 0;
      const totalVenta = Math.max(0, subtotal - desc);
      const metodo = toMetodoPago(metodoPago);

      await VentaService.create({
        cajaId: cajaAbierta?.id ?? null,
        clienteId: clienteId && clienteId > 0 ? clienteId : undefined,
        usuarioId: userId,
        sucursalId,
        pedidoId: pedido.id,
        items: detalles.map((d) => ({
          productoId: d.productoId ?? undefined,
          comboId: d.comboId ?? undefined,
          precio: Number(d.precio ?? 0),
          cantidad: d.cantidad,
          subtotal: Number(d.precio ?? 0) * d.cantidad,
        })),
        subtotal,
        descuento: desc,
        impuesto: 0,
        total: totalVenta,
        metodoPago: metodo,
        pagos: [{ metodoPago: metodo, monto: totalVenta }],
      });
    } catch { /* no bloquear respuesta si falla */ }

    // Notificar KDS en tiempo real
    const globalForSocket = global as unknown as { io?: import("socket.io").Server };
    try {
      if (sucursalId) {
        globalForSocket.io?.to(`sucursal_${sucursalId}_kds`).emit("pedido:nuevo", { id: pedido.id });
      }
    } catch { /* no bloquear */ }

    return NextResponse.json({ id: pedido.id, numero: pedido.numero, clienteId: clienteId ?? null }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
