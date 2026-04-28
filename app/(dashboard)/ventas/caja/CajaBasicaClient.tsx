"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  Wallet,
  X,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  CheckCircle2,
  Pencil,
  Check,
  ChevronRight,
  ShoppingCart,
  Tag,
  Star,
  UserCircle,
  Zap,
  LayoutGrid,
} from "lucide-react";
import { formatCurrency, normalize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { NotificacionesCajero } from "@/components/pedidos/NotificacionesCajero";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type LineItem = {
  tempId: string;
  productoId?: number;
  nombre: string;
  precioBase: number;
  precio: number;
  cantidad: number;
  esTemp: boolean;
};

type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  codigo?: string | null;
  imagen?: string | null;
  categoria?: { nombre: string };
}

interface ClienteResultado {
  id: number;
  nombre: string;
  telefono: string | null;
  puntos: number;
}

interface PuntosConfig {
  activo: boolean;
  puntosPorMil: number;
  valorPunto: number;
}

interface Props {
  productos: Producto[];
  simbolo: string;
  cajaId?: number;
  cajaNombre?: string;
  usuarioId: number;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  sucursalRut?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalGiroComercial?: string | null;
  puntosConfig?: PuntosConfig;
  /** Cuando es true el componente fue abierto desde /ventas/nueva?modo=express */
  modoExpress?: boolean;
}

let _cnt = 0;
const uid = () => `t_${++_cnt}_${Date.now()}`;

