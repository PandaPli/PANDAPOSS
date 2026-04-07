"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bike, CheckCircle2, MapPin, Phone, Wallet, RefreshCw,
  Route, Package2, TrendingUp, Navigation, Clock3, X,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { EstadoPedido } from "@/types";

interface PedidoRider {
  id: number;
  estado: EstadoPedido;
  clienteNombre: string;
  telefonoCliente: string | null;
  direccionEntrega: string | null;
  metodoPago: string;
  total: number;
  cargoEnvio: number;
  pagoRider: number;
  creadoEn: string;
}

interface Props {
  pedidos: PedidoRider[];
  simbolo: string;
  riderNombre: string;
}

type Tab = "recoger" | "camino" | "entregados";

export function RepartidorView({ pedidos: initialPedidos, simbolo, riderNombre }: Props) {
  const [pedidos, setPedidos]       = useState(initialPedidos);
  const [tab, setTab]               = useState<Tab>("recoger");
  const [enCamino, setEnCamino]     = useState<Set<number>>(new Set());
  const [loadingId, setLoadingId]   = useState<number | null>(null);
  const knownIdsRef = useRef(new Set(initialPedidos.map((p) => p.id)));

  // Clasificación
  const listos      = pedidos.filter((p) => p.estado === "LISTO" && !enCamino.has(p.id));
  const enRuta      = pedidos.filter((p) => p.estado === "LISTO" && enCamino.has(p.id));
  const entregados  = pedidos.filter((p) => p.estado === "ENTREGADO");

  // Ganancias del día (pagoRider de entregados hoy)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const gananciasHoy = pedidos
    .filter((p) => p.estado === "ENTREGADO" && new Date(p.creadoEn) >= hoy)
    .reduce((acc, p) => acc + p.pagoRider, 0);

  const tabCounts: Record<Tab, number> = {
    recoger:    listos.length,
    camino:     enRuta.length,
    entregados: entregados.length,
  };

  /* ── Polling ── */
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/orders");
      if (!res.ok) return;
      const data = await res.json();
      const fresh: PedidoRider[] = data.pedidos ?? data;
      setPedidos(fresh);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, 20_000);
    return () => clearInterval(id);
  }, [poll]);

  async function confirmarEntrega(pedidoId: number) {
    setLoadingId(pedidoId);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, estado: "ENTREGADO" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos((cur) =>
        cur.map((p) => p.id === pedidoId ? { ...p, estado: "ENTREGADO" } : p)
      );
      setEnCamino((cur) => { const n = new Set(cur); n.delete(pedidoId); return n; });
    } finally {
      setLoadingId(null);
    }
  }

  function salirAEntregar(pedidoId: number) {
    setEnCamino((cur) => new Set(cur).add(pedidoId));
    setTab("camino");
  }

  const currentList =
    tab === "recoger"    ? listos :
    tab === "camino"     ? enRuta :
                           entregados;

  function renderCard(pedido: PedidoRider) {
    const isRecoger   = tab === "recoger";
    const isCamino    = tab === "camino";
    const isEntregado = tab === "entregados";
    const loading     = loadingId === pedido.id;
    const hora        = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const mapsUrl     = pedido.direccionEntrega
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccionEntrega)}`
      : null;

    return (
      <article
        key={pedido.id}
        className={cn(
          "rounded-2xl border bg-white shadow-sm overflow-hidden",
          isEntregado ? "border-emerald-200 opacity-80" : "border-surface-border"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-surface-border/50",
          isEntregado ? "bg-emerald-50/50" : isCamino ? "bg-violet-50/50" : "bg-amber-50/50"
        )}>
          <div className="flex items-center gap-2">
            <span className={cn(
              "h-2 w-2 rounded-full",
              isEntregado ? "bg-emerald-500" : isCamino ? "bg-violet-500" : "bg-amber-400"
            )} />
            <span className="font-mono text-xs font-bold text-surface-muted">#{pedido.id}</span>
            {isEntregado && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                Entregado
              </span>
            )}
            {isCamino && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 uppercase">
                En camino
              </span>
            )}
          </div>
          <span className="text-xs text-surface-muted">{hora}</span>
        </div>

        {/* Cuerpo */}
        <div className="p-4 flex flex-col gap-3">

          {/* Cliente */}
          <p className="text-xl font-black text-surface-text leading-tight">
            {pedido.clienteNombre}
          </p>

          {/* Dirección — tappable a maps */}
          {pedido.direccionEntrega && (
            <a
              href={mapsUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 rounded-xl bg-surface-bg px-4 py-3 hover:bg-blue-50 transition group"
            >
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-400 group-hover:text-blue-500" />
              <span className="text-sm font-semibold text-surface-text leading-snug group-hover:text-blue-600">
                {pedido.direccionEntrega}
              </span>
              <Navigation size={13} className="ml-auto mt-0.5 shrink-0 text-surface-muted/40 group-hover:text-blue-400" />
            </a>
          )}

          {/* Teléfono */}
          {pedido.telefonoCliente && (
            <a
              href={`tel:${pedido.telefonoCliente}`}
              className="flex items-center gap-2.5 rounded-xl bg-surface-bg px-4 py-3 hover:bg-green-50 transition group"
            >
              <Phone size={15} className="shrink-0 text-brand-400 group-hover:text-green-600" />
              <span className="text-sm font-bold text-surface-text group-hover:text-green-700">
                {pedido.telefonoCliente}
              </span>
            </a>
          )}

          {/* Pago + Total */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface-bg px-3 py-2.5">
              <Wallet size={13} className="shrink-0 text-brand-400" />
              <span className="text-sm font-semibold text-surface-text truncate">
                {pedido.metodoPago}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-bg px-3 py-2.5">
              <span className="text-xs text-surface-muted">Total</span>
              <span className="text-sm font-black text-surface-text">{formatCurrency(pedido.total)}</span>
            </div>
          </div>

          {/* Acción */}
          {isRecoger && (
            <button
              onClick={() => salirAEntregar(pedido.id)}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-violet-700"
            >
              <Bike size={20} />
              Salir a entregar
            </button>
          )}

          {isCamino && (
            <button
              onClick={() => void confirmarEntrega(pedido.id)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-95 hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              Confirmar entrega
            </button>
          )}

          {isEntregado && pedido.pagoRider > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-bold text-emerald-700">Tu ganancia</span>
              <span className="text-base font-black text-emerald-700">{formatCurrency(pedido.pagoRider)}</span>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto pb-10">

      {/* ── Header rider ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-surface-text">Hola, {riderNombre.split(" ")[0]} 👋</h1>
          <p className="text-sm text-surface-muted mt-0.5">Panel de repartidor</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100">
          <Bike size={18} className="text-violet-600" />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-3 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Para recoger</p>
          <p className="text-3xl font-black text-amber-700 leading-tight mt-1">{listos.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-3 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">En camino</p>
          <p className="text-3xl font-black text-violet-700 leading-tight mt-1">{enRuta.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-3 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Ganancias</p>
          <p className={cn(
            "font-black text-emerald-700 leading-tight mt-1",
            gananciasHoy > 0 ? "text-lg" : "text-3xl"
          )}>
            {gananciasHoy > 0 ? formatCurrency(gananciasHoy) : "—"}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-surface-border bg-surface-bg p-1.5">
        {([
          { key: "recoger",    label: "Para recoger",  icon: Package2    },
          { key: "camino",     label: "En camino",     icon: Route       },
          { key: "entregados", label: "Entregados",    icon: CheckCircle2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition-all active:scale-95",
              tab === key
                ? "bg-white text-surface-text shadow-sm"
                : "text-surface-muted hover:text-surface-text"
            )}
          >
            <Icon size={17} className={cn(
              tab === key
                ? key === "recoger" ? "text-amber-500"
                  : key === "camino" ? "text-violet-500"
                  : "text-emerald-500"
                : "text-surface-muted/60"
            )} />
            <span>{label}</span>
            {tabCounts[key] > 0 && (
              <span className={cn(
                "min-w-[18px] rounded-full px-1 text-center text-[10px] font-black",
                tab === key ? "bg-surface-bg text-surface-text" : "bg-black/8 text-surface-muted"
              )}>
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {currentList.length > 0 ? (
        <div className="flex flex-col gap-3">
          {currentList.map(renderCard)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white p-14 text-center">
          {tab === "recoger"    && <Package2     size={32} className="mx-auto mb-3 text-surface-muted/30" />}
          {tab === "camino"     && <Route        size={32} className="mx-auto mb-3 text-surface-muted/30" />}
          {tab === "entregados" && <CheckCircle2 size={32} className="mx-auto mb-3 text-surface-muted/30" />}
          <p className="text-sm font-semibold text-surface-muted">
            {tab === "recoger"    && "No hay pedidos listos para recoger"}
            {tab === "camino"     && "No tienes pedidos en camino"}
            {tab === "entregados" && "Aún no has entregado pedidos hoy"}
          </p>
        </div>
      )}
    </div>
  );
}
