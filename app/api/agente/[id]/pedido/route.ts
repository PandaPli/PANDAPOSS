import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DeliveryService } from "@/server/services/delivery.service";
import { PedidoService } from "@/server/services/pedido.service";
import type { MetodoPago } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const k = req.headers.get("x-agente-key");
  if (k !== process.env.AGENTE_API_KEY) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const agenteId = Number(id);

  const agente = await prisma.agenteWsp.findUnique({
    where: { id: agenteId },
    select: { sucursalId: true },
  });
  if (!agente) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  const { sucursalId } = agente;
  const body = await req.json();

  const tipoEntrega: string = body.tipoEntrega ?? "retiro";
  const metodoPago = (body.metodoPago ?? "EFECTIVO") as MetodoPago;
  const cliente = body.cliente ?? {};
  const rawItems: Array<{ nombre: string; precio: number; cantidad: number }> = body.items ?? [];

  try {
    let pedidoId: number;
    let total: number = body.total ?? 0;

    if (tipoEntrega === "delivery") {
      // — DELIVERY: DeliveryService handles PedidoDelivery + cliente records —
      const result = await DeliveryService.createPublicOrder({
        sucursalId,
        items: rawItems.map((i) => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
        cliente: {
          nombre: cliente.nombre ?? "Cliente WhatsApp",
          telefono: cliente.telefono ?? "",
          direccion: cliente.direccion ?? "",
        },
        metodoPago,
        cargoEnvio: 0,
        zonaDelivery: "WhatsApp",
      });
      pedidoId = result.id;
      total = result.total;
    } else {
      // — MOSTRADOR (retiro): map names → product IDs, create via PedidoService —
      const productos = await prisma.producto.findMany({
        where: { sucursalId, activo: true },
        select: { id: true, nombre: true },
      });

      const matchedItems: Array<{ productoId: number; cantidad: number }> = [];
      const unmatchedLines: string[] = [];

      for (const raw of rawItems) {
        const match = productos.find(
          (p) => p.nombre.toLowerCase().trim() === raw.nombre.toLowerCase().trim()
        );
        if (match) {
          matchedItems.push({ productoId: match.id, cantidad: raw.cantidad });
        } else {
          unmatchedLines.push(`${raw.cantidad}x ${raw.nombre}`);
        }
      }

      if (matchedItems.length === 0 && unmatchedLines.length > 0) {
        // No products matched at all — cannot create a valid order via PedidoService
        return NextResponse.json({ error: "No se encontraron los productos en el catálogo" }, { status: 422 });
      }

      const usuarioSistema = await prisma.usuario.findFirst({
        where: {
          sucursalId,
          status: "ACTIVO",
          rol: { in: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "WAITER", "SECRETARY"] },
        },
        select: { id: true },
        orderBy: { id: "asc" },
      });

      if (!usuarioSistema) {
        return NextResponse.json({ error: "No hay personal activo en la sucursal" }, { status: 422 });
      }

      // Build observacion: include client name, payment method, and any unmatched items
      const obsLines = [
        `Cliente: ${cliente.nombre ?? "WhatsApp"} (${cliente.telefono ?? ""})`,
        `Pago: ${metodoPago}`,
        ...(unmatchedLines.length > 0 ? [`Items sin ID: ${unmatchedLines.join(", ")}`] : []),
      ];

      const pedido = await PedidoService.create({
        usuarioId: usuarioSistema.id,
        tipo: "MOSTRADOR",
        items: matchedItems,
        observacion: obsLines.join(" | "),
        telefonoCliente: cliente.telefono ?? null,
        direccionEntrega: null,
      });

      pedidoId = pedido.id;
      total = body.total ?? 0;
    }

    // Update AgenteCliente metrics (non-critical)
    if (cliente.telefono) {
      try {
        const agenteCliente = await prisma.agenteCliente.findUnique({
          where: { agenteId_telefono: { agenteId, telefono: cliente.telefono } },
        });
        if (agenteCliente) {
          await Promise.all([
            prisma.agenteCliente.update({
              where: { id: agenteCliente.id },
              data: { totalPedidos: { increment: 1 }, ultimoPedido: new Date() },
            }),
            prisma.agenteEvento.create({
              data: { agenteId, tipo: "PEDIDO_CONFIRMADO", payload: { pedidoId, total } },
            }),
          ]);
        }
      } catch {
        // non-critical
      }
    }

    return NextResponse.json({ pedidoId, total }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno";
    console.error("[AgenteWsp] Error creando pedido:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
