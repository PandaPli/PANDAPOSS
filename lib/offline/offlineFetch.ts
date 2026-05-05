/**
 * PandaPoss — Fetch offline-aware
 * Reemplaza fetch("/api/ventas") y fetch("/api/pedidos") en el POS.
 * Si el browser está offline, encola en IndexedDB y retorna un objeto local.
 */
import { queueVenta, queuePedido } from "./queue";

export interface OfflineResult {
  id: string | number;
  offline?: true;
  localId?: string;
}

// ── Ventas ─────────────────────────────────────────────────────────────────────

export async function fetchVentaOffline(
  payload: object,
  sucursalId: number
): Promise<OfflineResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const localId = await queueVenta(sucursalId, payload);
    return { id: localId, offline: true, localId };
  }

  const res = await fetch("/api/ventas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Error al registrar la venta";
    try { const d = await res.json(); errMsg = d.error ?? errMsg; } catch { /* */ }
    throw new Error(errMsg);
  }

  return res.json();
}

// ── Pedidos ────────────────────────────────────────────────────────────────────

export async function fetchPedidoOffline(
  payload: object,
  sucursalId: number
): Promise<OfflineResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const localId = await queuePedido(sucursalId, payload);
    return { id: localId, offline: true, localId };
  }

  const res = await fetch("/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Error al crear pedido";
    try { const d = await res.json(); errMsg = d.error ?? errMsg; } catch { /* */ }
    throw new Error(errMsg);
  }

  return res.json();
}
