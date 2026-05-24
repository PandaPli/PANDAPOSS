/**
 * Normalizador de texto para matching de voz.
 * Adaptado de Skill alexa Bampai: order-normalizer.ts
 */

/** Mapa de numeros en palabras a digitos */
const NUMBER_WORDS: Record<string, string> = {
  cero: "0", uno: "1", una: "1", un: "1", dos: "2", tres: "3",
  cuatro: "4", cinco: "5", seis: "6", siete: "7", ocho: "8",
  nueve: "9", diez: "10", once: "11", doce: "12", trece: "13",
  catorce: "14", quince: "15", dieciseis: "16", diecisiete: "17",
  dieciocho: "18", diecinueve: "19", veinte: "20", veintiuno: "21",
  veintidos: "22", veintitres: "23", veinticuatro: "24", veinticinco: "25",
  treinta: "30", cuarenta: "40", cincuenta: "50",
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza texto y ademas convierte numeros en palabras a digitos.
 * "tabla veinte" → "tabla 20"
 */
export function normalizeForSearch(value: string): string {
  let text = normalizeText(value);
  // Reemplazar palabras numéricas por dígitos
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  }
  return text.replace(/\s+/g, " ").trim();
}
