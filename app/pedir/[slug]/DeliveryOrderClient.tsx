"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Loader2, MapPin, Minus, Phone, Plus, ReceiptText, ShoppingBag, Sparkles, UserCheck } from "lucide-react";
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
}

interface Props {
  sucursal: {
    id: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    logoUrl: string | null;
    simbolo: string;
    descripcionDelivery: string | null;
    instagram: string | null;
    facebook: string | null;
    whatsapp: string | null;
    tiktok: string | null;
  };
  categorias: Categoria[];
  slug: string;
}

const zonas = [
  { id: "zona1", nombre: "Zona 1", detalle: "Cercana", cargo: 1500 },
  { id: "zona2", nombre: "Zona 2", detalle: "Intermedia", cargo: 2000 },
  { id: "zona3", nombre: "Zona 3", detalle: "Extendida", cargo: 3000 },
];

const paymentOptions: { id: string; label: string; method: MetodoPago; detail: string }[] = [
  { id: "webpay", label: "Webpay", method: "TARJETA", detail: "Tarjeta y links de pago" },
  { id: "efectivo", label: "Efectivo", method: "EFECTIVO", detail: "Pago al recibir" },
  { id: "transferencia", label: "Transferencia", method: "TRANSFERENCIA", detail: "Envio de comprobante" },
  { id: "mercadopago", label: "Mercado Pago", method: "TARJETA", detail: "Wallet y tarjetas" },
];

