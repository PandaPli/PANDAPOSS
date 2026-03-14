"use client";

import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface DayData  { fecha: string; total: number }
export interface MetodoData { clave: string; metodo: string; total: number; count: number }

interface Props {
  diario: DayData[];
  metodos: MetodoData[];
  simbolo?: string;
}

const METODO_COLORS: Record<string, string> = {
  EFECTIVO:      "#10B981",
  TARJETA:       "#6C3BFF",
  TRANSFERENCIA: "#3B82F6",
  CREDITO:       "#F59E0B",
  MIXTO:         "#EC4899",
};

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E6E8F0",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export function VentasCharts({ diario, metodos, simbolo = "$" }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Área: ventas últimos 30 días ── */}
      <div className="card lg:col-span-2">
        <h3 className="text-sm font-semibold text-surface-text mb-4">
          Ventas — Últimos 30 días
        </h3>
        {diario.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-surface-muted text-sm">
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={diario} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6C3BFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6C3BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E8F0" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${simbolo}${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v, simbolo), "Ventas"]}
                contentStyle={tooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6C3BFF"
                strokeWidth={2.5}
                fill="url(#gVentas)"
                dot={false}
                activeDot={{ r: 5, fill: "#6C3BFF" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Barras horizontales: métodos de pago ── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-surface-text mb-4">
          Métodos de pago — Este mes
        </h3>
        {metodos.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-surface-muted text-sm">
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={metodos}
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
                dataKey="metodo"
                tick={{ fontSize: 11, fill: "#374151" }}
                tickLine={false}
                axisLine={false}
                width={92}
              />
              <Tooltip
                formatter={(v: number, _n: string, p) => [
                  formatCurrency(v, simbolo),
                  `${p.payload.count} venta${p.payload.count !== 1 ? "s" : ""}`,
                ]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {metodos.map((m, i) => (
                  <Cell key={i} fill={METODO_COLORS[m.clave] ?? "#6C3BFF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
