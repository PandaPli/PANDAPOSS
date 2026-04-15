import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PedidoService } from "@/server/services/pedido.service";

interface KioskoItem {
  productoId: number;
  cantidad: number;
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
      tipo: "MOSTRADOR",
      items: (items as KioskoItem[]).map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        observacion: i.observacion ?? null,
      })),
      observacion: obs,
    });

    // Si es pago por Mercado Pago, marcamos el pedido como "pending_payment".
    // El repo de pedidos filtra estos pedidos del KDS hasta que el webhook
    // de MP los marque como "approved". Si se rechazan, el webhook los cancela.
    if (esPagoMP) {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { mpStatus: "pending_payment" },
      });
    }

    return NextResponse.json({ id: pedido.id, numero: pedido.numero }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
