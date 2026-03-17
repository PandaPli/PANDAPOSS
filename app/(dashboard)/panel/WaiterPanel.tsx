import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { WaiterPanelClient } from "./WaiterPanelClient";

export async function WaiterPanel() {
  const session  = await getServerSession(authOptions);
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const nombre     = session?.user?.name?.split(" ")[0] ?? "Usuario";

  const hoyInicio = startOfDay(new Date());
  const hoyFin    = endOfDay(new Date());

  const mesaFilter     = sucursalId ? { sala: { sucursalId } } : {};
  const pedidoSucFilter = sucursalId
    ? { OR: [{ mesa: { sala: { sucursalId } } }, { caja: { sucursalId } }] as object[] }
    : {};

  const [mesasAtendidasRows, mesasOcupadas, pedidosListos] = await Promise.all([
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
      abiertoEn: m.pedidos[0].creadoEn.toISOString(),
      pedidosActivos: m.pedidos.filter((p) =>
        ["PENDIENTE", "EN_PROCESO"].includes(p.estado)
      ).length,
    }));

  const esperando = mesasOcupadas
    .filter((m) => m.pedidos.length === 0)
    .map((m) => ({ id: m.id, nombre: m.nombre, sala: m.sala.nombre }));

  const alertas = pedidosListos.map((p) => ({
    id: p.id,
    tipo: p.tipo as "COCINA" | "BAR" | "DELIVERY" | "MOSTRADOR",
    mesa: p.mesa?.nombre ?? "Mostrador",
    listoEn: p.actualizadoEn.toISOString(),
  }));

  const greeting = new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Hola, {nombre}!</h1>
            <p className="text-brand-100 text-sm mt-0.5">
              A dar el mejor servicio! &mdash; {greeting}
            </p>
          </div>
        </div>
      </div>

      {/* Panel cliente */}
      <WaiterPanelClient
        initial={{
          mesasAtendidas: mesasAtendidasRows.length,
          mesasActivas,
          alertas,
          esperando,
        }}
      />
    </div>
  );
}
