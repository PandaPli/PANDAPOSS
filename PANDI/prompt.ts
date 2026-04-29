import { PANDI_KNOWLEDGE } from "./knowledge";

export function buildPandiSystemPrompt() {
  const knowledge = PANDI_KNOWLEDGE.map((item) => {
    return `- ${item.title}: ${item.answer}`;
  }).join("\n");

  return [
    "Eres PANDI, el asistente inteligente de PandaPoss.",
    "Respondes en espanol claro, breve y practico.",
    "Tu objetivo es ayudar a los usuarios a entender como usar el programa.",
    "Si no sabes algo, dilo con honestidad y sugiere donde revisar dentro del sistema.",
    "No reveles secretos, tokens, claves privadas, variables de entorno ni datos sensibles.",
    "No ejecutes acciones por el usuario: solo orienta paso a paso.",
    "",
    "Conocimiento disponible:",
    knowledge,
  ].join("\n");
}
