"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag, Plus, Minus, Trash2, Clock, User, Search,
  CheckCircle2, ArrowRight, RefreshCw, ChevronDown, ChevronUp,
  Star, X, Phone, ArrowLeft, Check, PackageCheck,
  Banknote, CreditCard, ArrowLeftRight, Tag, Gift, Percent, Wallet, Ticket,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface VOpcion { id: number; nombre: string; precio: number }
interface VGrupo { id: number; nombre: string; requerido: boolean; tipo: string; opciones: VOpcion[] }
interface CartOpcion { grupoId: number; grupoNombre: string; opcionId: number; opcionNombre: string; precio: number }

interface OpcionDetalle { grupoNombre: string; opcionNombre: string; precio: number }
interface PedidoDetalle { id: number; cantidad: number; nombre: string; precio: number; opciones?: OpcionDetalle[] }
interface PedidoLlevar {
  id: number;
  numero: number;
  estado: string;
  clienteNombre: string;
  horaRetiro: string | null;
  total: number;
  creadoEn: string;
  detalles: PedidoDetalle[];
}
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string | null;
  categoria?: { nombre: string };
  variantes: VGrupo[];
}
interface CartItem {
  cartKey: string;
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  opciones: CartOpcion[];
}

interface ClienteResult {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  puntos: number;
  rut: string | null;
}

type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "DEBITO" | "CREDITO" | "MERCADO_PAGO";

interface CuponAplicado {
  id: number;
  codigo: string;
  tipo: "PORCENTAJE" | "MONTO";
  valor: number;
  descripcion: string | null;
  descuentoAplicado: number;
  esCumple?: boolean;
}

const METODOS_PAGO: { key: MetodoPago; label: string }[] = [
  { key: "EFECTIVO",      label: "Efectivo"      },
  { key: "TARJETA",       label: "Tarjeta"        },
  { key: "TRANSFERENCIA", label: "Transferencia"  },
  { key: "DEBITO",        label: "Débito"         },
  { key: "CREDITO",       label: "Crédito"        },
  { key: "MERCADO_PAGO",  label: "Mercado Pago"   },
];

interface Props {
  productos: Producto[];
  pedidos: PedidoLlevar[];
  sucursalId: number | null;
  simbolo: string;
}

type Vista = "nuevo" | "lista";

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE:  "bg-amber-100 text-amber-700",
  EN_PROCESO: "bg-blue-100 text-blue-700",
  LISTO:      "bg-emerald-100 text-emerald-700",
  ENTREGADO:  "bg-gray-100 text-gray-500",
  CANCELADO:  "bg-red-100 text-red-600",
};

