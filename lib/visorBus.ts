/**
 * visorBus — pub/sub en memoria para el display visor del cliente.
 *
 * El estado persistente se guarda en la DB (cajas.visorEstado) para que
 * funcione correctamente en entornos PM2 cluster con múltiples workers.
 * Este módulo solo gestiona los listeners del proceso actual (notificación
 * instantánea cuando push y stream caen en el mismo worker).
 */

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

/** Cache en memoria del estado actual (mismo proceso) */
const lastState = new Map<number, VisorMsg>();

/** Listeners SSE del proceso actual */
const listeners = new Map<number, Set<(msg: VisorMsg) => void>>();

/** Retorna el último estado conocido en memoria para este worker */
export function getVisorStateMem(cajaId: number): VisorMsg | null {
  return lastState.get(cajaId) ?? null;
}

/** Notifica a todos los listeners del proceso actual y actualiza cache */
export function pushVisorStateMem(cajaId: number, msg: VisorMsg): void {
  lastState.set(cajaId, msg);
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
