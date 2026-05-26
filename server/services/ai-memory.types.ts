export type AiMemoryKind =
  | "conversation"
  | "order"
  | "table"
  | "kitchen"
  | "stock"
  | "sales"
  | "customer"
  | "preference"
  | "system";

export type AiMemoryRecord = {
  id: string;
  tenantId: string | null;
  sucursalId: number;
  userId: number | null;
  kind: AiMemoryKind;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AiMemoryContext = {
  activeTables: unknown[];
  recentOrders: unknown[];
  popularProducts: unknown[];
  kitchenStatus: unknown[];
  openingHours: unknown[];
  frequentCustomers: unknown[];
  semanticMemories: AiMemoryRecord[];
  optimizedContext: string;
};
