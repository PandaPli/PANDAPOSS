import { createEmbedding } from "@/server/services/ai-memory.embeddings";
import { loadOperationalContext, optimizeContext } from "@/server/services/ai-memory.context";
import { AiMemoryVectorStore } from "@/server/services/ai-memory.vector-store";
import type { AiMemoryKind } from "@/server/services/ai-memory.types";

type MemoryScope = {
  tenantId?: string | null;
  sucursalId: number;
  userId?: number | null;
};

export const AiMemoryService = {
  async remember(input: MemoryScope & {
    kind: AiMemoryKind;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
    importance?: number;
  }) {
    const embedding = await createEmbedding(`${input.kind}\n${input.title}\n${input.content}`);
    const id = await AiMemoryVectorStore.upsert({
      ...input,
      embedding,
    });

    return { id };
  },

  async retrieve(input: MemoryScope & {
    query: string;
    kinds?: AiMemoryKind[];
    limit?: number;
  }) {
    const embedding = await createEmbedding(input.query);
    return AiMemoryVectorStore.search({
      sucursalId: input.sucursalId,
      userId: input.userId,
      kinds: input.kinds,
      embedding,
      limit: input.limit ?? 8,
    });
  },

  async buildContext(input: MemoryScope & {
    query: string;
    kinds?: AiMemoryKind[];
  }) {
    const [operational, semanticMemories] = await Promise.all([
      loadOperationalContext(input.sucursalId),
      this.retrieve({
        sucursalId: input.sucursalId,
        userId: input.userId,
        query: input.query,
        kinds: input.kinds,
        limit: 10,
      }),
    ]);

    const context = {
      ...operational,
      semanticMemories,
    };

    return {
      ...context,
      optimizedContext: optimizeContext(context),
    };
  },

  async rememberConversation(input: MemoryScope & {
    userMessage: string;
    assistantMessage?: string;
  }) {
    return this.remember({
      ...input,
      kind: "conversation",
      title: input.userMessage.slice(0, 120),
      content: [input.userMessage, input.assistantMessage].filter(Boolean).join("\nRespuesta: "),
      importance: 0.45,
    });
  },
};
