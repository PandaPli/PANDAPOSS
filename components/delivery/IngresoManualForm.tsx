"use client";

import { useState, useMemo, useRef } from "react";
import {
  Search,
  User,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Printer,
  Loader2,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Truck,
  ChevronDown,
} from "lucide-react";
import { formatCurrency, normalize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { printFrame } from "@/lib/printFrame";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string | null;
  codigo?: string | null;
  categoria?: { nombre: string };
}

interface CartLine {
  tempId: string;          // clave única (para libres y regulares)
  productoId?: number;     // solo productos de carta
  nombre: string;
  precio: number;
  cantidad: number;
  esLibre?: boolean;
}

interface ClienteEncontrado {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
}

type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

interface ZonaDelivery {
  id: number;
  nombre: string;
  precio: number;
}

interface Props {
  productos: Producto[];
  sucursalId: number | null;
  simbolo: string;
  zonasDelivery?: ZonaDelivery[];
  onOrderCreated: (pedido: { id: number; clienteNombre: string }) => void;
}

const METODOS: { key: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { key: "EFECTIVO", label: "Efectivo", icon: <Banknote size={16} /> },
  { key: "TARJETA", label: "Tarjeta", icon: <CreditCard size={16} /> },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: <ArrowLeftRight size={16} /> },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function IngresoManualForm({ productos, sucursalId, simbolo, zonasDelivery = [], onOrderCreated }: Props) {
  /* ── Phone lookup ── */
  const [phoneDigits, setPhoneDigits] = useState("");
  const [searching, setSearching] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<ClienteEncontrado | null>(null);
  const [clienteNotFound, setClienteNotFound] = useState(false);

  /* ── Form fields ── */
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [zonaId, setZonaId] = useState<number | null>(
    zonasDelivery.length > 0 ? zonasDelivery[0].id : null
  );
  const [cargoManual, setCargoManual] = useState(0);

  /* ── Product cart ── */
  const [searchProd, setSearchProd] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  /* ── Producto libre ── */
  const [libreNombre, setLibreNombre] = useState("");
  const [librePrecio, setLibrePrecio] = useState("");;

  /* ── Submit ── */
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [ticketData, setTicketData] = useState<{ id: number; clienteNombre: string } | null>(null);

  /* ── Zona y cargo de envío ── */
  const zonaSeleccionada = zonasDelivery.find((z) => z.id === zonaId) ?? null;
  const cargoEnvio = zonasDelivery.length > 0
    ? (zonaSeleccionada?.precio ?? 0)
    : cargoManual;

  /* ── Computed ── */
  const productosFiltrados = useMemo(() => {
    const q = normalize(searchProd.trim());
    if (!q) return productos;
    return productos.filter(
      (p) =>
        normalize(p.nombre).includes(q) ||
        normalize(p.codigo ?? "").includes(q) ||
        normalize(p.categoria?.nombre ?? "").includes(q)
    );
  }, [productos, searchProd]);

  const subtotal = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalConEnvio = subtotal + cargoEnvio;
  const phone = `+569${phoneDigits.replace(/\s/g, "")}`;

  /* ── Phone search ── */
  async function buscarCliente() {
    if (phoneDigits.length < 8) return;
    setSearching(true);
    setClienteEncontrado(null);
    setClienteNotFound(false);
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(phoneDigits)}`);
      const data: ClienteEncontrado[] = await res.json();
      if (data.length > 0) {
        const c = data[0];
        setClienteEncontrado(c);
        setNombre(c.nombre);
        setDireccion(c.direccion ?? "");
      } else {
        setClienteNotFound(true);
        setNombre("");
        setDireccion("");
      }
    } catch {
      setClienteNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  function resetCliente() {
    setPhoneDigits("");
    setClienteEncontrado(null);
    setClienteNotFound(false);
    setNombre("");
    setDireccion("");
    setReferencia("");
  }

  /* ── Cart ── */
  function addProduct(p: Producto) {
    setCart((prev) => {
      const ex = prev.find((i) => i.productoId === p.id);
      if (ex) return prev.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...prev, { tempId: `prod-${p.id}`, productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
    });
  }

  function addLibre() {
    const nombre = libreNombre.trim();
    const precio = parseFloat(librePrecio.replace(/[^0-9.]/g, ""));
    if (!nombre || isNaN(precio) || precio <= 0) return;
    setCart((prev) => [...prev, { tempId: `libre-${Date.now()}`, nombre, precio, cantidad: 1, esLibre: true }]);
    setLibreNombre("");
    setLibrePrecio("");
  }

  function updateCantidad(tempId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.tempId === tempId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!nombre.trim() || !direccion.trim() || !cart.length) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/delivery/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId,
          items: cart.map((i) => i.esLibre
            ? { productoId: null, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad }
            : { productoId: i.productoId, cantidad: i.cantidad }
          ),
          cliente: {
            nombre: nombre.trim(),
            telefono: phone,
            direccion: direccion.trim(),
            referencia: referencia.trim() || undefined,
          },
          metodoPago: metodo,
          cargoEnvio,
          zonaDelivery: zonaSeleccionada?.nombre ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear el pedido");

      const ticket = { id: data.id, clienteNombre: nombre.trim() };
      setTicketData(ticket);
      onOrderCreated(ticket);

      // Reset form
      setCart([]);
      setPhoneDigits("");
      setClienteEncontrado(null);
      setClienteNotFound(false);
      setNombre("");
      setDireccion("");
      setReferencia("");
      setMetodo("EFECTIVO");
      setZonaId(zonasDelivery.length > 0 ? zonasDelivery[0].id : null);
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  /* ── Print ticket ── */
  function printTicket(id: number, clienteNombre: string) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

    const itemsHtml = cart
      .map(
        (item) => `
      <div class="item">
        <span class="qty">${item.cantidad}×</span>
        <div class="info">
          <span class="nombre">${item.nombre}</span>
          <span class="precio">${formatCurrency(item.precio * item.cantidad, simbolo)}</span>
        </div>
      </div>`
      )
      .join("");

    printFrame(`<!DOCTYPE html><html><head><title>Ticket #${id}</title><style>
      @page{size:80mm auto;margin:0;}
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:monospace;font-size:13px;width:80mm;max-width:80mm;padding:10px;}
      .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;}
      .title{font-size:18px;font-weight:bold;letter-spacing:2px;}
      .ticket-num{font-size:28px;font-weight:900;margin-top:4px;}
      .cliente{font-size:15px;font-weight:bold;margin-top:6px;}
      .meta{font-size:11px;color:#555;margin-top:2px;}
      .divider{border-top:1px dashed #000;margin:8px 0;}
      .items{margin:8px 0;}
      .item{display:flex;gap:8px;margin:5px 0;align-items:flex-start;}
      .qty{font-weight:bold;min-width:22px;}
      .info{flex:1;display:flex;justify-content:space-between;}
      .nombre{font-weight:bold;}
      .precio{color:#555;}
      .total-row{display:flex;justify-content:space-between;font-size:15px;font-weight:900;margin-top:8px;border-top:2px solid #000;padding-top:8px;}
      .footer{text-align:center;font-size:10px;color:#999;margin-top:10px;}
      .metodo{font-size:11px;color:#555;text-align:right;margin-top:4px;}
    </style></head><body>
      <div class="header">
        <div class="title">PEDIDO DELIVERY</div>
        <div class="ticket-num">#${id}</div>
        <div class="cliente">${clienteNombre}</div>
        <div class="meta">${dateStr} · ${timeStr}</div>
      </div>
      <div class="items">${itemsHtml}</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;padding-top:6px;border-top:1px dashed #ccc;"><span>Subtotal</span><span>${formatCurrency(subtotal, simbolo)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;"><span>Envío${zonaSeleccionada ? ` (${zonaSeleccionada.nombre})` : ""}</span><span>${cargoEnvio > 0 ? formatCurrency(cargoEnvio, simbolo) : "GRATIS"}</span></div>
      <div class="total-row"><span>TOTAL</span><span>${formatCurrency(totalConEnvio, simbolo)}</span></div>
      <div class="metodo">Pago: ${metodo}</div>
      <div class="divider"></div>
      <p style="font-size:11px;color:#555;">📍 ${direccion}${referencia ? ` · ${referencia}` : ""}</p>
      <p style="font-size:11px;color:#555;margin-top:3px;">📞 ${phone}</p>
      <div class="footer">— PandaPoss Delivery —</div>
    </body></html>`);
  }

  /* ── Render ── */
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

      {/* ══ LEFT: Form ══ */}
      <div className="space-y-5">

        {/* ── Phone lookup ── */}
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-muted">
            Buscar cliente por teléfono
          </p>

          {clienteEncontrado ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">{clienteEncontrado.nombre}</p>
                  <p className="text-xs text-emerald-600">{phone}</p>
                </div>
              </div>
              <button onClick={resetCliente} className="rounded-xl p-1.5 hover:bg-emerald-100 transition">
                <X size={16} className="text-emerald-600" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                <span className="flex-shrink-0 text-sm font-semibold text-stone-500">+569</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={8}
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
                  placeholder="12345678"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-stone-300"
                />
              </div>
              <button
                onClick={buscarCliente}
                disabled={phoneDigits.length < 8 || searching}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-700 disabled:opacity-40 active:scale-95"
              >
                {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                Buscar
              </button>
            </div>
          )}

          {clienteNotFound && (
            <p className="mt-2 text-xs font-semibold text-amber-600">
              Cliente no encontrado — ingresa los datos manualmente
            </p>
          )}
        </div>

        {/* ── Customer data ── */}
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-surface-muted">
            Datos del cliente
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Nombre *</label>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                <User size={14} className="flex-shrink-0 text-stone-400" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Dirección *</label>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                <MapPin size={14} className="flex-shrink-0 text-stone-400" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Referencia</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Depto, piso, color de puerta..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* Zona de delivery */}
            {zonasDelivery.length > 0 ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Zona de delivery
                </label>
                <div className="relative">
                  <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select
                    value={zonaId ?? ""}
                    onChange={(e) => setZonaId(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-8 text-sm font-semibold text-stone-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  >
                    {zonasDelivery.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre} — {formatCurrency(z.precio, simbolo)}
                      </option>
                    ))}
                  </select>
                </div>
                {zonaSeleccionada && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                    <Truck size={11} />
                    Costo de envío: <span className="font-black">{formatCurrency(zonaSeleccionada.precio, simbolo)}</span>
                  </p>
                )}
              </div>
            ) : (
              /* Sin zonas configuradas: input manual de cargo */
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Costo de envío
                  <span className="ml-1 font-normal text-stone-400">(sin zonas configuradas)</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <Truck size={14} className="flex-shrink-0 text-stone-400" />
                  <input
                    type="number"
                    min={0}
                    value={cargoManual}
                    onChange={(e) => setCargoManual(Number(e.target.value))}
                    placeholder="0"
                    className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                  />
                </div>
              </div>
            )}

            {/* Payment method */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-stone-500">Tipo de pago</label>
              <div className="grid grid-cols-3 gap-2">
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
            </div>
          </div>
        </div>

        {/* ── Product search ── */}
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-muted">
            Selección de productos
          </p>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchProd}
              onChange={(e) => setSearchProd(e.target.value)}
              placeholder="Buscar en carta..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {productosFiltrados.slice(0, 40).map((p) => {
              const inCart = cart.find((i) => i.productoId === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98]",
                    inCart
                      ? "border-brand-200 bg-brand-50"
                      : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white"
                  )}
                >
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-stone-200 text-sm">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{p.nombre}</p>
                    {p.categoria && <p className="text-[10px] text-stone-400">{p.categoria.nombre}</p>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-sm font-black text-brand-600">
                      {formatCurrency(p.precio, simbolo)}
                    </span>
                    {inCart ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        {inCart.cantidad}
                      </span>
                    ) : (
                      <Plus size={14} className="text-stone-400" />
                    )}
                  </div>
                </button>
              );
            })}
            {productosFiltrados.length === 0 && (
              <p className="py-6 text-center text-sm text-stone-400">Sin resultados</p>
            )}
          </div>

          {/* ── Producto Libre ── */}
          <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">
              ✏️ Producto Libre
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={libreNombre}
                onChange={(e) => setLibreNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLibre()}
                placeholder="Nombre del producto"
                className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <input
                type="text"
                inputMode="numeric"
                value={librePrecio}
                onChange={(e) => setLibrePrecio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLibre()}
                placeholder="Precio"
                className="w-24 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <button
                onClick={addLibre}
                disabled={!libreNombre.trim() || !librePrecio}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
              >
                <Plus size={15} />
                Agregar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Ticket ══ */}
      <div className="flex flex-col gap-5">
        <div className="rounded-[1.75rem] border border-surface-border bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-muted">
            Pedido
          </p>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-300">Agrega productos del panel izquierdo</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.tempId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                    item.esLibre ? "border-amber-200 bg-amber-50" : "border-stone-100 bg-stone-50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-stone-800">{item.nombre}</p>
                      {item.esLibre && (
                        <span className="shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">Libre</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-brand-600">
                      {formatCurrency(item.precio * item.cantidad, simbolo)}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-white px-1 py-1 border border-stone-200">
                    <button
                      onClick={() => updateCantidad(item.tempId, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-base font-bold text-stone-500 hover:bg-stone-100 transition"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                    <button
                      onClick={() => updateCantidad(item.tempId, +1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-base font-bold text-stone-500 hover:bg-stone-100 transition"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => setCart((prev) => prev.filter((i) => i.tempId !== item.tempId))}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl text-stone-300 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <div className="mt-3 space-y-1.5">
                {/* Subtotal */}
                <div className="flex items-center justify-between rounded-xl bg-stone-100 px-4 py-2.5">
                  <span className="text-xs font-semibold text-stone-500">Subtotal</span>
                  <span className="text-sm font-bold text-stone-700">{formatCurrency(subtotal, simbolo)}</span>
                </div>

                {/* Cargo de envío */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                    <Truck size={11} />
                    {zonaSeleccionada ? zonaSeleccionada.nombre : "Envío"}
                  </span>
                  <span className="text-sm font-bold text-brand-600">
                    {cargoEnvio > 0 ? formatCurrency(cargoEnvio, simbolo) : "GRATIS"}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-2xl bg-stone-900 px-4 py-3">
                  <span className="text-sm font-semibold text-stone-300">TOTAL</span>
                  <span className="text-lg font-black text-white">{formatCurrency(totalConEnvio, simbolo)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Errors ── */}
        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        )}

        {/* ── Validation hints ── */}
        {(!nombre.trim() || !direccion.trim() || !cart.length) && (
          <div className="space-y-1 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {!nombre.trim() && <p>• Ingresa el nombre del cliente</p>}
            {!direccion.trim() && <p>• Ingresa la dirección de entrega</p>}
            {!cart.length && <p>• Agrega al menos un producto</p>}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={loading || !nombre.trim() || !direccion.trim() || !cart.length}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-base font-bold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Creando pedido...</>
          ) : (
            <><CheckCircle2 size={18} /> Crear pedido delivery</>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════
          TICKET SUCCESS MODAL
      ════════════════════════════════════════════ */}
      {ticketData && (
        <div className="fixed inset-0 z-50 col-span-full flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-stone-800">¡Pedido creado!</h3>
              <button onClick={() => setTicketData(null)} className="rounded-xl p-1.5 hover:bg-stone-100 transition">
                <X size={18} className="text-stone-500" />
              </button>
            </div>

            <div className="rounded-2xl bg-stone-900 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">N° Ticket</p>
              <p className="mt-1 text-5xl font-black text-white">#{ticketData.id}</p>
              <p className="mt-2 text-sm font-semibold text-stone-300">{ticketData.clienteNombre}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => printTicket(ticketData.id, ticketData.clienteNombre)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3.5 font-bold text-white transition hover:bg-stone-700"
              >
                <Printer size={16} />
                Imprimir ticket
              </button>
              <button
                onClick={() => setTicketData(null)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 py-3.5 font-semibold text-stone-600 transition hover:bg-stone-100"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
