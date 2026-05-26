import { prisma } from "@/lib/db";
import type { AiMemoryContext, AiMemoryRecord } from "@/server/services/ai-memory.types";

const MAX_CONTEXT_CHARS = 7000;

function compactJson(value: unknown, maxChars: number) {
  const text = JSON.stringify(value);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

function formatMemories(memories: AiMemoryRecord[]) {
  return memories
    .map((memory) => `- [${memory.kind}] ${memory.title}: ${memory.content}`)
    .join("\n");
}

export async function loadOperationalContext(sucursalId: number) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 12);
  const salesSince = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const [activeTables, recentOrders, popularProducts, kitchenStatus, openingHours, frequentCustomers] =
    await Promise.all([
      prisma.mesa.findMany({
        where: { sala: { sucursalId }, estado: { in: ["OCUPADA", "CUENTA", "RESERVADA"] } },
        select: { id: true, nombre: true, estado: true, sala: { select: { nombre: true } } },
        orderBy: { nombre: "asc" },
        take: 40,
      }),
      prisma.pedido.findMany({
        where: {
          creadoEn: { gte: since },
          OR: [{ mesa: { sala: { sucursalId } } }, { usuario: { sucursalId } }],
        },
        include: { mesa: true, detalles: true },
        orderBy: { creadoEn: "desc" },
        take: 20,
      }),
      prisma.detalleVenta.groupBy({
        by: ["productoId", "nombre"],
        where: {
          venta: {
            creadoEn: { gte: salesSince },
            estado: "PAGADA",
            usuario: { sucursalId },
          },
        },
        _sum: { cantidad: true, subtotal: true },
        _count: { id: true },
        orderBy: { _sum: { cantidad: "desc" } },
        take: 12,
      }),
      prisma.pedido.findMany({
        where: {
          estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
          OR: [{ mesa: { sala: { sucursalId } } }, { usuario: { sucursalId } }],
        },
        include: { mesa: true, detalles: true },
        orderBy: { creadoEn: "asc" },
        take: 30,
      }),
      prisma.sucursal.findUnique({
        where: { id: sucursalId },
        select: { id: true, nombre: true, sector: true, delivery: true, menuQR: true, kioskActivo: true },
      }),
      prisma.cliente.findMany({
        where: { sucursalId },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          puntos: true,
          ventas: {
            select: { id: true, total: true, creadoEn: true },
            orderBy: { creadoEn: "desc" },
            take: 5,
          },
        },
        orderBy: [{ puntos: "desc" }, { creadoEn: "desc" }],
        take: 10,
      }),
    ]);

  return {
    activeTables,
    recentOrders,
    popularProducts,
    kitchenStatus,
    openingHours: openingHours ? [openingHours] : [],
    frequentCustomers,
  };
}

export function optimizeContext(input: Omit<AiMemoryContext, "optimizedContext">) {
  const sections = [
    `Mesas activas: ${compactJson(input.activeTables, 1200)}`,
    `Pedidos recientes: ${compactJson(input.recentOrders, 1800)}`,
    `Productos populares: ${compactJson(input.popularProducts, 900)}`,
    `Estado cocina/KDS: ${compactJson(input.kitchenStatus, 1500)}`,
    `Horario/configuracion sucursal: ${compactJson(input.openingHours, 700)}`,
    `Clientes frecuentes: ${compactJson(input.frequentCustomers, 900)}`,
    `Memoria semantica relevante:\n${formatMemories(input.semanticMemories)}`,
  ];

  let context = sections.join("\n\n");
  if (context.length > MAX_CONTEXT_CHARS) {
    context = context.slice(0, MAX_CONTEXT_CHARS);
  }

  return context;
}
