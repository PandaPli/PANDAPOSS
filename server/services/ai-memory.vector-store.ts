import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import type { AiMemoryKind, AiMemoryRecord } from "@/server/services/ai-memory.types";
import { cosineSimilarity } from "@/server/services/ai-memory.embeddings";

type RawMemoryRow = {
  id: string;
  tenantId: string | null;
  sucursalId: number;
  userId: number | null;
  kind: AiMemoryKind;
  title: string;
  content: string;
  metadataJson: string;
  embeddingJson: string;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
};

let ensured = false;

async function ensureTable() {
  if (ensured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ai_memory_vectors (
      id VARCHAR(64) PRIMARY KEY,
      tenantId VARCHAR(191) NULL,
      sucursalId INT NOT NULL,
      userId INT NULL,
      kind VARCHAR(40) NOT NULL,
      title VARCHAR(180) NOT NULL,
      content TEXT NOT NULL,
      metadataJson JSON NULL,
      embeddingJson LONGTEXT NOT NULL,
      importance DOUBLE NOT NULL DEFAULT 0.5,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ai_memory_scope (sucursalId, kind),
      INDEX idx_ai_memory_user (userId),
      INDEX idx_ai_memory_created (createdAt)
    )
  `);

  ensured = true;
}

function rowToMemory(row: RawMemoryRow, score?: number): AiMemoryRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    sucursalId: row.sucursalId,
    userId: row.userId,
    kind: row.kind,
    title: row.title,
    content: row.content,
    metadata: row.metadataJson ? (JSON.parse(row.metadataJson) as Record<string, unknown>) : {},
    importance: Number(row.importance),
    score,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const AiMemoryVectorStore = {
  async upsert(input: {
    tenantId?: string | null;
    sucursalId: number;
    userId?: number | null;
    kind: AiMemoryKind;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
    embedding: number[];
    importance?: number;
  }) {
    await ensureTable();
    const id = randomUUID();

    await prisma.$executeRaw`
      INSERT INTO ai_memory_vectors
        (id, tenantId, sucursalId, userId, kind, title, content, metadataJson, embeddingJson, importance)
      VALUES
        (
          ${id},
          ${input.tenantId ?? null},
          ${input.sucursalId},
          ${input.userId ?? null},
          ${input.kind},
          ${input.title},
          ${input.content},
          ${JSON.stringify(input.metadata ?? {})},
          ${JSON.stringify(input.embedding)},
          ${input.importance ?? 0.5}
        )
    `;

    return id;
  },

  async search(input: {
    sucursalId: number;
    embedding: number[];
    kinds?: AiMemoryKind[];
    userId?: number | null;
    limit?: number;
    minScore?: number;
  }) {
    await ensureTable();
    const rows = await prisma.$queryRaw<RawMemoryRow[]>`
      SELECT *
      FROM ai_memory_vectors
      WHERE sucursalId = ${input.sucursalId}
      ORDER BY updatedAt DESC
      LIMIT 300
    `;

    const kindSet = input.kinds ? new Set(input.kinds) : null;
    const scored = rows
      .filter((row) => !kindSet || kindSet.has(row.kind))
      .filter((row) => input.userId === undefined || row.userId === null || row.userId === input.userId)
      .map((row) => {
        const vector = JSON.parse(row.embeddingJson) as number[];
        const semanticScore = cosineSimilarity(input.embedding, vector);
        const score = semanticScore * 0.82 + Number(row.importance) * 0.18;
        return rowToMemory(row, score);
      })
      .filter((memory) => (input.minScore ?? 0.2) <= (memory.score ?? 0))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return scored.slice(0, input.limit ?? 8);
  },
};
