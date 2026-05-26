"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Loader2, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface LogEntry {
  id: number;
  accion: string;
  ip: string | null;
  creadoEn: string;
  usuario: {
    id: number;
    nombre: string;
    rol: string;
    sucursal: { nombre: string } | null;
  } | null;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 25;

const ROL_BADGE: Record<string, { bg: string; text: string }> = {
  ADMIN_GENERAL: { bg: "bg-red-500/10",      text: "text-red-700" },
  RESTAURANTE:   { bg: "bg-brand-500/10",     text: "text-brand-700" },
  SECRETARY:     { bg: "bg-violet-500/10",    text: "text-violet-700" },
  CASHIER:       { bg: "bg-emerald-500/10",   text: "text-emerald-700" },
  WAITER:        { bg: "bg-amber-500/10",     text: "text-amber-700" },
  CHEF:          { bg: "bg-orange-500/10",     text: "text-orange-700" },
  BAR:           { bg: "bg-cyan-500/10",       text: "text-cyan-700" },
  DELIVERY:      { bg: "bg-blue-500/10",       text: "text-blue-700" },
};

export function AdminLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  const fetchLogs = useCallback(async (p: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`, { signal: controller.signal });
      if (!res.ok) throw new Error();
      const data: LogsResponse = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast("error", "Error al cargar logs");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function formatFecha(iso: string) {
    const d = new Date(iso);
    const hoy = new Date();
    const esHoy = d.toDateString() === hoy.toDateString();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const esAyer = d.toDateString() === ayer.toDateString();

    const hora = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    if (esHoy) return `Hoy ${hora}`;
    if (esAyer) return `Ayer ${hora}`;
    return `${d.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} ${hora}`;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/10 flex items-center justify-center">
              <FileText size={15} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-text leading-none">Log de Actividad</h2>
              <p className="text-[10px] text-surface-muted mt-0.5">
                {total} registros totales
              </p>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="p-1.5 rounded-lg text-surface-muted hover:text-brand-600 hover:bg-brand-500/10 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-bold text-surface-muted tabular-nums min-w-[40px] text-center">
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg text-surface-muted hover:text-brand-600 hover:bg-brand-500/10 transition-all disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="text-brand-500 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-12 text-center text-surface-muted text-sm">
          No hay registros de actividad
        </div>
      ) : (
        <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl overflow-hidden">
          <div className="divide-y divide-white/40">
            {logs.map(log => {
              const rolCfg = ROL_BADGE[log.usuario?.rol ?? ""] ?? { bg: "bg-slate-100", text: "text-slate-500" };
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/30 transition-colors">
                  {/* Timestamp column */}
                  <div className="shrink-0 w-[72px] pt-0.5">
                    <span className="text-[10px] font-bold text-surface-muted tabular-nums leading-tight">
                      {formatFecha(log.creadoEn)}
                    </span>
                  </div>

                  {/* User avatar */}
                  <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${rolCfg.bg} ${rolCfg.text}`}>
                    {log.usuario ? log.usuario.nombre.charAt(0).toUpperCase() : "?"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-surface-text">
                        {log.usuario?.nombre ?? "Sistema"}
                      </span>
                      {log.usuario && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${rolCfg.bg} ${rolCfg.text}`}>
                          {log.usuario.rol}
                        </span>
                      )}
                      {log.usuario?.sucursal && (
                        <span className="flex items-center gap-0.5 text-[9px] text-surface-muted">
                          <Store size={7} /> {log.usuario.sucursal.nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-surface-muted mt-0.5 leading-snug">{log.accion}</p>
                  </div>

                  {/* IP */}
                  {log.ip && (
                    <span className="shrink-0 text-[9px] font-mono text-surface-muted/60 pt-0.5">
                      {log.ip}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