export function DeliveryOrderClient({ sucursal, categorias, slug }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(categorias[0]?.id ?? null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [zonaId, setZonaId] = useState(zonas[0].id);
  const [paymentId, setPaymentId] = useState(paymentOptions[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: number; total: number; trackingUrl: string } | null>(null);
  
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientFoundLabel, setClientFoundLabel] = useState("");
  const [sugerenciaDireccion, setSugerenciaDireccion] = useState<{calle: string, referencia: string} | null>(null);

  const zonaSeleccionada = zonas.find((zona) => zona.id === zonaId) ?? zonas[0];
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
  const total = subtotal + zonaSeleccionada.cargo;

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
          },
          metodoPago: paymentSeleccionado.method,
          cargoEnvio: zonaSeleccionada.cargo,
          items: cart.map((item) => ({
            productoId: item.id,
            cantidad: item.cantidad,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No fue posible crear el pedido.");

      setSuccess({
        id: data.id,
        total: Number(data.total),
        trackingUrl: data.trackingUrl,
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
            <button onClick={() => setSuccess(null)} className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              Hacer otro pedido
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe7] text-stone-900">
      <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${cart.length > 0 ? "pb-28 xl:pb-6" : ""}`}>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_420px]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#111111] text-white shadow-[0_40px_120px_-65px_rgba(0,0,0,0.7)]">
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-6 sm:px-8">
                <div>
                  <Link href={`/pedir`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white">
                    <ArrowLeft size={15} />
                    Volver
                  </Link>
                  <div className="mt-4 flex items-center gap-3">
                    {sucursal.logoUrl && (
                      <img
                        src={sucursal.logoUrl}
                        alt={sucursal.nombre}
                        className="h-12 w-12 rounded-2xl object-contain flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Delivery integrado</p>
                      <h1 className="mt-1 text-3xl font-black sm:text-4xl">{sucursal.nombre}</h1>
                    </div>
                  </div>
                  {sucursal.descripcionDelivery && (
                    <p className="mt-3 max-w-2xl text-sm text-white/75">
                      {sucursal.descripcionDelivery}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/60">
                    {sucursal.direccion && (
                      <span className="flex items-center gap-1.5"><MapPin size={13} />{sucursal.direccion}</span>
                    )}
                    {sucursal.telefono && (
                      <span className="flex items-center gap-1.5"><Phone size={13} />{sucursal.telefono}</span>
                    )}
                  </div>
                  {(sucursal.instagram || sucursal.facebook || sucursal.whatsapp || sucursal.tiktok) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sucursal.whatsapp && (
                        <a
                          href={`https://wa.me/${sucursal.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366]/20 px-4 py-2 text-xs font-bold text-[#25D366] transition hover:bg-[#25D366]/30"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </a>
                      )}
                      {sucursal.instagram && (
                        <a
                          href={`https://instagram.com/${sucursal.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#E1306C]/20 px-4 py-2 text-xs font-bold text-[#E1306C] transition hover:bg-[#E1306C]/30"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          Instagram
                        </a>
                      )}
                      {sucursal.facebook && (
                        <a
                          href={sucursal.facebook.startsWith("http") ? sucursal.facebook : `https://facebook.com/${sucursal.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#1877F2]/20 px-4 py-2 text-xs font-bold text-[#1877F2] transition hover:bg-[#1877F2]/30"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          Facebook
                        </a>
                      )}
                      {sucursal.tiktok && (
                        <a
                          href={`https://tiktok.com/@${sucursal.tiktok.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/></svg>
                          TikTok
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]">
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaActiva(categoria.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      categoriaActiva === categoria.id
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(categoriaVisible?.productos ?? []).map((producto) => {
                  const quantity = cart.find((item) => item.id === producto.id)?.cantidad ?? 0;
                  return (
                    <article key={producto.id} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 transition hover:border-amber-300 hover:bg-white">
                      <div className="flex gap-4">
                        {producto.imagen ? (
                          <img src={producto.imagen} alt={producto.nombre} className="h-24 w-24 rounded-2xl object-cover" />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-stone-200 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Sin foto
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-black leading-tight text-stone-900">{producto.nombre}</p>
                          <p className="mt-2 line-clamp-2 text-sm text-stone-500">{producto.descripcion ?? "Preparado al momento para delivery."}</p>
                          <p className="mt-4 text-lg font-black text-amber-600">{formatCurrency(producto.precio, sucursal.simbolo)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                        <button onClick={() => removeItem(producto.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-700 transition hover:bg-stone-200">
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-bold text-stone-900">{quantity}</span>
                        <button onClick={() => addItem(producto)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-stone-700">
                          <Plus size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="xl:sticky xl:top-6 xl:h-fit">
            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_35px_100px_-60px_rgba(0,0,0,0.45)]">
              <div className="border-b border-stone-200 bg-stone-950 px-5 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Resumen delivery</p>
                    <h2 className="mt-1 text-xl font-black">Tu pedido</h2>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{totalItems} items</div>
                </div>
              </div>

              <div className="space-y-6 p-5">
                <div className="space-y-3">
                  {cart.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
                      Agrega productos para empezar tu pedido delivery.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-stone-900">{item.nombre}</p>
                            <p className="mt-1 text-xs text-stone-500">{item.cantidad} x {formatCurrency(item.precio, sucursal.simbolo)}</p>
                          </div>
                          <p className="font-bold text-stone-900">{formatCurrency(item.precio * item.cantidad, sucursal.simbolo)}</p>
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
                    
                    <div className="relative">
                      <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Direccion de entrega" className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-amber-400" />
                    </div>
                    
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
                    <p className="text-[11px] text-stone-500">El autocompletado de mapas queda listo para conectarse a Google Maps API cuando quieras activarlo.</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Zona de despacho</p>
                  <div className="mt-4 grid gap-2">
                    {zonas.map((zona) => (
                      <button
                        key={zona.id}
                        onClick={() => setZonaId(zona.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          zonaId === zona.id ? "border-amber-400 bg-white" : "border-stone-200 bg-white/70 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-stone-900">{zona.nombre}</p>
                            <p className="text-xs text-stone-500">{zona.detalle}</p>
                          </div>
                          <p className="font-bold text-stone-900">{formatCurrency(zona.cargo, sucursal.simbolo)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Pago</p>
                  <div className="mt-4 grid gap-2">
                    {paymentOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setPaymentId(option.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          paymentId === option.id ? "border-stone-900 bg-white" : "border-stone-200 bg-white/70 hover:border-stone-300"
                        }`}
                      >
                        <p className="font-bold text-stone-900">{option.label}</p>
                        <p className="text-xs text-stone-500">{option.detail}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center justify-between text-sm text-stone-700">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, sucursal.simbolo)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-stone-700">
                    <span>Despacho</span>
                    <span>{formatCurrency(zonaSeleccionada.cargo, sucursal.simbolo)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-amber-200 pt-3 text-lg font-black text-stone-950">
                    <span>Total</span>
                    <span>{formatCurrency(total, sucursal.simbolo)}</span>
                  </div>
                </div>

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <ReceiptText size={18} />}
                  {submitting ? "Enviando pedido..." : "Confirmar pedido"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {cart.length > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 z-40 xl:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between rounded-[1.5rem] bg-stone-950 px-5 py-4 text-white shadow-2xl">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Pedido actual</p>
              <p className="mt-1 font-black">{totalItems} items · {formatCurrency(total, sucursal.simbolo)}</p>
            </div>
            <ShoppingBag size={20} />
          </div>
        </div>
      ) : null}
    </main>
  );
}

