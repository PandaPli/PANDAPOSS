import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { PLAN_LIMITS, type PlanTipo } from "@/core/billing/planConfig";
import { MultiSalesChart } from "@/components/dashboard/MultiSalesChart";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, Package, Truck, QrCode, Mail, TrendingUp, CreditCard } from "lucide-react";

async function getAdminData() {
  const sucursales = await prisma.sucursal.findMany({
    include: {
      _count: {
        select: {
          usuarios: { where: { status: "ACTIVO" } },
          cajas: true,
          productos: { where: { activo: true } },
          clientes: { where: { activo: true } },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  const hoy = startOfDay(new Date());
  const hoyFin = endOfDay(new Date());

  const ventasHoyMap: Record<number, { total: number; count: number }> = {};
  await Promise.all(
    sucursales.map(async (s) => {
      const r = await prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { caja: { sucursalId: s.id }, creadoEn: { gte: hoy, lte: hoyFin }, estado: "PAGADA" },
      });
      ventasHoyMap[s.id] = { total: Number(r._sum.total ?? 0), count: r._count.id };
    })
  );

  // Gráfico: ventas por sucursal últimos 7 días
  const dias = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const chartData: Record<string, number | string>[] = await Promise.all(
    dias.map(async (day) => {
      const entry: Record<string, number | string> = { fecha: format(day, "dd/MM") };
      await Promise.all(
        sucursales.map(async (s) => {
          const r = await prisma.venta.aggregate({
            _sum: { total: true },
            where: {
              caja: { sucursalId: s.id },
              creadoEn: { gte: startOfDay(day), lte: endOfDay(day) },
              estado: "PAGADA",
            },
          });
          entry[s.nombre] = Number(r._sum.total ?? 0);
        })
      );
      return entry;
    })
  );

  const totalVentasHoy = Object.values(ventasHoyMap).reduce((sum, v) => sum + v.total, 0);
  return { sucursales, ventasHoyMap, chartData, totalVentasHoy };
}

function UsageBar({ current, max, label, icon: Icon }: {
  current: number; max: number; label: string; icon: React.ElementType;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const barColor = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon size={11} className="text-surface-muted shrink-0" />
      <span className="w-16 text-surface-muted truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div className={`${barColor} h-full rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-semibold text-surface-text">{current}/{max}</span>
    </div>
  );
}

export async function AdminGeneralView() {
  const { sucursales, ventasHoyMap, chartData, totalVentasHoy } = await getAdminData();
  const series = sucursales.map((s) => s.nombre);
  const countBasico = sucursales.filter((s) => s.plan === "BASICO").length;
  const countPro = sucursales.filter((s) => s.plan === "PRO").length;

  return (
    <div className="space-y-6">
      {/* Header PANDAADMIN */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">PANDAADMIN</h1>
              <span className="text-xs bg-brand-500/40 text-brand-200 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                Control General
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              {new Intl.DateTimeFormat("es-CL", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              }).format(new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs text-surface-muted font-semibold uppercase tracking-wide">Sucursales</p>
          <p className="text-3xl font-bold text-surface-text mt-1">{sucursales.length}</p>
          <p className="text-xs text-surface-muted mt-1">registradas</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-400">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Plan BASICO</p>
          <p className="text-3xl font-bold text-surface-text mt-1">{countBasico}</p>
          <p className="text-xs text-surface-muted mt-1">sucursales</p>
        </div>
        <div className="card p-5 border-l-4 border-violet-500">
          <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide">Plan PRO</p>
          <p className="text-3xl font-bold text-surface-text mt-1">{countPro}</p>
          <p className="text-xs text-surface-muted mt-1">sucursales</p>
        </div>
        <div className="card p-5 border-l-4 border-brand-500">
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide">Ventas Globales Hoy</p>
          <p className="text-3xl font-bold text-surface-text mt-1">{formatCurrency(totalVentasHoy, "$")}</p>
          <p className="text-xs text-surface-muted mt-1">todas las sucursales</p>
        </div>
      </div>

      {/* Gráfico multi-sucursal */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-surface-text">Índice de Ventas por Sucursal</h2>
            <p className="text-xs text-surface-muted mt-0.5">Últimos 7 días — comparativa</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl font-semibold">
            <TrendingUp size={13} />
            Esta semana
          </div>
        </div>
        {sucursales.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-surface-muted text-sm">
            No hay sucursales registradas
          </div>
        ) : (
          <MultiSalesChart data={chartData} series={series} simbolo="$" />
        )}
      </div>

      {/* Sucursales grid */}
      <div>
        <h2 className="font-bold text-surface-text mb-3">Sucursales</h2>
        {sucursales.length === 0 ? (
          <div className="card p-10 text-center text-surface-muted">No hay sucursales registradas.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sucursales.map((s) => {
              const plan = s.plan as PlanTipo;
              const limits = PLAN_LIMITS[plan];
              const ventasHoy = ventasHoyMap[s.id];
              const deliveryOk = s.delivery && limits.delivery;
              const menuQROk = s.menuQR && limits.menuQR;
              const correoOk = s.correoActivo && limits.correo;

              return (
                <div key={s.id} className="card p-5 space-y-4">
                  {/* Nombre + plan */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-surface-text truncate">{s.nombre}</p>
                      <p className="text-xs text-surface-muted mt-0.5">
                        Cliente desde{" "}
                        {new Intl.DateTimeFormat("es-CL", {
                          day: "numeric", month: "short", year: "numeric",
                        }).format(new Date(s.creadoEn))}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                        plan === "PRO"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {plan}
                    </span>
                  </div>

                  {/* Ventas hoy */}
                  <div className="flex items-center justify-between bg-brand-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-brand-600 font-medium">Ventas hoy</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-brand-600">
                        {formatCurrency(ventasHoy?.total ?? 0, "$")}
                      </span>
                      <span className="text-xs text-brand-400 ml-1.5">
                        ({ventasHoy?.count ?? 0} tx)
                      </span>
                    </div>
                  </div>

                  {/* APIs / Features */}
                  <div>
                    <p className="text-xs text-surface-muted font-medium mb-2">APIs habilitadas</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                        deliveryOk
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-surface-muted/15 text-surface-muted"
                      }`}>
                        <Truck size={10} />
                        Delivery {deliveryOk ? "✓" : "—"}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        menuQROk
                          ? "bg-blue-100 text-blue-700"
                          : "bg-surface-muted/15 text-surface-muted"
                      }`}>
                        <QrCode size={10} />
                        Menú QR {menuQROk ? "✓" : "—"}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        correoOk
                          ? "bg-purple-100 text-purple-700"
                          : "bg-surface-muted/15 text-surface-muted"
                      }`}>
                        <Mail size={10} />
                        Correo {correoOk ? "✓" : "—"}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                        <CreditCard size={10} />
                        POS ✓
                      </span>
                    </div>
                  </div>

                  {/* Uso de recursos */}
                  <div className="space-y-2 pt-1 border-t border-surface-border">
                    <p className="text-xs text-surface-muted font-medium">Uso del plan</p>
                    <UsageBar current={s._count.usuarios} max={limits.usuarios} label="Usuarios" icon={Users} />
                    <UsageBar current={s._count.cajas} max={limits.cajas} label="Cajas" icon={CreditCard} />
                    <UsageBar current={s._count.productos} max={limits.productos} label="Productos" icon={Package} />
                    <UsageBar current={s._count.clientes} max={limits.clientes} label="Clientes" icon={Users} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
