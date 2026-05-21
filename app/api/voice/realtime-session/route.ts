import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { POS_TOOLS } from "@/lib/voice/tools";
import { rateLimit } from "@/lib/rateLimit";

/**
 * POST /api/voice/realtime-session
 *
 * Crea una sesion efimera de OpenAI Realtime con:
 * - Instrucciones contextuales (sucursal, menu, mesas en tiempo real)
 * - Herramientas POS para ejecutar acciones reales
 * - VAD optimizado para restaurantes ruidosos
 */

const OPENAI_REALTIME_SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
  }

  const user = session.user as { id: number; rol: string; sucursalId: number | null; usuario: string };

  // Rate limit: max 5 sesiones realtime por usuario por minuto
  const rl = rateLimit(`voice:session:${user.id}`, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas sesiones de voz. Espera un momento." }, { status: 429 });
  }

  // ── Cargar contexto dinamico de la sucursal ────────────────────────────
  let contextLines: string[] = [];

  if (user.sucursalId) {
    try {
      const [sucursal, categorias, mesasData, kdsStats] = await Promise.all([
        prisma.sucursal.findUnique({
          where: { id: user.sucursalId },
          select: { nombre: true, simbolo: true },
        }),

        // Top 50 productos activos con categoria (para que la IA conozca el menu)
        prisma.producto.findMany({
          where: { sucursalId: user.sucursalId, activo: true },
          select: { nombre: true, precio: true, categoria: { select: { nombre: true } } },
          orderBy: { nombre: "asc" },
          take: 50,
        }),

        // Mesas con su estado actual
        prisma.mesa.findMany({
          where: { sala: { sucursalId: user.sucursalId } },
          select: { nombre: true, estado: true, sala: { select: { nombre: true } } },
          orderBy: [{ salaId: "asc" }, { nombre: "asc" }],
        }),

        // Conteo rapido KDS
        prisma.pedido.groupBy({
          by: ["estado"],
          where: {
            estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
            OR: [
              { caja: { sucursalId: user.sucursalId } },
              { mesa: { sala: { sucursalId: user.sucursalId } } },
              { usuario: { sucursalId: user.sucursalId } },
            ],
          },
          _count: true,
        }),
      ]);

      const simbolo = sucursal?.simbolo ?? "$";

      // Menu resumido
      const menuResumen = categorias
        .slice(0, 40)
        .map((p) => `${p.nombre} ${simbolo}${Number(p.precio).toLocaleString("es-CL")} [${p.categoria?.nombre ?? "Sin cat"}]`)
        .join("; ");

      // Mesas resumidas
      const mesasLibres = mesasData.filter((m) => m.estado === "LIBRE").map((m) => m.nombre);
      const mesasOcupadas = mesasData.filter((m) => m.estado === "OCUPADA").map((m) => m.nombre);

      // KDS resumido
      const kdsMap: Record<string, number> = {};
      for (const g of kdsStats) kdsMap[g.estado] = g._count;

      contextLines = [
        `Sucursal: ${sucursal?.nombre ?? "?"} (ID ${user.sucursalId})`,
        `Moneda: ${simbolo}`,
        `Menu (${categorias.length} productos): ${menuResumen}`,
        `Mesas libres (${mesasLibres.length}): ${mesasLibres.slice(0, 15).join(", ")}${mesasLibres.length > 15 ? "..." : ""}`,
        `Mesas ocupadas (${mesasOcupadas.length}): ${mesasOcupadas.slice(0, 15).join(", ")}${mesasOcupadas.length > 15 ? "..." : ""}`,
        `KDS: ${kdsMap["PENDIENTE"] ?? 0} pendientes, ${kdsMap["EN_PROCESO"] ?? 0} en proceso, ${kdsMap["LISTO"] ?? 0} listos`,
      ];
    } catch (e) {
      console.error("[voice:session] Error cargando contexto:", e);
    }
  }

  const instructions = [
    "Eres PandaPOS Voice, el asistente de voz operacional para restaurantes.",
    "Habla en espanol chileno claro, breve y directo. Maximo 2-3 frases por respuesta.",
    "Tu trabajo es ejecutar acciones POS reales: crear pedidos, consultar mesas, ver cocina, buscar productos, revisar ventas.",
    "Cuando el garzon pide algo, usa las herramientas disponibles para ejecutarlo. No simules ni inventes datos.",
    "Para cancelaciones y acciones destructivas, confirma antes de ejecutar.",
    "Si no entiendes un producto, pregunta. Si no encuentras una mesa, dilo.",
    "No digas 'no puedo hacer eso' — usa las herramientas.",
    "Numeros: di los precios con pesos, ej: 'cinco mil quinientos pesos', no '5500'.",
    "",
    "── CONTEXTO ACTUAL ──",
    `Usuario: ${user.usuario} (ID ${user.id})`,
    `Rol: ${user.rol}`,
    ...contextLines,
  ].join("\n");

  const openaiResponse = await fetch(OPENAI_REALTIME_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview",
      voice: process.env.OPENAI_REALTIME_VOICE ?? "ash",
      instructions,
      tools: POS_TOOLS,
      input_audio_transcription: {
        model: "gpt-4o-mini-transcribe",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.65,
        prefix_padding_ms: 300,
        silence_duration_ms: 600,
      },
    }),
  });

  const data = await openaiResponse.json();

  if (!openaiResponse.ok) {
    console.error("[voice:session] OpenAI error:", data);
    return NextResponse.json(
      { error: "No se pudo crear sesion de voz", details: data },
      { status: openaiResponse.status },
    );
  }

  return NextResponse.json(data);
}
