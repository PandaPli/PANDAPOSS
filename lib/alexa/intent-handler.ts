/**
 * Handler de intents de Alexa para PandaPOS.
 *
 * Arquitectura hibrida adaptada de Skill alexa Bampai:
 * - Intents nativos de Alexa para comandos estructurados
 * - NLP con OpenAI para interpretacion libre de voz
 * - Executor POS para acciones reales en la base de datos
 *
 * Flujo: Alexa → Intent → NLP (si es frase libre) → Executor POS → Respuesta hablada
 */

import { prisma } from "@/lib/db";
import { executeVoiceTool } from "@/lib/voice/executor";
import { normalizeText, normalizeForSearch } from "./normalizer";

// ── Tipos de Alexa ─────────────────────────────────────────

interface AlexaSlot {
  name: string;
  value?: string;
  confirmationStatus?: string;
}

interface AlexaIntent {
  name: string;
  confirmationStatus?: string;
  slots?: Record<string, AlexaSlot>;
}

interface AlexaRequest {
  type: string;
  intent?: AlexaIntent;
  reason?: string;
  timestamp?: string;
}

interface AlexaSession {
  sessionId?: string;
  application?: { applicationId?: string };
  user?: { userId?: string; accessToken?: string };
  attributes?: Record<string, unknown>;
  new?: boolean;
}

export interface AlexaRequestBody {
  version: string;
  session: AlexaSession;
  request: AlexaRequest;
  context?: Record<string, unknown>;
}

interface AlexaResponse {
  version: string;
  sessionAttributes?: Record<string, unknown>;
  response: {
    outputSpeech?: { type: "PlainText"; text: string };
    reprompt?: { outputSpeech: { type: "PlainText"; text: string } };
    shouldEndSession: boolean;
  };
}

interface PosContext {
  userId: number;
  sucursalId: number;
  rol: string;
}

// ── Helpers de respuesta ───────────────────────────────────

function speak(text: string, endSession = false, sessionAttributes?: Record<string, unknown>): AlexaResponse {
  return {
    version: "1.0",
    sessionAttributes,
    response: {
      outputSpeech: { type: "PlainText", text },
      reprompt: endSession ? undefined : { outputSpeech: { type: "PlainText", text: "Que necesitas?" } },
      shouldEndSession: endSession,
    },
  };
}

// ── Resolver contexto POS desde token o config ─────────────

async function resolveContext(session: AlexaSession): Promise<PosContext | null> {
  // Opcion 1: Account Linking — el accessToken es el userId
  const accessToken = session.user?.accessToken;
  if (accessToken) {
    const userId = parseInt(accessToken, 10);
    if (!isNaN(userId)) {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, sucursalId: true, rol: true },
      });
      if (user?.sucursalId) {
        return { userId: user.id, sucursalId: user.sucursalId, rol: user.rol };
      }
    }
  }

  // Opcion 2: Device vinculado a sucursal via env o session attributes
  const attrs = session.attributes ?? {};
  const sucursalId = attrs.sucursalId as number | undefined;
  const userId = attrs.userId as number | undefined;
  if (sucursalId && userId) {
    return { userId, sucursalId, rol: "WAITER" };
  }

  // Opcion 3: Sucursal por defecto (configuracion en env)
  const defaultSucursal = parseInt(process.env.ALEXA_DEFAULT_SUCURSAL_ID ?? "", 10);
  const defaultUser = parseInt(process.env.ALEXA_DEFAULT_USER_ID ?? "", 10);
  if (!isNaN(defaultSucursal) && !isNaN(defaultUser)) {
    return { userId: defaultUser, sucursalId: defaultSucursal, rol: "WAITER" };
  }

  return null;
}

// ── Extraer productos de slots de Alexa ────────────────────

function extractItems(slots: Record<string, AlexaSlot> | undefined) {
  const items: Array<{ nombre: string; cantidad: number; observacion?: string }> = [];
  if (!slots) return items;

  // Slots genericos: producto1, cantidad1, producto2, cantidad2, etc.
  for (let i = 1; i <= 5; i++) {
    const nombre = slots[`producto${i}`]?.value ?? slots[`producto`]?.value;
    if (!nombre) continue;
    const cantidadRaw = slots[`cantidad${i}`]?.value ?? slots[`cantidad`]?.value;
    const cantidad = cantidadRaw ? parseInt(cantidadRaw, 10) : 1;
    const observacion = slots[`observacion${i}`]?.value ?? slots[`observacion`]?.value ?? undefined;
    items.push({ nombre: normalizeForSearch(nombre), cantidad: isNaN(cantidad) ? 1 : cantidad, observacion });
    // Solo tomar el primer match si usamos slots sin indice
    if (!slots[`producto${i}`]) break;
  }

  return items;
}

// ── Handler principal ──────────────────────────────────────

