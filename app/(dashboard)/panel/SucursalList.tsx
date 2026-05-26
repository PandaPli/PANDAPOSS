"use client";

import { useState, useMemo, type ReactNode } from "react";
import { Search, X, Filter } from "lucide-react";

type EstadoPago = "PENDIENTE" | "AL_DIA" | "ATRASADO" | "GRATIS" | "SOCIO";

interface SucursalData {
  id: number;
  nombre: string;
  plan: string;
  estadoPago: EstadoPago;
}

const FILTER_PLANS = ["BASICO", "PRO", "PRIME", "DEMO"] as const;
const FILTER_PAGOS: { key: EstadoPago; label: string }[] = [
  { key: "AL_DIA",    label: "Al día" },
  { key: "PENDIENTE", label: "Pendiente" },
  { key: "ATRASADO",  label: "Atrasado" },
  { key: "GRATIS",    label: "Gratis" },
  { key: "SOCIO",     label: "Socio" },
];

interface Props {
  /** Metadata for filtering — parallel array with children */
  sucursales: SucursalData[];
  /** Rendered SucursalRow nodes in the same order as sucursales */
  children: ReactNode[];
}

export function SucursalList({ sucursales, children }: Props) {
  const [query, setQuery]       = useState("");
  const [planFilter, setPlanFilter]   = useState<string | null>(null);
  const [pagoFilter, setPagoFilter]   = useState<EstadoPago | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = !!query.trim() || !!planFilter || !!pagoFilter;

  const visibleIndices = useMemo(() => {
    const q = query.toLowerCase().trim();
    return sucursales
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => {
        if (q && !s.nombre.toLowerCase().includes(q)) return false;
        if (planFilter && s.plan !== planFilter) return false;
        if (pagoFilter && s.estadoPago !== pagoFilter) return false;
        return true;
      })
      .map(({ i }) => i);
  }, [sucursales, query, planFilter, pagoFilter]);

  function clearAll() {
    setQuery("");
    setPlanFilter(null);
    setPagoFilter(null);
  }

  return (
    <div className="space-y-2.5">
      {/* ── Search bar ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar sucursal..."
            className="w-full rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm pl-8 pr-8 py-2 text-xs text-surface-text outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-muted/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-muted/50 hover:text-surface-muted transition"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-all ${
            showFilters || planFilter || pagoFilter
              ? "bg-brand-500/10 border-brand-300/30 text-brand-600"
              : "bg-white/50 border-white/60 text-surface-muted hover:text-brand-600 hover:bg-brand-500/10"
          }`}
          title="Filtros"
        >
          <Filter size={13} />
        </button>
      </div>

      {/* ── Filter chips ── */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {/* Plan filters */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-surface-muted/60 uppercase tracking-wider mr-0.5">Plan:</span>
            {FILTER_PLANS.map(p => (
              <button
                key={p}
                onClick={() => setPlanFilter(planFilter === p ? null : p)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  planFilter === p
                    ? "bg-brand-500/15 text-brand-700 border-brand-300/40"
                    : "bg-white/40 text-surface-muted border-white/50 hover:bg-white/70"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Pago filters */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-surface-muted/60 uppercase tracking-wider mr-0.5">Pago:</span>
            {FILTER_PAGOS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPagoFilter(pagoFilter === key ? null : key)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                  pagoFilter === key
                    ? "bg-brand-500/15 text-brand-700 border-brand-300/40"
                    : "bg-white/40 text-surface-muted border-white/50 hover:bg-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-[10px] font-semibold text-red-500 hover:text-red-600 underline underline-offset-2 transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Results count ── */}
      {hasFilters && (
        <p className="text-[10px] text-surface-muted font-medium">
          {visibleIndices.length} de {sucursales.length} sucursales
        </p>
      )}

      {/* ── Filtered list ── */}
      <div className="space-y-2">
        {visibleIndices.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-8 text-center">
            <p className="text-sm text-surface-muted">Sin resultados para estos filtros</p>
            <button
              onClick={clearAll}
              className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          visibleIndices.map(i => (
            <div key={sucursales[i].id}>{children[i]}</div>
          ))
        )}
      </div>
    </div>
  );
}
