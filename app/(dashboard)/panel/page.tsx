import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { ShoppingBag, ClipboardList, UtensilsCrossed, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Rol } from "@/types";
import { AdminGeneralView } from "./AdminGeneralView";
import { WaiterPanel } from "./WaiterPanel";

/* Micro-mensajes por rol */
const ROLE_GREETING: Partial<Record<Rol, string>> = {
  CASHIER:       "Que tengas muchas ventas hoy!",
  WAITER:        "A dar el mejor servicio!",
  CHEF:          "Hoy saldran platos perfectos!",
  BAR:           "A mezclar felicidad!",
  PASTRY:        "Endulzando el dia!",
  ADMIN_GENERAL: "Todo bajo control.",
  ADMIN_SUCURSAL:"Tu sucursal esta en buenas manos.",
};

async function getDashboardData(rol: Rol, sucursalId: number | null) {
  const hoyInicio = startOfDay(new Date());
  const hoyFin = endOfDay(new Date());

  const esSucursal = rol !== "ADMIN_GENERAL" && sucursalId != null;
  const ventaWhere = esSucursal ? { caja: { sucursalId } } : {};
  const pedidoWhere = esSucursal
    ? { OR: [{ caja: { sucursalId } }, { mesa: { sala: { sucursalId } } }] }
    : {};
  const mesaWhere = esSucursal ? { sala: { sucursalId } } : {};

  const [ventasHoy, pedidosActivos, mesasOcupadas, ultimasVentas] = await Promise.all([
    prisma.venta.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { ...ventaWhere, creadoEn: { gte: hoyInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    prisma.pedido.count({
      where: { ...pedidoWhere, estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
    }),
    prisma.mesa.count({ where: { ...mesaWhere, estado: "OCUPADA" } }),
    prisma.venta.findMany({
      where: ventaWhere,
      take: 5,
      orderBy: { creadoEn: "desc" },
      include: { cliente: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
    }),
  ]);

  const ventasChart = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const r = await prisma.venta.aggregate({
        _sum: { total: true },
        where: { ...ventaWhere, creadoEn: { gte: startOfDay(day), lte: endOfDay(day) }, estado: "PAGADA" },
      });
      return { fecha: format(day, "dd/MM"), total: Number(r._sum.total ?? 0) };
    })
  );

  return { ventasHoy, pedidosActivos, mesasOcupadas, ultimasVentas, ventasChart };
}

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const rol = (session?.user as { rol?: Rol })?.rol;

  // ADMIN_GENERAL ve el panel PANDAADMIN
  if (rol === "ADMIN_GENERAL") {
    return <AdminGeneralView />;
  }

  // WAITER ve su panel operativo
  if (rol === "WAITER") {
    return <WaiterPanel />;
  }

  const { ventasHoy, pedidosActivos, mesasOcupadas, ultimasVentas, ventasChart } =
    await getDashboardData(rol ?? "CASHIER", sucursalId);

  const nombre = session?.user?.name?.split(" ")[0] ?? "Usuario";
  const totalHoy = Number(ventasHoy._sum.total ?? 0);
  const greeting = rol ? ROLE_GREETING[rol] : undefined;

  return (
    <div className="space-y-6">
      {/* Header con saludo personalizado */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="PandaPoss" className="w-14 h-14 drop-shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Hola, {nombre}!
            </h1>
            <p className="text-brand-100 text-sm mt-0.5">
              {greeting ?? "Ten un maravilloso turno!"} &mdash;{" "}
              {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas Hoy"
          value={formatCurrency(totalHoy, simbolo)}
          subtitle={`${ventasHoy._count.id} transacciones`}
          icon={TrendingUp}
          color="brand"
        />
        <StatsCard
          title="Pedidos Activos"
          value={pedidosActivos}
          subtitle="En cocina / bar"
          icon={ClipboardList}
          color="amber"
        />
        <StatsCard
          title="Mesas Ocupadas"
          value={mesasOcupadas}
          subtitle="En este momento"
          icon={UtensilsCrossed}
          color="emerald"
        />
        <StatsCard
          title="Total Mesas"
          value={mesasOcupadas}
          subtitle="Mesas activas"
          icon={UtensilsCrossed}
          color="violet"
        />
      </div>

      {/* Grafico + Ultimas ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-surface-text">Ventas — Ultimos 7 dias</h2>
              <p className="text-xs text-surface-muted mt-0.5">Ingresos totales por dia</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl font-semibold">
              <ShoppingBag size={13} />
              Esta semana
            </div>
          </div>
          <SalesChart data={ventasChart} simbolo={simbolo} />
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-surface-text mb-4">Ultimas Ventas</h2>
          {ultimasVentas.length === 0 ? (
            <div className="text-center py-8">
              <img src="/logo.png" alt="PandaPoss" className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-surface-muted text-sm">Sin ventas hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ultimasVentas.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-surface-text">
                      {v.cliente?.nombre ?? "Consumidor Final"}
                    </p>
                    <p className="text-xs text-surface-muted">{formatDateTime(v.creadoEn)}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-500">
                    {formatCurrency(Number(v.total), simbolo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerta pedidos activos */}
      {rol && ["CHEF", "BAR", "PASTRY", "DELIVERY"].includes(rol) && pedidosActivos > 0 && (
        <div className="card p-5 border-brand-200 bg-brand-50">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-brand-500" size={20} />
            <div>
              <p className="font-semibold text-brand-800">
                Tienes {pedidosActivos} pedido{pedidosActivos !== 1 ? "s" : ""} pendiente{pedidosActivos !== 1 ? "s" : ""}
              </p>
              <p className="text-brand-600 text-sm">
                <a href="/pedidos" className="underline hover:no-underline">Ver pedidos →</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
