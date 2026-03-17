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