const METODOS: { key: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { key: "EFECTIVO", label: "Efectivo", icon: <Banknote size={18} /> },
  { key: "TARJETA", label: "Tarjeta", icon: <CreditCard size={18} /> },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: <ArrowLeftRight size={18} /> },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function parseMonto(s: string) {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function CajaBasicaClient({
  productos,
  simbolo,
  cajaId,
  cajaNombre,
  usuarioId,
  sucursalNombre,
  sucursalRut,
  sucursalTelefono,
  sucursalDireccion,
  sucursalGiroComercial,
  puntosConfig,
  modoExpress = false,
}: Props) {
  /* ── State ── */
  const [items, setItems] = useState<LineItem[]>([]);
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<"productos" | "ticket">("productos");

  // Cliente seleccionado
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteResultados, setClienteResultados] = useState<ClienteResultado[]>([]);
  const [clienteBuscando, setClienteBuscando] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteResultado | null>(null);
  const [puntosACanjear, setPuntosACanjear] = useState(0);
  const clienteSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline price editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // Temp product modal
  const [showTemp, setShowTemp] = useState(false);
  const [tempNombre, setTempNombre] = useState("");
  const [tempPrecio, setTempPrecio] = useState("");

  // Total override
  const [overrideTotal, setOverrideTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState("");

  // Payment modal
  const [showPago, setShowPago] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [efectivoStr, setEfectivoStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState<{ numero: string; total: number; puntosGanados?: number } | null>(null);

  /* ── Derived ── */
  const productosFiltrados = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return productos;
    return productos.filter(
      (p) =>
        normalize(p.nombre).includes(q) ||
        normalize(p.codigo ?? "").includes(q) ||
        normalize(p.categoria?.nombre ?? "").includes(q)
    );
  }, [productos, search]);

  // Group products by category
  const porCategoria = useMemo(() => {
    const map = new Map<string, Producto[]>();
    for (const p of productosFiltrados) {
      const cat = p.categoria?.nombre ?? "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [productosFiltrados]);

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalOverride = overrideTotal && manualTotal ? parseMonto(manualTotal) : null;
  const totalSinPuntos = totalOverride !== null ? Math.min(subtotal, Math.max(0, totalOverride)) : subtotal;
  const descuentoManual = subtotal - totalSinPuntos;

  // Descuento por canje de puntos
  const descuentoPuntos =
    puntosConfig?.activo && clienteSeleccionado && puntosACanjear > 0
      ? puntosACanjear * puntosConfig.valorPunto
      : 0;

  const totalFinal = Math.max(0, totalSinPuntos - descuentoPuntos);
  const descuento = descuentoManual + descuentoPuntos;

  // Puntos que ganará en esta compra
  const puntosAGanar =
    puntosConfig?.activo && clienteSeleccionado
      ? Math.floor((totalFinal * puntosConfig.puntosPorMil) / 1000)
      : 0;

  const vuelto =
    metodo === "EFECTIVO" && efectivoStr
      ? Math.max(0, parseMonto(efectivoStr) - totalFinal)
      : 0;

  /* ── Client search ── */
  const buscarCliente = useCallback((q: string) => {
    if (clienteSearchRef.current) clearTimeout(clienteSearchRef.current);
    if (!q.trim()) { setClienteResultados([]); return; }
    clienteSearchRef.current = setTimeout(async () => {
      setClienteBuscando(true);
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setClienteResultados(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setClienteResultados([]);
      } finally {
        setClienteBuscando(false);
      }
    }, 300);
  }, []);

  function seleccionarCliente(c: ClienteResultado) {
    setClienteSeleccionado(c);
    setClienteSearch("");
    setClienteResultados([]);
    setPuntosACanjear(0);
  }

  function quitarCliente() {
    setClienteSeleccionado(null);
    setPuntosACanjear(0);
  }

  /* ── Cart operations ── */
  function addProduct(p: Producto) {
    setItems((prev) => {
      const ex = prev.find((i) => i.productoId === p.id);
      if (ex) return prev.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [
        ...prev,
        { tempId: uid(), productoId: p.id, nombre: p.nombre, precioBase: p.precio, precio: p.precio, cantidad: 1, esTemp: false },
      ];
    });
    // on mobile, flash ticket tab
    if (mobileTab === "productos") {
      // subtle: don't switch, user can see counter
    }
  }

  function updateCantidad(tempId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.tempId === tempId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  }

  function removeItem(tempId: string) {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  }

  function startEdit(item: LineItem) {
    setEditingId(item.tempId);
    setEditVal(String(item.precio));
    setTimeout(() => editRef.current?.select(), 30);
  }

  function confirmEdit(tempId: string) {
    const val = parseMonto(editVal);
    if (!isNaN(val) && val >= 0) {
      setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, precio: val } : i)));
    }
    setEditingId(null);
  }

  function addTemp() {
    if (!tempNombre.trim()) return;
    const precio = parseMonto(tempPrecio);
    if (isNaN(precio) || precio < 0) return;
    setItems((prev) => [
      ...prev,
      { tempId: uid(), nombre: tempNombre.trim(), precioBase: precio, precio, cantidad: 1, esTemp: true },
    ]);
    setTempNombre("");
    setTempPrecio("");
    setShowTemp(false);
  }

  function resetVenta() {
    setItems([]);
    setOverrideTotal(false);
    setManualTotal("");
    setEfectivoStr("");
    setMetodo("EFECTIVO");
    setSuccess(null);
    setErrorMsg("");
    setMobileTab("productos");
    setClienteSeleccionado(null);
    setPuntosACanjear(0);
    setClienteSearch("");
    setClienteResultados([]);
  }

  /* ── Checkout ── */
  async function confirmar() {
    if (!items.length) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const ventaItems = items.map((i) => ({
        productoId: i.productoId ?? null,
        comboId: null,
        nombre: i.esTemp ? i.nombre : null,
        cantidad: i.cantidad,
        precio: i.precio,
        subtotal: i.precio * i.cantidad,
      }));

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: ventaItems,
          cajaId,
          usuarioId,
          clienteId: clienteSeleccionado?.id ?? null,
          subtotal,
          descuento,
          impuesto: 0,
          total: totalFinal,
          metodoPago: metodo,
          pagos: [{ metodoPago: metodo, monto: totalFinal }],
          puntosCanjeados: puntosACanjear > 0 ? puntosACanjear : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar venta");
      setSuccess({ numero: data.numero ?? `#${data.id}`, total: totalFinal, puntosGanados: puntosAGanar });
      setShowPago(false);
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════
     SUCCESS SCREEN
  ══════════════════════════════════════════════════════════ */
  if (success) {
    return (
      <div className="-m-6 flex h-[calc(100vh-52px)] flex-col items-center justify-center gap-6 bg-[#f8f9fb] px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={44} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-stone-800">¡Venta registrada!</p>
          <p className="mt-1 text-sm text-stone-500">{success.numero}</p>
          <p className="mt-2 text-3xl font-black text-stone-900">{formatCurrency(success.total, simbolo)}</p>
          {success.puntosGanados && success.puntosGanados > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
              <Star size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-amber-700">
                +{success.puntosGanados} puntos ganados
              </span>
            </div>
          ) : null}
        </div>
        <button
          onClick={resetVenta}
          className="mt-2 rounded-2xl bg-stone-900 px-10 py-4 text-base font-bold text-white shadow-lg transition hover:bg-stone-700 active:scale-95"
        >
          Nueva venta
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     MAIN LAYOUT
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="-m-6 flex h-[calc(100vh-52px)] flex-col bg-[#f8f9fb]">
      <NotificacionesCajero />

      {/* ── Top bar ── */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href={modoExpress ? "/ventas/nueva" : "/panel"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Volver</span>
        </Link>

        <div className="flex items-center gap-2">
          {modoExpress ? (
            <>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500">
                <Zap size={14} className="fill-white text-white" />
              </div>
              <h1 className="font-bold text-stone-800">Express</h1>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Venta rápida
              </span>
            </>
          ) : (
            <>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <ShoppingCart size={14} className="text-white" />
              </div>
              <h1 className="font-bold text-stone-800">Caja Básica</h1>
            </>
          )}
        </div>

        {modoExpress && (
          <Link
            href="/ventas/nueva"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm hover:bg-stone-100 transition"
            title="Volver al modo completo con mesas y comandas"
          >
            <LayoutGrid size={13} />
            <span className="hidden sm:inline">Modo Completo</span>
          </Link>
        )}

        <div className="ml-auto flex items-center gap-2">
          {cajaId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Wallet size={11} />
              {cajaNombre ?? "Caja abierta"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <AlertTriangle size={11} />
              Sin caja
            </span>
          )}
        </div>
      </div>

      {/* ── Mobile tabs ── */}
      <div className="flex flex-shrink-0 border-b border-stone-200 bg-white md:hidden">
        {(["productos", "ticket"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors capitalize",
              mobileTab === tab
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-stone-400"
            )}
          >
            {tab === "ticket" && items.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {items.length}
              </span>
            )}
            {tab === "productos" ? "Productos" : "Ticket"}
          </button>
        ))}
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ PRODUCTS PANEL ══ */}
        <div className={cn(
          "flex flex-col gap-3 overflow-hidden border-r border-stone-200 bg-white p-3",
          "md:flex md:w-[58%]",
          mobileTab === "ticket" ? "hidden md:flex" : "flex w-full"
        )}>
          {/* Search + add temp */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setShowTemp(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-700 transition active:scale-95"
              title="Producto libre"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Libre</span>
            </button>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto">
            {porCategoria.length === 0 ? (
              <p className="py-10 text-center text-sm text-stone-400">Sin resultados</p>
            ) : (
              <div className="space-y-4">
                {porCategoria.map(([cat, prods]) => (
                  <div key={cat}>
                    <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      {cat}
                    </p>
                    <div className="space-y-1">
                      {prods.map((p) => {
                        const enCarrito = items.find((i) => i.productoId === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:shadow-sm active:scale-[0.98]",
                              enCarrito
                                ? "border-brand-200 bg-brand-50"
                                : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white"
                            )}
                          >
                            {p.imagen ? (
                              <img
                                src={p.imagen}
                                alt={p.nombre}
                                className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-stone-200 text-lg">
                                🛒
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-stone-800">{p.nombre}</p>
                              {p.codigo && <p className="text-[10px] text-stone-400">{p.codigo}</p>}
                            </div>
                            <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                              <span className="text-sm font-black text-brand-600">
                                {formatCurrency(p.precio, simbolo)}
                              </span>
                              {enCarrito && (
                                <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                  {enCarrito.cantidad}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ TICKET PANEL ══ */}
        <div className={cn(
          "flex flex-col bg-[#f8f9fb]",
          "md:flex md:w-[42%]",
          mobileTab === "productos" ? "hidden md:flex" : "flex w-full"
        )}>
          {/* Ticket header */}
          <div className="flex-shrink-0 border-b border-stone-200 bg-white px-4 py-3">
            <p className="text-sm font-bold text-stone-700">Ticket</p>
          </div>

          {/* ── Cliente (solo si puntosConfig.activo) ── */}
          {puntosConfig?.activo && (
            <div className="flex-shrink-0 border-b border-stone-100 bg-white px-3 py-2">
              {clienteSeleccionado ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                  <UserCircle size={16} className="text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">{clienteSeleccionado.nombre}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-amber-500" />
                      <span className="text-xs text-amber-700 font-semibold">{clienteSeleccionado.puntos} pts disponibles</span>
                    </div>
                  </div>
                  <button onClick={quitarCliente} className="rounded-lg p-1 hover:bg-amber-100 transition">
                    <X size={13} className="text-stone-400" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <UserCircle size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o teléfono..."
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      buscarCliente(e.target.value);
                    }}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-8 pr-3 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                  {clienteSearch && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
                      {clienteBuscando ? (
                        <p className="px-3 py-2 text-xs text-stone-400">Buscando...</p>
                      ) : clienteResultados.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-stone-400">Sin resultados</p>
                      ) : (
                        clienteResultados.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => seleccionarCliente(c)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-stone-50 transition border-b border-stone-100 last:border-0"
                          >
                            <UserCircle size={14} className="text-stone-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-800 truncate">{c.nombre}</p>
                              {c.telefono && <p className="text-[10px] text-stone-400">{c.telefono}</p>}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Star size={10} className="text-amber-500" />
                              <span className="text-[10px] font-bold text-amber-600">{c.puntos}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Canje de puntos */}
              {clienteSeleccionado && clienteSeleccionado.puntos > 0 && items.length > 0 && (
                <div className="mt-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-stone-600">Canjear puntos</span>
                    <span className="text-[10px] text-stone-400">
                      1 pt = {formatCurrency(puntosConfig.valorPunto, simbolo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPuntosACanjear((p) => Math.max(0, p - 10))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-200 text-stone-600 font-bold hover:bg-stone-300 transition"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={clienteSeleccionado.puntos}
                      value={puntosACanjear}
                      onChange={(e) => {
                        const v = Math.min(clienteSeleccionado.puntos, Math.max(0, parseInt(e.target.value) || 0));
                        setPuntosACanjear(v);
                      }}
                      className="w-16 rounded-lg border border-stone-200 bg-white px-2 py-1 text-center text-sm font-bold outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => setPuntosACanjear((p) => Math.min(clienteSeleccionado.puntos, p + 10))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-200 text-stone-600 font-bold hover:bg-stone-300 transition"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setPuntosACanjear(clienteSeleccionado.puntos)}
                      className="ml-auto text-[10px] font-bold text-amber-600 hover:underline"
                    >
                      Usar todos
                    </button>
                  </div>
                  {puntosACanjear > 0 && (
                    <p className="mt-1.5 text-xs text-emerald-600 font-semibold">
                      Descuento: −{formatCurrency(descuentoPuntos, simbolo)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                  <ShoppingCart size={24} className="text-stone-300" />
                </div>
                <p className="text-sm font-semibold text-stone-400">Ticket vacío</p>
                <p className="text-xs text-stone-300">Selecciona productos del panel izquierdo</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.tempId}
                    className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    {/* Nombre + badge */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-stone-800">{item.nombre}</p>
                        {item.esTemp && (
                          <Tag size={10} className="flex-shrink-0 text-amber-500" />
                        )}
                        {item.precio !== item.precioBase && !item.esTemp && (
                          <span className="flex-shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                            editado
                          </span>
                        )}
                      </div>

                      {/* Price edit */}
                      {editingId === item.tempId ? (
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            ref={editRef}
                            type="number"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit(item.tempId);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-28 rounded-lg border border-brand-400 bg-brand-50 px-2 py-1 text-sm font-bold text-brand-700 outline-none focus:ring-2 focus:ring-brand-200"
                          />
                          <button
                            onClick={() => confirmEdit(item.tempId)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-500"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="mt-0.5 flex items-center gap-1 text-sm font-black text-brand-600 hover:underline"
                        >
                          {formatCurrency(item.precio, simbolo)}
                          <Pencil size={10} className="text-stone-400" />
                        </button>
                      )}
                    </div>

                    {/* Qty controls */}
                    <div className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-stone-100 px-1 py-1">
                      <button
                        onClick={() => updateCantidad(item.tempId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-lg font-bold text-stone-600 hover:bg-stone-200 transition"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-stone-800">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => updateCantidad(item.tempId, +1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-lg font-bold text-stone-600 hover:bg-stone-200 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.tempId)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-stone-300 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Totals + checkout ── */}
          {items.length > 0 && (
            <div className="flex-shrink-0 border-t border-stone-200 bg-white p-4 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-700">{formatCurrency(subtotal, simbolo)}</span>
              </div>

              {/* Descuento por puntos */}
              {descuentoPuntos > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star size={12} />
                    Canje {puntosACanjear} pts
                  </span>
                  <span className="font-semibold text-emerald-600">−{formatCurrency(descuentoPuntos, simbolo)}</span>
                </div>
              )}

              {/* Puntos a ganar */}
              {puntosAGanar > 0 && (
                <div className="flex justify-between text-xs text-amber-600">
                  <span className="flex items-center gap-1">
                    <Star size={10} />
                    Ganarás
                  </span>
                  <span className="font-bold">+{puntosAGanar} pts</span>
                </div>
              )}

              {/* Override total */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overrideTotal}
                    onChange={(e) => {
                      setOverrideTotal(e.target.checked);
                      if (e.target.checked) setManualTotal(String(subtotal));
                    }}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600"
                  />
                  <span className="text-sm font-semibold text-stone-700">Ajustar total manualmente</span>
                </label>
                {overrideTotal && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-stone-500">{simbolo}</span>
                    <input
                      type="number"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(e.target.value)}
                      placeholder="0"
                      className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-bold text-stone-800 outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                )}
                {descuento > 0 && (
                  <p className="mt-1.5 text-xs text-emerald-600 font-semibold">
                    Descuento aplicado: {formatCurrency(descuento, simbolo)}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-2xl bg-stone-900 px-4 py-3">
                <span className="text-sm font-semibold text-stone-300">TOTAL</span>
                <span className="text-xl font-black text-white">{formatCurrency(totalFinal, simbolo)}</span>
              </div>

              {/* Cobrar */}
              <button
                onClick={() => { setShowPago(true); setErrorMsg(""); }}
                disabled={!cajaId}
                className="flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 font-bold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Cobrar</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">{formatCurrency(totalFinal, simbolo)}</span>
                  <ChevronRight size={18} />
                </div>
              </button>

              {!cajaId && (
                <p className="text-center text-xs text-amber-600">
                  Abre una caja en /cajas para registrar ventas
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TEMP PRODUCT MODAL
      ════════════════════════════════════════════ */}
      {showTemp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-stone-800">Producto libre</h3>
              <button onClick={() => setShowTemp(false)} className="rounded-xl p-1.5 hover:bg-stone-100 transition">
                <X size={18} className="text-stone-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Nombre / descripción
                </label>
                <input
                  autoFocus
                  type="text"
                  value={tempNombre}
                  onChange={(e) => setTempNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTemp()}
                  placeholder="Ej: Servicio a domicilio"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Precio
                </label>
                <input
                  type="number"
                  value={tempPrecio}
                  onChange={(e) => setTempPrecio(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTemp()}
                  placeholder="0"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <button
              onClick={addTemp}
              disabled={!tempNombre.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3.5 font-bold text-white transition hover:bg-stone-700 disabled:opacity-40"
            >
              <Plus size={16} />
              Agregar al ticket
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          PAYMENT MODAL
      ════════════════════════════════════════════ */}
      {showPago && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-stone-800">Cobrar</h3>
              <button onClick={() => setShowPago(false)} className="rounded-xl p-1.5 hover:bg-stone-100 transition">
                <X size={18} className="text-stone-500" />
              </button>
            </div>

            {/* Total reminder */}
            <div className="mb-4 rounded-2xl bg-stone-900 px-5 py-4 text-center">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Total a cobrar</p>
              <p className="mt-1 text-3xl font-black text-white">{formatCurrency(totalFinal, simbolo)}</p>
              {descuentoPuntos > 0 && (
                <p className="mt-1 text-xs text-amber-300">
                  Incl. descuento {formatCurrency(descuentoPuntos, simbolo)} por {puntosACanjear} pts
                </p>
              )}
            </div>

            {/* Puntos a ganar */}
            {puntosAGanar > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">
                  {clienteSeleccionado?.nombre} ganará +{puntosAGanar} puntos
                </span>
              </div>
            )}

            {/* Method */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {METODOS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetodo(m.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-xs font-bold transition",
                    metodo === m.key
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
                  )}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {/* Efectivo recibido */}
            {metodo === "EFECTIVO" && (
              <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                <label className="mb-1.5 block text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Efectivo recibido
                </label>
                <input
                  type="number"
                  value={efectivoStr}
                  onChange={(e) => setEfectivoStr(e.target.value)}
                  placeholder={String(totalFinal)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                {efectivoStr && parseMonto(efectivoStr) >= totalFinal && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-stone-500">Vuelto</span>
                    <span className="font-black text-emerald-600">{formatCurrency(vuelto, simbolo)}</span>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                {errorMsg}
              </p>
            )}

            <button
              onClick={confirmar}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmar venta
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
