"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OrderCard } from "@/components/pedidos/OrderCard";
import type { PedidoConDetalles, TipoPedido, EstadoPedido } from "@/types";
import { ChefHat, Wine, Flame, Bike, UtensilsCrossed, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Secciones KDS ────────────────────────────────────────────────────────────
const SECCIONES: {
  key: TipoPedido;
  label: string;
  icon: React.ReactNode;
  color: string;
  badgeBg: string;
  badgeText: string;
  headerBg: string;
}[] = [
  {
    key: "COCINA",
    label: "Cocina",
    icon: <ChefHat size={15} />,
    color: "text-orange-600",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    headerBg: "bg-orange-50 border-orange-200",
  },
  {
    key: "BAR",
    label: "Bar",
    icon: <Wine size={15} />,
    color: "text-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    headerBg: "bg-purple-50 border-purple-200",
  },
  {
    key: "REPOSTERIA",
    label: "Cuarto Caliente",
    icon: <Flame size={15} />,
    color: "text-rose-600",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
    headerBg: "bg-rose-50 border-rose-200",
  },
  {
    key: "DELIVERY",
    label: "Delivery",
    icon: <Bike size={15} />,
    color: "text-sky-600",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    headerBg: "bg-sky-50 border-sky-200",
  },
];

// ─── Columnas de estado ────────────────────────────────────────────────────────
const COLUMNAS: {
  estado: EstadoPedido;
  label: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    estado: "PENDIENTE",
    label: "Pendiente",
    dot: "bg-brand-500",
    badgeBg: "bg-brand-100",
    badgeText: "text-brand-700",
  },
  {
    estado: "EN_PROCESO",
    label: "En Preparación",
    dot: "bg-amber-500",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  {
    estado: "LISTO",
    label: "Listo para servir",
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  pedidos: PedidoConDetalles[];
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PedidosClient({ pedidos: initial }: Props) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(initial);
  const [seccionFiltro, setSeccionFiltro] = useState<TipoPedido | "TODOS">("TODOS");

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    setPedidos(initial);
  }, [initial]);

  // Secciones visibles según filtro
  const seccionesVisibles =
    seccionFiltro === "TODOS"
      ? SECCIONES
      : SECCIONES.filter((s) => s.key === seccionFiltro);

  async function handleUpdateEstado(id: number, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado, meseroLlamado: estado === "ENTREGADO" ? false : p.meseroLlamado }
          : p
      )
    );
    if (estado === "ENTREGADO") {
      setTimeout(refresh, 500);
    }
  }

  async function handleLlamarMesero(id: number) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meseroLlamado: true, estado: "LISTO" }),
    });
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, meseroLlamado: true, estado: "LISTO" } : p
      )
    );
  }

  const totalActivos = pedidos.length;

  return (
    <div className="space-y-5">

      {/* ── Tabs de sección ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* TODOS */}
        <button
          onClick={() => setSeccionFiltro("TODOS")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            seccionFiltro === "TODOS"
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "bg-white border border-surface-border text-surface-muted hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200"
          )}
        >
          <UtensilsCrossed size={15} />
          Todos
          {totalActivos > 0 && (
            <span className={cn(
              "text-xs rounded-full px-2 py-0.5 min-w-[22px] text-center font-bold",
              seccionFiltro === "TODOS" ? "bg-white/25 text-white" : "bg-brand-100 text-brand-600"
            )}>
              {totalActivos}
            </span>
          )}
        </button>

        {/* Separador vertical */}
        <div className="w-px h-8 bg-surface-border mx-1" />

        {/* Secciones */}
        {SECCIONES.map((sec) => {
          const count = pedidos.filter((p) => p.tipo === sec.key).length;
          const active = seccionFiltro === sec.key;
          return (
            <button
              key={sec.key}
              onClick={() => setSeccionFiltro(sec.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                active
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-white border border-surface-border text-surface-muted hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200"
              )}
            >
              {sec.icon}
              {sec.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs rounded-full px-2 py-0.5 min-w-[22px] text-center font-bold",
                  active ? "bg-white/25 text-white" : "bg-brand-100 text-brand-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Botón refrescar */}
        <button
          onClick={refresh}
          className="ml-auto flex items-center gap-2 text-xs text-surface-muted hover:text-brand-600 transition-colors bg-white border border-surface-border px-3 py-2 rounded-xl hover:bg-brand-50"
          title="Actualizar"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* ── Contenido KDS ───────────────────────────────────────────────── */}
      {totalActivos === 0 ? (
        <div className="card p-16 text-center">
          <img src="/logo.png" alt="PandaPoss" className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-surface-text font-semibold text-lg">Sin pedidos activos</p>
          <p className="text-surface-muted text-sm mt-1">Los pedidos apareceran aqui automaticamente</p>
        </div>
      ) : (
        <div className="space-y-8">
          {seccionesVisibles.map((sec) => {
            const pedidosSeccion = pedidos.filter((p) => p.tipo === sec.key);

            // Si no hay pedidos en esta sección y estamos en "TODOS", no mostrar
            if (seccionFiltro === "TODOS" && pedidosSeccion.length === 0) return null;

            return (
              <div key={sec.key} className="space-y-3">
                {/* ── Cabecera de sección ── */}
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl border font-bold text-sm",
                  sec.headerBg,
                  sec.color
                )}>
                  {sec.icon}
                  <span className="uppercase tracking-wide">{sec.label}</span>
                  <span className={cn(
                    "ml-1 text-xs rounded-full px-2.5 py-0.5 font-bold",
                    sec.badgeBg,
                    sec.badgeText
                  )}>
                    {pedidosSeccion.length} pedido{pedidosSeccion.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* ── 3 columnas de estado ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pl-2">
                  {COLUMNAS.map((col) => {
                    const cards = pedidosSeccion.filter((p) => p.estado === col.estado);
                    return (
                      <div key={col.estado} className="space-y-3">
                        {/* Header de columna */}
                        <div className="flex items-center gap-2 px-1">
                          <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", col.dot)} />
                          <h4 className="font-bold text-surface-text text-sm">{col.label}</h4>
                          <span className={cn(
                            "text-xs font-bold rounded-full px-2 py-0.5",
                            col.badgeBg,
                            col.badgeText
                          )}>
                            {cards.length}
                          </span>
                        </div>

                        {/* Cards o placeholder */}
                        {cards.length === 0 ? (
                          <div className="rounded-xl border-2 border-dashed border-surface-border p-6 text-center">
                            <p className="text-surface-muted text-xs">Sin pedidos</p>
                          </div>
                        ) : (
                          cards.map((pedido) => (
                            <OrderCard
                              key={pedido.id}
                              pedido={pedido}
                              onUpdateEstado={handleUpdateEstado}
                              onLlamarMesero={handleLlamarMesero}
                            />
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Si estamos en TODOS pero solo hay pedidos en secciones que no se muestran */}
          {seccionFiltro === "TODOS" && seccionesVisibles.every((s) => pedidos.filter((p) => p.tipo === s.key).length === 0) && (
            <div className="card p-16 text-center">
              <p className="text-surface-muted text-sm">Sin pedidos activos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
