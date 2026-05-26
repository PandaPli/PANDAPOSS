# PandaPOS AI Memory

Memoria contextual inteligente para que PandaPOS AI entienda el restaurante con estado operativo y memoria semantica.

## Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=512
```

## Endpoints

Crear memoria manual:

```http
POST /api/ai-memory/remember
```

```json
{
  "kind": "preference",
  "title": "Mesa 4 suele pedir bebidas",
  "content": "La mesa 4 normalmente repite bebidas despues del primer pedido.",
  "importance": 0.7
}
```

Construir contexto optimizado:

```http
POST /api/ai-memory/context
```

```json
{
  "query": "Lo mismo de siempre para mesa 4"
}
```

## Que recuerda

- Mesas activas
- Pedidos recientes
- Productos populares
- Conversaciones y preferencias
- Estado cocina/KDS
- Horario/configuracion de sucursal
- Clientes frecuentes
- Eventos POS ejecutados por IA

## Arquitectura

- `AiMemoryService`: entrada publica para guardar y recuperar memoria.
- `AiMemoryVectorStore`: vector database inicial sobre MySQL con tabla `ai_memory_vectors`.
- `AiMemoryContext`: mezcla contexto operacional real de Prisma con memoria semantica.
- `createEmbedding`: embeddings OpenAI con `text-embedding-3-small` por defecto.

La tabla vectorial se crea bajo demanda para evitar una migracion obligatoria en esta etapa. Si luego migramos a Supabase Vector, pgvector, Pinecone o Qdrant, se reemplaza solo `AiMemoryVectorStore`.

## Context Window Optimization

El context manager prioriza:

1. Estado operativo actual: mesas, KDS, pedidos activos.
2. Memorias semanticas similares al query.
3. Popularidad y frecuencia.
4. Truncado compacto por seccion para no saturar la ventana del modelo.

## Preparado Para Agentes

Los agentes futuros pueden usar:

- `remember` como herramienta de escritura de memoria.
- `buildContext` como herramienta de recuperacion.
- `retrieve` para busqueda semantica por tipo de memoria.
