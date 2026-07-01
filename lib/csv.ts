// Utilidad para exportar datos a CSV con descarga en el navegador.
// Escapa campos y previene inyección de fórmulas (CSV injection).

function escapeCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Prevenir inyección de fórmulas en Excel/Sheets
  if (/^[=+\-@|]/.test(s)) s = "\t" + s;
  // Escapar comillas y envolver si contiene caracteres especiales
  if (/["\n,;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Construye una cadena CSV a partir de filas (array de arrays).
 * Cada fila es un array de celdas; se pueden mezclar secciones.
 */
export function buildCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/** Dispara la descarga de un CSV en el navegador (con BOM para tildes en Excel). */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