export async function handleAlexaRequest(body: AlexaRequestBody): Promise<AlexaResponse> {
  const { request, session } = body;

  // ── Launch ─────────────────────────────────────────────
  if (request.type === "LaunchRequest") {
    return speak(
      "PandaPOS listo. Que necesitas?",
      false,
      session.attributes,
    );
  }

  // ── Session End ────────────────────────────────────────
  if (request.type === "SessionEndedRequest") {
    return speak("", true);
  }

  // ── Intent Request ─────────────────────────────────────
  if (request.type !== "IntentRequest" || !request.intent) {
    return speak("No entendi eso. Intenta de nuevo.", false, session.attributes);
  }

  const intent = request.intent;
  const slots = intent.slots;

  // ── Built-in intents ───────────────────────────────────
  if (intent.name === "AMAZON.HelpIntent") {
    return speak(
      "Puedes pedirme: crear un pedido para la mesa 5, estado de cocina, mesas libres, o ventas de hoy. Que necesitas?",
      false,
      session.attributes,
    );
  }

  if (intent.name === "AMAZON.CancelIntent" || intent.name === "AMAZON.StopIntent") {
    return speak("Hasta luego!", true);
  }

  if (intent.name === "AMAZON.FallbackIntent") {
    return speak(
      "No entendi tu pedido. Intenta decir: crear pedido de dos completos para la mesa 3.",
      false,
      session.attributes,
    );
  }

  // ── Resolver contexto POS ──────────────────────────────
  const ctx = await resolveContext(session);
  if (!ctx) {
    return speak(
      "No pude identificar tu restaurante. Vincula tu cuenta en la app de Alexa o configura la sucursal por defecto.",
      true,
    );
  }

  // ── Custom intents POS ─────────────────────────────────

  // 1. Crear pedido
  if (intent.name === "CrearPedidoIntent") {
    const mesa = slots?.mesa?.value ?? null;
    const items = extractItems(slots);

    if (items.length === 0) {
      return speak("Que productos quieres pedir?", false, { ...session.attributes, pendingMesa: mesa });
    }

    const result = await executeVoiceTool("crear_pedido", {
      mesa,
      items,
    }, ctx);

    return speak(result.message, false, session.attributes);
  }

  // 2. Estado de mesas
  if (intent.name === "EstadoMesasIntent") {
    const estado = slots?.estadoMesa?.value?.toUpperCase() ?? undefined;

    const result = await executeVoiceTool("estado_mesas", { estado }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // 3. Estado de cocina
  if (intent.name === "EstadoCocinaIntent") {
    const estacion = slots?.estacion?.value?.toUpperCase() ?? undefined;

    const result = await executeVoiceTool("estado_cocina", { estacion }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // 4. Consultar ventas
  if (intent.name === "ConsultarVentasIntent") {
    const periodo = slots?.periodo?.value ?? "hoy";

    const result = await executeVoiceTool("consultar_ventas", { periodo }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // 5. Leer comanda
  if (intent.name === "LeerComandaIntent") {
    const mesa = slots?.mesa?.value ?? undefined;
    const numero = slots?.numero?.value ? parseInt(slots.numero.value, 10) : undefined;

    const result = await executeVoiceTool("leer_comanda", { mesa, numero }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // 6. Actualizar pedido
  if (intent.name === "ActualizarPedidoIntent") {
    const mesa = slots?.mesa?.value ?? undefined;
    const numero = slots?.numero?.value ? parseInt(slots.numero.value, 10) : undefined;
    const estado = slots?.estadoPedido?.value?.toUpperCase() ?? undefined;

    if (!estado) {
      return speak("A que estado quieres cambiar el pedido? En proceso, listo, entregado o cancelado.", false, session.attributes);
    }

    const result = await executeVoiceTool("actualizar_pedido", { mesa, numero, estado }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // 7. Consultar stock
  if (intent.name === "ConsultarStockIntent") {
    const busqueda = slots?.busqueda?.value ?? undefined;

    const result = await executeVoiceTool("consultar_stock", { busqueda }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // 8. Cancelar producto
  if (intent.name === "CancelarProductoIntent") {
    const mesa = slots?.mesa?.value ?? undefined;
    const numero = slots?.numero?.value ? parseInt(slots.numero.value, 10) : undefined;
    const producto = slots?.producto?.value ?? undefined;

    if (!producto) {
      return speak("Que producto quieres cancelar?", false, session.attributes);
    }

    const result = await executeVoiceTool("cancelar_producto", { mesa, numero, producto }, ctx);
    return speak(result.message, false, session.attributes);
  }

  // ── 9. Comando libre (catch-all via NLP) ───────────────
  if (intent.name === "ComandoLibreIntent") {
    const frase = slots?.frase?.value;
    if (!frase) {
      return speak("No entendi. Puedes repetir?", false, session.attributes);
    }

    return await handleFreeCommand(frase, ctx, session.attributes);
  }

  // Intent no reconocido
  return speak("No entendi ese comando. Intenta decir: crear pedido, estado de mesas, o ventas de hoy.", false, session.attributes);
}

// ── NLP para comandos libres ───────────────────────────────

async function handleFreeCommand(
  frase: string,
  ctx: PosContext,
  sessionAttributes?: Record<string, unknown>,
): Promise<AlexaResponse> {
  const text = normalizeText(frase);

  // Deteccion de intencion simple por keywords (sin depender de OpenAI)
  // Adaptado del order-interpretation de Bampai

  // Crear pedido
  if (/(pedir|pedido|crear|quiero|dame|traeme|pon|agrega)/i.test(text)) {
    // Intentar extraer mesa
    const mesaMatch = text.match(/mesa\s*(\d+)/);
    const mesa = mesaMatch?.[1] ?? null;

    // Intentar extraer items de la frase
    const items = parseItemsFromFrase(text);
    if (items.length > 0) {
      const result = await executeVoiceTool("crear_pedido", { mesa, items }, ctx);
      return speak(result.message, false, sessionAttributes);
    }

    return speak("Que productos quieres pedir?", false, { ...sessionAttributes, pendingMesa: mesa });
  }

  // Estado mesas
  if (/(mesas?\s*(libres?|ocupadas?|disponibles?)|que mesas|cuantas mesas)/i.test(text)) {
    const result = await executeVoiceTool("estado_mesas", {}, ctx);
    return speak(result.message, false, sessionAttributes);
  }

  // Estado cocina
  if (/(cocina|pendientes?|en proceso|listos?|kds)/i.test(text)) {
    const result = await executeVoiceTool("estado_cocina", {}, ctx);
    return speak(result.message, false, sessionAttributes);
  }

  // Ventas
  if (/(ventas?|vendido|recaudado|plata|caja)/i.test(text)) {
    const periodoMatch = text.match(/(hoy|ayer|semana|mes)/);
    const result = await executeVoiceTool("consultar_ventas", { periodo: periodoMatch?.[1] ?? "hoy" }, ctx);
    return speak(result.message, false, sessionAttributes);
  }

  // Leer comanda
  if (/(comanda|que pidio|pedido de la mesa|que tiene la mesa)/i.test(text)) {
    const mesaMatch = text.match(/mesa\s*(\d+)/);
    const result = await executeVoiceTool("leer_comanda", { mesa: mesaMatch?.[1] }, ctx);
    return speak(result.message, false, sessionAttributes);
  }

  // Cancelar
  if (/(cancela|quita|saca|elimina)/i.test(text)) {
    const mesaMatch = text.match(/mesa\s*(\d+)/);
    // Intentar extraer el producto a cancelar
    const productoMatch = text.replace(/cancela|quita|saca|elimina|de la mesa\s*\d+|del pedido\s*\d+/gi, "").trim();
    if (productoMatch) {
      const result = await executeVoiceTool("cancelar_producto", {
        mesa: mesaMatch?.[1],
        producto: productoMatch,
      }, ctx);
      return speak(result.message, false, sessionAttributes);
    }
  }

  // Stock
  if (/(stock|hay|tenemos|queda|disponible|busca|precio)/i.test(text)) {
    const busqueda = text.replace(/(stock|hay|tenemos|queda|disponible|busca|precio|de|del|cuanto|cuantos)/gi, "").trim();
    const result = await executeVoiceTool("consultar_stock", { busqueda: busqueda || undefined }, ctx);
    return speak(result.message, false, sessionAttributes);
  }

  return speak("No entendi ese comando. Intenta decir: crear pedido, mesas libres, o estado de cocina.", false, sessionAttributes);
}

// ── Parser simple de items desde frase libre ───────────────

function parseItemsFromFrase(text: string): Array<{ nombre: string; cantidad: number }> {
  const items: Array<{ nombre: string; cantidad: number }> = [];

  // Patrones: "2 completos", "una coca cola", "tres empanadas"
  const numberWords: Record<string, number> = {
    un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  };

  // Limpiar prefijos de intencion
  const cleaned = text
    .replace(/(pedir|pedido|crear|quiero|dame|traeme|pon|agrega|para la mesa\s*\d+|de mostrador|y)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Separar por comas o "y"
  const parts = cleaned.split(/[,]/).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Intentar extraer cantidad + nombre
    const match = part.match(/^(\d+)\s+(.+)$/);
    if (match) {
      items.push({ nombre: normalizeForSearch(match[2].trim()), cantidad: parseInt(match[1], 10) });
      continue;
    }

    // Cantidad en palabras
    const wordMatch = part.match(/^(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(.+)$/i);
    if (wordMatch) {
      items.push({ nombre: normalizeForSearch(wordMatch[2].trim()), cantidad: numberWords[wordMatch[1].toLowerCase()] ?? 1 });
      continue;
    }

    // Sin cantidad explicita = 1
    if (part.length > 2) {
      items.push({ nombre: normalizeForSearch(part), cantidad: 1 });
    }
  }

  return items;
}
