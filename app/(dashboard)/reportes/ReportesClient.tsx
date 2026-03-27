"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  ClipboardList,
  Timer,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Printer,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

/* ── Types ────────────────────────────────────────────────────────────── */
type Tab = "cierre" | "auditoria" | "tiempos";

interface BreakdownItem {
  label: string;
  transacciones: number;
  monto: number;
}

interface MovimientoDetalle {
  tipo: "INGRESO" | "RETIRO";
  monto: number;
  motivo: string | null;
  creadoEn: string;
  usuario: { nombre: string } | null;
  caja: { nombre: string } | null;
}

interface CierreDiario {
  fecha: string;
  totalVentas: number;
  totalTransacciones: number;
  anuladas: { cantidad: number; monto: number };
  breakdown: BreakdownItem[];
  movimientos: { ingresos: number; retiros: number; detalle: MovimientoDetalle[] };
  efectivoEsperado: number;
}

interface Evento {
  id: number;
  tipo: string;
  descripcion: string;
  creadoEn: string;
  pedido: { id: number; numero: number; tipo: string; mesa: { nombre: string } | null };
  usuario: { nombre: string } | null;
}

interface TiempoEstacion {
  tipo: string;
  cantidad: number;
  esperaPromedio: number | null;
  prepPromedio: number | null;
  totalPromedio: number | null;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const SIMBOLO = "$";
const fmt = (n: number) => formatCurrency(n, SIMBOLO);
const hoy = () => new Date().toISOString().slice(0, 10);

const TIPO_ICON: Record<string, React.ReactNode> = {
  EFECTIVO:      <Banknote size={16} />,
  TARJETA:       <CreditCard size={16} />,
  TRANSFERENCIA: <ArrowLeftRight size={16} />,
};

const ESTACION_LABEL: Record<string, string> = {
  COCINA:    "Cocina",
  BAR:       "Bar",
  MOSTRADOR: "Mostrador",
  DELIVERY:  "Delivery",
};

function minLabel(min: number | null) {
  if (min === null) return "—";
  if (min < 1) return `${Math.round(min * 60)}s`;
  return `${min} min`;
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════ */
export function ReportesClient() {
  const [tab, setTab] = useState<Tab>("cierre");

  // Cierre
  const [fecha, setFecha] = useState(hoy());
  const [cierre, setCierre] = useState<CierreDiario | null>(null);
  const [loadingCierre, setLoadingCierre] = useState(false);

  // Auditoría
  const [fechaAudit, setFechaAudit] = useState(hoy());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Tiempos
  const [dias, setDias] = useState(7);
  const [tiempos, setTiempos] = useState<TiempoEstacion[]>([]);
  const [loadingTiempos, setLoadingTiempos] = useState(false);

  /* ── Fetch functions ── */
  const fetchCierre = useCallback(async () => {
    setLoadingCierre(true);
    try {
      const r = await fetch(`/api/reportes/caja-diaria?fecha=${fecha}`);
      const d = await r.json();
      setCierre(d);
    } finally {
      setLoadingCierre(false);
    }
  }, [fecha]);

  const fetchAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const r = await fetch(`/api/auditoria/pedidos?fecha=${fechaAudit}&limit=200`);
      const d = await r.json();
      setEventos(d.eventos ?? []);
    } finally {
      setLoadingAudit(false);
    }
  }, [fechaAudit]);

  const fetchTiempos = useCallback(async () => {
    setLoadingTiempos(true);
    try {
      const r = await fetch(`/api/reportes/tiempos?dias=${dias}`);
      const d = await r.json();
      setTiempos(d.resultado ?? []);
    } finally {
      setLoadingTiempos(false);
    }
  }, [dias]);

  useEffect(() => { if (tab === "cierre")    fetchCierre(); },  [tab, fetchCierre]);
  useEffect(() => { if (tab === "auditoria") fetchAudit(); },   [tab, fetchAudit]);
  useEffect(() => { if (tab === "tiempos")   fetchTiempos(); }, [tab, fetchTiempos]);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Reportes</h1>
          <p className="text-sm text-stone-500">Cierre de caja · Auditoría · Tiempos de preparación</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
        {([
          { key: "cierre",    label: "Cierre de Caja",  icon: <BarChart3 size={15} /> },
          { key: "auditoria", label: "Historial",        icon: <ClipboardList size={15} /> },
          { key: "tiempos",   label: "Tiempos KDS",     icon: <Timer size={15} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
              tab === key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ══ TAB: CIERRE DE CAJA ══ */}
      {tab === "cierre" && (
        <div className="space-y-4">
          {/* Controles */}
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fecha}
              max={hoy()}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={fetchCierre}
              disabled={loadingCierre}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(loadingCierre && "animate-spin")} />
              Actualizar
            </button>
            {cierre && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition"
              >
                <Printer size={14} />
                Imprimir
              </button>
            )}
          </div>

          {loadingCierre ? (
            <div className="py-16 text-center text-sm text-stone-400">Cargando...</div>
          ) : cierre ? (
            <div className="space-y-4 print:space-y-3">
              {/* Resumen principal */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Ventas" value={fmt(cierre.totalVentas)} accent="emerald" />
                <StatCard label="Transacciones" value={String(cierre.totalTransacciones)} accent="blue" />
                <StatCard label="Efectivo esperado" value={fmt(cierre.efectivoEsperado)} accent="amber" />
                <StatCard
                  label="Anuladas"
                  value={`${cierre.anuladas.cantidad} (${fmt(cierre.anuladas.monto)})`}
                  accent={cierre.anuladas.cantidad > 0 ? "red" : "stone"}
                />
              </div>

              {/* Desglose por método */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
                  Desglose por método de pago
                </p>
                <div className="space-y-2">
                  {cierre.breakdown.map((b) => (
                    <div key={b.label} className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-stone-600">
                        {TIPO_ICON[Object.keys(TIPO_ICON).find((k) => b.label.toLowerCase().includes(k.toLowerCase())) ?? ""] ?? <Banknote size={16} />}
                        <span className="text-sm font-semibold">{b.label}</span>
                        <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-500">
                          {b.transacciones} vtax
                        </span>
                      </div>
                      <span className="text-sm font-black text-stone-800">{fmt(b.monto)}</span>
                    </div>
                  ))}
                  {cierre.breakdown.length === 0 && (
                    <p className="py-4 text-center text-sm text-stone-400">Sin ventas en esta fecha</p>
                  )}
                </div>
              </div>

              {/* Movimientos de caja */}
              {cierre.movimientos.detalle.length > 0 && (
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
                    Movimientos de caja
                  </p>
                  <div className="mb-3 flex gap-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <TrendingUp size={14} />
                      <span className="text-sm font-semibold">Ingresos: {fmt(cierre.movimientos.ingresos)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <TrendingDown size={14} />
                      <span className="text-sm font-semibold">Retiros: {fmt(cierre.movimientos.retiros)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {cierre.movimientos.detalle.map((m, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                        <div>
                          <span className={cn("font-semibold", m.tipo === "INGRESO" ? "text-emerald-600" : "text-red-500")}>
                            {m.tipo === "INGRESO" ? "+" : "−"}{fmt(m.monto)}
                          </span>
                          <span className="ml-2 text-stone-500">{m.motivo ?? ""}</span>
                          {m.usuario && <span className="ml-2 text-xs text-stone-400">por {m.usuario.nombre}</span>}
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(m.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ══ TAB: AUDITORÍA ══ */}
      {tab === "auditoria" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fechaAudit}
              max={hoy()}
              onChange={(e) => setFechaAudit(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={fetchAudit}
              disabled={loadingAudit}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(loadingAudit && "animate-spin")} />
              Actualizar
            </button>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white">
            {loadingAudit ? (
              <div className="py-16 text-center text-sm text-stone-400">Cargando...</div>
            ) : eventos.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle size={32} className="text-stone-300" />
                <p className="text-sm text-stone-400">Sin eventos en esta fecha</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {eventos.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={cn(
                      "mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      ev.tipo === "ESTADO" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {ev.tipo === "ESTADO" ? "Estado" : "Ítem"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-800">{ev.descripcion}</p>
                      <p className="text-xs text-stone-400">
                        Pedido #{ev.pedido.numero}
                        {ev.pedido.mesa && ` · ${ev.pedido.mesa.nombre}`}
                        {ev.usuario && ` · ${ev.usuario.nombre}`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-stone-400">
                      {new Date(ev.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: TIEMPOS KDS ══ */}
      {tab === "tiempos" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  dias === d
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                )}
              >
                {d} días
              </button>
            ))}
            <button
              onClick={fetchTiempos}
              disabled={loadingTiempos}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(loadingTiempos && "animate-spin")} />
              Actualizar
            </button>
          </div>

          {loadingTiempos ? (
            <div className="py-16 text-center text-sm text-stone-400">Cargando...</div>
          ) : tiempos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white py-16 text-center">
              <Timer size={32} className="text-stone-300" />
              <p className="text-sm font-semibold text-stone-400">Sin datos suficientes</p>
              <p className="text-xs text-stone-400">Los tiempos se registran desde hoy en adelante</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tiempos.map((t) => (
                <div key={t.tipo} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-lg font-black text-stone-800">
                      {ESTACION_LABEL[t.tipo] ?? t.tipo}
                    </p>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
                      {t.cantidad} pedidos
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <TimeCard label="Espera" value={minLabel(t.esperaPromedio)} color="blue" />
                    <TimeCard label="Preparación" value={minLabel(t.prepPromedio)} color="amber" />
                    <TimeCard label="Total" value={minLabel(t.totalPromedio)} color="emerald" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */
function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue:    "bg-blue-50 border-blue-100 text-blue-700",
    amber:   "bg-amber-50 border-amber-100 text-amber-700",
    red:     "bg-red-50 border-red-100 text-red-700",
    stone:   "bg-stone-50 border-stone-100 text-stone-600",
  };
  return (
    <div className={cn("rounded-2xl border p-4", colors[accent] ?? colors.stone)}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function TimeCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue:    "bg-blue-50 text-blue-700",
    amber:   "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={cn("rounded-xl p-3 text-center", colors[color])}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
