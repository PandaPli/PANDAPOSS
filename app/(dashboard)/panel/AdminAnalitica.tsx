"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MultiSalesChart } from "@/components/dashboard/MultiSalesChart";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp, Download, Loader2, Timer,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Range = "7d" | "30d" | "90d";

const RANGES: { key: Range; label: string }[] = [
  { key: "7d",  label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "3 meses" },
];

interface VentaRango {
  id: number;
  nombre: string;
  total: number;
  transacciones: number;
}

interface ChartApiResponse {
  chartData: Record<string, number | string>[];
  series: string[];
  ventasRango: VentaRango[];
  range: string;
  desde: string;
  hasta: string;
}

interface Props {
  initialChartData: Record<string, number | string>[];
  initialSeries: string[];
  initialVentasMes: Record<number, number>;
  initialTiempoTotal: Record<number, number>;
  sucursales: { id: number; nombre: string }[];
}

export function AdminAnalitica({
  initialChartData, initialSeries,
  initialVentasMes, initialTiempoTotal, sucursales,
}: Props) {
  const { toast } = useToast();
  const [range, setRange] = useState<Range>("7d");
  const [chartData, setChartData] = useState(initialChartData);
  const [series, setSeries] = useState(initialSeries);
  const [ventasRango, setVentasRango] = useState<VentaRango[]>([]);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const fetchRange = useCallback(async (r: Range) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chart?range=${r}`, { signal: controller.signal });
      if (!res.ok) throw new Error();
      const data: ChartApiResponse = await res.json();
      setChartData(data.chartData);
      setSeries(data.series);
      setVentasRango(data.ventasRango);
      setDesde(data.desde);
      setHasta(data.hasta);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast("error", "Error al cargar datos del gráfico");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (range !== "7d") {
      fetchRange(range);
    }
  }, [range, fetchRange]);

  function handleRangeChange(r: Range) {
    if (r === range) return;
    setRange(r);
    if (r === "7d") {
      setChartData(initialChartData);
      setSeries(initialSeries);
      setVentasRango([]);
    }
  }

  /** Escape a CSV field: wrap in quotes if it contains comma/quote/newline, double any quotes */
  function csvEscape(val: string | number): string {
    const s = String(val);
    // Prevent formula injection: prefix with tab if starts with =, +, -, @, |
    const safe = /^[=+\-@|]/.test(s) ? `\t${s}` : s;
    if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  }

  function exportCSV() {
    try {
      // Build CSV from chart data
      if (chartData.length === 0) {
        toast("info", "No hay datos para exportar");
        return;
      }

      const headers = ["Fecha", ...series.map(csvEscape)];
      const rows = chartData.map(row => {
        return [csvEscape(row.fecha as string), ...series.map(s => csvEscape(row[s] ?? 0))].join(",");
      });

      // Add summary rows
      if (ventasRango.length > 0) {
        rows.push("");
        rows.push("Resumen por Sucursal");
        rows.push("Sucursal,Total,Transacciones");
        for (const v of ventasRango) {
          rows.push(`${csvEscape(v.nombre)},${v.total},${v.transacciones}`);
        }
      }

      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast("ok", "CSV descargado correctamente");
    } catch {
      toast("error", "Error al generar CSV");
    }
  }

  // Rankings (memoized)
  const sortedVentas = useMemo(() =>
    ventasRango.length > 0
      ? [...ventasRango].sort((a, b) => b.total - a.total).slice(0, 5)
      : [...sucursales]
          .map(s => ({ ...s, total: initialVentasMes[s.id] ?? 0 }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5),
    [ventasRango, sucursales, initialVentasMes]
  );

  const sortedActividad = useMemo(() =>
    [...sucursales]
      .map(s => ({ ...s, seg: initialTiempoTotal[s.id] ?? 0 }))
      .sort((a, b) => b.seg - a.seg)
      .slice(0, 5),
    [sucursales, initialTiempoTotal]
  );

  return (
    <div className="space-y-4">
      {/* Chart card */}
      <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-text leading-none">Ventas por Sucursal</h2>
              <p className="text-[10px] text-surface-muted mt-0.5">
                {desde && hasta ? `${desde} — ${hasta}` : "Últimos 7 días — comparativa"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Range selector */}
            <div className="flex gap-0.5 p-0.5 rounded-xl bg-white/40 border border-white/60 backdrop-blur-sm">
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => handleRangeChange(r.key)}
                  disabled={loading}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    range === r.key
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-surface-muted hover:text-brand-600 hover:bg-white/60"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Export button */}
            <button
              onClick={exportCSV}
              disabled={loading}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-white/60 bg-white/40 backdrop-blur-sm text-surface-muted hover:text-brand-600 hover:bg-brand-500/10 transition-all disabled:opacity-40"
              title="Exportar CSV"
            >
              <Download size={11} /> CSV
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <Loader2 size={20} className="text-brand-500 animate-spin" />
            </div>
          )}
          {series.length > 0 ? (
            <MultiSalesChart data={chartData} series={series} simbolo="$" />
          ) : (
            <div className="h-40 flex items-center justify-center text-surface-muted text-sm rounded-xl bg-white/30">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Top ventas */}
        <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-4">
          <h3 className="text-[11px] font-bold text-surface-muted uppercase tracking-wider mb-3">
            {ventasRango.length > 0 ? `Top Ventas (${range})` : "Top Ventas Mes"}
          </h3>
          <div className="space-y-2">
            {sortedVentas.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                  i === 0 ? "bg-amber-400/20 text-amber-700" :
                  i === 1 ? "bg-slate-300/20 text-slate-600" :
                  i === 2 ? "bg-orange-400/15 text-orange-700" :
                  "bg-slate-100 text-slate-400"
                }`}>{i + 1}</span>
                <span className="text-xs font-semibold text-surface-text flex-1 truncate">{s.nombre}</span>
                <span className="text-xs font-black text-surface-text tabular-nums">
                  {formatCurrency(s.total, "$")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad */}
        <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-4">
          <h3 className="text-[11px] font-bold text-surface-muted uppercase tracking-wider mb-3">Actividad por Sucursal</h3>
          <div className="space-y-2">
            {sortedActividad.map((s, i) => {
              const hrs = Math.floor(s.seg / 3600);
              const min = Math.floor((s.seg % 3600) / 60);
              const label = hrs > 0 ? `${hrs}h ${min}m` : `${min}m`;
              return (
                <div key={s.id} className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    i === 0 ? "bg-indigo-400/20 text-indigo-700" :
                    i === 1 ? "bg-indigo-300/15 text-indigo-600" :
                    "bg-slate-100 text-slate-400"
                  }`}>{i + 1}</span>
                  <span className="text-xs font-semibold text-surface-text flex-1 truncate">{s.nombre}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 tabular-nums">
                    <Timer size={10} /> {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
