/**
 * PandaPoss — Cola offline
 * Encola ventas/pedidos fallidos y los sincroniza al recuperar conexión.
 */
import { getOfflineDB } from "./db";

const MAX_RETRIES = 5;

// ── Eventos internos ───────────────────────────────────────────────────────────
// Dispara un evento para que el OfflineContext actualice el contador.
function notifyQueued() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pp:offline:queued"));
  }
}
function notifySynced() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pp:offline:synced"));
  }
}

// Notifica al UI que una venta con puntos involucrados fue descartada.
// El operador debe revisar manualmente: el cliente NUNCA perdió los puntos en
// el servidor (la venta no llegó), pero la UI local pudo haberlos mostrado como
// gastados. Si esperaba ganar puntos, tampoco los recibió.
type DescartedPuntosInfo = {
  clienteId: number | null;
  puntosCanjeados: number;
  total: number;
  motivo: string;
  localId: string;
};
function notifyDescartePuntos(info: DescartedPuntosInfo) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<DescartedPuntosInfo>("pp:offline:descarte-puntos", { detail: info }));
  }
  // Logging persistente para auditoría
  console.warn("[OfflineQueue] Venta descartada con puntos involucrados:", info);
}

// ── Encolar ────────────────────────────────────────────────────────────────────

export async function queueVenta(sucursalId: number, payload: object): Promise<string> {
  const db = getOfflineDB();
  const localId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await db.pendingVentas.add({
    localId, sucursalId, payload,
    timestamp: Date.now(), synced: false, retries: 0,
  });
  notifyQueued();
  return localId;
}

export async function queuePedido(sucursalId: number, payload: object): Promise<string> {
  const db = getOfflineDB();
  const localId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await db.pendingPedidos.add({
    localId, sucursalId, payload,
    timestamp: Date.now(), synced: false, retries: 0,
  });
  notifyQueued();
  return localId;
}

// ── Contadores ─────────────────────────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  try {
    const db = getOfflineDB();
    const [ventas, pedidos] = await Promise.all([
      db.pendingVentas.filter(v => !v.synced).count(),
      db.pendingPedidos.filter(p => !p.synced).count(),
    ]);
    return ventas + pedidos;
  } catch {
    return 0;
  }
}

// ── Sincronizar ────────────────────────────────────────────────────────────────

export async function syncAll(): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  const db = getOfflineDB();

  // ── Ventas pendientes ──
  const pendingVentas = await db.pendingVentas.filter(v => !v.synced).toArray();
  for (const venta of pendingVentas) {
    if (venta.retries >= MAX_RETRIES) { failed++; continue; }
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venta.payload),
      });
      if (res.ok) {
        await db.pendingVentas.update(venta.id!, {
          synced: true, syncedAt: Date.now(),
        });
        ok++;
      } else {
        // 4xx → no reintentar; 5xx → reintentar
        const status = res.status;
        const willDiscard = status < 500;
        await db.pendingVentas.update(venta.id!, {
          retries: venta.retries + 1,
          errorMsg: `HTTP ${status}`,
          // Si es un error de cliente (caja cerrada, etc.), marcamos como synced para no volver a intentar
          ...(willDiscard ? { synced: true, errorMsg: `Descartado (${status})` } : {}),
        });

        // Reconciliación de puntos: si la venta descartada involucraba puntos
        // (canjeados o por ganar con cliente identificado), notificar para que
        // el operador pueda informar al cliente y revisar manualmente.
        if (willDiscard) {
          const p = venta.payload as {
            clienteId?: number | null;
            puntosCanjeados?: number;
            total?: number;
          };
          const puntosCanjeados = typeof p.puntosCanjeados === "number" ? p.puntosCanjeados : 0;
          const hayClienteIdentificado = typeof p.clienteId === "number" && p.clienteId > 0;
          if (puntosCanjeados > 0 || hayClienteIdentificado) {
            notifyDescartePuntos({
              clienteId: hayClienteIdentificado ? p.clienteId! : null,
              puntosCanjeados,
              total: typeof p.total === "number" ? p.total : 0,
              motivo: `HTTP ${status}`,
              localId: venta.localId,
            });
          }
        }

        failed++;
      }
    } catch {
      await db.pendingVentas.update(venta.id!, { retries: venta.retries + 1 });
      failed++;
    }
  }

  // ── Pedidos pendientes ──
  const pendingPedidos = await db.pendingPedidos.filter(p => !p.synced).toArray();
  for (const pedido of pendingPedidos) {
    if (pedido.retries >= MAX_RETRIES) { failed++; continue; }
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido.payload),
      });
      if (res.ok) {
        await db.pendingPedidos.update(pedido.id!, {
          synced: true, syncedAt: Date.now(),
        });
        ok++;
      } else {
        const status = res.status;
        await db.pendingPedidos.update(pedido.id!, {
          retries: pedido.retries + 1,
          errorMsg: `HTTP ${status}`,
          ...(status < 500 ? { synced: true, errorMsg: `Descartado (${status})` } : {}),
        });
        failed++;
      }
    } catch {
      await db.pendingPedidos.update(pedido.id!, { retries: pedido.retries + 1 });
      failed++;
    }
  }

  if (ok > 0) notifySynced();
  return { ok, failed };
}
