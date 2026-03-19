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
  nota?: string;
}

interface ZonaDelivery {
  id: number;
  nombre: string;
  precio: number;
}

interface Props {
  sucursal: {
    id: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    logoUrl: string | null;
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
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(categorias[0]?.id ?? null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
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

  return (
    <main className="min-h-screen bg-[#f4efe7] text-stone-900">
      {/* Padding inferior en mobile para que el bottom bar no tape el contenido */}
      <div className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6 lg:px-8 xl:pb-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_420px]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#111111] text-white shadow-[0_40px_120px_-65px_rgba(0,0,0,0.7)]">
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-6 sm:px-8">
                <div>
                  <Link href={`/pedir`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white">
                    <ArrowLeft size={15} />
                    Volver
                  </Link>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Delivery integrado</p>
                  <h1 className="mt-2 text-3xl font-black sm:text-4xl">Pide desde casa</h1>
                  <p className="mt-3 max-w-2xl text-sm text-white/75">
                    Tu pedido entra directo al POS, cocina lo prepara y delivery lo despacha con seguimiento para el cliente.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-sm text-white/75">
                  <p className="font-bold text-white">{sucursal.nombre}</p>
                  {sucursal.direccion ? <p className="mt-1">{sucursal.direccion}</p> : null}
                  {sucursal.telefono ? <p className="mt-1">{sucursal.telefono}</p> : null}
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
                        {/* Nota para cocina por ítem */}
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
                          <span className="shrink-0 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">Nota</span>
                          <input
                            type="text"
                            value={item.nota ?? ""}
                            onChange={(e) => updateNota(item.id, e.target.value)}
                            placeholder="ej: sin pimentón, extra salsa"
                            maxLength={120}
                            className="min-w-0 flex-1 bg-transparent text-xs text-stone-700 placeholder-stone-300 outline-none"
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

                {zonas.length > 0 && (
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
                            <p className="font-bold text-stone-900">{zona.nombre}</p>
                            <p className="font-bold text-stone-900">{formatCurrency(zona.precio, sucursal.simbolo)}</p>
                          </div>
                        </button>
                      ))}
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
                    <span>Despacho{zonaSeleccionada ? ` · ${zonaSeleccionada.nombre}` : ""}</span>
                    <span>{formatCurrency(zonaSeleccionada?.precio ?? 0, sucursal.simbolo)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-amber-200 pt-3 text-lg font-black text-stone-950">
                    <span>Total</span>
                    <span>{formatCurrency(total, sucursal.simbolo)}</span>
                  </div>
                </div>

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

                {/* Botón visible solo en desktop — en mobile va en el bottom bar */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
                  className="hidden xl:inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <ReceiptText size={18} />}
                  {submitting ? "Enviando pedido..." : "Confirmar pedido"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom action bar — solo mobile/tablet, con botón confirmar integrado */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 xl:hidden transition-transform duration-300 ${cart.length > 0 ? "translate-y-0" : "translate-y-full"}`}>
        <div className="border-t border-stone-800 bg-stone-950 px-4 pb-safe pt-3 shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.5)]">
          {/* Resumen compacto */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <ShoppingBag size={15} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/45">Total</p>
              <p className="text-lg font-black text-white">{formatCurrency(total, sucursal.simbolo)}</p>
            </div>
          </div>
          {/* Error inline */}
          {error ? (
            <p className="mb-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-300">{error}</p>
          ) : null}
          {/* Botón confirmar */}
          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-stone-900 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ReceiptText size={18} />}
            {submitting ? "Enviando pedido..." : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </main>
  );
}

