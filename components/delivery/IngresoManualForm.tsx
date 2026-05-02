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
  Tag,
  Percent,
  Gift,
  Package2,
  Phone,
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

interface CuponAplicado {
  id: number;
  codigo: string;
  tipo: "PORCENTAJE" | "MONTO";
  valor: number;
  descripcion: string | null;
  descuentoAplicado: number;
  esCumple?: boolean;
}

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
  onOrderCreated: (pedido: { id: number; clienteNombre: string; telefono: string; direccion: string; referencia: string }) => void;
}

const METODOS: { key: MetodoPago; label: string; icon: React.ReactNode; active: string; inactive: string }[] = [
  {
    key: "EFECTIVO",
    label: "Efectivo",
    icon: <Banknote size={16} />,
    active:   "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200",
    inactive: "border-stone-200 bg-stone-50 text-stone-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
  },
  {
    key: "TARJETA",
    label: "Tarjeta",
    icon: <CreditCard size={16} />,
    active:   "border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200",
    inactive: "border-stone-200 bg-stone-50 text-stone-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
  },
  {
    key: "TRANSFERENCIA",
    label: "Transferencia",
    icon: <ArrowLeftRight size={16} />,
    active:   "border-violet-500 bg-violet-500 text-white shadow-sm shadow-violet-200",
    inactive: "border-stone-200 bg-stone-50 text-stone-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
  },
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

  /* ── Name lookup ── */
  const [nameQuery, setNameQuery] = useState("");
  const [nameSearching, setNameSearching] = useState(false);
  const [nameResults, setNameResults] = useState<ClienteEncontrado[]>([]);
  const [nameNotFound, setNameNotFound] = useState(false);

  /* ── Form fields ── */
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  // -1 = RETIRO EN LOCAL (costo $0), null = sin zona
  const RETIRO_ID = -1;
  const [zonaId, setZonaId] = useState<number | null>(
    zonasDelivery.length > 0 ? zonasDelivery[0].id : RETIRO_ID
  );
  const [cargoManual, setCargoManual] = useState(0);

  /* ── Product cart ── */
  const [searchProd, setSearchProd] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  /* ── Producto libre ── */
  const [libreNombre, setLibreNombre] = useState("");
  const [librePrecio, setLibrePrecio] = useState("");;

  /* ── Descuentos ── */
  const [showDescuentos, setShowDescuentos] = useState(false);
  const [descPorcentaje, setDescPorcentaje] = useState(0);
  const [descMontoFijo, setDescMontoFijo] = useState(0);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null);
  const [cuponLoading, setCuponLoading] = useState(false);
  const [cuponError, setCuponError] = useState("");

  /* ── Submit ── */
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [ticketData, setTicketData] = useState<{ id: number; clienteNombre: string } | null>(null);

  /* ── Zona y cargo de envío ── */
  const esRetiro = zonaId === RETIRO_ID;
  const zonaSeleccionada = zonasDelivery.find((z) => z.id === zonaId) ?? null;
  const cargoEnvio = esRetiro
    ? 0
    : zonasDelivery.length > 0
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
  const descuentoPorcentajeMonto = Math.round((subtotal * Math.min(100, Math.max(0, descPorcentaje))) / 100);
  const descuentoCuponMonto = cuponAplicado?.descuentoAplicado ?? 0;
  const descMontoFijoAplicado = Math.min(descMontoFijo, subtotal); // no puede superar el subtotal
  const descuentoTotal = descuentoPorcentajeMonto + descuentoCuponMonto + descMontoFijoAplicado;
  const totalConEnvio = Math.max(0, subtotal + cargoEnvio - descuentoTotal);
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
    setNameQuery("");
    setNameResults([]);
    setNameNotFound(false);
    setNombre("");
    setDireccion("");
    setReferencia("");
  }

  /* ── Name search ── */
  async function buscarClientePorNombre() {
    const q = nameQuery.trim();
    if (q.length < 2) return;
    setNameSearching(true);
    setNameResults([]);
    setNameNotFound(false);
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`);
      const data: ClienteEncontrado[] = await res.json();
      if (data.length > 0) {
        setNameResults(data.slice(0, 5));
      } else {
        setNameNotFound(true);
      }
    } catch {
      setNameNotFound(true);
    } finally {
      setNameSearching(false);
    }
  }

  function seleccionarClienteNombre(c: ClienteEncontrado) {
    setClienteEncontrado(c);
    setNombre(c.nombre);
    setDireccion(c.direccion ?? "");
    if (c.telefono) setPhoneDigits(c.telefono.replace(/\D/g, "").slice(-8));
    setNameResults([]);
    setNameQuery("");
  }

  /* ── Cupones ── */
  async function aplicarCupon() {
    const codigo = codigoCupon.trim().toUpperCase();
    if (!codigo) return;
    setCuponLoading(true);
    setCuponError("");
    try {
      const res = await fetch("/api/cupones/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, sucursalId, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cupón inválido");
      setCuponAplicado(data as CuponAplicado);
      setCodigoCupon("");
    } catch (e) {
      setCuponError((e as Error).message);
    } finally {
      setCuponLoading(false);
    }
  }

  function quitarCupon() {
    setCuponAplicado(null);
    setCuponError("");
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
          zonaDelivery: esRetiro ? "RETIRO EN LOCAL" : (zonaSeleccionada?.nombre ?? undefined),
          descuento: descuentoTotal,
          cuponId: cuponAplicado?.id && cuponAplicado.id > 0 ? cuponAplicado.id : null,
          cuponCodigo: cuponAplicado?.codigo ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear el pedido");

      const ticket = { id: data.id, clienteNombre: nombre.trim() };
      setTicketData(ticket);
      onOrderCreated({
        id: data.id,
        clienteNombre: nombre.trim(),
        telefono: phone,
        direccion: direccion.trim(),
        referencia: referencia.trim(),
      });

      // Reset form
      setCart([]);
      setPhoneDigits("");
      setClienteEncontrado(null);
      setClienteNotFound(false);
      setNombre("");
      setDireccion("");
      setReferencia("");
      setMetodo("EFECTIVO");
      setZonaId(zonasDelivery.length > 0 ? zonasDelivery[0].id : RETIRO_ID);
      setDescPorcentaje(0);
      setCodigoCupon("");
      setCuponAplicado(null);
      setCuponError("");
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
      @page{size:80mm auto;margin:0;}@media print{@page{size:80mm auto;margin:0;}}
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Courier New',monospace;font-size:13px;width:80mm;padding:3mm 3mm 10mm;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
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
      ${descuentoPorcentajeMonto > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;"><span>Descuento (${descPorcentaje}%)</span><span>-${formatCurrency(descuentoPorcentajeMonto, simbolo)}</span></div>` : ""}
      ${descMontoFijoAplicado > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;"><span>Descuento monto fijo</span><span>-${formatCurrency(descMontoFijoAplicado, simbolo)}</span></div>` : ""}
      ${descuentoCuponMonto > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;"><span>Descuento${cuponAplicado?.esCumple ? " 🎂 Cumpleaños" : cuponAplicado ? ` (${cuponAplicado.codigo})` : ""}</span><span>-${formatCurrency(descuentoCuponMonto, simbolo)}</span></div>` : ""}
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
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">

      {/* ══ LEFT: Form ══ */}
      <div className="space-y-3">

        {/* ── Widget: Buscar cliente ── */}
        {clienteEncontrado ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow shadow-emerald-200">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <div>
                <p className="font-black text-emerald-900">{clienteEncontrado.nombre}</p>
                <p className="text-xs font-semibold text-emerald-600">{phone || "Sin teléfono"}</p>
              </div>
            </div>
            <button onClick={resetCliente} className="rounded-xl p-1.5 hover:bg-emerald-100 transition">
              <X size={15} className="text-emerald-600" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">

            {/* — Widget TELÉFONO — índigo */}
            <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-3.5 shadow-sm">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500 shadow shadow-indigo-300">
                  <Phone size={13} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Por teléfono</p>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-1.5 rounded-xl border-2 border-indigo-200 bg-white px-2.5 py-1.5">
                  <span className="flex-shrink-0 text-xs font-bold text-indigo-400">+569</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={8}
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
                    placeholder="12345678"
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-indigo-200"
                  />
                </div>
                <button
                  onClick={buscarCliente}
                  disabled={phoneDigits.length < 8 || searching}
                  className="flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-1.5 text-white shadow shadow-indigo-300 transition hover:bg-indigo-700 disabled:opacity-40 active:scale-95"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </button>
              </div>
              {clienteNotFound && (
                <p className="mt-1.5 text-xs font-semibold text-amber-600">No encontrado</p>
              )}
            </div>

            {/* — Widget NOMBRE — violeta */}
            <div className="relative rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100/60 p-3.5 shadow-sm">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500 shadow shadow-violet-300">
                  <User size={13} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">Por nombre</p>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-1.5 rounded-xl border-2 border-violet-200 bg-white px-2.5 py-1.5">
                  <input
                    type="text"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscarClientePorNombre()}
                    placeholder="Ej: María López"
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-violet-200"
                  />
                </div>
                <button
                  onClick={buscarClientePorNombre}
                  disabled={nameQuery.trim().length < 2 || nameSearching}
                  className="flex items-center justify-center rounded-xl bg-violet-600 px-3 py-1.5 text-white shadow shadow-violet-300 transition hover:bg-violet-700 disabled:opacity-40 active:scale-95"
                >
                  {nameSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </button>
              </div>
              {nameNotFound && (
                <p className="mt-1.5 text-xs font-semibold text-amber-600">No encontrado</p>
              )}
              {nameResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-xl shadow-violet-100">
                  {nameResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => seleccionarClienteNombre(c)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-violet-50 border-b border-violet-50 last:border-0"
                    >
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                        <User size={12} className="text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-800">{c.nombre}</p>
                        {c.telefono && <p className="text-xs text-stone-400">{c.telefono}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Widget: Datos del cliente ── */}
        <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-800 shadow">
              <User size={13} className="text-white" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-stone-600">Datos del cliente</p>
          </div>
          <div className="space-y-2">
            {/* Nombre + Referencia lado a lado */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-400">Nombre *</label>
                <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2">
                  <User size={13} className="flex-shrink-0 text-stone-400" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-400">Referencia</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Depto, piso..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300 focus:border-brand-400"
                />
              </div>
            </div>
            {/* Dirección */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-400">Dirección *</label>
              <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2">
                <MapPin size={13} className="flex-shrink-0 text-stone-400" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Widget: Zona de entrega ── */}
        <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
          {/* Header: título + Retiro en local como acción destacada */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 shadow shadow-brand-200">
                <Truck size={13} className="text-white" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-stone-600">Zona / Entrega</p>
            </div>
            {/* Retiro en local — siempre visible, color propio */}
            <button
              type="button"
              onClick={() => setZonaId(RETIRO_ID)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                esRetiro
                  ? "border-emerald-500 bg-emerald-500 text-white shadow shadow-emerald-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
              )}
            >
              <Package2 size={13} />
              Retiro en local
              <span className={cn("font-black", esRetiro ? "text-emerald-100" : "text-emerald-500")}>· GRATIS</span>
            </button>
          </div>

          {/* Zonas de delivery */}
          <div className="flex flex-wrap gap-2">
            {zonasDelivery.map((z) => {
              const isSelected = zonaId === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZonaId(z.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all active:scale-95",
                    isSelected
                      ? "border-brand-400 bg-brand-50 text-brand-800"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
                  )}
                >
                  <Truck size={14} className={isSelected ? "text-brand-600" : "text-stone-400"} />
                  {z.nombre}
                  <span className={cn("font-black", isSelected ? "text-brand-700" : "text-stone-400")}>
                    · {formatCurrency(z.precio, simbolo)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sin zonas: input manual */}
          {zonasDelivery.length === 0 && !esRetiro && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-stone-400">Costo de envío manual</label>
              <input
                type="number"
                value={cargoManual}
                onChange={(e) => setCargoManual(Math.max(0, Number(e.target.value)))}
                min={0}
                step={100}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-base font-black text-stone-800 outline-none focus:border-brand-400"
              />
            </div>
          )}
        </div>

        {/* ── Widget: Pago ── */}
        <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500 shadow shadow-violet-200">
              <CreditCard size={13} className="text-white" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-stone-600">Método de pago</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetodo(m.key)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-bold transition-all active:scale-95",
                  metodo === m.key ? m.active : m.inactive
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Widget: Descuentos (colapsible) ── */}
        <div className={cn(
          "rounded-2xl border-2 border-dashed transition-colors",
          showDescuentos || descuentoTotal > 0
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-stone-200 bg-stone-50/60"
        )}>
          <button
            type="button"
            onClick={() => setShowDescuentos((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <span className={cn(
              "flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest",
              showDescuentos || descuentoTotal > 0 ? "text-emerald-700" : "text-stone-400"
            )}>
              <Tag size={12} />
              Descuentos
              {descuentoTotal > 0 && (
                <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                  -{formatCurrency(descuentoTotal, simbolo)}
                </span>
              )}
            </span>
            <ChevronDown
              size={14}
              className={cn("transition-transform duration-200", showDescuentos ? "rotate-180 text-emerald-600" : "text-stone-300")}
            />
          </button>

          {showDescuentos && (
            <div className="px-4 pb-4 space-y-3">
              {/* % + monto fijo lado a lado */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">Descuento %</label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
                    <Percent size={13} className="flex-shrink-0 text-stone-400" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={descPorcentaje || ""}
                      onChange={(e) => setDescPorcentaje(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      placeholder="0"
                      className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                    />
                    {descPorcentaje > 0 && (
                      <span className="text-xs font-bold text-emerald-600">-{formatCurrency(descuentoPorcentajeMonto, simbolo)}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">Monto fijo</label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
                    <span className="flex-shrink-0 text-sm font-bold text-stone-400">{simbolo}</span>
                    <input
                      type="number"
                      min={0}
                      value={descMontoFijo || ""}
                      onChange={(e) => setDescMontoFijo(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-stone-300"
                    />
                    {descMontoFijo > 0 && (
                      <span className="text-xs font-bold text-emerald-600">-{formatCurrency(descMontoFijoAplicado, simbolo)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cupón */}
              {cuponAplicado ? (
                <div className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2",
                  cuponAplicado.esCumple ? "border-pink-200 bg-pink-50" : "border-emerald-200 bg-emerald-50"
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    {cuponAplicado.esCumple
                      ? <Gift size={14} className="flex-shrink-0 text-pink-500" />
                      : <Tag size={14} className="flex-shrink-0 text-emerald-600" />
                    }
                    <div className="min-w-0">
                      <p className={cn("text-xs font-bold truncate", cuponAplicado.esCumple ? "text-pink-700" : "text-emerald-700")}>
                        {cuponAplicado.esCumple ? "🎂 Cumpleaños" : cuponAplicado.codigo}
                      </p>
                      <p className="text-xs text-stone-500">-{formatCurrency(cuponAplicado.descuentoAplicado, simbolo)}</p>
                    </div>
                  </div>
                  <button onClick={quitarCupon} className="flex-shrink-0 rounded-lg p-1 hover:bg-white transition">
                    <X size={13} className="text-stone-400" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">Código de cupón</label>
                  <div className="flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
                      <Tag size={13} className="flex-shrink-0 text-stone-400" />
                      <input
                        type="text"
                        value={codigoCupon}
                        onChange={(e) => { setCodigoCupon(e.target.value.toUpperCase()); setCuponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && aplicarCupon()}
                        placeholder="CODIGO o CUMPLEAÑOS"
                        className="flex-1 bg-transparent text-sm font-semibold uppercase outline-none placeholder:normal-case placeholder:font-normal placeholder:text-stone-300"
                      />
                    </div>
                    <button
                      onClick={aplicarCupon}
                      disabled={!codigoCupon.trim() || cuponLoading || !subtotal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40 active:scale-95"
                    >
                      {cuponLoading ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                  {cuponError && <p className="mt-1 text-xs font-semibold text-red-500">{cuponError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Widget: Selección de productos ── */}
        <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 shadow shadow-amber-200">
              <Package2 size={13} className="text-white" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-stone-600">Selección de productos</p>
          </div>

          <div className="relative mb-2.5">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchProd}
              onChange={(e) => setSearchProd(e.target.value)}
              placeholder="Buscar en carta..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto">
            {productosFiltrados.slice(0, 40).map((p) => {
              const inCart = cart.find((i) => i.productoId === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition active:scale-[0.98]",
                    inCart
                      ? "border-brand-200 bg-brand-50"
                      : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white"
                  )}
                >
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} className="h-8 w-8 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-stone-200 text-sm">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{p.nombre}</p>
                    {p.categoria && <p className="text-[10px] text-stone-400">{p.categoria.nombre}</p>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-sm font-black text-brand-600">{formatCurrency(p.precio, simbolo)}</span>
                    {inCart ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        {inCart.cantidad}
                      </span>
                    ) : (
                      <Plus size={13} className="text-stone-400" />
                    )}
                  </div>
                </button>
              );
            })}
            {productosFiltrados.length === 0 && (
              <p className="py-5 text-center text-sm text-stone-400">Sin resultados</p>
            )}
          </div>

          {/* ── Producto Libre ── */}
          <div className="mt-3 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">✏️ Producto libre</p>
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
                className="w-20 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <button
                onClick={addLibre}
                disabled={!libreNombre.trim() || !librePrecio}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
              >
                <Plus size={14} />
                Add
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

                {/* Descuento % */}
                {descuentoPorcentajeMonto > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <Tag size={11} /> Descuento {descPorcentaje}%
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      -{formatCurrency(descuentoPorcentajeMonto, simbolo)}
                    </span>
                  </div>
                )}

                {/* Descuento monto fijo */}
                {descMontoFijoAplicado > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <Tag size={11} /> Descuento monto fijo
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      -{formatCurrency(descMontoFijoAplicado, simbolo)}
                    </span>
                  </div>
                )}

                {/* Descuento cupón */}
                {descuentoCuponMonto > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      {cuponAplicado?.esCumple ? <Gift size={11} /> : <Tag size={11} />}
                      {cuponAplicado?.esCumple ? "Cumpleaños" : cuponAplicado?.codigo}
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      -{formatCurrency(descuentoCuponMonto, simbolo)}
                    </span>
                  </div>
                )}

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
