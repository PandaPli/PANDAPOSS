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

/** Normaliza texto para búsquedas: sin acentos, minúsculas */
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
