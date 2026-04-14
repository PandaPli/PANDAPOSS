import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPreferenceAPI } from "@/lib/mercadopago";

// POST /api/mercadopago/create-preference
// Body: { pedidoId, sucursalId }
export async function POST(req: NextRequest) {
  try {
    const { pedidoId, sucursalId } = await req.json();

    if (!pedidoId || !sucursalId) {
      return NextResponse.json({ error: "pedidoId y sucursalId son requeridos" }, { status: 400 });
    }

    // Obtener access token de la sucursal
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: Number(sucursalId) },
      select: { mpAccessToken: true, nombre: true },
    });

    if (!sucursal?.mpAccessToken) {
      return NextResponse.json({ error: "Esta sucursal no tiene Mercado Pago configurado." }, { status: 400 });
    }

    // Obtener pedido con detalles
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(pedidoId) },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true, precio: true } },
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }

    // Construir items para MP
    const items = pedido.detalles.map((d) => {
      const nombre = d.observacion?.startsWith("[LIBRE]")
        ? d.observacion.replace("[LIBRE] ", "")
        : d.producto?.nombre ?? "Producto";
      const precio = Math.round(Number(d.precio ?? d.producto?.precio ?? 0));
      return {
        id: String(d.id),
        title: nombre.slice(0, 255),
        quantity: d.cantidad,
        unit_price: precio,
        currency_id: "CLP",
      };
    }).filter((item) => item.unit_price > 0);

    // Agregar cargo de envío si existe (parseado desde observación)
    const obsMatch = pedido.observacion?.match(/"cargoEnvio":(\d+)/);
    const cargoEnvio = obsMatch ? Number(obsMatch[1]) : 0;
    if (cargoEnvio > 0) {
      items.push({
        id: "envio",
        title: "Cargo de envío",
        quantity: 1,
        unit_price: cargoEnvio,
        currency_id: "CLP",
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://pandaposs.com";

    const preferenceAPI = getPreferenceAPI(sucursal.mpAccessToken);
    const preference = await preferenceAPI.create({
      body: {
        items,
        back_urls: {
          success: `${baseUrl}/pago/resultado?pedidoId=${pedidoId}&status=approved`,
          failure: `${baseUrl}/pago/resultado?pedidoId=${pedidoId}&status=rejected`,
          pending: `${baseUrl}/pago/resultado?pedidoId=${pedidoId}&status=pending`,
        },
        auto_return: "approved",
        external_reference: String(pedidoId),
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        statement_descriptor: sucursal.nombre.slice(0, 22),
      },
    });

    // Guardar preferenceId en el pedido
    await prisma.pedido.update({
      where: { id: Number(pedidoId) },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
    });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    const msg = err?.message ?? err?.cause?.message ?? JSON.stringify(err);
    console.error("[POST /api/mercadopago/create-preference]", msg);
    return NextResponse.json(
      { error: `Error al crear preferencia: ${msg}` },
      { status: 500 }
    );
  }
}
