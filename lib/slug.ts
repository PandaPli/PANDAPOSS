export function createSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Elimina todos los espacios
    .replace(/[^\w-]+/g, '') // Elimina caracteres especiales
    .replace(/--+/g, '-');
}
