/**
 * PandaPoss — Offline IndexedDB
 * Gestiona la cola de ventas y pedidos cuando no hay conexión.
 */
import Dexie, { type Table } from "dexie";

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface PendingVenta {
  id?: number;
  localId: string;
  sucursalId: number;
  payload: object;
  timestamp: number;
  synced: boolean;
  syncedAt?: number;
  errorMsg?: string;
  retries: number;
}

export interface PendingPedido {
  id?: number;
  localId: string;
  sucursalId: number;
  payload: object;
  timestamp: number;
  synced: boolean;
  syncedAt?: number;
  errorMsg?: string;
  retries: number;
}

// ── Base de datos ──────────────────────────────────────────────────────────────

class OfflineDB extends Dexie {
  pendingVentas!: Table<PendingVenta>;
  pendingPedidos!: Table<PendingPedido>;

  constructor() {
    super("pandaposs_offline_v1");
    this.version(1).stores({
      pendingVentas:  "++id, localId, sucursalId, timestamp",
      pendingPedidos: "++id, localId, sucursalId, timestamp",
    });
  }
}

// Singleton — sólo se instancia en el cliente
let _db: OfflineDB | null = null;

export function getOfflineDB(): OfflineDB {
  if (typeof window === "undefined") throw new Error("IndexedDB sólo disponible en cliente");
  if (!_db) _db = new OfflineDB();
  return _db;
}
