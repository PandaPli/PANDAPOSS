/**
 * Normalizador de texto para matching de voz.
 * Adaptado de Skill alexa Bampai: order-normalizer.ts
 */

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
