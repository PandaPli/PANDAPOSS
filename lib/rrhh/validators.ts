export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`INVALID_${field.toUpperCase()}`);
  return value.trim();
}

export function requireNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`INVALID_${field.toUpperCase()}`);
  return parsed;
}

export function optionalString(value: unknown) {
  if (value == null || value === "") return undefined;
  return String(value).trim();
}
