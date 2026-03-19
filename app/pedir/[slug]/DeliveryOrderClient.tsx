"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Loader2, MapPin, Minus, Phone, Plus, ReceiptText, ShoppingBag, Sparkles, UserCheck } from "lucide-react";
import ProductoViewer from "./ProductoViewer";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { formatCurrency } from "@/lib/utils";
import type { MetodoPago } from "@/types";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
  productos: Producto[];
}

interface CartItem extends Producto {
  cantidad: number;
  nota?: string;
}

interface ZonaDelivery {
  id: number;
  nombre: string;
  precio: number;
  polygon?: { lat: number; lng: number }[];
}

function pointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

interface Props {
  sucursal: {
    id: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    logoUrl: string | null;
    cartaBg: string | null;
    cartaTagline: string | null;
    cartaSaludo: string | null;
    simbolo: string;
  };
  categorias: Categoria[];
  slug: string;
  zonas: ZonaDelivery[];
}

const paymentOptions: { id: string; label: string; method: MetodoPago; detail: string }[] = [
  { id: "webpay", label: "Webpay", method: "TARJETA", detail: "Tarjeta y links de pago" },
  { id: "efectivo", label: "Efectivo", method: "EFECTIVO", detail: "Pago al recibir" },
  { id: "transferencia", label: "Transferencia", method: "TRANSFERENCIA", detail: "Envio de comprobante" },
  { id: "mercadopago", label: "Mercado Pago", method: "TARJETA", detail: "Wallet y tarjetas" },
];

