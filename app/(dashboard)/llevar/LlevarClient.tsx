"use client";

import { useState, useMemo } from "react";
import {
  ShoppingBag, Plus, Minus, Trash2, Clock, User, Search,
  CheckCircle2, ArrowRight, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface PedidoDetalle { id: number; cantidad: number; nombre: string; precio: number }
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
}
interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

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
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<{ id: number; numero: number } | null>(null);
  const [expandedPedido, setExpandedPedido] = useState<number | null>(null);

  const categorias = useMemo(() => {
    const map = new Map<string, Producto[]>();
    for (const p of productos) {
      const cat = p.categoria?.nombre ?? "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return categorias;
    const q = busqueda.toLowerCase();
    return categorias
      .map(([cat, prods]) => [cat, prods.filter((p) => p.nombre.toLowerCase().includes(q))] as const)
      .filter(([, prods]) => prods.length > 0);
  }, [categorias, busqueda]);

  const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  function addToCart(p: Producto) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === p.id);
      if (existing) return prev.map((i) => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
    });
  }

  function updateQty(productoId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
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
          items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
          nombreCliente: nombreCliente.trim(),
          horaRetiro: horaRetiro.trim() || undefined,
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
        total,
        creadoEn: new Date().toISOString(),
        detalles: cart.map((i, idx) => ({ id: idx, cantidad: i.cantidad, nombre: i.nombre, precio: i.precio })),
      };
      setPedidos((prev) => [newPedido, ...prev]);
    } catch {
      // silently handle
    } finally {
      setSending(false);
    }
  }

  function resetForm() {
    setSuccess(null);
    setCart([]);
    setNombreCliente("");
    setHoraRetiro("");
    setBusqueda("");
  }

  // ── Pedidos activos vs completados ──
  const pedidosActivos = pedidos.filter((p) => ["PENDIENTE", "EN_PROCESO", "LISTO"].includes(p.estado));
  const pedidosCompletados = pedidos.filter((p) => ["ENTREGADO", "CANCELADO"].includes(p.estado));

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
              <button onClick={resetForm} className="btn-primary mx-auto flex items-center gap-2">
                <Plus size={16} /> Nuevo pedido
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-4">
              {/* ── Izquierda: Datos del cliente + Productos ── */}
              <div className="lg:col-span-3 space-y-4">
                {/* Datos del cliente */}
                <div className="card p-4 space-y-3">
                  <p className="text-sm font-bold text-surface-text flex items-center gap-2">
                    <User size={15} className="text-emerald-500" /> Datos del Cliente
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-surface-muted mb-1 block">Nombre *</label>
                      <input
                        type="text"
                        value={nombreCliente}
                        onChange={(e) => setNombreCliente(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="input w-full"
                      />
                    </div>
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
                          const inCart = cart.find((i) => i.productoId === p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => addToCart(p)}
                              className={cn(
                                "text-left p-3 rounded-xl border transition-all hover:shadow-sm",
                                inCart
                                  ? "border-emerald-300 bg-emerald-50"
                                  : "border-surface-border bg-white hover:border-emerald-200",
                              )}
                            >
                              <p className="text-sm font-semibold text-surface-text truncate">{p.nombre}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs font-bold text-emerald-600">{formatCurrency(p.precio, simbolo)}</p>
                                {inCart && (
                                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                                    x{inCart.cantidad}
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
                            key={item.productoId}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-bg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-surface-text truncate">{item.nombre}</p>
                              <p className="text-xs text-surface-muted">{formatCurrency(item.precio * item.cantidad, simbolo)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => updateQty(item.productoId, -1)}
                                className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                              >
                                {item.cantidad === 1 ? <Trash2 size={12} className="text-red-500" /> : <Minus size={12} />}
                              </button>
                              <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                              <button
                                onClick={() => updateQty(item.productoId, 1)}
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

                      {/* Total */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-text text-white">
                        <span className="text-sm font-bold">Total</span>
                        <span className="text-lg font-black">{formatCurrency(total, simbolo)}</span>
                      </div>

                      {/* Botón enviar */}
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
    </div>
  );
}

/* ── Tarjeta de pedido ── */
function PedidoCard({
  pedido, simbolo, expanded, onToggle,
}: { pedido: PedidoLlevar; simbolo: string; expanded: boolean; onToggle: () => void }) {
  const hora = new Date(pedido.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

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
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-surface-muted">
                <span className="font-semibold text-surface-text">{d.cantidad}x</span> {d.nombre}
              </span>
              <span className="font-semibold text-surface-text">{formatCurrency(d.precio * d.cantidad, simbolo)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
