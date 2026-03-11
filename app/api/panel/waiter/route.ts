import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const hoyInicio = startOfDay(new Date());
  const hoyFin    = endOfDay(new Date());

  const mesaFilter  = sucursalId ? { sala: { sucursalId } } : {};
  const pedidoSucFilter = sucursalId
    ? { OR: [{ mesa: { sala: { sucursalId } } }, { caja: { sucursalId } }] }
    : {};

  const [mesasAtendidasRows, mesasOcupadas, pedidosListos] = await Promise.all([
    // 1. Mesas con al menos un pedido ENTREGADO hoy
    prisma.pedido.findMany({
      where: {
        ...pedidoSucFilter,
        estado: "ENTREGADO",
        mesaId: { not: null },
        creadoEn: { gte: hoyInicio, lte: hoyFin },
      },
      select: { mesaId: true },
      distinct: ["mesaId"],
    }),

    // 2. Mesas OCUPADA con sus pedidos activos
    prisma.mesa.findMany({
      where: { ...mesaFilter, estado: "OCUPADA" },
      include: {
        sala: { select: { nombre: true } },
        pedidos: {
          where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
          orderBy: { creadoEn: "asc" },
          select: { id: true, estado: true, creadoEn: true, tipo: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),

    // 3. Pedidos LISTO (alertas para la mesera)
    prisma.pedido.findMany({
      where: { ...pedidoSucFilter, estado: "LISTO" },
      include: { mesa: { select: { nombre: true } } },
      orderBy: { actualizadoEn: "asc" },
    }),
  ]);

  const mesasActivas = mesasOcupadas
    .filter((m) => m.pedidos.length > 0)
    .map((m) => ({
      id: m.id,
      nombre: m.nombre,
      sala: m.sala.nombre,
      abiertoEn: m.pedidos[0].creadoEn,
      pedidosActivos: m.pedidos.filter((p) =>
        ["PENDIENTE", "EN_PROCESO"].includes(p.estado)
      ).length,
    }));

  const esperando = mesasOcupadas
    .filter((m) => m.pedidos.length === 0)
    .map((m) => ({
      id: m.id,
      nombre: m.nombre,
      sala: m.sala.nombre,
    }));

  const alertas = pedidosListos.map((p) => ({
    id: p.id,
    tipo: p.tipo,
    mesa: p.mesa?.nombre ?? "Mostrador",
    listoEn: p.actualizadoEn,
  }));

  return NextResponse.json({
    mesasAtendidas: mesasAtendidasRows.length,
    mesasActivas,
    alertas,
    esperando,
  });
}
