/**
 * visorBus — pub/sub para el display visor del cliente.
 *
 * Estrategia dual:
 *  1. In-memory (mismo proceso) → notificación inmediata vía listeners.
 *  2. Filesystem (/tmp) → estado persistido para que otros workers de PM2
 *     puedan leerlo cada 2 s vía poll en el SSE endpoint.
 */

import fs   from "fs";
import os   from "os";
import path from "path";

export type VisorMsg =
  | { type: "idle"; sucursalNombre?: string }
  | {
      type: "cart";
      items: {
        id: number;
        tipo: string;
        nombre: string;
        precio: number;
        cantidad: number;
        observacion?: string | null;
      }[];
      subtotal: number;
      descuento: number;
      totalDescuento: number;
      ivaPorc: number;
      totalIva: number;
      total: number;
      simbolo: string;
      sucursalNombre?: string;
    }
  | { type: "success"; total: number; simbolo: string; sucursalNombre?: string };

const lastState = new Map<number, VisorMsg>();
const listeners = new Map<number, Set<(msg: VisorMsg) => void>>();

/** Ruta del archivo de estado para una caja */
function statePath(cajaId: number): string {
  return path.join(os.tmpdir(), `pandapos-visor-${cajaId}.json`);
}

/** Lee el estado desde disco (otro worker pudo haberlo escrito) */
function readStateFromDisk(cajaId: number): VisorMsg | null {
  try {
    const raw = fs.readFileSync(statePath(cajaId), "utf8");
    return JSON.parse(raw) as VisorMsg;
  } catch {
    return null;
  }
}

export function getVisorState(cajaId: number): VisorMsg {
  // Preferir memoria; si no hay, leer del disco
  return lastState.get(cajaId) ?? readStateFromDisk(cajaId) ?? { type: "idle" };
}

export function getVisorStateFromDisk(cajaId: number): VisorMsg {
  // Siempre leer del disco (usado por el poll cross-process)
  return readStateFromDisk(cajaId) ?? lastState.get(cajaId) ?? { type: "idle" };
}

export function pushVisorState(cajaId: number, msg: VisorMsg): void {
  lastState.set(cajaId, msg);

  // Persistir en disco para sincronizar con otros workers PM2
  try {
    fs.writeFileSync(statePath(cajaId), JSON.stringify(msg));
  } catch { /* silencioso — el poll del cliente compensará */ }

  // Notificar listeners del mismo proceso (respuesta inmediata)
  listeners.get(cajaId)?.forEach((cb) => {
    try { cb(msg); } catch { /* cliente desconectado */ }
  });
}

export function subscribeVisor(
  cajaId: number,
  cb: (msg: VisorMsg) => void
): () => void {
  if (!listeners.has(cajaId)) listeners.set(cajaId, new Set());
  listeners.get(cajaId)!.add(cb);
  return () => listeners.get(cajaId)?.delete(cb);
}
