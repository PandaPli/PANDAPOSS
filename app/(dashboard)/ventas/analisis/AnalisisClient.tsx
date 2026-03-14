"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  BarChart3, Clock, ShoppingBag, TrendingUp, Users,
  AlertTriangle, Package, ChevronDown, Filter, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type {
  AnalisisData, VentaTurno, TopProducto, BajaRotacion,
  VentaHora, VentaCategoria, AlertaSinVenta,
} from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  fecha:       string;
  desde?:      string;
  hasta?:      string;
  turno:       string;
  usuarioId:   string;
  categoriaId: string;
}

interface Props {
  data:    AnalisisData;
  simbolo: string;
  filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FECHA_LABELS: Record<string, string> = {
  hoy:          "Hoy",
  ayer:         "Ayer",
  "7d":         "Últimos 7 días",
  "30d":        "Últimos 30 días",
  mes:          "Este mes",
  personalizado:"Rango personalizado",
};

const TURNO_COLORS: Record<string, string> = {
  manana: "#F59E0B",
  tarde:  "#3B82F6",
  noche:  "#6C3BFF",
};

const CAT_COLORS = [
  "#6C3BFF", "#10B981", "#3B82F6", "#F59E0B", "#EC4899",
  "#14B8A6", "#8B5CF6", "#F97316",
];

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E6E8F0",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({ filters, usuarios, categorias }: {
  filters:    Filters;
  usuarios:   AnalisisData["usuarios"];
  categorias: AnalisisData["categorias"];
}) {
  const router = useRouter();
  const [local, setLocal] = useState<Filters>({ ...filters });

  const apply = useCallback((next: Partial<Filters>) => {
    const merged = { ...local, ...next };
    setLocal(merged);
    const p = new URLSearchParams();
    if (merged.fecha)       p.set("fecha",       merged.fecha);
    if (merged.turno)       p.set("turno",        merged.turno);
    if (merged.usuarioId)   p.set("usuarioId",    merged.usuarioId);
    if (merged.categoriaId) p.set("categoriaId",  merged.categoriaId);
    if (merged.fecha === "personalizado") {
      if (merged.desde) p.set("desde", merged.desde);
      if (merged.hasta) p.set("hasta", merged.hasta);
    }
    router.push(`/ventas/analisis?${p.toString()}`);
  }, [local, router]);

  return (
    <div className="card flex flex-wrap gap-3 items-end">
      <div className="flex items-center gap-2 mr-1">
        <Filter size={15} className="text-brand-500" />
        <span className="text-xs font-semibold text-surface-muted uppercase tracking-wide">Filtros</span>
      </div>

      {/* Fecha */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-surface-muted">Período</label>
        <div className="relative">
          <select
            value={local.fecha}
            onChange={(e) => apply({ fecha: e.target.value, desde: undefined, hasta: undefined })}
            className="appearance-none bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 pr-7 text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {Object.entries(FECHA_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
        </div>
      </div>

      {/* Custom date range */}
      {local.fecha === "personalizado" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-surface-muted">Desde</label>
            <input
              type="date"
              value={local.desde ?? ""}
              onChange={(e) => setLocal((p) => ({ ...p, desde: e.target.value }))}
              onBlur={() => apply({})}
              className="bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-surface-muted">Hasta</label>
            <input
              type="date"
              value={local.hasta ?? ""}
              onChange={(e) => setLocal((p) => ({ ...p, hasta: e.target.value }))}
              onBlur={() => apply({})}
              className="bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </>
      )}

      {/* Turno */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-surface-muted">Turno</label>
        <div className="relative">
          <select
            value={local.turno}
            onChange={(e) => apply({ turno: e.target.value })}
            className="appearance-none bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 pr-7 text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos</option>
            <option value="manana">Mañana (06–14)</option>
            <option value="tarde">Tarde (14–20)</option>
            <option value="noche">Noche (20–06)</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
        </div>
      </div>

      {/* Usuario */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-surface-muted">Vendedor</label>
        <div className="relative">
          <select
            value={local.usuarioId}
            onChange={(e) => apply({ usuarioId: e.target.value })}
            className="appearance-none bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 pr-7 text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.nombre}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
        </div>
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-surface-muted">Categoría</label>
        <div className="relative">
          <select
            value={local.categoriaId}
            onChange={(e) => apply({ categoriaId: e.target.value })}
            className="appearance-none bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 pr-7 text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.nombre}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" />
        </div>
      </div>

      {/* Clear filters */}
      {(local.turno || local.usuarioId || local.categoriaId || local.fecha !== "hoy") && (
        <button
          onClick={() => apply({ fecha: "hoy", turno: "", usuarioId: "", categoriaId: "", desde: undefined, hasta: undefined })}
          className="mt-4 text-xs text-brand-500 hover:text-brand-700 underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

// ─── Turno card ───────────────────────────────────────────────────────────────

function TurnoCard({ item, simbolo, selected }: { item: VentaTurno; simbolo: string; selected: boolean }) {
  const col = TURNO_COLORS[item.turno] ?? "#6C3BFF";
  return (
    <div
      className={`card flex items-start gap-3 transition-all ${
        selected ? "ring-2 ring-brand-500" : ""
      }`}
    >
      <div className="w-2 h-12 rounded-full shrink-0 mt-1" style={{ backgroundColor: col }} />
      <div className="min-w-0">
        <p className="text-xs text-surface-muted">{item.label}</p>
        <p className="text-xl font-bold text-surface-text leading-tight">
          {formatCurrency(item.total, simbolo)}
        </p>
        <p className="text-xs text-surface-muted mt-0.5">
          {item.pedidos} venta{item.pedidos !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalisisClient({ data, simbolo, filters }: Props) {
  const {
    totalVentas, totalPedidos, ticketPromedio,
    ventasPorTurno, topProductos, bajaRotacion,
    ventasPorHora, ventasPorCategoria, alertasSinVenta,
    usuarios, categorias,
  } = data;

  const periodoLabel = FECHA_LABELS[filters.fecha] ?? filters.fecha;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/ventas"
            className="p-2 text-surface-muted hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-text flex items-center gap-2">
              <BarChart3 size={22} className="text-brand-500" />
              Análisis de Ventas
            </h1>
            <p className="text-surface-muted text-sm mt-0.5">{periodoLabel}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} usuarios={usuarios} categorias={categorias} />

      {/* Alerts */}
      {alertasSinVenta.length > 0 && (
        <div className="card border-l-4 border-amber-400 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {alertasSinVenta.length} producto{alertasSinVenta.length > 1 ? "s" : ""} sin venta en los últimos 7 días
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {alertasSinVenta.slice(0, 6).map((a, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    {a.nombre}
                    {a.diasSinVenta < 999 && ` · ${a.diasSinVenta}d`}
                  </span>
                ))}
                {alertasSinVenta.length > 6 && (
                  <span className="text-xs text-amber-600">+{alertasSinVenta.length - 6} más</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-xl text-brand-600 bg-brand-50">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs text-surface-muted">Total ventas</p>
            <p className="text-xl font-bold text-surface-text">{formatCurrency(totalVentas, simbolo)}</p>
            <p className="text-xs text-surface-muted mt-0.5">{periodoLabel}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-xl text-sky-600 bg-sky-50">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-surface-muted">Pedidos</p>
            <p className="text-xl font-bold text-surface-text">{totalPedidos}</p>
            <p className="text-xs text-surface-muted mt-0.5">en el período</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-xl text-amber-600 bg-amber-50">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-surface-muted">Ticket promedio</p>
            <p className="text-xl font-bold text-surface-text">{formatCurrency(ticketPromedio, simbolo)}</p>
            <p className="text-xs text-surface-muted mt-0.5">por venta</p>
          </div>
        </div>
      </div>

      {/* Ventas por turno */}
      <div>
        <h2 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
          Ventas por turno
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ventasPorTurno.map((t) => (
            <TurnoCard
              key={t.turno}
              item={t}
              simbolo={simbolo}
              selected={filters.turno === t.turno}
            />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Hora pico */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Hora con mayor venta</h3>
              {ventasPorHora.length > 0 && (() => {
                const pico = ventasPorHora.reduce((a, b) => a.total > b.total ? a : b);
                return (
                  <p className="text-xs text-surface-muted">
                    Hora pico: <span className="font-semibold text-brand-600">{pico.hora}</span>
                  </p>
                );
              })()}
            </div>
          </div>
          {ventasPorHora.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-surface-muted text-sm">
              Sin datos para el período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventasPorHora} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8F0" />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${simbolo}${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number, _n, p) => [
                    formatCurrency(v, simbolo),
                    `${p.payload.pedidos} pedido${p.payload.pedidos !== 1 ? "s" : ""}`,
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {ventasPorHora.map((_, i) => (
                    <Cell key={i} fill="#6C3BFF" fillOpacity={0.7 + (i % 3) * 0.1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas por categoría */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <BarChart3 size={16} />
            </div>
            <h3 className="text-sm font-semibold text-surface-text">Ventas por categoría</h3>
          </div>
          {ventasPorCategoria.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-surface-muted text-sm">
              Sin datos para el período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={ventasPorCategoria}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${simbolo}${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  tick={{ fontSize: 10, fill: "#374151" }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(v: number, _n, p) => [
                    formatCurrency(v, simbolo),
                    `${p.payload.pedidos} venta${p.payload.pedidos !== 1 ? "s" : ""}`,
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {ventasPorCategoria.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Products row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top 10 productos */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Productos más vendidos</h3>
              <p className="text-xs text-surface-muted">{periodoLabel}</p>
            </div>
          </div>
          {topProductos.length === 0 ? (
            <p className="text-center text-surface-muted text-sm py-8">Sin ventas de productos en el período</p>
          ) : (
            <ol className="space-y-1.5">
              {topProductos.map((p, i) => (
                <li key={i} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-surface-bg transition-colors">
                  <span className="text-xs font-bold text-surface-muted w-5 text-center shrink-0">
                    {i < 3 ? ["🥇","🥈","🥉"][i] : `${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-text truncate">{p.nombre}</p>
                    <p className="text-xs text-surface-muted">{p.categoria}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{p.cantidad} uds</p>
                    <p className="text-xs text-surface-muted">{formatCurrency(p.total, simbolo)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Baja rotación */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-red-50 text-red-500">
              <Package size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-text">Productos con baja rotación</h3>
              <p className="text-xs text-surface-muted">Menor actividad en el período</p>
            </div>
          </div>
          {bajaRotacion.length === 0 ? (
            <p className="text-center text-surface-muted text-sm py-8">Sin productos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left py-2 px-2 text-xs font-medium text-surface-muted">Producto</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-surface-muted">Vendido</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-surface-muted">Última venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {bajaRotacion.map((p, i) => (
                    <tr key={i} className="hover:bg-surface-bg transition-colors">
                      <td className="py-2 px-2">
                        <p className="font-medium text-surface-text truncate max-w-[140px]">{p.nombre}</p>
                        <p className="text-xs text-surface-muted">{p.categoria}</p>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.cantidad === 0
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          {p.cantidad === 0 ? "Sin ventas" : `${p.cantidad} uds`}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-xs text-surface-muted">
                        {p.ultimaVenta
                          ? new Date(p.ultimaVenta).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })
                          : "Nunca"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
