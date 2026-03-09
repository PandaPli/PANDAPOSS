"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  fecha: string;
  total: number;
}

interface SalesChartProps {
  data: DataPoint[];
  simbolo?: string;
}

export function SalesChart({ data, simbolo = "$" }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-surface-muted text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6C3BFF" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6C3BFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6E8F0" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${simbolo}${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v, simbolo), "Ventas"]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #E6E8F0",
            borderRadius: "12px",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#6C3BFF"
          strokeWidth={2.5}
          fill="url(#colorVentas)"
          dot={{ fill: "#6C3BFF", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: "#6C3BFF" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
