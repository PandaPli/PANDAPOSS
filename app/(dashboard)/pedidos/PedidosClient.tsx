"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderCard } from "@/components/pedidos/OrderCard";
import type { PedidoConDetalles, TipoPedido, EstadoPedido } from "@/types";
import { ChefHat, Wine, Bike, UtensilsCrossed, RefreshCw, Moon, Sun, Flame, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKdsUI } from "@/stores/kdsStore";
import type { Rol } from "@/types";
import { useKdsSocket } from "@/hooks/useKdsSocket";

const tipoTabs: { key: TipoPedido | "TODOS"; label: string; icon: React.ReactNode }[] = [
  { key: "TODOS", label: "Todos", icon: <UtensilsCrossed size={16} /> },
  { key: "COCINA", label: "Cocina", icon: <ChefHat size={16} /> },
  { key: "BAR", label: "Bar", icon: <Wine size={16} /> },
  { key: "DELIVERY", label: "Delivery", icon: <Bike size={16} /> },
];

interface Props {
  pedidos: PedidoConDetalles[];
  rol?: Rol;
  sucursalId?: number | null;
  welcome?: { emoji: string; msg: string } | null;
}

// Estaciones visibles por rol. null = ve todo (sin filtro de items)
function getRolEstaciones(rol?: Rol): string[] | null {
  if (rol === "CHEF") return ["COCINA", "CUARTO_CALIENTE"];
  if (rol === "BAR") return ["BARRA"];
  return null;
}

// Filtra los detalles de un pedido segun las estaciones visibles.
// Si el rol no tiene filtro, devuelve el pedido sin cambios.
// Si el pedido no contiene items de ninguna estacion visible, devuelve null.
function filtrarPorEstacion(
  pedido: PedidoConDetalles,
  estaciones: string[] | null
): PedidoConDetalles | null {
  if (!estaciones) return pedido;
  const detallesFiltrados = pedido.detalles.filter(d => {
    const est = d.producto?.categoria?.estacion ?? d.combo?.categoria?.estacion;
    // Si no tiene estacion definida, solo lo mostramos a chef (para no perderlo)
    if (!est) return estaciones.includes("COCINA");
    return estaciones.includes(est);
  });
  if (detallesFiltrados.length === 0) return null;
  return { ...pedido, detalles: detallesFiltrados };
}

