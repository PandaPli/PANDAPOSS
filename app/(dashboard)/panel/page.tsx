import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { ShoppingBag, ClipboardList, UtensilsCrossed, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Rol } from "@/types";

async function getDashboardData(sucursalId: number | null) {
  const hoyInicio = startOfDay(new Date());
  const hoyFin = endOfDay(new Date());

  const [ventasHoy, pedidosActivos, mesasOcupadas, ultimasVentas] = await Promise.all([
    prisma.venta.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { creadoEn: { gte: hoyInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    prisma.pedido.count({
      where: { estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
    }),
    prisma.mesa.count({ where: { estado: "OCUPADA" } }),
    prisma.venta.findMany({
      take: 5,
      orderBy: { creadoEn: "desc" },
      include: { cliente: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
    }),
  ]);

  // Últimos 7 días
  const ventasChart = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const r = await prisma.venta.aggregate({
        _sum: { total: true },
        where: { creadoEn: { gte: startOfDay(day), lte: endOfDay(day) }, estado: "PAGADA" },
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

  const { ventasHoy, pedidosActivos, mesasOcupadas, ultimasVentas, ventasChart } =
    await getDashboardData(sucursalId);

  const nombre = session?.user?.name?.split(" ")[0] ?? "Usuario";
  const totalHoy = Number(ventasHoy._sum.total ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-odoo-text">
          Hola, {nombre}
        </h1>
        <p className="text-odoo-text-muted text-sm mt-1">
          Resumen del día —{" "}
          {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </p>
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

      {/* Gráfico + Últimas ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-odoo-text">Ventas — Últimos 7 días</h2>
              <p className="text-xs text-odoo-text-muted mt-0.5">Ingresos totales por día</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-odoo-purple bg-purple-50 px-2 py-1 rounded font-medium">
              <ShoppingBag size={13} />
              Esta semana
            </div>
          </div>
          <SalesChart data={ventasChart} simbolo={simbolo} />
        </div>

        {/* Últimas ventas */}
        <div className="card p-6">
          <h2 className="font-semibold text-odoo-text mb-4">Últimas Ventas</h2>
          {ultimasVentas.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {ultimasVentas.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      {v.cliente?.nombre ?? "Consumidor Final"}
                    </p>
                    <p className="text-xs text-zinc-400">{formatDateTime(v.creadoEn)}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-600">
                    {formatCurrency(Number(v.total), simbolo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pedidos activos (si es cocinero/bar/repostería) */}
      {rol && ["CHEF", "BAR", "PASTRY", "DELIVERY"].includes(rol) && pedidosActivos > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-amber-600" size={20} />
            <div>
              <p className="font-semibold text-amber-800">
                Tienes {pedidosActivos} pedido{pedidosActivos !== 1 ? "s" : ""} pendiente{pedidosActivos !== 1 ? "s" : ""}
              </p>
              <p className="text-amber-600 text-sm">
                <a href="/pedidos" className="underline hover:no-underline">Ver pedidos →</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
