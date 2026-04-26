import { PANDI_KNOWLEDGE, PANDI_QUICK_QUESTIONS } from "./knowledge";
import type { PandiAnswer, PandiAskInput, PandiKnowledgeItem, PandiTopic } from "./types";

const STOP_WORDS = new Set([
  "a",
  "al",
  "como",
  "con",
  "de",
  "del",
  "donde",
  "el",
  "en",
  "es",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "para",
  "por",
  "que",
  "se",
  "un",
  "una",
  "y",
]);

export function createPandiAnswer(input: PandiAskInput): PandiAnswer {
  const question = normalizeText(input.question);

  if (!question) {
    return {
      answer: "Escribeme una pregunta sobre PandaPoss y te guio paso a paso.",
      confidence: 0,
      matchedTopics: ["general"],
      suggestions: PANDI_QUICK_QUESTIONS,
    };
  }

  const matches = PANDI_KNOWLEDGE.map((item) => ({
    item,
    score: scoreKnowledgeItem(question, item),
  }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      answer:
        "No encontre una respuesta exacta en mi base inicial. Puedo ayudarte con ventas, productos, clientes, pedidos, delivery, cajas, reportes, usuarios, mesas, carta QR, kiosko, cupones, RRHH y configuracion.",
      confidence: 0.15,
      matchedTopics: ["general"],
      suggestions: PANDI_QUICK_QUESTIONS,
    };
  }

  const bestMatches = matches.slice(0, 2);
  const matchedTopics = uniqueTopics(bestMatches.map((match) => match.item.topic));
  const answer = composeAnswer(bestMatches.map((match) => match.item));
  const confidence = Math.min(0.95, Math.max(0.35, bestMatches[0].score / 8));

  return {
    answer,
    confidence,
    matchedTopics,
    suggestions: createSuggestions(matchedTopics),
  };
}

function composeAnswer(items: PandiKnowledgeItem[]) {
  const [primary, secondary] = items;
  const related = primary.relatedModules?.length
    ? `\n\nModulos relacionados: ${primary.relatedModules.join(", ")}.`
    : "";

  if (!secondary || secondary.topic === primary.topic) {
    return `${primary.answer}${related}`;
  }

  return `${primary.answer}\n\nTambien puede servirte: ${secondary.answer}${related}`;
}

function scoreKnowledgeItem(question: string, item: PandiKnowledgeItem) {
  const tokens = tokenize(question);
  const searchable = normalizeText(
    [item.title, item.topic, item.keywords.join(" "), item.answer, item.relatedModules?.join(" ")].join(" "),
  );

  let score = 0;

  for (const token of tokens) {
    if (searchable.includes(token)) {
      score += token.length > 5 ? 2 : 1;
    }
  }

  for (const keyword of item.keywords) {
    if (question.includes(normalizeText(keyword))) {
      score += 4;
    }
  }

  return score;
}

function createSuggestions(topics: PandiTopic[]) {
  const topicSuggestions: Partial<Record<PandiTopic, string[]>> = {
    ventas: ["Como cierro una venta?", "Como asocio un cliente a una venta?"],
    productos: ["Como creo una categoria?", "Como muestro un producto en carta QR?"],
    clientes: ["Como veo el historial de un cliente?", "Como funcionan los puntos?"],
    pedidos: ["Como cambio el estado de un pedido?", "Donde ve cocina los pedidos?"],
    delivery: ["Como asigno un repartidor?", "Como configuro zonas de delivery?"],
    cajas: ["Como hago un arqueo?", "Como registro un movimiento de caja?"],
    reportes: ["Donde veo ventas de hoy?", "Como reviso caja diaria?"],
    usuarios: ["Que permisos tiene cada rol?", "Como creo un usuario?"],
    mesas: ["Como abro una mesa?", "Como emito una precuenta?"],
    carta_qr: ["Como comparto la carta QR?", "Como cambio el logo de la carta?"],
    kiosko: ["Como activo productos para kiosko?", "Como llegan los pedidos del kiosko?"],
    cupones: ["Como creo un cupon?", "Como uso cupones de cumpleanos?"],
    rrhh: ["Como registro asistencia?", "Como creo un cargo?"],
    configuracion: ["Como cambio datos de sucursal?", "Como configuro impresora?"],
    general: PANDI_QUICK_QUESTIONS,
  };

  return topics.flatMap((topic) => topicSuggestions[topic] ?? []).slice(0, 4);
}

function uniqueTopics(topics: PandiTopic[]) {
  return Array.from(new Set(topics));
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
