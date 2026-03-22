/**
 * visorBus — pub/sub en memoria para el display visor del cliente.
 * La clave es cajaId (cada caja tiene su propia pantalla visor).
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

const lastState  = new Map<number, VisorMsg>();
const listeners  = new Map<number, Set<(msg: VisorMsg) => void>>();

export function getVisorState(cajaId: number): VisorMsg {
  return lastState.get(cajaId) ?? { type: "idle" };
}

export function pushVisorState(cajaId: number, msg: VisorMsg): void {
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
