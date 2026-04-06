"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Entrega {
  id: number;
  pedidoNumero: number;
  direccion: string;
  zona: string | null;
  pago: number;
  fecha: string;
}

interface EarningsData {
  period: string;
  total: number;
  cantidad: number;
  entregas: Entrega[];
}

type Period = "today" | "week" | "month";

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/driver/earnings?period=${period}`)
      .then((r) => r.json())
      .then((d: EarningsData) => setData(d))
      .finally(() => setLoading(false));
  }, [period]);

  const periodLabel: Record<Period, string> = {
    today: "Hoy",
    week: "Últimos 7 días",
    month: "Este mes",
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <header className="bg-white px-4 pt-10 pb-4 border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/driver" className="p-2 rounded-xl hover:bg-stone-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">PandaDriver</p>
            <h1 className="font-black text-lg text-stone-900">Mis ganancias</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Selector de período */}
        <div className="bg-white rounded-2xl border border-stone-200 p-1.5 flex gap-1">
          {(["today", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                period === p
                  ? "bg-stone-900 text-white shadow"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-stone-400" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* Total */}
            <div className="bg-stone-900 rounded-[1.8rem] p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase font-bold tracking-widest text-stone-400">
                  {periodLabel[period]}
                </p>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <p className="text-4xl font-black">{formatCurrency(data.total)}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-stone-400">
                  <Package size={14} />
                  <span>{data.cantidad} entrega{data.cantidad !== 1 ? "s" : ""}</span>
                </div>
                {data.cantidad > 0 && (
                  <span className="text-sm text-stone-400">
                    · Promedio {formatCurrency(Math.round(data.total / data.cantidad))} c/u
                  </span>
                )}
              </div>
            </div>

            {/* Lista de entregas */}
            <div>
              <p className="text-[11px] uppercase tracking-widest font-black text-stone-400 mb-3 px-1">
                Detalle de entregas
              </p>

              {data.entregas.length === 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                  <Package size={28} className="mx-auto mb-3 text-stone-300" />
                  <p className="text-stone-400 text-sm font-medium">Sin entregas en este período</p>
                </div>
              )}

              <div className="space-y-2">
                {data.entregas.map((e) => (
                  <div key={e.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900 text-sm">Pedido #{e.pedidoNumero}</p>
                      <p className="text-xs text-stone-500 mt-0.5 truncate max-w-[200px]">{e.direccion}</p>
                      <div className="flex gap-3 mt-1">
                        {e.zona && <span className="text-[10px] text-stone-400">{e.zona}</span>}
                        <span className="text-[10px] text-stone-400">
                          {new Date(e.fecha).toLocaleString("es-CL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="font-black text-emerald-600 text-lg">+{formatCurrency(e.pago)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
