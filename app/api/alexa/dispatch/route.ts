import { NextRequest, NextResponse } from "next/server";
import { AiMemoryService } from "@/server/services/ai-memory.service";
import { AiPosService } from "@/server/services/ai-pos.service";

type AlexaDispatchBody = {
  intentName?: string;
  slots?: Record<string, string | number | undefined>;
  rawText?: string;
  sucursalId?: number;
  accessToken?: string;
};

const getRequiredNumber = (slots: AlexaDispatchBody["slots"], name: string) => {
  const value = Number(slots?.[name]);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Falta ${name}`);
  return value;
};

const getRequiredString = (slots: AlexaDispatchBody["slots"], name: string) => {
  const value = String(slots?.[name] ?? "").trim();
  if (!value) throw new Error(`Falta ${name}`);
  return value;
};

function authenticate(req: NextRequest) {
  const expected = process.env.ALEXA_SHARED_SECRET;
  if (!expected) throw new Error("ALEXA_SHARED_SECRET no configurado");

  const received = req.headers.get("x-pandaposs-alexa-secret");
  if (!received || received !== expected) throw new Error("Alexa no autorizada");
}

function resolveSucursalId(body: AlexaDispatchBody) {
  const sucursalId = Number(body.sucursalId ?? process.env.ALEXA_DEFAULT_SUCURSAL_ID);
  if (!Number.isFinite(sucursalId) || sucursalId <= 0) {
    throw new Error("Sucursal no configurada para Alexa");
  }
  return sucursalId;
}

function resolveServiceUserId() {
  const userId = Number(process.env.ALEXA_SERVICE_USER_ID);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("ALEXA_SERVICE_USER_ID no configurado");
  }
  return userId;
}

function isSalesSummary(data: unknown): data is { transacciones: number; totalVentas: number } {
  return (
    typeof data === "object" &&
    data !== null &&
    "transacciones" in data &&
    "totalVentas" in data &&
    typeof (data as { transacciones: unknown }).transacciones === "number" &&
    typeof (data as { totalVentas: unknown }).totalVentas === "number"
  );
}

function isOrderList(data: unknown): data is Array<{ id: number; estado: string; mesa?: { nombre?: string | null } | null }> {
  return Array.isArray(data) && data.every((item) => typeof item === "object" && item !== null && "estado" in item);
}

function isStockList(data: unknown): data is Array<{ nombre: string; stock: unknown }> {
  return Array.isArray(data) && data.every((item) => typeof item === "object" && item !== null && "stock" in item);
}

export async function POST(req: NextRequest) {
  try {
    authenticate(req);

    const body = (await req.json()) as AlexaDispatchBody;
    const sucursalId = resolveSucursalId(body);
    const userId = resolveServiceUserId();
    const context = { userId, rol: "RESTAURANTE", sucursalId };

    switch (body.intentName) {
      case "SalesTodayIntent": {
        const data = await AiPosService.query({ query: "sales", sucursalId }, context);
        if (!isSalesSummary(data)) throw new Error("Resumen de ventas invalido");
        return NextResponse.json({
          speech: `Hoy llevamos ${data.transacciones} ventas por un total de ${Math.round(data.totalVentas)} pesos.`,
          data,
        });
      }

      case "KitchenStatusIntent": {
        const data = await AiPosService.query({ query: "kds", sucursalId }, context);
        const orders = isOrderList(data) ? data : [];
        const pending = orders.filter((pedido) => pedido.estado === "PENDIENTE").length;
        const preparing = orders.filter((pedido) => pedido.estado === "EN_PROCESO").length;
        const ready = orders.filter((pedido) => pedido.estado === "LISTO").length;
        return NextResponse.json({
          speech: `Cocina tiene ${pending} pendientes, ${preparing} en preparacion y ${ready} listos.`,
          data,
        });
      }

      case "StockQueryIntent": {
        const productName = getRequiredString(body.slots, "productName");
        const data = await AiPosService.query({ query: "stock", q: productName, sucursalId }, context);
        if (!isStockList(data) || data.length === 0) {
          return NextResponse.json({ speech: `No encontre stock para ${productName}.`, data });
        }
        const product = data[0];
        return NextResponse.json({
          speech: `${product.nombre} tiene stock ${Number(product.stock)}.`,
          data,
        });
      }

      case "AddOrderIntent": {
        const quantity = getRequiredNumber(body.slots, "quantity");
        const tableNumber = getRequiredNumber(body.slots, "tableNumber");
        const productName = getRequiredString(body.slots, "productName");
        const pedidos = await AiPosService.query({ query: "orders", sucursalId }, context);
        const activeOrder = isOrderList(pedidos)
          ? pedidos.find((pedido) => pedido.mesa?.nombre?.includes(String(tableNumber)))
          : null;

        if (activeOrder) {
          const result = await AiPosService.execute(
            {
              action: "add_items",
              pedidoId: activeOrder.id,
              items: [{ nombre: productName, cantidad: quantity }],
              observacion: "Agregado por Alexa",
              sucursalId,
            },
            context,
          );
          return NextResponse.json({
            speech: `Listo, agregue ${quantity} ${productName} a la mesa ${tableNumber}.`,
            data: result,
          });
        }

        return NextResponse.json({
          speech: `No encontre una comanda activa para la mesa ${tableNumber}. Abre la mesa en PandaPoss o dime una mesa activa.`,
        });
      }

      case "CancelProductIntent": {
        const tableNumber = getRequiredNumber(body.slots, "tableNumber");
        const productName = getRequiredString(body.slots, "productName");
        const pedidos = await AiPosService.query({ query: "orders", sucursalId }, context);
        const activeOrder = isOrderList(pedidos)
          ? pedidos.find((pedido) => pedido.mesa?.nombre?.includes(String(tableNumber)))
          : null;
        if (!activeOrder) return NextResponse.json({ speech: `No encontre comanda activa para mesa ${tableNumber}.` });

        const result = await AiPosService.execute(
          {
            action: "cancel_items",
            pedidoId: activeOrder.id,
            nombre: productName,
            sucursalId,
          },
          context,
        );
        return NextResponse.json({
          speech: `Listo, cancele ${productName} de la mesa ${tableNumber}.`,
          data: result,
        });
      }

      case "RepeatUsualIntent": {
        const tableNumber = getRequiredNumber(body.slots, "tableNumber");
        const memory = await AiMemoryService.buildContext({
          sucursalId,
          userId,
          query: `lo mismo de siempre mesa ${tableNumber}`,
          kinds: ["preference", "order", "conversation"],
        });
        return NextResponse.json({
          speech:
            memory.semanticMemories.length > 0
              ? `Tengo contexto de la mesa ${tableNumber}. Para evitar errores, confirma el pedido desde PandaPoss.`
              : `Aun no tengo memoria suficiente para saber lo de siempre de la mesa ${tableNumber}.`,
          data: memory,
        });
      }

      default: {
        const memory = await AiMemoryService.buildContext({
          sucursalId,
          userId,
          query: body.rawText ?? body.intentName ?? "consulta alexa",
        });
        return NextResponse.json({
          speech: "Puedo ayudarte con ventas, cocina, stock y pedidos. Prueba: cuanto vendimos hoy.",
          data: memory,
        });
      }
    }
  } catch (error: any) {
    console.error("[POST /api/alexa/dispatch]", error);
    return NextResponse.json(
      { speech: error?.message ?? "No pude completar la accion en PandaPoss.", error: error?.message },
      { status: error?.message === "Alexa no autorizada" ? 401 : 400 },
    );
  }
}
