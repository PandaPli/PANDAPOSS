import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { Package, Users, TrendingUp, BarChart, ArrowRight, UtensilsCrossed, ShoppingCart, Monitor } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Props {
  sucursalId: number;
  simbolo: string;
  nombre: string;
}

export async function SecretaryPanel({ sucursalId, simbolo, nombre }: Props) {
  const hoyInicio = startOfDay(new Date());
  const hoyFin = endOfDay(new Date());

  const ventaWhere = { caja: { sucursalId } };

  const [ventasHoy, totalProductos, totalActivos] = await Promise.all([
    prisma.venta.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { ...ventaWhere, creadoEn: { gte: hoyInicio, lte: hoyFin }, estado: "PAGADA" },
    }),
    prisma.producto.count({ where: { OR: [{ sucursalId }, { sucursalId: null }] } }),
    prisma.producto.count({ where: { AND: [{ activo: true }, { OR: [{ sucursalId }, { sucursalId: null }] }] } })
  ]);

  const totalHoy = Number(ventasHoy._sum.total ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
             <span className="text-white text-2xl font-bold">{nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bienvenida, {nombre}!</h1>
            <p className="text-emerald-100 text-sm mt-0.5">
              Gestión de Sucursal &mdash;{" "}
              {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Stats resumidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Ventas Hoy"
          value={formatCurrency(totalHoy, simbolo)}
          subtitle={`${ventasHoy._count.id} transacciones registradas`}
          icon={TrendingUp}
          color="brand"
        />
        <StatsCard
          title="Catálogo de Productos"
          value={totalProductos}
          subtitle={`${totalActivos} productos activos`}
          icon={Package}
          color="amber"
        />
        <StatsCard
          title="Personal Sucursal"
          value={"Directorio"}
          subtitle="Ver empleados asignados"
          icon={Users}
          color="violet"
        />
      </div>

      {/* Accesos Directos */}
      <div className="card p-6">
         <h2 className="text-lg font-bold text-surface-text mb-4">Accesos Directos</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/productos"
              className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-bg hover:bg-white hover:border-brand-200 transition-all group"
            >
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-surface-text">Gestión de Productos</p>
                <p className="text-xs text-surface-muted">Editar precios y disponibilidad</p>
              </div>
              <ArrowRight size={16} className="text-surface-muted group-hover:text-amber-500 transition-colors" />
            </Link>

            <Link 
              href="/usuarios"
              className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-bg hover:bg-white hover:border-brand-200 transition-all group"
            >
              <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-surface-text">Directorio Usuarios</p>
                <p className="text-xs text-surface-muted">Mi personal de sucursal</p>
              </div>
              <ArrowRight size={16} className="text-surface-muted group-hover:text-violet-500 transition-colors" />
            </Link>

            <Link 
              href="/ventas"
              className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-bg hover:bg-white hover:border-brand-200 transition-all group"
            >
              <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-surface-text">Reporte de Ventas</p>
                <p className="text-xs text-surface-muted">Revisar historial diario</p>
              </div>
              <ArrowRight size={16} className="text-surface-muted group-hover:text-brand-500 transition-colors" />
            </Link>
         </div>
      </div>
    </div>
  );
}
