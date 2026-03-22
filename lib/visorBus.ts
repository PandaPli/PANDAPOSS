/**
 * visorBus — pub/sub en memoria para el display visor del cliente.
 * Funciona para instancia única (Railway single-instance).
 *
 * Cada sucursal tiene:
 *   - lastState : último mensaje enviado (para hidratar reconexiones)
 *   - listeners : Set de callbacks activos (conexiones SSE abiertas)
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

const lastState = new Map<number, VisorMsg>();
const listeners = new Map<number, Set<(msg: VisorMsg) => void>>();

export function getVisorState(sucursalId: number): VisorMsg {
  return lastState.get(sucursalId) ?? { type: "idle" };
}

export function pushVisorState(sucursalId: number, msg: VisorMsg): void {
  lastState.set(sucursalId, msg);
  const subs = listeners.get(sucursalId);
  if (subs) {
    subs.forEach((cb) => {
      try { cb(msg); } catch { /* cliente desconectado */ }
    });
  }
}

export function subscribeVisor(
  sucursalId: number,
  cb: (msg: VisorMsg) => void
): () => void {
  if (!listeners.has(sucursalId)) listeners.set(sucursalId, new Set());
  listeners.get(sucursalId)!.add(cb);
  return () => listeners.get(sucursalId)?.delete(cb);
}
