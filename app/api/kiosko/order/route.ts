import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PedidoService } from "@/server/services/pedido.service";
import { VentaService } from "@/server/services/venta.service";

interface KioskoItem {
  productoId: number;
  cantidad: number;
  precio?: number;
  opciones?: { grupoId: number; grupoNombre: string; opcionId: number; opcionNombre: string; precio: number }[];
  observacion?: string;
}

// POST /api/kiosko/order — público, sin sesión
// Crea un pedido de tipo MOSTRADOR que aparece en KDS.
//
// Si metodoPago = "mercadopago", el pedido se crea con mpStatus="pending_payment"
// y NO aparece en el KDS hasta que el webhook de MP lo marque como "approved".
// Si el pago se rechaza/cancela, el webhook cancela el pedido automaticamente.
// Esto evita que la cocina prepare pedidos sin pago confirmado.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sucursalId, items, nombreCliente, tipoConsumo, metodoPago } = body;
  const esPagoMP = metodoPago === "mercadopago";

  if (!sucursalId || !items?.length) {
    return NextResponse.json({ error: "sucursalId e items requeridos" }, { status: 400 });
  }

  // Verificar que la sucursal existe y está activa
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: Number(sucursalId) },
    select: { id: true, activa: true },
  });

  if (!sucursal || !sucursal.activa) {
    return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
  }

  // Verificar caja abierta — sin caja el local está cerrado
  const cajaAbierta = await prisma.caja.findFirst({
    where: { sucursalId: sucursal.id, estado: "ABIERTA" },
    select: { id: true },
  });
  if (!cajaAbierta) {
    return NextResponse.json({ error: "El local no está recibiendo pedidos en este momento." }, { status: 409 });
  }

  // Obtener el usuario sistema de la sucursal (primer RESTAURANTE o ADMIN)
  const sistemaUser = await prisma.usuario.findFirst({
    where: {
      sucursalId: sucursal.id,
      rol: { in: ["RESTAURANTE", "ADMIN_GENERAL"] },
      status: "ACTIVO",
    },
    select: { id: true },
  });

  if (!sistemaUser) {
    return NextResponse.json({ error: "No hay usuario de sistema configurado" }, { status: 500 });
  }

  const obs = [
    tipoConsumo === "llevar" ? "🥡 PARA LLEVAR" : "🍽️ COMER AQUÍ",
    nombreCliente ? `👤 ${nombreCliente}` : null,
    "📟 KIOSKO",
  ]
    .filter(Boolean)
    .join(" · ");

  try {
    const pedido = await PedidoService.create({
      usuarioId: sistemaUser.id,
      cajaId: cajaAbierta.id, // Anclar pedido a la caja activa para que la venta siempre aparezca en el turno correcto
      tipo: "MOSTRADOR",
      items: (items as KioskoItem[]).map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precio: i.precio ?? undefined,
        opciones: i.opciones ?? undefined,
        observacion: i.observacion ?? null,
      })),
      observacion: obs,
    });

    if (esPagoMP) {
      // Pago MP: marcar como pending_payment.
      // La venta se registrará cuando el webhook confirme el pago aprobado.
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { mpStatus: "pending_payment" },
      });
    } else {
      // Pago en caja (EFECTIVO): registrar venta inmediatamente vinculada a la caja activa.
      // Esto garantiza que el dinero del kiosko aparezca en el resumen del turno.
      try {
        const detalles = await prisma.detallePedido.findMany({
          where: { pedidoId: pedido.id },
          select: { productoId: true, comboId: true, cantidad: true, precio: true },
        });
        const subtotal = detalles.reduce((acc, d) => acc + Number(d.precio ?? 0) * d.cantidad, 0);

        await VentaService.create({
          cajaId: cajaAbierta.id,
          usuarioId: sistemaUser.id,
          sucursalId: sucursal.id,
          pedidoId: pedido.id,
          items: detalles.map((d) => ({
            productoId: d.productoId ?? undefined,
            comboId:    d.comboId    ?? undefined,
            precio:     Number(d.precio ?? 0),
            cantidad:   d.cantidad,
            subtotal:   Number(d.precio ?? 0) * d.cantidad,
          })),
          subtotal,
          descuento:  0,
          impuesto:   0,
          total:      subtotal,
          metodoPago: "EFECTIVO",
          pagos: [{ metodoPago: "EFECTIVO", monto: subtotal }],
        });
      } catch (ventaErr) {
        // No bloquear — el pedido ya fue creado correctamente.
        // El operador puede registrar la venta manualmente si es necesario.
        console.error("[kiosko/order] Error al registrar venta:", ventaErr);
      }
    }

    // Emitir al KDS solo cuando el pedido ya está listo para preparar.
    // Para MP, el pedido tiene estado "pending_payment" y NO debe aparecer en KDS
    // hasta que el webhook confirme el pago (el webhook emitirá después).
    if (!esPagoMP) {
      const globalForSocket = global as unknown as { io?: import("socket.io").Server };
      try {
        globalForSocket.io
          ?.to(`sucursal_${sucursal.id}_kds`)
          .emit("pedido:nuevo", { id: pedido.id });
      } catch { /* no bloquear */ }
    }

    return NextResponse.json({ id: pedido.id, numero: pedido.numero }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
