import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formato: $5.200  $18.000 — usa el símbolo de la sucursal, sin decimales */
export function formatCurrency(amount: number, simbolo = "$"): string {
  const formatted = new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${simbolo}${formatted}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ${diffMin % 60}min`;
}

export function generateNumeroVenta(id: number): string {
  return `VTA-${String(id).padStart(6, "0")}`;
}

// Sanitizar inputs de texto
export function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Normaliza y formatea un teléfono chileno para mostrar.
 * Maneja todos los formatos almacenados: "12345678", "912345678",
 * "56912345678", "+56912345678", etc.
 * Retorna siempre "+56 9 XXXX XXXX" para móviles o "+56 XXXXXXXXX" para otros.
 */
export function formatPhone(tel: string | null | undefined): string {
  if (!tel) return "—";
  const digits = tel.replace(/\D/g, "");
  if (!digits) return tel;

  let local = digits;
  // Quitar código de país 56
  if (local.startsWith("569") && local.length === 11) {
    local = local.slice(2);           // "9XXXXXXXX"
  } else if (local.startsWith("56") && local.length === 10) {
    local = local.slice(2);           // "XXXXXXXX" fijo
  } else if (local.length === 8) {
    local = "9" + local;              // asume móvil sin 9
  }

  // Móvil: 9 dígitos comenzando con 9 → "+56 9 XXXX XXXX"
  if (local.startsWith("9") && local.length === 9) {
    return `+56 9 ${local.slice(1, 5)} ${local.slice(5)}`;
  }
  return `+56 ${local}`;
}

/**
 * Extrae los dígitos locales de un teléfono chileno para usar en un input
 * con prefijo "+56" ya mostrado. Ej: "+56912345678" → "912345678"
 */
export function phoneToInputDigits(tel: string | null | undefined): string {
  if (!tel) return "";
  const d = tel.replace(/\D/g, "");
  if (d.startsWith("56") && d.length >= 10) return d.slice(2); // quitar "56"
  if (d.length === 8) return "9" + d;                          // asumir móvil
  return d.slice(-9);                                          // últimos 9
}

/** Normaliza texto para búsquedas: sin acentos, minúsculas */
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
