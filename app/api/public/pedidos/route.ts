import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PedidoService } from "@/server/services/pedido.service";
import { effectiveFeature } from "@/lib/plan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sucursalId, mesaId, items, clienteInfo } = body;

    // 1. Basic Validation
    if (!sucursalId || !mesaId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Faltan datos obligatorios para crear el pedido" }, { status: 400 });
    }

    // 2. Security / Integrity Check
    const [sucursal, mesa] = await Promise.all([
      prisma.sucursal.findUnique({
        where: { id: Number(sucursalId) },
        select: { activa: true, menuQR: true, plan: true }
      }),
      prisma.mesa.findFirst({
        where: { id: Number(mesaId), sala: { sucursalId: Number(sucursalId) } },
        select: { id: true }
      })
    ]);

    if (!sucursal || !sucursal.activa || !effectiveFeature(sucursal.plan, sucursal.menuQR)) {
      return NextResponse.json({ error: "Esta sucursal no tiene habilitado el menú QR o no está activa." }, { status: 403 });
    }

    if (!mesa) {
      return NextResponse.json({ error: "La mesa indicada no es válida para esta sucursal." }, { status: 404 });
    }

    // 3. Create the order using PedidoService (business logic)
    // We pass a generic system user/waiter or look for one, or bypass if not strictly required
    // PedidoService might require 'usuarioId'. 
    // Usually POS systems leave 'usuarioId' null for self-orders or assign a "Virtual Waiter" ID.
    // Let's find an active WAITER or ADMIN to anchor the order to, or use a system configured approach.
    const systemUser = await prisma.usuario.findFirst({
      where: { sucursalId: Number(sucursalId), status: "ACTIVO" }
    });

    if (!systemUser) {
      return NextResponse.json({ error: "No hay personal activo en la sucursal para recepcionar." }, { status: 500 });
    }

    // Calcular subtotal (trust frontend for visual total, but better approach is to recalculate, 
    // for now we trust `items` price/cantidad or handle it securely later if exact payment applies)
    let totalCalculado = 0;
    for (const item of items) {
      totalCalculado += (Number(item.precio) * Number(item.cantidad));
    }

    // Las observaciones del cliente entran en el pedido
    const observacionCliente = clienteInfo?.nombre ? `Cliente: ${clienteInfo.nombre}` : "";

    const pedido = await PedidoService.create({
      tipo: "COCINA",
      mesaId: mesa.id,
      usuarioId: systemUser.id, // Mandatory by schema
      cajaId: null,
      observacion: observacionCliente,
      items: items.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        observacion: item.notas || item.observacion
      }))
    });

    // 4. Also mark table as OCUPADA automatically if requested
    await prisma.mesa.update({
      where: { id: mesa.id },
      data: { estado: "OCUPADA" }
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error("[POST /api/public/pedidos]", error);
    const message = error instanceof Error ? error.message : "Error interno al procesar el pedido QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
