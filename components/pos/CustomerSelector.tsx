"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, X, User, Phone, Star, TrendingUp, ShoppingBag,
  ChevronRight, Plus, Repeat2, Loader2, UserCheck,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface ClienteBasico {
  id: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  puntos?: number;
}

interface ProductoFrecuente {
  productoId: number;
  nombre: string;
  veces: number;
  cantidadTotal: number;
}

interface ResumenCliente {
  cliente: ClienteBasico & { creadoEn: string };
  stats: {
    totalCompras: number;
    totalGastado: number;
    promedioTicket: number;
    ultimaCompra: { fecha: string; monto: number } | null;
  };
  productosFrecuentes: ProductoFrecuente[];
}

/* Producto mínimo del catálogo para "Agregar pedido habitual" */
export interface ProductoCatalogo {
  id: number;
  nombre: string;
  precio: number;
  codigo: string;
  imagen?: string | null;
}

interface Props {
  simbolo?: string;
  puntosConfig?: { activo: boolean; puntosPorMil: number; valorPunto: number };
  /** Catálogo completo para poder buscar y agregar productos frecuentes */
  productos: ProductoCatalogo[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `hace ${Math.floor(days / 30)} mes.`;
  return `hace ${Math.floor(days / 365)} año${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

/* ─── Sub-component: ResultsDropdown ────────────────────────────────────── */

function ResultsDropdown({
  resultados,
  onSelect,
  loading,
  query,
}: {
  resultados: ClienteBasico[];
  onSelect: (c: ClienteBasico) => void;
  loading: boolean;
  query: string;
}) {
  if (!query) return null;
  if (loading) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-surface-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-surface-muted">
          <Loader2 size={13} className="animate-spin" />
          Buscando…
        </div>
      </div>
    );
  }

  if (resultados.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-surface-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 text-xs text-surface-muted">Sin resultados para "{query}"</div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-surface-border rounded-xl shadow-lg overflow-hidden divide-y divide-surface-border/60">
      {resultados.map((c) => (
        <button
          key={c.id}
          onMouseDown={(e) => e.preventDefault()} // evita perder foco del input antes del click
          onClick={() => onSelect(c)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-surface-text truncate">{c.nombre}</p>
            {c.telefono && (
              <p className="text-[11px] text-surface-muted">{c.telefono}</p>
            )}
          </div>
          {(c.puntos ?? 0) > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {c.puntos} pts
            </span>
          )}
          <ChevronRight size={12} className="text-surface-muted flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

/* ─── Sub-component: ClientCardWidget ───────────────────────────────────── */

function ClientCardWidget({
  resumen,
  simbolo,
  puntosConfig,
  puntosCanjeados,
  onPuntosChange,
  onRepetirPedido,
  onQuitar,
  loadingResumen,
}: {
  resumen: ResumenCliente | null;
  simbolo: string;
  puntosConfig?: Props["puntosConfig"];
  puntosCanjeados: number;
  onPuntosChange: (v: number) => void;
  onRepetirPedido: (productos: ProductoFrecuente[]) => void;
  onQuitar: () => void;
  loadingResumen: boolean;
}) {
  const cliente = resumen?.cliente;
  const stats = resumen?.stats;
  const frecuentes = resumen?.productosFrecuentes ?? [];

  // Puntos disponibles del cliente
  const puntosDisponibles = cliente?.puntos ?? 0;
  const maxCanjeable = puntosDisponibles;
  const descuentoPuntos =
    puntosConfig?.activo && puntosCanjeados > 0
      ? puntosCanjeados * (puntosConfig.valorPunto ?? 1)
      : 0;

  return (
    <div className="mt-2 rounded-xl border border-surface-border bg-white overflow-hidden">
      {/* Header del cliente */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-brand-50 border-b border-surface-border/60">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
          <UserCheck size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {cliente ? (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-surface-text truncate">{cliente.nombre}</p>
              </div>
              {cliente.telefono && (
                <p className="text-[11px] text-surface-muted flex items-center gap-1">
                  <Phone size={9} />
                  {cliente.telefono}
                </p>
              )}
            </>
          ) : (
            <div className="h-3.5 w-24 bg-surface-100 rounded animate-pulse" />
          )}
        </div>
        <button
          onClick={onQuitar}
          title="Quitar cliente"
          className="p-1 rounded-lg text-surface-muted hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {loadingResumen ? (
        <div className="px-3 py-3 flex items-center gap-2 text-xs text-surface-muted">
          <Loader2 size={12} className="animate-spin" />
          Cargando historial…
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 divide-x divide-surface-border/60 border-b border-surface-border/60">
              <div className="px-2 py-2 text-center">
                <p className="text-[11px] font-black text-surface-text">{stats.totalCompras}</p>
                <p className="text-[9px] text-surface-muted uppercase tracking-wide leading-tight">Visitas</p>
              </div>
              <div className="px-2 py-2 text-center">
                <p className="text-[11px] font-black text-surface-text">{formatCurrency(stats.promedioTicket, simbolo)}</p>
                <p className="text-[9px] text-surface-muted uppercase tracking-wide leading-tight">Ticket prom.</p>
              </div>
              <div className="px-2 py-2 text-center">
                {stats.ultimaCompra ? (
                  <>
                    <p className="text-[11px] font-black text-surface-text">
                      {formatRelativeDate(stats.ultimaCompra.fecha)}
                    </p>
                    <p className="text-[9px] text-surface-muted uppercase tracking-wide leading-tight">Última compra</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-black text-surface-muted">—</p>
                    <p className="text-[9px] text-surface-muted uppercase tracking-wide leading-tight">Última compra</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Productos frecuentes + botón repetir pedido */}
          {frecuentes.length > 0 && (
            <div className="px-3 py-2 border-b border-surface-border/60">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp size={10} />
                  Pide frecuente
                </p>
                <button
                  onClick={() => onRepetirPedido(frecuentes)}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-full transition-colors"
                >
                  <Repeat2 size={10} />
                  Agregar habitual
                </button>
              </div>
              <div className="space-y-0.5">
                {frecuentes.slice(0, 3).map((p) => (
                  <div key={p.productoId} className="flex items-center gap-1.5">
                    <ShoppingBag size={9} className="text-surface-muted flex-shrink-0" />
                    <span className="text-[11px] text-surface-text truncate flex-1">{p.nombre}</span>
                    <span className="text-[10px] text-surface-muted flex-shrink-0">{p.veces}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Puntos */}
          {puntosConfig?.activo && puntosDisponibles > 0 && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  {puntosDisponibles} pts disponibles
                </p>
                {descuentoPuntos > 0 && (
                  <span className="text-[10px] font-bold text-green-600">
                    −{formatCurrency(descuentoPuntos, simbolo)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPuntosChange(Math.max(0, puntosCanjeados - 10))}
                  disabled={puntosCanjeados <= 0}
                  className="w-6 h-6 rounded-lg border border-surface-border flex items-center justify-center text-xs font-bold text-surface-muted hover:border-amber-400 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={maxCanjeable}
                  value={puntosCanjeados}
                  onChange={(e) => {
                    const v = Math.min(maxCanjeable, Math.max(0, Number(e.target.value) || 0));
                    onPuntosChange(v);
                  }}
                  className="flex-1 text-center text-xs font-bold border border-surface-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  onClick={() => onPuntosChange(Math.min(maxCanjeable, puntosCanjeados + 10))}
                  disabled={puntosCanjeados >= maxCanjeable}
                  className="w-6 h-6 rounded-lg border border-surface-border flex items-center justify-center text-xs font-bold text-surface-muted hover:border-amber-400 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => onPuntosChange(maxCanjeable)}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-700 px-1.5 py-1 rounded-lg hover:bg-amber-50 transition-colors whitespace-nowrap"
                >
                  Usar todos
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function CustomerSelector({ simbolo = "$", puntosConfig, productos }: Props) {
  const { clienteId, setCliente, puntosCanjeados, setPuntosCanjeados, addItem } = useCartStore();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ClienteBasico[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState<ClienteBasico | null>(null);
  const [resumen, setResumen] = useState<ResumenCliente | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Búsqueda con debounce 200ms ───────────────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResultados([]);
      setOpen(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setResultados(data.clientes ?? data ?? []);
        }
      } finally {
        setSearchLoading(false);
      }
      setOpen(true);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* ── Cargar resumen al seleccionar cliente ─────────────────────────────── */
  const cargarResumen = useCallback(async (id: number) => {
    setLoadingResumen(true);
    setResumen(null);
    try {
      const res = await fetch(`/api/clientes/${id}/resumen`);
      if (res.ok) {
        const data: ResumenCliente = await res.json();
        setResumen(data);
      }
    } finally {
      setLoadingResumen(false);
    }
  }, []);

  /* ── Seleccionar cliente ───────────────────────────────────────────────── */
  const handleSelect = useCallback(
    (cliente: ClienteBasico) => {
      setSelectedCliente(cliente);
      setCliente(cliente.id);
      setPuntosCanjeados(0);
      setQuery("");
      setOpen(false);
      setResultados([]);
      cargarResumen(cliente.id);
    },
    [setCliente, setPuntosCanjeados, cargarResumen]
  );

  /* ── Quitar cliente ────────────────────────────────────────────────────── */
  const handleQuitar = useCallback(() => {
    setSelectedCliente(null);
    setCliente(null);
    setPuntosCanjeados(0);
    setResumen(null);
    setQuery("");
  }, [setCliente, setPuntosCanjeados]);

  /* ── Agregar pedido habitual ───────────────────────────────────────────── */
  const handleRepetirPedido = useCallback(
    (frecuentes: ProductoFrecuente[]) => {
      let agregados = 0;
      for (const fp of frecuentes.slice(0, 3)) {
        // Buscar el producto en el catálogo
        const prod = productos.find((p) => p.id === fp.productoId);
        if (!prod) continue;
        addItem({
          id: prod.id,
          tipo: "producto",
          nombre: prod.nombre,
          precio: prod.precio,
          codigo: prod.codigo,
          imagen: prod.imagen ?? undefined,
          cantidad: 1,
          guardado: false,
        });
        agregados++;
      }
      if (agregados > 0) {
        // Feedback visual breve (sin toast pesado)
        const btn = document.getElementById("cs-repetir-btn");
        if (btn) {
          btn.textContent = "✓ Agregado";
          setTimeout(() => {
            btn.textContent = "Agregar habitual";
          }, 1500);
        }
      }
    },
    [addItem, productos]
  );

  /* ── Render ────────────────────────────────────────────────────────────── */

  // Si no hay cliente seleccionado: mostrar buscador
  if (!clienteId || !selectedCliente) {
    return (
      <div className="px-3 pt-2.5 pb-1">
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2 border border-surface-border rounded-xl bg-surface-50 focus-within:border-brand-400 focus-within:bg-white transition-all">
            <Search size={13} className="text-surface-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar cliente por nombre o teléfono…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (resultados.length > 0) setOpen(true); }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              className="flex-1 bg-transparent text-xs text-surface-text placeholder:text-surface-muted outline-none min-w-0"
            />
            {query && (
              <button onClick={() => { setQuery(""); setOpen(false); }} className="text-surface-muted hover:text-surface-text transition-colors">
                <X size={12} />
              </button>
            )}
          </div>

          {open && (
            <ResultsDropdown
              resultados={resultados}
              onSelect={handleSelect}
              loading={searchLoading}
              query={query.trim()}
            />
          )}
        </div>
      </div>
    );
  }

  // Cliente ya seleccionado: mostrar tarjeta
  return (
    <div className="px-3 pt-2.5 pb-1">
      <ClientCardWidget
        resumen={resumen}
        simbolo={simbolo}
        puntosConfig={puntosConfig}
        puntosCanjeados={puntosCanjeados}
        onPuntosChange={setPuntosCanjeados}
        onRepetirPedido={handleRepetirPedido}
        onQuitar={handleQuitar}
        loadingResumen={loadingResumen}
      />
    </div>
  );
}