export function PedidosClient({ pedidos: initial, rol, sucursalId }: Props) {
  const isDelivery = rol === "DELIVERY";
  const { filter, setFilter, nightMode, toggleNightMode } = useKdsUI();

  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>(initial);
  // Default: delivery ve solo DELIVERY; los demas ven TODOS (cocinero/barman ven
  // tambien pedidos de kiosko que son tipo MOSTRADOR)
  const [tipoFiltro, setTipoFiltro] = useState<TipoPedido | "TODOS">(
    isDelivery ? "DELIVERY" : "TODOS"
  );

  const estacionesRol = getRolEstaciones(rol);

  // ── Fetch todos los estados activos en paralelo ────────────────────────
  const fetchPedidos = useCallback(async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/pedidos?estado=PENDIENTE"),
        fetch("/api/pedidos?estado=EN_PROCESO"),
        fetch("/api/pedidos?estado=LISTO"),
      ]);
      const p1 = r1.ok ? await r1.json() : [];
      const p2 = r2.ok ? await r2.json() : [];
      const p3 = r3.ok ? await r3.json() : [];
      setPedidos([...p1, ...p2, ...p3]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Tiempo real via Socket.IO
  useKdsSocket(sucursalId ?? null, fetchPedidos);

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 8000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  // ── Derivar grupos ─────────────────────────────────────────────────────
  // Aplicamos el filtro de estacion por rol (CHEF/BAR solo ven items de su area).
  // Si un pedido queda sin items visibles, se descarta completamente.
  const pedidosVisibles = pedidos
    .map(p => filtrarPorEstacion(p, estacionesRol))
    .filter((p): p is PedidoConDetalles => p !== null);

  const pendientes = pedidosVisibles.filter(p => p.estado === "PENDIENTE");
  const enProceso  = pedidosVisibles.filter(p => p.estado === "EN_PROCESO");
  const listosAll  = pedidosVisibles.filter(p => p.estado === "LISTO");

  const pendienteCount = pendientes.length;
  const enProcesoCount = enProceso.length;
  const enCursoCount   = pendienteCount + enProcesoCount;
  const listosCount    = listosAll.length;

  // Filtrar por tipo y ordenar (PENDIENTE primero, luego EN_PROCESO, más antiguo primero)
  const enCurso = [...pendientes, ...enProceso]
    .filter(p => tipoFiltro === "TODOS" || p.tipo === tipoFiltro)
    .sort((a, b) => {
      if (a.estado === "PENDIENTE" && b.estado !== "PENDIENTE") return -1;
      if (a.estado !== "PENDIENTE" && b.estado === "PENDIENTE") return 1;
      return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
    });

  const listos = listosAll.filter(p => tipoFiltro === "TODOS" || p.tipo === tipoFiltro);

  const displayed = filter === "EN_CURSO" ? enCurso : listos;

  // ── Handlers ───────────────────────────────────────────────────────────
  async function handleUpdateEstado(id: number, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    if (estado === "CANCELADO") {
      setPedidos(prev => prev.filter(p => p.id !== id));
    } else {
      setPedidos(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, estado, meseroLlamado: estado === "ENTREGADO" ? false : p.meseroLlamado }
            : p
        )
      );
    }

    setTimeout(fetchPedidos, 500);
  }

  async function handleReturnToProcess(id: number) {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "EN_PROCESO", meseroLlamado: false, llamadoTipo: null }),
    });
    setPedidos(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, estado: "EN_PROCESO", meseroLlamado: false, llamadoTipo: null }
          : p
      )
    );
    setTimeout(fetchPedidos, 500);
  }

  async function handleLlamarMesero(id: number) {
    const pedido = pedidos.find(p => p.id === id);
    const llamadoTipo = pedido?.tipo === "DELIVERY" ? "RIDER" : pedido?.mesa ? "MESERO" : "CAJERO";
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meseroLlamado: true, estado: "LISTO", llamadoTipo }),
    });
    setPedidos(prev =>
      prev.map(p =>
        p.id === id ? { ...p, meseroLlamado: true, estado: "LISTO", llamadoTipo } : p
      )
    );
  }

  return (
    <div className={cn("space-y-3 min-h-screen -m-4 sm:-m-6 p-4 sm:p-6 transition-colors duration-300", nightMode ? "bg-gray-950" : "")}>

      {/* ── Fila 1: Vista principal (prominente) + Acciones ────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={cn("flex items-center gap-1 p-1.5 rounded-2xl border", nightMode ? "bg-gray-900 border-gray-700" : "bg-white border-surface-border shadow-sm")}>
          <button
            onClick={() => setFilter("EN_CURSO")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-black transition-all",
              filter === "EN_CURSO"
                ? nightMode ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-orange-500 text-white shadow-md"
                : nightMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Flame size={18} />
            En Curso
            {enCursoCount > 0 && (
              <span className={cn("text-xs rounded-full px-2 py-0.5 min-w-[22px] text-center font-black",
                filter === "EN_CURSO" ? "bg-white/25 text-white" : nightMode ? "bg-gray-700 text-gray-300" : "bg-slate-200 text-slate-700"
              )}>{enCursoCount}</span>
            )}
            {pendienteCount > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] font-black bg-red-500 text-white rounded-full px-2 py-0.5 animate-pulse">
                <AlertTriangle size={11} />
                {pendienteCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("LISTOS")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-black transition-all",
              filter === "LISTOS"
                ? nightMode ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-emerald-500 text-white shadow-md"
                : nightMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <CheckCircle2 size={18} />
            Completados
            {listosCount > 0 && (
              <span className={cn("text-xs rounded-full px-2 py-0.5 min-w-[22px] text-center font-black",
                filter === "LISTOS" ? "bg-white/25 text-white" : nightMode ? "bg-gray-700 text-gray-300" : "bg-slate-200 text-slate-700"
              )}>{listosCount}</span>
            )}
          </button>
        </div>

        {/* Acciones derecha */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={toggleNightMode}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all",
              nightMode
                ? "bg-gray-800 border-gray-700 text-amber-400 hover:bg-gray-700"
                : "bg-white border-surface-border text-surface-muted hover:bg-slate-50 hover:text-slate-700"
            )}
            title="Modo nocturno"
          >
            {nightMode ? <Sun size={13} /> : <Moon size={13} />}
            {nightMode ? "Dia" : "Noche"}
          </button>
          <button
            onClick={fetchPedidos}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors",
              nightMode
                ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                : "bg-white border-surface-border text-surface-muted hover:text-brand-600 hover:bg-brand-50"
            )}
            title="Actualizar"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Fila 2: Filtro por estacion (secundario) ─────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-[10px] font-black uppercase tracking-wider", nightMode ? "text-gray-500" : "text-slate-400")}>
          Estacion
        </span>
        {tipoTabs.map(tab => {
          const count = tab.key === "TODOS"
            ? displayed.length
            : displayed.filter(p => p.tipo === tab.key).length;
          const isActive = tipoFiltro === tab.key;
          const showCount = tab.key !== "TODOS" && count > 0;
          return (
            <button
              key={tab.key}
              onClick={() => setTipoFiltro(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                isActive
                  ? nightMode ? "bg-white text-gray-900" : "bg-slate-800 text-white"
                  : nightMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              {tab.icon}
              {tab.label}
              {showCount && (
                <span className={cn("text-[10px] rounded-full px-1.5 min-w-[16px] text-center font-bold",
                  isActive
                    ? nightMode ? "bg-gray-200 text-gray-800" : "bg-white/25 text-white"
                    : nightMode ? "bg-gray-800 text-gray-400" : "bg-slate-200 text-slate-600"
                )}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Alerta pedidos por confirmar ───────────────────────────── */}
      {pendienteCount > 0 && filter === "EN_CURSO" && (
        <div className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 border animate-pulse",
          nightMode ? "bg-red-950/40 border-red-500/30" : "bg-red-50 border-red-200"
        )}>
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          <span className={cn("font-bold text-sm", nightMode ? "text-red-400" : "text-red-700")}>
            {pendienteCount} pedido{pendienteCount !== 1 ? "s" : ""} esperando confirmacion de caja
          </span>
        </div>
      )}

      {/* ── Grid KDS ──────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div className={cn("p-10 text-center rounded-2xl border", nightMode ? "bg-gray-900 border-gray-800" : "card shadow-sm")}>
          <img src="/logo.png" alt="PandaPoss" className="w-12 h-12 mx-auto mb-3 opacity-40 grayscale" />
          <p className={cn("font-semibold", nightMode ? "text-gray-300" : "text-surface-text")}>
            {filter === "EN_CURSO" ? "No hay pedidos en curso" : "No hay pedidos completados"}
          </p>
          <p className={cn("text-xs mt-1", nightMode ? "text-gray-500" : "text-surface-muted")}>Actualizando automaticamente...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {displayed.map(pedido => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              onUpdateEstado={handleUpdateEstado}
              onLlamarMesero={handleLlamarMesero}
              onReturnToProcess={handleReturnToProcess}
              rol={rol}
              nightMode={nightMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
