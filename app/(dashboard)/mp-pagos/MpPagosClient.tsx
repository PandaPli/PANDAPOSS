"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, Clock, XCircle, Ban, CreditCard, RefreshCw, Loader2, DollarSign,
} from "lucide-react";

interface PedidoMp {
  id: number;
  numero: number;
  estado: string;
  mpStatus: string;
  mpPaymentId: string | null;
  monto: number;
  creadoEn: string;
}

interface Resumen {
  approved: number;
  pending_payment: number;
  abandoned: number;
  fallidos: number;
  total: number;
  montoAprobado: number;
}

const MP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  approved:        { label: "Aprobado",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 size={13} /> },
  pending_payment: { label: "Pendiente",  color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: <Clock size={13} /> },
  abandoned:       { label: "Abandonado", color: "text-slate-600",   bg: "bg-slate-50 border-slate-200",     icon: <Ban size={13} /> },
  rejected:        { label: "Rechazado",  color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle size={13} /> },
  cancelled:       { label: "Cancelado",  color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle size={13} /> },
  refunded:        { label: "Reembolsado",color: "text-purple-700",  bg: "bg-purple-50 border-purple-200",   icon: <RefreshCw size={13} /> },
  charged_back:    { label: "Contracargo",color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle size={13} /> },
  sin_estado:      { label: "Sin estado", color: "text-slate-500",   bg: "bg-slate-50 border-slate-200",     icon: <Clock size={13} /> },
};

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export function MpPagosClient() {
  const [dias, setDias] = useState(7);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [pedidos, setPedidos] = useState<PedidoMp[]>([]);
  const [filtro, setFiltro] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/mercadopago/panel?dias=${dias}`);
      if (res.ok) {
        const data = await res.json();
        setResumen(data.resumen);
        setPedidos(data.pedidos);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  const filtered = filtro ? pedidos.filter((p) => p.mpStatus === filtro) : pedidos;

  const cards = resumen
    ? [
        { key: "approved",        label: "Aprobados",   value: resumen.approved,        icon: CheckCircle2, color: "text-emerald-600", ring: "ring-emerald-200" },
        { key: "pending_payment", label: "Pendientes",  value: resumen.pending_payment, icon: Clock,        color: "text-amber-600",   ring: "ring-amber-200" },
        { key: "abandoned",       label: "Abandonados", value: resumen.abandoned,       icon: Ban,          color: "text-slate-500",   ring: "ring-slate-200" },
        { key: "fallidos",        label: "Fallidos",    value: resumen.fallidos,        icon: XCircle,      color: "text-red-600",     ring: "ring-red-200" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Pagos MercadoPago</h1>
          <p className="text-sm text-surface-muted mt-0.5">Estado de transacciones y recuperación de pagos</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="input py-1.5 text-sm w-auto"
          >
            <option value={1}>Hoy</option>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
          <button onClick={fetchData} disabled={loading} className="btn-secondary text-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setFiltro(filtro === c.key ? "" : (c.key === "fallidos" ? "" : c.key))}
            className={`text-left rounded-2xl border border-surface-border bg-white p-4 transition-all hover:shadow-card ${
              filtro === c.key ? `ring-2 ${c.ring}` : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <c.icon size={18} className={c.color} />
              <span className={`text-2xl font-bold ${c.color}`}>{c.value}</span>
            </div>
            <p className="text-xs text-surface-muted mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Monto aprobado */}
      {resumen && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-emerald-700">Total cobrado vía MercadoPago ({dias === 1 ? "hoy" : `${dias} días`})</p>
            <p className="text-xl font-bold text-emerald-800">{money(resumen.montoAprobado)}</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-surface-muted">
          <CreditCard size={40} className="mx-auto mb-2 opacity-30" />
          <p>Sin transacciones MercadoPago en este período</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Pedido</th>
                <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Estado MP</th>
                <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Estado pedido</th>
                <th className="text-right px-4 py-2.5 font-medium text-surface-muted">Monto</th>
                <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Payment ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((p) => {
                const cfg = MP_STATUS_CONFIG[p.mpStatus] ?? MP_STATUS_CONFIG.sin_estado;
                return (
                  <tr key={p.id} className="hover:bg-surface-bg/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-surface-text">#{p.numero || p.id}</td>
                    <td className="px-4 py-2.5 text-surface-muted whitespace-nowrap">
                      {new Date(p.creadoEn).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-surface-muted">{p.estado}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-surface-text">{money(p.monto)}</td>
                    <td className="px-4 py-2.5 text-surface-muted font-mono text-xs">{p.mpPaymentId ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