export function LlevarClient({ productos, pedidos: initialPedidos, sucursalId, simbolo }: Props) {
  const [vista, setVista] = useState<Vista>("nuevo");
  const [pedidos, setPedidos] = useState(initialPedidos);

  // ── Form state ──
  const [nombreCliente, setNombreCliente] = useState("");
  const [horaRetiro, setHoraRetiro] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [variantesModal, setVariantesModal] = useState<Producto | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<{ id: number; numero: number } | null>(null);
  const [expandedPedido, setExpandedPedido] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // ── Pago ──
  const [metodoPago, setMetodoPago]     = useState<MetodoPago>("EFECTIVO");
  const [montoPagado, setMontoPagado]   = useState("");
  // ── Descuentos ──
  const [showDescuentos, setShowDescuentos] = useState(false);
  const [descPorcentaje, setDescPorcentaje] = useState(0);
  const [descMontoFijo, setDescMontoFijo]   = useState(0);
  const [codigoCupon, setCodigoCupon]       = useState("");
  const [cuponAplicado, setCuponAplicado]   = useState<CuponAplicado | null>(null);
  const [cuponLoading, setCuponLoading]     = useState(false);
  const [cuponError, setCuponError]         = useState("");

  // ── Cliente search state ──
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState<ClienteResult[]>([]);
  const [clienteSelected, setClienteSelected] = useState<ClienteResult | null>(null);
  const [searchingCliente, setSearchingCliente] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchClientes = useCallback(async (q: string) => {
    if (q.length < 2) { setClienteResults([]); return; }
    setSearchingCliente(true);
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setClienteResults(data.slice(0, 6));
        setShowClienteDropdown(true);
      }
    } catch { /* ignore */ } finally {
      setSearchingCliente(false);
    }
  }, []);

  function handleClienteQueryChange(val: string) {
    setClienteQuery(val);
    if (clienteSelected) { setClienteSelected(null); }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchClientes(val), 300);
  }

  function selectCliente(c: ClienteResult) {
    setClienteSelected(c);
    setNombreCliente(c.nombre);
    setClienteQuery(c.nombre);
    setShowClienteDropdown(false);
  }

  function clearCliente() {
    setClienteSelected(null);
    setClienteQuery("");
    setNombreCliente("");
    setClienteResults([]);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categorias = useMemo(() => {
    const map = new Map<string, Producto[]>();
    for (const p of productos) {
      const cat = p.categoria?.nombre ?? "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [productos]);

  const norm = (s: string) => s.normalize("NFD").split("").filter(c => { const code = c.charCodeAt(0); return code < 0x0300 || code > 0x036f; }).join("").toLowerCase();

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return categorias;
    const q = norm(busqueda);
    return categorias
      .map(([cat, prods]) => [cat, prods.filter((p) => norm(p.nombre).includes(q))] as const)
      .filter(([, prods]) => prods.length > 0);
  }, [categorias, busqueda]);

  const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const descuentoPorcentajeMonto = descPorcentaje > 0 ? Math.round((total * Math.min(100, Math.max(0, descPorcentaje))) / 100) : 0;
  const descuentoCuponMonto      = cuponAplicado?.descuentoAplicado ?? 0;
  const descMontoFijoAplicado    = descMontoFijo > 0 ? Math.min(descMontoFijo, total) : 0;
  const descuentoTotal           = descuentoPorcentajeMonto + descuentoCuponMonto + descMontoFijoAplicado;
  const totalFinal               = Math.max(0, total - descuentoTotal);
  const cambio                   = metodoPago === "EFECTIVO" && Number(montoPagado) > totalFinal
    ? Number(montoPagado) - totalFinal
    : 0;

  function handleProductClick(p: Producto) {
    if (p.variantes.length > 0) {
      setVariantesModal(p);
    } else {
      addToCart(p, []);
    }
  }

  function addToCart(p: Producto, opciones: CartOpcion[]) {
    const opKey = opciones.map(o => o.opcionId).sort().join("-");
    const cartKey = `${p.id}-${opKey}`;
    const precioOpciones = opciones.reduce((s, o) => s + o.precio, 0);
    const precio = p.precio + precioOpciones;
    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) return prev.map((i) => i.cartKey === cartKey ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { cartKey, productoId: p.id, nombre: p.nombre, precio, cantidad: 1, opciones }];
    });
  }

  function updateQty(cartKey: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.cartKey === cartKey ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0),
    );
  }

  async function handleSubmit() {
    if (!nombreCliente.trim() || cart.length === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/llevar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precio: i.opciones.length > 0 ? i.precio : undefined,
            opciones: i.opciones.length > 0 ? i.opciones : undefined,
          })),
          nombreCliente: nombreCliente.trim(),
          horaRetiro: horaRetiro.trim() || undefined,
          clienteId: clienteSelected?.id ?? undefined,
          metodoPago,
          descuento: descuentoTotal > 0 ? descuentoTotal : undefined,
          cuponId: cuponAplicado?.id && cuponAplicado.id > 0 ? cuponAplicado.id : undefined,
          cuponCodigo: cuponAplicado?.codigo ?? undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear pedido");
      const data = await res.json();
      setSuccess(data);
      setCart([]);
      setNombreCliente("");
      setHoraRetiro("");

      const newPedido: PedidoLlevar = {
        id: data.id,
        numero: data.numero,
        estado: "PENDIENTE",
        clienteNombre: nombreCliente.trim(),
        horaRetiro: horaRetiro.trim() || null,
        total: totalFinal,
        creadoEn: new Date().toISOString(),
        detalles: cart.map((i, idx) => ({
          id: idx, cantidad: i.cantidad, nombre: i.nombre, precio: i.precio,
          opciones: i.opciones.length > 0 ? i.opciones.map(o => ({ grupoNombre: o.grupoNombre, opcionNombre: o.opcionNombre, precio: o.precio })) : undefined,
        })),
      };
      setPedidos((prev) => [newPedido, ...prev]);
    } catch {
      // silently handle
    } finally {
      setSending(false);
    }
  }

  async function updateEstado(pedidoId: number, estado: string) {
    setLoadingId(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setPedidos((prev) => prev.map((p) => p.id === pedidoId ? { ...p, estado } : p));
    } catch { /* ignore */ } finally {
      setLoadingId(null);
    }
  }

  async function aplicarCupon() {
    const codigo = codigoCupon.trim().toUpperCase();
    if (!codigo || !sucursalId) return;
    setCuponLoading(true);
    setCuponError("");
    try {
      const res = await fetch("/api/cupones/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, sucursalId, subtotal: total }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cupón no válido");
      setCuponAplicado(data as CuponAplicado);
      setCodigoCupon("");
    } catch (e) {
      setCuponError((e as Error).message);
    } finally {
      setCuponLoading(false);
    }
  }

  function resetForm() {
    setSuccess(null);
    setCart([]);
    setNombreCliente("");
    setHoraRetiro("");
    setBusqueda("");
    clearCliente();
    setMetodoPago("EFECTIVO");
    setMontoPagado("");
    setShowDescuentos(false);
    setDescPorcentaje(0);
    setDescMontoFijo(0);
    setCodigoCupon("");
    setCuponAplicado(null);
    setCuponError("");
  }

  // ── Pedidos activos vs completados ──
  const pedidosActivos = pedidos.filter((p) => ["PENDIENTE", "EN_PROCESO", "LISTO"].includes(p.estado));
  const pedidosCompletados = pedidos.filter((p) => ["ENTREGADO", "CANCELADO"].includes(p.estado));

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/ordenes"
            className="w-9 h-9 rounded-xl bg-surface-bg border border-surface-border flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} className="text-surface-muted" />
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-surface-text leading-tight">Para Llevar</h1>
            <p className="text-xs text-surface-muted mt-0.5">Pedidos para retiro en tienda</p>
          </div>
        </div>

        <div className="flex gap-1.5 bg-surface-bg rounded-xl p-1 border border-surface-border">
          <button
            onClick={() => setVista("nuevo")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
              vista === "nuevo" ? "bg-white text-surface-text shadow-sm" : "text-surface-muted hover:text-surface-text",
            )}
          >
            Nuevo Pedido
          </button>
          <button
            onClick={() => setVista("lista")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all relative",
              vista === "lista" ? "bg-white text-surface-text shadow-sm" : "text-surface-muted hover:text-surface-text",
            )}
          >
            Pedidos
            {pedidosActivos.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pedidosActivos.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Vista: Nuevo Pedido ── */}
      {vista === "nuevo" && (
        <>
          {success ? (
            <div className="card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-black text-surface-text">Pedido #{success.numero} creado</p>
                <p className="text-sm text-surface-muted mt-1">El pedido para llevar fue registrado exitosamente</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href="/pedidos"
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <ArrowRight size={16} /> Ir a KDS
                </Link>
                <button onClick={resetForm} className="btn-secondary flex items-center justify-center gap-2">
                  <Plus size={16} /> Nuevo pedido
                </button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-4">
              {/* ── Izquierda: Datos del cliente + Productos ── */}
              <div className="lg:col-span-3 space-y-4">
                {/* Datos del cliente */}
                <div className="card p-4 space-y-3">
                  <p className="text-sm font-bold text-surface-text flex items-center gap-2">
                    <User size={15} className="text-emerald-500" /> Cliente
                  </p>

                  {/* Cliente seleccionado */}
                  {clienteSelected ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-text truncate">{clienteSelected.nombre}</p>
                        <div className="flex items-center gap-3 text-[11px] text-surface-muted">
                          {clienteSelected.telefono && (
                            <span className="flex items-center gap-1"><Phone size={9} />{clienteSelected.telefono}</span>
                          )}
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Star size={9} className="fill-amber-400 text-amber-400" />{clienteSelected.puntos} pts
                          </span>
                        </div>
                      </div>
                      <button onClick={clearCliente} className="p-1 rounded-lg hover:bg-emerald-100 transition-colors">
                        <X size={14} className="text-emerald-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative" ref={clienteDropdownRef}>
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
                      <input
                        type="text"
                        value={clienteQuery}
                        onChange={(e) => handleClienteQueryChange(e.target.value)}
                        onFocus={() => clienteResults.length > 0 && setShowClienteDropdown(true)}
                        placeholder="Buscar cliente por nombre, teléfono o email..."
                        className="input w-full pl-9 pr-8"
                      />
                      {searchingCliente && (
                        <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted animate-spin" />
                      )}

                      {showClienteDropdown && clienteResults.length > 0 && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-xl border border-surface-border shadow-xl max-h-52 overflow-y-auto">
                          {clienteResults.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => selectCliente(c)}
                              className="w-full flex items-center gap-3 p-2.5 hover:bg-emerald-50 transition-colors text-left border-b border-surface-border/50 last:border-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center shrink-0">
                                <User size={14} className="text-surface-muted" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-surface-text truncate">{c.nombre}</p>
                                <p className="text-[11px] text-surface-muted truncate">
                                  {c.telefono ?? c.email ?? "Sin contacto"}
                                </p>
                              </div>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 shrink-0">
                                <Star size={9} className="fill-amber-400 text-amber-400" />{c.puntos}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    {!clienteSelected && (
                      <div>
                        <label className="text-xs font-semibold text-surface-muted mb-1 block">Nombre *</label>
                        <input
                          type="text"
                          value={nombreCliente}
                          onChange={(e) => setNombreCliente(e.target.value)}
                          placeholder="O escribe el nombre manualmente"
                          className="input w-full"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-surface-muted mb-1 block flex items-center gap-1">
                        <Clock size={12} /> Horario de retiro
                      </label>
                      <input
                        type="time"
                        value={horaRetiro}
                        onChange={(e) => setHoraRetiro(e.target.value)}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Buscador de productos */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar producto..."
                    className="input w-full pl-9"
                  />
                </div>

                {/* Lista de productos */}
                <div className="card p-3 max-h-[50vh] overflow-y-auto space-y-4">
                  {productosFiltrados.map(([cat, prods]) => (
                    <div key={cat}>
                      <p className="text-[11px] font-bold text-surface-muted uppercase tracking-wider mb-2">{cat}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {prods.map((p) => {
                          const cartQty = cart.filter((i) => i.productoId === p.id).reduce((s, i) => s + i.cantidad, 0);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleProductClick(p)}
                              className={cn(
                                "text-left p-3 rounded-xl border transition-all hover:shadow-sm",
                                cartQty > 0
                                  ? "border-emerald-300 bg-emerald-50"
                                  : "border-surface-border bg-white hover:border-emerald-200",
                              )}
                            >
                              <p className="text-sm font-semibold text-surface-text truncate">{p.nombre}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <div>
                                  <p className="text-xs font-bold text-emerald-600">{formatCurrency(p.precio, simbolo)}</p>
                                  {p.variantes.length > 0 && <p className="text-[10px] text-surface-muted">+opciones</p>}
                                </div>
                                {cartQty > 0 && (
                                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                                    x{cartQty}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <p className="text-sm text-surface-muted text-center py-8">No se encontraron productos</p>
                  )}
                </div>
              </div>

              {/* ── Derecha: Resumen del pedido ── */}
              <div className="lg:col-span-2">
                <div className="card p-4 space-y-4 lg:sticky lg:top-4">
                  <p className="text-sm font-bold text-surface-text flex items-center gap-2">
                    <ShoppingBag size={15} className="text-emerald-500" /> Resumen del Pedido
                  </p>

                  {cart.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShoppingBag size={32} className="mx-auto text-surface-muted/30 mb-2" />
                      <p className="text-sm text-surface-muted">Agrega productos al pedido</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {cart.map((item) => (
                          <div
                            key={item.cartKey}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-bg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-surface-text truncate">{item.nombre}</p>
                              {item.opciones.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.opciones.map((o, i) => (
                                    <span key={i} className="rounded-full bg-violet-100 text-violet-700 px-1.5 py-0.5 text-[9px] font-bold">
                                      {o.opcionNombre}{o.precio > 0 ? ` +${formatCurrency(o.precio, simbolo)}` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-surface-muted">{formatCurrency(item.precio * item.cantidad, simbolo)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => updateQty(item.cartKey, -1)}
                                className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                              >
                                {item.cantidad === 1 ? <Trash2 size={12} className="text-red-500" /> : <Minus size={12} />}
                              </button>
                              <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                              <button
                                onClick={() => updateQty(item.cartKey, 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Info de retiro */}
                      {(nombreCliente.trim() || horaRetiro) && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                          {nombreCliente.trim() && (
                            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                              <User size={12} /> {nombreCliente.trim()}
                            </p>
                          )}
                          {horaRetiro && (
                            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                              <Clock size={12} /> Retiro: {horaRetiro}
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Descuentos ── */}
                      <div className="rounded-xl border border-surface-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowDescuentos(!showDescuentos)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-surface-text hover:bg-surface-bg transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Tag size={13} className="text-violet-500" />
                            Descuentos
                            {descuentoTotal > 0 && (
                              <span className="ml-1 rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-[9px] font-black">
                                -{formatCurrency(descuentoTotal, simbolo)}
                              </span>
                            )}
                          </span>
                          {showDescuentos ? <ChevronUp size={13} className="text-surface-muted" /> : <ChevronDown size={13} className="text-surface-muted" />}
                        </button>

                        {showDescuentos && (
                          <div className="border-t border-surface-border p-3 space-y-3 bg-violet-50/40">
                            {/* Porcentaje */}
                            <div>
                              <label className="text-[10px] font-bold text-surface-muted mb-1 block flex items-center gap-1">
                                <Percent size={10} /> % Descuento
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number" min={0} max={100}
                                  value={descPorcentaje || ""}
                                  onChange={(e) => setDescPorcentaje(Number(e.target.value))}
                                  placeholder="0"
                                  className="input flex-1 text-sm"
                                />
                                <span className="text-xs text-surface-muted font-semibold shrink-0">
                                  = {formatCurrency(descuentoPorcentajeMonto, simbolo)}
                                </span>
                              </div>
                            </div>

                            {/* Monto fijo */}
                            <div>
                              <label className="text-[10px] font-bold text-surface-muted mb-1 block flex items-center gap-1">
                                <Tag size={10} /> Monto fijo
                              </label>
                              <input
                                type="number" min={0}
                                value={descMontoFijo || ""}
                                onChange={(e) => setDescMontoFijo(Number(e.target.value))}
                                placeholder="0"
                                className="input w-full text-sm"
                              />
                            </div>

                            {/* Código cupón */}
                            <div>
                              <label className="text-[10px] font-bold text-surface-muted mb-1 block flex items-center gap-1">
                                <Gift size={10} /> Código cupón / cumpleaños
                              </label>
                              {cuponAplicado ? (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-100 border border-violet-300">
                                  <span className="flex-1 text-xs font-bold text-violet-800 truncate">
                                    {cuponAplicado.esCumple ? "🎂" : "🎟️"} {cuponAplicado.descripcion ?? cuponAplicado.codigo}
                                  </span>
                                  <span className="text-[10px] font-black text-violet-700 shrink-0">
                                    -{formatCurrency(cuponAplicado.descuentoAplicado, simbolo)}
                                  </span>
                                  <button
                                    onClick={() => { setCuponAplicado(null); setCuponError(""); }}
                                    className="text-violet-600 hover:text-violet-800 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={codigoCupon}
                                      onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                                      onKeyDown={(e) => e.key === "Enter" && void aplicarCupon()}
                                      placeholder="CODIGO123"
                                      className="input flex-1 text-sm uppercase"
                                      disabled={cuponLoading}
                                    />
                                    <button
                                      onClick={() => void aplicarCupon()}
                                      disabled={cuponLoading || !codigoCupon.trim()}
                                      className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-violet-700 transition-colors shrink-0"
                                    >
                                      {cuponLoading ? <RefreshCw size={12} className="animate-spin" /> : "Aplicar"}
                                    </button>
                                  </div>
                                  {cuponError && <p className="text-[10px] text-red-500 font-semibold mt-1">{cuponError}</p>}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Totales ── */}
                      <div className="rounded-xl border border-surface-border bg-surface-bg px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between text-sm text-surface-muted">
                          <span>Subtotal</span>
                          <span>{formatCurrency(total, simbolo)}</span>
                        </div>
                        {descuentoTotal > 0 && (
                          <div className="flex items-center justify-between text-sm text-violet-600 font-semibold">
                            <span>Descuento</span>
                            <span>-{formatCurrency(descuentoTotal, simbolo)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-surface-border">
                          <span className="text-sm font-bold text-surface-text">Total</span>
                          <span className="text-lg font-black text-surface-text">{formatCurrency(totalFinal, simbolo)}</span>
                        </div>
                      </div>

                      {/* ── Método de pago ── */}
                      <div>
                        <p className="text-[10px] font-bold text-surface-muted mb-1.5 flex items-center gap-1">
                          <Wallet size={10} /> Método de pago
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {METODOS_PAGO.map((m) => (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => { setMetodoPago(m.key); setMontoPagado(""); }}
                              className={cn(
                                "py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all",
                                metodoPago === m.key
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                  : "border-surface-border bg-white text-surface-muted hover:border-emerald-300 hover:text-emerald-700"
                              )}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Monto y cambio (solo EFECTIVO) ── */}
                      {metodoPago === "EFECTIVO" && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] font-bold text-surface-muted mb-1 block flex items-center gap-1">
                              <Banknote size={10} /> Monto recibido
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={montoPagado}
                              onChange={(e) => setMontoPagado(e.target.value)}
                              placeholder={formatCurrency(totalFinal, simbolo)}
                              className="input w-full text-sm"
                            />
                          </div>
                          {cambio > 0 && (
                            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                              <span className="text-xs font-bold text-emerald-700">Cambio a devolver</span>
                              <span className="text-base font-black text-emerald-700">{formatCurrency(cambio, simbolo)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Botón enviar ── */}
                      <button
                        onClick={handleSubmit}
                        disabled={sending || !nombreCliente.trim() || cart.length === 0}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                          sending || !nombreCliente.trim() || cart.length === 0
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25",
                        )}
                      >
                        {sending ? (
                          <><RefreshCw size={16} className="animate-spin" /> Creando...</>
                        ) : (
                          <><ArrowRight size={16} /> Crear Pedido</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Vista: Lista de pedidos ── */}
      {vista === "lista" && (
        <div className="space-y-4">
          {/* Activos */}
          {pedidosActivos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-surface-muted uppercase tracking-wider">
                Activos ({pedidosActivos.length})
              </p>
              {pedidosActivos.map((p) => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  simbolo={simbolo}
                  expanded={expandedPedido === p.id}
                  onToggle={() => setExpandedPedido(expandedPedido === p.id ? null : p.id)}
                  onMarcarRetirado={(id) => void updateEstado(id, "ENTREGADO")}
                  loadingId={loadingId}
                />
              ))}
            </div>
          )}

          {/* Completados */}
          {pedidosCompletados.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-surface-muted uppercase tracking-wider">
                Completados ({pedidosCompletados.length})
              </p>
              {pedidosCompletados.map((p) => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  simbolo={simbolo}
                  expanded={expandedPedido === p.id}
                  onToggle={() => setExpandedPedido(expandedPedido === p.id ? null : p.id)}
                  loadingId={loadingId}
                />
              ))}
            </div>
          )}

          {pedidos.length === 0 && (
            <div className="card p-12 text-center">
              <ShoppingBag size={40} className="mx-auto text-surface-muted/30 mb-3" />
              <p className="text-sm text-surface-muted">No hay pedidos para llevar en este turno</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal de variantes ── */}
      {variantesModal && (
        <VariantesModal
          producto={variantesModal}
          simbolo={simbolo}
          onConfirm={(opciones) => { addToCart(variantesModal, opciones); setVariantesModal(null); }}
          onClose={() => setVariantesModal(null)}
        />
      )}
    </div>
  );
}

/* ── Modal de variantes ── */
function VariantesModal({
  producto, simbolo, onConfirm, onClose,
}: { producto: Producto; simbolo: string; onConfirm: (opciones: CartOpcion[]) => void; onClose: () => void }) {
  const [sel, setSel] = useState<Record<number, number[]>>(() => {
    const init: Record<number, number[]> = {};
    for (const g of producto.variantes) {
      if (g.requerido && g.tipo === "radio" && g.opciones.length > 0) init[g.id] = [g.opciones[0].id];
      else init[g.id] = [];
    }
    return init;
  });

  function toggle(g: VGrupo, opId: number) {
    setSel(prev => ({
      ...prev,
      [g.id]: g.tipo === "radio"
        ? [opId]
        : prev[g.id]?.includes(opId) ? prev[g.id].filter(i => i !== opId) : [...(prev[g.id] ?? []), opId],
    }));
  }

  const missingRequired = producto.variantes.some(g => g.requerido && !(sel[g.id]?.length));
  const selectedOpciones: CartOpcion[] = producto.variantes.flatMap(g =>
    (sel[g.id] ?? []).map(opId => {
      const op = g.opciones.find(o => o.id === opId)!;
      return { grupoId: g.id, grupoNombre: g.nombre, opcionId: op.id, opcionNombre: op.nombre, precio: op.precio };
    })
  );
  const unitPrice = producto.precio + selectedOpciones.reduce((s, o) => s + o.precio, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-surface-text">{producto.nombre}</h3>
            <p className="text-emerald-600 font-bold text-base mt-0.5">{formatCurrency(unitPrice, simbolo)}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-surface-bg p-2 text-surface-muted hover:bg-surface-hover">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {producto.variantes.map(g => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-surface-text">{g.nombre}</p>
                {g.requerido && <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">REQUERIDO</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.opciones.map(op => {
                  const active = sel[g.id]?.includes(op.id);
                  return (
                    <button key={op.id} onClick={() => toggle(g, op.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all text-sm",
                        active ? "border-emerald-400 bg-emerald-50" : "border-surface-border bg-white hover:border-emerald-200",
                      )}
                    >
                      <span className="font-semibold text-surface-text">{op.nombre}</span>
                      <div className="flex items-center gap-1">
                        {op.precio > 0 && <span className="text-xs text-emerald-600">+{formatCurrency(op.precio, simbolo)}</span>}
                        {active && <Check size={14} className="text-emerald-500 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button
          disabled={missingRequired}
          onClick={() => onConfirm(selectedOpciones)}
          className={cn(
            "w-full mt-5 py-3 rounded-xl font-bold text-sm transition-all",
            missingRequired
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25",
          )}
        >
          Agregar · {formatCurrency(unitPrice, simbolo)}
        </button>
      </div>
    </div>
  );
}

/* ── Tarjeta de pedido ── */
function PedidoCard({
  pedido, simbolo, expanded, onToggle, onMarcarRetirado, loadingId,
}: {
  pedido: PedidoLlevar;
  simbolo: string;
  expanded: boolean;
  onToggle: () => void;
  onMarcarRetirado?: (id: number) => void;
  loadingId?: number | null;
}) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const isLoading = loadingId === pedido.id;

  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-4 text-left hover:bg-surface-bg/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <ShoppingBag size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-surface-text">#{pedido.numero}</p>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", ESTADO_STYLES[pedido.estado] ?? "bg-gray-100 text-gray-500")}>
              {pedido.estado.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-surface-muted truncate">
            {pedido.clienteNombre} · {hora}
            {pedido.horaRetiro && <> · Retiro: {pedido.horaRetiro}</>}
          </p>
        </div>
        <p className="text-sm font-black text-surface-text shrink-0">{formatCurrency(pedido.total, simbolo)}</p>
        {expanded ? <ChevronUp size={16} className="text-surface-muted shrink-0" /> : <ChevronDown size={16} className="text-surface-muted shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-border pt-3 space-y-1.5">
          {pedido.detalles.map((d) => (
            <div key={d.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-muted">
                  <span className="font-semibold text-surface-text">{d.cantidad}x</span> {d.nombre}
                </span>
                <span className="font-semibold text-surface-text">{formatCurrency(d.precio * d.cantidad, simbolo)}</span>
              </div>
              {d.opciones && d.opciones.length > 0 && (
                <div className="ml-6 mt-0.5 flex flex-wrap gap-1">
                  {d.opciones.map((o, i) => (
                    <span key={i} className="rounded-full bg-violet-100 text-violet-700 px-1.5 py-0.5 text-[9px] font-bold">
                      {o.opcionNombre}{o.precio > 0 ? ` +${formatCurrency(o.precio, simbolo)}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* ── Botón marcar retirado (solo cuando está LISTO) ── */}
          {pedido.estado === "LISTO" && onMarcarRetirado && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarcarRetirado(pedido.id); }}
              disabled={isLoading}
              className={cn(
                "mt-3 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                isLoading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95",
              )}
            >
              {isLoading
                ? <><RefreshCw size={15} className="animate-spin" /> Procesando...</>
                : <><PackageCheck size={15} /> Marcar como Retirado</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
