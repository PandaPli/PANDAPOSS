"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const PALETTE = [
  "#6C3BFF", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#EC4899", "#14B8A6", "#8B5CF6",
];

interface MultiSalesChartProps {
  data: Record<string, number | string>[];
  series: string[];
  simbolo?: string;
}

export function MultiSalesChart({ data, series, simbolo = "$" }: MultiSalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-surface-muted text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          formatter={(v: number, name: string) => [formatCurrency(v, simbolo), name]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #E6E8F0",
            borderRadius: "12px",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
