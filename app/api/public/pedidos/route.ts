import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PedidoService } from "@/server/services/pedido.service";
import { effectiveFeature } from "@/lib/plan";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// P1: Límites para prevenir abuso del endpoint público
const MAX_ITEMS        = 30;   // máximo de líneas por pedido
const MAX_CANTIDAD     = 50;   // máximo de unidades por ítem
const MAX_NOMBRE_LEN   = 100;  // caracteres en nombre de cliente
const MAX_OBS_LEN      = 200;  // caracteres en observación por ítem

export async function POST(req: NextRequest) {
  try {
    // P2: Rate limiting — 10 pedidos por IP por minuto
    const ip = getClientIp(req);
    const rl = rateLimit(`public:pedidos:${ip}`, { max: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await req.json();
    const { sucursalId, mesaId, items, clienteInfo } = body;

    // 1. Validación básica
    if (!sucursalId || !mesaId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Faltan datos obligatorios para crear el pedido" }, { status: 400 });
    }

    // P1: Validar límites de ítems
    if (items.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `El pedido no puede tener más de ${MAX_ITEMS} productos.` },
        { status: 400 }
      );
    }

    for (const item of items) {
      const productoId = Number(item.productoId);
      const cantidad   = Number(item.cantidad);

      if (!productoId || isNaN(productoId) || productoId <= 0) {
        return NextResponse.json({ error: "Producto inválido en el pedido." }, { status: 400 });
      }
      if (!cantidad || isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
        return NextResponse.json({ error: "Cantidad inválida en el pedido." }, { status: 400 });
      }
      if (cantidad > MAX_CANTIDAD) {
        return NextResponse.json(
          { error: `La cantidad por producto no puede superar ${MAX_CANTIDAD} unidades.` },
          { status: 400 }
        );
      }
    }

    // P1: Sanitizar nombre de cliente (sin injection de strings largos)
    const nombreCliente = typeof clienteInfo?.nombre === "string"
      ? clienteInfo.nombre.trim().slice(0, MAX_NOMBRE_LEN)
      : "";

    // 2. Verificar sucursal y mesa
    const [sucursal, mesa] = await Promise.all([
      prisma.sucursal.findUnique({
        where: { id: Number(sucursalId) },
        select: { activa: true, menuQR: true, plan: true },
      }),
      prisma.mesa.findFirst({
        where: { id: Number(mesaId), sala: { sucursalId: Number(sucursalId) } },
        select: { id: true },
      }),
    ]);

    if (!sucursal || !sucursal.activa || !effectiveFeature(sucursal.plan, sucursal.menuQR)) {
      return NextResponse.json(
        { error: "Esta sucursal no tiene habilitado el menú QR o no está activa." },
        { status: 403 }
      );
    }

    if (!mesa) {
      return NextResponse.json(
        { error: "La mesa indicada no es válida para esta sucursal." },
        { status: 404 }
      );
    }

    // P3: Buscar usuario receptor con rol adecuado (no CHEF, BAR ni DELIVERY)
    const systemUser = await prisma.usuario.findFirst({
      where: {
        sucursalId: Number(sucursalId),
        status: "ACTIVO",
        rol: { in: ["RESTAURANTE", "CASHIER", "WAITER", "SECRETARY", "ADMIN_GENERAL"] },
      },
      orderBy: { id: "asc" },
    });

    if (!systemUser) {
      return NextResponse.json(
        { error: "No hay personal activo en la sucursal para recepcionar." },
        { status: 500 }
      );
    }

    // Observación sanitizada
    const observacionCliente = nombreCliente ? `Cliente: ${nombreCliente}` : "";

    const pedido = await PedidoService.create({
      tipo: "COCINA",
      mesaId: mesa.id,
      usuarioId: systemUser.id,
      cajaId: null,
      observacion: observacionCliente,
      items: items.map((item) => ({
        productoId: Number(item.productoId),
        cantidad:   Number(item.cantidad),
        // P1: truncar observación por ítem
        observacion: typeof item.notas === "string"
          ? item.notas.trim().slice(0, MAX_OBS_LEN)
          : typeof item.observacion === "string"
          ? item.observacion.trim().slice(0, MAX_OBS_LEN)
          : null,
      })),
    });

    // Marcar mesa como OCUPADA
    await prisma.mesa.update({
      where: { id: mesa.id },
      data: { estado: "OCUPADA" },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error("[POST /api/public/pedidos]", error);
    const message =
      error instanceof Error ? error.message : "Error interno al procesar el pedido QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
