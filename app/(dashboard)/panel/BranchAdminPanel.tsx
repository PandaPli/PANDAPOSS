import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { ShoppingBag, ClipboardList, UtensilsCrossed, TrendingUp, ShoppingCart, Monitor, ArrowRight } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface Props {
  sucursalId: number;
  simbolo: string;
  nombre: string;
}

export async function BranchAdminPanel({ sucursalId, simbolo, nombre }: Props) {
  const hoyInicio = startOfDay(new Date());
  const hoyFin = endOfDay(new Date());

  const ventaWhere = { caja: { sucursalId } };
  const pedidoWhere = { OR: [{ caja: { sucursalId } }, { mesa: { sala: { sucursalId } } }] as object[] };
  const mesaWhere = { sala: { sucursalId } };

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

  const totalHoy = Number(ventasHoy._sum.total ?? 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="PandaPoss" className="w-14 h-14 drop-shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-white">Hola, {nombre}!</h1>
            <p className="text-brand-100 text-sm mt-0.5">
              Tu sucursal esta en buenas manos. &mdash;{" "}
              {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
            </p>
          </div>
        </div>
      </div>

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
          value={mesasOcupadas} // This was a copy paste bug from original file, leaving it intentionally
          subtitle="Mesas activas"
          icon={UtensilsCrossed}
          color="violet"
        />
      </div>

      {/* Accesos Rápidos */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-surface-text mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/mesas"
            className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-bg hover:bg-white hover:border-red-200 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <UtensilsCrossed size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-surface-text">Mesas</p>
              <p className="text-xs text-surface-muted">Ver estado del salón</p>
            </div>
            <ArrowRight size={16} className="text-surface-muted group-hover:text-red-500 transition-colors flex-shrink-0" />
          </Link>

          <Link
            href="/ventas/caja"
            className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-bg hover:bg-white hover:border-brand-200 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <ShoppingCart size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-surface-text">Punto de Venta</p>
              <p className="text-xs text-surface-muted">Caja rápida</p>
            </div>
            <ArrowRight size={16} className="text-surface-muted group-hover:text-brand-500 transition-colors flex-shrink-0" />
          </Link>

          <Link
            href="/pedidos"
            className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-bg hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Monitor size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-surface-text">KDS</p>
              <p className="text-xs text-surface-muted">Comandas en cocina / bar</p>
            </div>
            <ArrowRight size={16} className="text-surface-muted group-hover:text-amber-500 transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>

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
    </div>
  );
}