export function DeliveryOrderClient({ sucursal, categorias, slug, zonas }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(categorias[0]?.id ?? null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [referencia, setReferencia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [zonaId, setZonaId] = useState<number | null>(zonas[0]?.id ?? null);
  const [paymentId, setPaymentId] = useState(paymentOptions[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: number; total: number; trackingUrl: string; whatsappUrl: string | null } | null>(null);
  
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientFoundLabel, setClientFoundLabel] = useState("");
  const [sugerenciaDireccion, setSugerenciaDireccion] = useState<{calle: string, referencia: string} | null>(null);

  const zonaSeleccionada = zonas.find((zona) => zona.id === zonaId) ?? zonas[0] ?? null;
  const paymentSeleccionado = paymentOptions.find((option) => option.id === paymentId) ?? paymentOptions[0];
  const categoriaVisible = categorias.find((categoria) => categoria.id === categoriaActiva) ?? categorias[0];

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    [cart]
  );
  const totalItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.cantidad, 0),
    [cart]
  );
  const total = subtotal + (zonaSeleccionada?.precio ?? 0);

  function addItem(producto: Producto) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === producto.id);
      if (existing) {
        return prev.map((item) => (item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      }

      return [...prev, { ...producto, cantidad: 1 }];
    });
  }

  function removeItem(productoId: number) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productoId);
      if (!existing) return prev;
      if (existing.cantidad === 1) return prev.filter((item) => item.id !== productoId);
      return prev.map((item) => (item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item));
    });
  }

  function updateNota(productoId: number, nota: string) {
    setCart((prev) =>
      prev.map((item) => (item.id === productoId ? { ...item, nota } : item))
    );
  }

  useEffect(() => {
    // Si el usuario borra el telefono, limpiamos el badge
    if (telefono.length < 8) {
      setClientFoundLabel("");
    }

    // Buscamos autofill si el numero tiene exactamente 8 digitos (ej: 9XXXXXXX despues del +56 9)
    if (telefono.length === 8) {
      const controller = new AbortController();
      
      const searchClient = async () => {
        setIsSearchingClient(true);
        setClientFoundLabel("");
        try {
          // El prefix ya sabemos que es +56 9, mandamos la query completa o solo los digitos
          const phoneQuery = `569${telefono}`; 
          const res = await fetch(`/api/public/clientes/buscar?telefono=${phoneQuery}&sucursalId=${sucursal.id}`, {
            signal: controller.signal
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data) {
              if (data.nombre) setNombre(data.nombre);
              setClientFoundLabel(`👋 Hola, ${data.nombre.split(' ')[0]}`);
              
              if (data.direccion) {
                setSugerenciaDireccion({ calle: data.direccion, referencia: data.referencia || "" });
                // Solo autocompletamos directo si el campo estaba vacio o tenia algo generico
                if (!direccion.trim()) {
                  setDireccion(data.direccion);
                  setReferencia(data.referencia || "");
                }
              }
            }
          }
        } catch (e) {
          if (e instanceof Error && e.name !== 'AbortError') {
             console.log("No se pudo autocompletar cliente");
          }
        } finally {
          setIsSearchingClient(false);
        }
      };

      // Pequeño debounce para no interrumpir typeo rapido
      const timeoutId = setTimeout(searchClient, 400);
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [telefono, sucursal.id, direccion]);

  async function handleSubmit() {
    if (cart.length === 0) {
      setError("Agrega al menos un producto antes de confirmar.");
      return;
    }

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setError("Completa nombre, telefono y direccion de despacho.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/delivery/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId: sucursal.id,
          cliente: {
            nombre,
            telefono,
            direccion,
            referencia,
            departamento,
            lat: geoLat,
            lng: geoLng,
          },
          metodoPago: paymentSeleccionado.method,
          cargoEnvio: zonaSeleccionada?.precio ?? 0,
          zonaDelivery: zonaSeleccionada?.nombre ?? null,
          items: cart.map((item) => ({
            productoId: item.id,
            cantidad: item.cantidad,
            ...(item.nota?.trim() ? { observacion: item.nota.trim() } : {}),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No fue posible crear el pedido.");

      // Construir mensaje WhatsApp antes de limpiar el carrito
      const cartSnapshot = [...cart];
      const zonaSnap = zonas.find((z) => z.id === zonaId);
      const subtotalSnap = cartSnapshot.reduce((a, i) => a + i.precio * i.cantidad, 0);
      const totalSnap = subtotalSnap + (zonaSnap?.precio ?? 0);
      let waMsg = `Hola! Mi pedido es:\n`;
      cartSnapshot.forEach((item) => {
        waMsg += `• ${item.nombre} x${item.cantidad} — ${formatCurrency(item.precio * item.cantidad, sucursal.simbolo)}\n`;
      });
      if (zonaSnap) waMsg += `\nZona: ${zonaSnap.nombre} (${formatCurrency(zonaSnap.precio, sucursal.simbolo)})\n`;
      waMsg += `\n*Total: ${formatCurrency(totalSnap, sucursal.simbolo)}*`;
      waMsg += `\n\nPedido #${data.id}`;

      const rawPhone = (sucursal.telefono ?? "").replace(/\D/g, "");
      const whatsappUrl = rawPhone ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(waMsg)}` : null;

      setSuccess({
        id: data.id,
        total: Number(data.total),
        trackingUrl: data.trackingUrl,
        whatsappUrl,
      });
      setCart([]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible crear el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#111111_0%,#1f2937_100%)] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-[0_45px_120px_-65px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200">
            <Sparkles size={28} />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Pedido confirmado</p>
          <h1 className="mt-3 text-4xl font-black">Pedido #{success.id}</h1>
          <p className="mt-3 text-sm text-white/75">Tu pedido ya entro directo a PandaPoss, la cocina lo esta preparando y luego se asignara a delivery.</p>

          <div className="mt-8 grid gap-3 rounded-[1.5rem] bg-white/8 p-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Total</p>
              <p className="mt-2 text-2xl font-black">{formatCurrency(success.total, sucursal.simbolo)}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={success.trackingUrl} className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300">
              Seguir pedido
            </Link>
            {success.whatsappUrl && (
              <a
                href={success.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1ebe5a]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Confirmar por WhatsApp
              </a>
            )}
            <button onClick={() => setSuccess(null)} className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              Hacer otro pedido
            </button>
          </div>
        </div>
      </main>
    );
  }

  const productosVisibles = categoriaVisible?.productos ?? [];

  return (
    <>
    {/* Visor de producto con swipe */}
    {viewerIndex !== null && productosVisibles.length > 0 && (
      <ProductoViewer
        productos={productosVisibles}
        initialIndex={viewerIndex}
        simbolo={sucursal.simbolo}
        getQuantity={(id) => cart.find((i) => i.id === id)?.cantidad ?? 0}
        onAdd={addItem}
        onRemove={removeItem}
        onClose={() => setViewerIndex(null)}
      />
    )}
    <main className="min-h-screen bg-[#f4efe7] text-stone-900">
      {/* Padding inferior en mobile para que el bottom bar no tape el contenido */}
      <div className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6 lg:px-8 xl:pb-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_420px]">
          <section className="space-y-6">
            {/* ═══ HERO ═══ */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)]">
              {/* Fondo */}
              <div
                className="absolute inset-0"
                style={sucursal.cartaBg
                  ? { backgroundImage: `url(${sucursal.cartaBg})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: "linear-gradient(135deg,#1a0a00 0%,#3b0f0f 40%,#1c1003 100%)" }
                }
              />
              {/* Overlay gradiente para siempre leer bien el texto */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

              {/* Volver */}
              <div className="relative z-10 px-6 pt-5 sm:px-8">
                <Link href="/pedir" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition hover:text-white">
                  <ArrowLeft size={13} /> Volver
                </Link>
              </div>

              {/* Logo centrado */}
              <div className="relative z-10 flex flex-col items-center px-6 pt-4 pb-2 sm:px-8">
                {sucursal.logoUrl ? (
                  <img
                    src={sucursal.logoUrl}
                    alt={sucursal.nombre}
                    className="h-36 w-auto max-w-[280px] object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
                  />
                ) : (
                  <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
                    {sucursal.nombre}
                  </h1>
                )}
              </div>

              {/* Bloque de información */}
              <div className="relative z-10 mx-4 mb-6 mt-2 sm:mx-8">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center backdrop-blur-md">
                  {sucursal.cartaTagline && (
                    <p className="text-lg font-black text-white drop-shadow sm:text-xl">
                      {sucursal.cartaTagline}
                    </p>
                  )}
                  {sucursal.cartaSaludo && (
                    <p className="mt-1 text-sm text-white/75">{sucursal.cartaSaludo}</p>
                  )}
                  {!sucursal.cartaTagline && !sucursal.cartaSaludo && (
                    <p className="text-sm text-white/60">Pide directo, cocina lo prepara al momento.</p>
                  )}
                  {/* Dirección y teléfono */}
                  {(sucursal.direccion || sucursal.telefono) && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/50">
                      {sucursal.direccion && <span>📍 {sucursal.direccion}</span>}
                      {sucursal.telefono && <span>📞 {sucursal.telefono}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Categorías ── */}
            <div className="rounded-[2rem] border border-black/5 bg-white/80 backdrop-blur-sm p-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)]">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaActiva(categoria.id)}
                    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-black transition-all duration-200 ${
                      categoriaActiva === categoria.id
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 scale-105"
                        : "bg-stone-100 text-stone-500 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Productos ── */}
            <div className="space-y-2">
              {(categoriaVisible?.productos ?? []).map((producto, idx) => {
                const quantity = cart.find((item) => item.id === producto.id)?.cantidad ?? 0;
                return (
                  <article
                    key={producto.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.10)] transition-all duration-200 active:scale-[0.99]"
                  >
                    {/* Miniatura cuadrada */}
                    <button
                      className="relative h-[76px] w-[76px] flex-shrink-0 overflow-hidden rounded-xl"
                      onClick={() => setViewerIndex(idx)}
                    >
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
                          <span className="text-3xl opacity-40">🍽️</span>
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black leading-tight text-stone-900">{producto.nombre}</p>
                      {producto.descripcion && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-stone-400">{producto.descripcion}</p>
                      )}
                      <p className="mt-1 text-sm font-black text-orange-500">
                        {formatCurrency(producto.precio, sucursal.simbolo)}
                      </p>
                    </div>

                    {/* Contador */}
                    <div className="flex-shrink-0">
                      {quantity === 0 ? (
                        <button
                          onClick={() => addItem(producto)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/60 transition-all hover:from-orange-600 hover:to-amber-600 active:scale-90"
                        >
                          <Plus size={18} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-stone-950 px-1.5 py-1">
                          <button
                            onClick={() => removeItem(producto.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-[18px] text-center text-sm font-black text-white">{quantity}</span>
                          <button
                            onClick={() => addItem(producto)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white transition hover:from-orange-600 hover:to-amber-600 active:scale-90"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="xl:sticky xl:top-6 xl:h-fit">
            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_35px_100px_-60px_rgba(0,0,0,0.45)]">
              <div className="border-b border-white/5 bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Tu pedido</p>
                    <h2 className="mt-0.5 text-xl font-black">🔥 ¿Qué va hoy?</h2>
                  </div>
                  {totalItems > 0 && (
                    <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-black backdrop-blur-sm">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 p-5">
                <div className="space-y-3">
                  {cart.length === 0 ? (
                    <div className="rounded-[1.5rem] border-2 border-dashed border-orange-100 bg-orange-50/50 p-8 text-center">
                      <p className="text-4xl">🛒</p>
                      <p className="mt-2 text-sm font-bold text-stone-400">¡Todo listo para pedir!</p>
                      <p className="mt-1 text-xs text-stone-300">Elige algo del menú 👆</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-[1.25rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
                        <div className="flex items-start justify-between gap-3 p-3 pb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-stone-900 leading-tight">{item.nombre}</p>
                            <p className="mt-0.5 text-xs text-stone-400">{item.cantidad} × {formatCurrency(item.precio, sucursal.simbolo)}</p>
                          </div>
                          <p className="shrink-0 font-black text-orange-600">{formatCurrency(item.precio * item.cantidad, sucursal.simbolo)}</p>
                        </div>
                        {/* Nota para cocina */}
                        <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2">
                          <span className="shrink-0 text-[10px] font-black text-orange-300 uppercase tracking-wider">Nota</span>
                          <input
                            type="text"
                            value={item.nota ?? ""}
                            onChange={(e) => updateNota(item.id, e.target.value)}
                            placeholder="ej: sin pimentón, extra salsa"
                            maxLength={120}
                            className="min-w-0 flex-1 bg-transparent text-xs text-stone-600 placeholder-stone-300 outline-none"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Datos de despacho</p>
                  <div className="mt-4 space-y-3">
                    <div className="relative">
                      <div className="absolute left-0 top-0 flex items-center justify-center p-3 pl-4 text-stone-500 font-medium">
                        +56 9
                      </div>
                      <input 
                        value={telefono} 
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length > 8) {
                            // Limpieza heuristica chilenos si pegan: +569 8765 4321
                            if (val.startsWith("569") && val.length === 11) val = val.slice(-8);
                            else if (val.startsWith("9") && val.length === 9) val = val.slice(-8);
                            else val = val.slice(0, 8); // fallback: cortar primeros 8
                          }
                          setTelefono(val);
                        }} 
                        type="tel"
                        placeholder="1234 5678" 
                        maxLength={11}
                        className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-[4.5rem] pr-10 text-sm outline-none transition focus:border-amber-400 font-mono tracking-wider" 
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {isSearchingClient ? (
                          <Loader2 size={16} className="animate-spin text-amber-500" />
                        ) : clientFoundLabel ? (
                          <UserCheck size={18} className="text-emerald-500" />
                        ) : null}
                      </div>
                    </div>
                    {clientFoundLabel && (
                      <p className="text-[13px] font-bold text-emerald-600 px-2 -mt-1">{clientFoundLabel}</p>
                    )}

                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 mt-2" />
                    
                    <AddressAutocomplete
                      value={direccion}
                      onChange={setDireccion}
                      onSelect={({ direccion: d, lat, lng }) => {
                        setDireccion(d);
                        setGeoLat(lat);
                        setGeoLng(lng);
                        if (lat !== null && lng !== null) {
                          const matched = zonas.find(z => z.polygon?.length && pointInPolygon(lat, lng, z.polygon));
                          if (matched) setZonaId(matched.id);
                        }
                      }}
                      placeholder="Dirección de entrega"
                    />
                    
                    {sugerenciaDireccion && (!direccion || direccion !== sugerenciaDireccion.calle) && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 px-3">
                        <MapPin size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-emerald-800">Dirección guardada: <b>{sugerenciaDireccion.calle}</b></p>
                          <button 
                            type="button"
                            onClick={() => {
                              setDireccion(sugerenciaDireccion.calle);
                              if(sugerenciaDireccion.referencia) setReferencia(sugerenciaDireccion.referencia);
                            }}
                            className="mt-1.5 inline-flex text-xs font-bold text-emerald-700 bg-emerald-100/50 hover:bg-emerald-200 rounded px-2 py-1 transition"
                          >
                            Usar esta dirección
                          </button>
                        </div>
                      </div>
                    )}

                    <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Referencia (ej: porton negro)" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400" />
                    <input value={departamento} onChange={(e) => setDepartamento(e.target.value)} placeholder="Departamento (opcional)" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400" />
                  </div>
                </div>

                {zonas.length > 0 && (
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Zona de despacho</p>
                    <div className="mt-4 grid gap-2">
                      {zonas.map((zona) => {
                        const isAutoMatched = geoLat !== null && geoLng !== null && zona.polygon?.length
                          ? pointInPolygon(geoLat, geoLng, zona.polygon)
                          : false;
                        return (
                          <button
                            key={zona.id}
                            onClick={() => setZonaId(zona.id)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${
                              zonaId === zona.id ? "border-orange-400 bg-orange-50 shadow-sm shadow-orange-100" : "border-stone-200 bg-white/70 hover:border-orange-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-stone-900">{zona.nombre}</p>
                                {isAutoMatched && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓ Tu zona</span>
                                )}
                              </div>
                              <p className="font-bold text-stone-900">{formatCurrency(zona.precio, sucursal.simbolo)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Pago</p>
                  <div className="mt-4 grid gap-2">
                    {paymentOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setPaymentId(option.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          paymentId === option.id ? "border-orange-500 bg-orange-50 shadow-sm shadow-orange-100" : "border-stone-200 bg-white/70 hover:border-orange-200"
                        }`}
                      >
                        <p className="font-bold text-stone-900">{option.label}</p>
                        <p className="text-xs text-stone-500">{option.detail}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-stone-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotal, sucursal.simbolo)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-stone-600">
                      <span>Despacho{zonaSeleccionada ? ` · ${zonaSeleccionada.nombre}` : ""}</span>
                      <span className="font-semibold">{formatCurrency(zonaSeleccionada?.precio ?? 0, sucursal.simbolo)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
                    <span className="font-black text-white/80 uppercase tracking-wide text-sm">Total</span>
                    <span className="text-2xl font-black text-white drop-shadow">{formatCurrency(total, sucursal.simbolo)}</span>
                  </div>
                </div>

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

                {/* Botón visible solo en desktop */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
                  className={`hidden xl:inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    cart.length > 0
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-300 active:scale-95"
                      : "bg-stone-300"
                  }`}
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <span>🔥</span>}
                  {submitting ? "Enviando pedido..." : `Confirmar · ${formatCurrency(total, sucursal.simbolo)}`}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom action bar — solo mobile/tablet, con botón confirmar integrado */}
      {/* ── Bottom bar mobile ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 xl:hidden transition-all duration-300 ${cart.length > 0 ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-stone-950/95 backdrop-blur-md px-4 pb-safe pt-3 shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.6)]">
          {/* Resumen compacto */}
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white shadow">
                {totalItems}
              </div>
              <span className="text-xs font-semibold text-white/50">{totalItems === 1 ? "producto" : "productos"}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30">Total</p>
              <p className="text-xl font-black text-white">{formatCurrency(total, sucursal.simbolo)}</p>
            </div>
          </div>
          {error && (
            <p className="mb-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting
              ? <Loader2 size={20} className="animate-spin" />
              : <span className="text-xl">🔥</span>
            }
            {submitting ? "Enviando pedido..." : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </main>
    </>
  );
}

