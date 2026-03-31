"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Loader2, MapPin, Minus, Phone, Plus, ReceiptText, Share2, ShoppingBag, Sparkles, UserCheck, X } from "lucide-react";
import ProductoViewer from "./ProductoViewer";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { formatCurrency } from "@/lib/utils";
import type { MetodoPago } from "@/types";

interface VOpcion { id: number; nombre: string; precio: number; }
interface VGrupo  { id: number; nombre: string; requerido: boolean; tipo: string; opciones: VOpcion[]; }

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  variantes: VGrupo[];
}

interface Categoria {
  id: number;
  nombre: string;
  productos: Producto[];
}

interface CartOpcion { grupoNombre: string; opcionId: number; opcionNombre: string; precio: number; }
interface CartItem {
  cartKey: string;
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  variantes: VGrupo[];
  cantidad: number;
  nota?: string;
  opciones?: CartOpcion[];
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
  flayerUrl?: string | null;
  flayerActivo?: boolean;
}

const paymentOptions: { id: string; label: string; method: MetodoPago; detail: string }[] = [
  { id: "webpay", label: "Webpay", method: "TARJETA", detail: "Tarjeta y links de pago" },
  { id: "efectivo", label: "Efectivo", method: "EFECTIVO", detail: "Pago al recibir" },
  { id: "transferencia", label: "Transferencia", method: "TRANSFERENCIA", detail: "Envio de comprobante" },
  { id: "mercadopago", label: "Mercado Pago", method: "TARJETA", detail: "Wallet y tarjetas" },
];

// ── Modal de opciones / variantes ────────────────────────────────────────────
function ProductoOpcionesModal({
  producto,
  simbolo,
  onConfirm,
  onClose,
}: {
  producto: Producto;
  simbolo: string;
  onConfirm: (opciones: CartOpcion[]) => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState<Record<number, number[]>>(() => {
    // Pre-select first option for required radio groups
    const init: Record<number, number[]> = {};
    for (const g of producto.variantes) {
      if (g.requerido && g.tipo === "radio" && g.opciones.length > 0) {
        init[g.id] = [g.opciones[0].id];
      } else {
        init[g.id] = [];
      }
    }
    return init;
  });
  const [qty, setQty] = useState(1);

  function toggleOption(grupo: VGrupo, opcionId: number) {
    setSelection(prev => {
      const current = prev[grupo.id] ?? [];
      if (grupo.tipo === "radio") {
        return { ...prev, [grupo.id]: [opcionId] };
      } else {
        return {
          ...prev,
          [grupo.id]: current.includes(opcionId)
            ? current.filter(id => id !== opcionId)
            : [...current, opcionId],
        };
      }
    });
  }

  const missingRequired = producto.variantes.some(
    g => g.requerido && (selection[g.id]?.length ?? 0) === 0
  );

  const selectedOpciones: CartOpcion[] = producto.variantes.flatMap(g =>
    (selection[g.id] ?? []).map(opId => {
      const op = g.opciones.find(o => o.id === opId)!;
      return { grupoNombre: g.nombre, opcionId: op.id, opcionNombre: op.nombre, precio: op.precio };
    })
  );

  const unitPrice = producto.precio + selectedOpciones.reduce((s, o) => s + o.precio, 0);
  const totalPrice = unitPrice * qty;

  function handleConfirm() {
    if (missingRequired) return;
    for (let i = 0; i < qty; i++) {
      onConfirm(selectedOpciones);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Product header */}
        {producto.imagen && (
          <div className="relative h-44 w-full shrink-0 overflow-hidden">
            <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-stone-700 shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        {!producto.imagen && (
          <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
            <h2 className="text-xl font-black text-stone-900">{producto.nombre}</h2>
            <button onClick={onClose} className="rounded-full bg-stone-100 p-1.5 text-stone-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {producto.imagen && (
            <div>
              <h2 className="text-xl font-black text-stone-900">{producto.nombre}</h2>
              {producto.descripcion && <p className="text-sm text-stone-500 mt-0.5">{producto.descripcion}</p>}
            </div>
          )}
          {!producto.imagen && producto.descripcion && (
            <p className="text-sm text-stone-500 -mt-2">{producto.descripcion}</p>
          )}

          {producto.variantes.map(grupo => (
            <div key={grupo.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-black uppercase tracking-wide text-stone-900">{grupo.nombre}</p>
                {grupo.requerido && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">Requerido</span>
                )}
              </div>
              <div className="space-y-1">
                {grupo.opciones.map(op => {
                  const selected = (selection[grupo.id] ?? []).includes(op.id);
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => toggleOption(grupo, op.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-orange-400 bg-orange-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          selected ? "border-orange-500 bg-orange-500" : "border-stone-300"
                        }`}>
                          {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-medium ${selected ? "text-orange-700" : "text-stone-700"}`}>
                          {op.nombre}
                        </span>
                      </div>
                      {op.precio > 0 && (
                        <span className={`text-sm font-bold ${selected ? "text-orange-600" : "text-stone-500"}`}>
                          +{simbolo}{op.precio.toLocaleString("es-CL")}
                        </span>
                      )}
                      {op.precio === 0 && (
                        <span className="text-xs text-stone-400">Incluido</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            {/* Qty counter */}
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span className="w-5 text-center text-base font-black text-stone-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white hover:bg-stone-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={missingRequired}
              className="flex-1 flex items-center justify-between rounded-xl px-4 py-3 font-black text-white transition-all disabled:opacity-40"
              style={{ background: missingRequired ? "#d1d5db" : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              <span>Agregar</span>
              <span>{simbolo}{totalPrice.toLocaleString("es-CL")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeliveryOrderClient({ sucursal, categorias, slug, zonas, flayerUrl, flayerActivo }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [flayerCerrado, setFlayerCerrado] = useState(false);
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
  const [opcionesModal, setOpcionesModal] = useState<Producto | null>(null);
  const [modoRetiro, setModoRetiro] = useState(false);

  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientFoundLabel, setClientFoundLabel] = useState("");
  const [sugerenciaDireccion, setSugerenciaDireccion] = useState<{calle: string, referencia: string} | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

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
  const total = subtotal + (modoRetiro ? 0 : (zonaSeleccionada?.precio ?? 0));

  function addItem(producto: Producto, selectedOpciones?: CartOpcion[]) {
    const opKey = selectedOpciones?.map(o => o.opcionId).sort().join("-") ?? "";
    const cartKey = `${producto.id}-${opKey}`;
    const computedPrice = producto.precio + (selectedOpciones?.reduce((s, o) => s + o.precio, 0) ?? 0);

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        return prev.map((item) => item.cartKey === cartKey ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { cartKey, id: producto.id, nombre: producto.nombre, precio: computedPrice, imagen: producto.imagen, variantes: producto.variantes, cantidad: 1, opciones: selectedOpciones }];
    });
  }

  function removeItem(cartKey: string) {
    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (!existing) return prev;
      if (existing.cantidad === 1) return prev.filter((item) => item.cartKey !== cartKey);
      return prev.map((item) => item.cartKey === cartKey ? { ...item, cantidad: item.cantidad - 1 } : item);
    });
  }

  function updateNota(cartKey: string, nota: string) {
    setCart((prev) => prev.map((item) => item.cartKey === cartKey ? { ...item, nota } : item));
  }

  // Registrar Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {/* silent */});
    }
  }, []);

  // Detectar iOS sin standalone → mostrar banner de instalación
  // Detectar Android/Chrome → capturar beforeinstallprompt
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) { setInstalled(true); return; }

    const dismissed = sessionStorage.getItem("installBannerDismissed");
    if (dismissed) return;

    // Android / Chrome: capturar el prompt nativo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: mostrar instrucciones manuales
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      const t = setTimeout(() => setShowInstallBanner(true), 2500);
      return () => { window.removeEventListener("beforeinstallprompt", handler); clearTimeout(t); };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
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

    if (!nombre.trim() || !telefono.trim()) {
      setError("Completa nombre y teléfono.");
      return;
    }
    if (!modoRetiro && !direccion.trim()) {
      setError("Completa la dirección de despacho.");
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
          cargoEnvio: modoRetiro ? 0 : (zonaSeleccionada?.precio ?? 0),
          zonaDelivery: modoRetiro ? "Retiro en tienda" : (zonaSeleccionada?.nombre ?? null),
          items: cart.map((item) => ({
            productoId: item.id,
            cantidad: item.cantidad,
            precio: item.precio,
            observacion: [
              item.opciones?.map(o => o.opcionNombre).join(", "),
              item.nota?.trim(),
            ].filter(Boolean).join(" | ") || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No fue posible crear el pedido.");

      // Construir mensaje WhatsApp antes de limpiar el carrito
      const cartSnapshot = [...cart];
      const zonaSnap = modoRetiro ? null : zonas.find((z) => z.id === zonaId);
      const subtotalSnap = cartSnapshot.reduce((a, i) => a + i.precio * i.cantidad, 0);
      const totalSnap = subtotalSnap + (modoRetiro ? 0 : (zonaSnap?.precio ?? 0));
      let waMsg = `Hola! Mi pedido es:\n`;
      cartSnapshot.forEach((item) => {
        waMsg += `• ${item.nombre} x${item.cantidad} — ${formatCurrency(item.precio * item.cantidad, sucursal.simbolo)}`;
        if (item.opciones && item.opciones.length > 0) {
          waMsg += ` (${item.opciones.map(o => o.opcionNombre).join(", ")})`;
        }
        waMsg += "\n";
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
    {/* Flayer popup promocional */}
    {flayerActivo && flayerUrl && !flayerCerrado && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={() => setFlayerCerrado(true)}
      >
        <div
          className="relative max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setFlayerCerrado(true)}
            className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flayerUrl}
            alt="Promoción"
            className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"
          />
        </div>
      </div>
    )}

    {/* Modal de opciones/variantes */}
    {opcionesModal && (
      <ProductoOpcionesModal
        producto={opcionesModal}
        simbolo={sucursal.simbolo}
        onConfirm={(opciones) => addItem(opcionesModal, opciones)}
        onClose={() => setOpcionesModal(null)}
      />
    )}

    {/* Visor de producto con swipe */}
    {viewerIndex !== null && productosVisibles.length > 0 && (
      <ProductoViewer
        productos={productosVisibles}
        initialIndex={viewerIndex}
        simbolo={sucursal.simbolo}
        getQuantity={(id) => cart.filter((i) => i.id === id).reduce((s, i) => s + i.cantidad, 0)}
        onAdd={(p) => {
          if (p.variantes?.length > 0) {
            setOpcionesModal(p);
          } else {
            addItem(p);
          }
        }}
        onRemove={(id) => {
          const items = cart.filter(i => i.id === id);
          if (items.length > 0) removeItem(items[items.length - 1].cartKey);
        }}
        onClose={() => setViewerIndex(null)}
      />
    )}
    {/* Banner de instalación PWA — Android (prompt nativo) e iOS (instrucciones) */}
    {showInstallBanner && !installed && (
      <div className="fixed bottom-24 left-3 right-3 z-50 overflow-hidden rounded-2xl shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-80"
        style={{ border: "1.5px solid rgba(249,115,22,0.3)" }}>
        {/* Gradiente superior */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
          {sucursal.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sucursal.logoUrl} alt={sucursal.nombre}
              className="h-10 w-10 shrink-0 rounded-xl object-cover shadow" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white font-black text-lg">
              {sucursal.nombre.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm leading-tight truncate">{sucursal.nombre}</p>
            <p className="text-white/80 text-xs">Instala la app gratis 📲</p>
          </div>
          <button
            onClick={() => { setShowInstallBanner(false); sessionStorage.setItem("installBannerDismissed", "1"); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition">
            <X size={14} />
          </button>
        </div>

        {/* Cuerpo blanco */}
        <div className="bg-white px-4 py-3">
          {deferredPrompt ? (
            // Android: botón directo
            <button onClick={handleInstall}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-black text-white shadow-md shadow-orange-200/60 transition active:scale-95">
              ⬇ Instalar {sucursal.nombre}
            </button>
          ) : (
            // iOS: instrucción manual
            <p className="text-xs text-stone-600 text-center leading-relaxed">
              Toca <Share2 size={11} className="inline mx-0.5 text-blue-500" /> en Safari
              y luego <strong className="text-stone-800">«Añadir a pantalla de inicio»</strong>
            </p>
          )}
        </div>
      </div>
    )}

    <main className="carta-body min-h-screen bg-[#f4efe7] text-stone-900">
      {/* Padding inferior en mobile para que el bottom bar no tape el contenido */}
      <div className="mx-auto max-w-7xl px-3 py-2 pb-28 sm:px-6 sm:py-4 lg:px-8 lg:pb-6">
        <div className="grid gap-2 sm:gap-5 lg:grid-cols-[1.2fr_400px]">
          <section className="min-w-0 space-y-3 sm:space-y-5">
            {/* ═══ HERO ═══ */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)]">
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

              {/* Logo + info — layout compacto horizontal en mobile */}
              <div className="relative z-10 flex items-center gap-3 px-4 pt-2 pb-3 sm:flex-col sm:items-center sm:gap-0 sm:px-8 sm:pt-5 sm:pb-4">
                {sucursal.logoUrl ? (
                  <div className="flex-shrink-0 rounded-2xl bg-white p-2 shadow-md sm:rounded-3xl sm:p-3 sm:mb-3">
                    <img
                      src={sucursal.logoUrl}
                      alt={sucursal.nombre}
                      className="h-12 w-auto max-w-[88px] object-contain sm:h-24 sm:max-w-[180px]"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl sm:mb-3">
                    {sucursal.nombre}
                  </h1>
                )}

                {/* Info compacta */}
                <div className="flex-1 sm:w-full">
                  <div className="px-1 py-1 text-left sm:text-center">
                    {sucursal.cartaTagline && (
                      <p className="text-xs font-black text-white drop-shadow sm:text-base">
                        {sucursal.cartaTagline}
                      </p>
                    )}
                    {sucursal.cartaSaludo && (
                      <p className="mt-0.5 text-[11px] text-white/75 sm:text-sm">{sucursal.cartaSaludo}</p>
                    )}
                    {!sucursal.cartaTagline && !sucursal.cartaSaludo && (
                      <p className="text-[11px] text-white/60 sm:text-sm">Pide directo, cocina lo prepara al momento.</p>
                    )}
                    {(sucursal.direccion || sucursal.telefono) && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-white/50 sm:justify-center sm:text-xs">
                        {sucursal.direccion && <span>📍 {sucursal.direccion}</span>}
                        {sucursal.telefono && <span>📞 {sucursal.telefono}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Categorías — sticky bajo el scroll ── */}
            <div className="sticky top-0 z-20 rounded-2xl border border-black/5 bg-white/95 backdrop-blur-sm p-2 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.14)] sm:rounded-[2rem] sm:p-3">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none sm:gap-2">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaActiva(categoria.id)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition-all duration-200 sm:px-5 sm:py-2.5 sm:text-sm ${
                      categoriaActiva === categoria.id
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200 scale-105"
                        : "bg-stone-100 text-stone-500 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Productos ── */}
            {(() => {
              // Si la categoría tiene imágenes → hero cards; si no → filas compactas
              const conImagenes = (categoriaVisible?.productos ?? []).some(p => p.imagen);
              return (
                <div className={conImagenes
                  ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3"
                  : "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3"
                }>
                  {(categoriaVisible?.productos ?? []).map((producto, idx) => {
                    const quantity = cart.filter((item) => item.id === producto.id).reduce((s, i) => s + i.cantidad, 0);
                    const handleAdd = () => {
                      if (producto.variantes?.length > 0) setOpcionesModal(producto);
                      else addItem(producto);
                    };
                    const handleRemove = () => {
                      const items = cart.filter(i => i.id === producto.id);
                      if (items.length > 0) removeItem(items[items.length - 1].cartKey);
                    };

                    if (conImagenes) {
                      // ── HERO CARD (con imagen) ── original Netaa
                      return (
                        <article key={producto.id}
                          className="flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.10)] transition-all duration-200 active:scale-[0.99] sm:flex-col sm:p-0 sm:hover:shadow-lg"
                        >
                          <button
                            className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none sm:rounded-t-2xl"
                            onClick={() => setViewerIndex(idx)}
                          >
                            {producto.imagen ? (
                              <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-cover transition-transform duration-300 sm:group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
                                <span className="text-3xl opacity-40">🍽️</span>
                              </div>
                            )}
                            {quantity > 0 && (
                              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white shadow">{quantity}</span>
                            )}
                          </button>
                          <div className="min-w-0 flex-1 sm:w-full sm:flex-none sm:p-3">
                            <p className="truncate text-sm font-black leading-tight text-stone-900">{producto.nombre}</p>
                            {producto.descripcion && <p className="mt-0.5 line-clamp-1 text-xs text-stone-400 sm:line-clamp-2">{producto.descripcion}</p>}
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-orange-500">
                                {formatCurrency(producto.precio, sucursal.simbolo)}
                                {producto.variantes.length > 0 && <span className="ml-1 text-[10px] font-medium text-stone-400">+opc.</span>}
                              </p>
                              <div className="hidden sm:block shrink-0">
                                {quantity === 0 ? (
                                  <button onClick={handleAdd} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/60 transition-all hover:from-orange-600 active:scale-90"><Plus size={16} /></button>
                                ) : (
                                  <div className="flex items-center gap-1 rounded-full bg-stone-950 px-1.5 py-1">
                                    <button onClick={handleRemove} className="flex h-6 w-6 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"><Minus size={11} /></button>
                                    <span className="min-w-[16px] text-center text-xs font-black text-white">{quantity}</span>
                                    <button onClick={handleAdd} className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white transition active:scale-90"><Plus size={11} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 sm:hidden">
                            {quantity === 0 ? (
                              <button onClick={handleAdd} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/60 transition-all hover:from-orange-600 active:scale-90"><Plus size={18} /></button>
                            ) : (
                              <div className="flex items-center gap-1 rounded-full bg-stone-950 px-1.5 py-1">
                                <button onClick={handleRemove} className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"><Minus size={13} /></button>
                                <span className="min-w-[18px] text-center text-sm font-black text-white">{quantity}</span>
                                <button onClick={handleAdd} className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white transition active:scale-90"><Plus size={13} /></button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    }

                    // ── FILA COMPACTA (sin imagen, ej: BamPai) ──
                    return (
                      <article key={producto.id}
                        className="flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.10)] transition-all duration-200 active:scale-[0.99] hover:shadow-md"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black leading-tight text-stone-900">{producto.nombre}</p>
                          {producto.descripcion && <p className="mt-0.5 line-clamp-2 text-xs text-stone-400">{producto.descripcion}</p>}
                          <p className="mt-1.5 text-sm font-black text-orange-500">
                            {formatCurrency(producto.precio, sucursal.simbolo)}
                            {producto.variantes.length > 0 && <span className="ml-1 text-[10px] font-medium text-stone-400">+opc.</span>}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {quantity === 0 ? (
                            <button onClick={handleAdd} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/60 transition-all hover:from-orange-600 active:scale-90"><Plus size={18} /></button>
                          ) : (
                            <div className="flex items-center gap-1.5 rounded-full bg-stone-950 px-2 py-1">
                              <button onClick={handleRemove} className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"><Minus size={13} /></button>
                              <span className="min-w-[18px] text-center text-sm font-black text-white">{quantity}</span>
                              <button onClick={handleAdd} className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white transition active:scale-90"><Plus size={13} /></button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          <aside className="hidden lg:block lg:sticky lg:top-6 lg:h-fit">
            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_35px_100px_-60px_rgba(0,0,0,0.45)]">
              <div className="border-b border-white/5 bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-white sm:px-5 sm:py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Tu pedido</p>
                    <h2 className="mt-0.5 text-lg font-black sm:text-xl">🔥 ¿Qué va hoy?</h2>
                  </div>
                  {totalItems > 0 && (
                    <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-black backdrop-blur-sm">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </div>
                  )}
                </div>
                {/* Modo toggle */}
                <div className="mt-3 flex rounded-2xl bg-black/20 p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setModoRetiro(false)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all ${
                      !modoRetiro ? "bg-white text-orange-600 shadow" : "text-white/70 hover:text-white"
                    }`}
                  >
                    🛵 Delivery
                  </button>
                  <button
                    onClick={() => setModoRetiro(true)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all ${
                      modoRetiro ? "bg-white text-orange-600 shadow" : "text-white/70 hover:text-white"
                    }`}
                  >
                    🏪 Retiro en tienda
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-3 sm:space-y-6 sm:p-5">
                <div className="space-y-3">
                  {cart.length === 0 ? (
                    <div className="rounded-[1.5rem] border-2 border-dashed border-orange-100 bg-orange-50/50 p-5 text-center sm:p-8">
                      <p className="text-4xl">🛒</p>
                      <p className="mt-2 text-sm font-bold text-stone-400">¡Todo listo para pedir!</p>
                      <p className="mt-1 text-xs text-stone-300">Elige algo del menú 👆</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.cartKey} className="overflow-hidden rounded-[1.25rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
                        <div className="flex items-start justify-between gap-3 p-3 pb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-stone-900 leading-tight">{item.nombre}</p>
                            {item.opciones && item.opciones.length > 0 && (
                              <p className="text-xs text-orange-600/70 mt-0.5">
                                {item.opciones.map(o => o.opcionNombre).join(", ")}
                              </p>
                            )}
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
                            onChange={(e) => updateNota(item.cartKey, e.target.value)}
                            placeholder="ej: sin pimentón, extra salsa"
                            maxLength={120}
                            className="min-w-0 flex-1 bg-transparent text-xs text-stone-600 placeholder-stone-300 outline-none"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    {modoRetiro ? "Tus datos" : "Datos de despacho"}
                  </p>
                  {modoRetiro && sucursal.direccion && (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-xs font-bold text-emerald-800">Retira en:</p>
                        <p className="text-sm font-semibold text-stone-700">{sucursal.nombre}</p>
                        <p className="text-xs text-stone-500">{sucursal.direccion}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
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

                    {!modoRetiro && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                {!modoRetiro && zonas.length > 0 && (
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Zona de despacho</p>
                    <div className="mt-3 grid gap-2 sm:mt-4">
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

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Pago</p>
                  <div className="mt-3 grid gap-2 sm:mt-4">
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
                      <span>
                        {modoRetiro
                          ? "🏪 Retiro en tienda"
                          : `Despacho${zonaSeleccionada ? ` · ${zonaSeleccionada.nombre}` : ""}`}
                      </span>
                      <span className={`font-semibold ${modoRetiro ? "text-emerald-600" : ""}`}>
                        {modoRetiro ? "Gratis" : formatCurrency(zonaSeleccionada?.precio ?? 0, sucursal.simbolo)}
                      </span>
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

      {/* Bottom action bar — solo mobile/tablet */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${cart.length > 0 ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-stone-950/95 backdrop-blur-md px-4 pb-safe pt-3 shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.6)]">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white shadow">
                {totalItems}
              </div>
              <span className="text-xs font-semibold text-white/50">{totalItems === 1 ? "producto" : "productos"}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30">Total estimado</p>
              <p className="text-xl font-black text-white">{formatCurrency(total, sucursal.simbolo)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCheckoutSheet(true)}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95"
          >
            <ShoppingBag size={20} />
            Ver pedido y confirmar
          </button>
        </div>
      </div>

      {/* ── Mobile checkout sheet ── */}
      {showCheckoutSheet && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ isolation: "isolate" }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckoutSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] bg-[#f4efe7]">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-stone-900">Tu pedido</h2>
                <p className="text-xs text-stone-400">{totalItems} {totalItems === 1 ? "producto" : "productos"}</p>
              </div>
              <button onClick={() => setShowCheckoutSheet(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">

              {/* Modo toggle */}
              <div className="flex rounded-2xl bg-stone-200 p-1">
                <button onClick={() => setModoRetiro(false)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-black transition-all ${!modoRetiro ? "bg-white text-orange-600 shadow" : "text-stone-500"}`}>🛵 Delivery</button>
                <button onClick={() => setModoRetiro(true)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-black transition-all ${modoRetiro ? "bg-white text-orange-600 shadow" : "text-stone-500"}`}>🏪 Retiro</button>
              </div>

              {/* Resumen carrito */}
              <div className="rounded-[1.5rem] bg-white p-4 space-y-2 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Productos</p>
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-800">{item.nombre}</p>
                      {item.opciones && item.opciones.length > 0 && <p className="text-xs text-orange-500 truncate">{item.opciones.map(o => o.opcionNombre).join(", ")}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1">
                        <button onClick={() => { const items = cart.filter(i => i.id === item.id); if (items.length > 0) removeItem(items[items.length - 1].cartKey); }} className="flex h-5 w-5 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-200"><Minus size={11} /></button>
                        <span className="min-w-[16px] text-center text-xs font-black">{item.cantidad}</span>
                        <button onClick={() => addItem({ id: item.id, nombre: item.nombre, precio: item.precio, imagen: item.imagen, descripcion: null, variantes: item.variantes })} className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white transition"><Plus size={11} /></button>
                      </div>
                      <span className="text-sm font-black text-orange-600">{formatCurrency(item.precio * item.cantidad, sucursal.simbolo)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-stone-100 pt-2 flex items-center justify-between">
                  <span className="text-sm text-stone-500">Subtotal</span>
                  <span className="text-sm font-bold">{formatCurrency(subtotal, sucursal.simbolo)}</span>
                </div>
                {!modoRetiro && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Despacho{zonaSeleccionada ? ` · ${zonaSeleccionada.nombre}` : ""}</span>
                    <span className="text-sm font-bold">{formatCurrency(zonaSeleccionada?.precio ?? 0, sucursal.simbolo)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
                  <span className="text-sm font-black text-white/80 uppercase tracking-wide">Total</span>
                  <span className="text-xl font-black text-white">{formatCurrency(total, sucursal.simbolo)}</span>
                </div>
              </div>

              {/* Formulario */}
              <div className="rounded-[1.5rem] bg-white p-4 space-y-3 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{modoRetiro ? "Tus datos" : "Datos de despacho"}</p>

                {modoRetiro && sucursal.direccion && (
                  <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Retira en:</p>
                      <p className="text-sm font-semibold text-stone-700">{sucursal.nombre}</p>
                      <p className="text-xs text-stone-500">{sucursal.direccion}</p>
                    </div>
                  </div>
                )}

                {/* Teléfono */}
                <div className="relative">
                  <div className="absolute left-0 top-0 flex items-center justify-center p-3 pl-4 text-stone-500 font-medium">+56 9</div>
                  <input
                    value={telefono}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 8) {
                        if (val.startsWith("569") && val.length === 11) val = val.slice(-8);
                        else if (val.startsWith("9") && val.length === 9) val = val.slice(-8);
                        else val = val.slice(0, 8);
                      }
                      setTelefono(val);
                    }}
                    type="tel" placeholder="1234 5678" maxLength={11}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-[4.5rem] pr-10 text-sm outline-none transition focus:border-amber-400 font-mono tracking-wider"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isSearchingClient ? <Loader2 size={16} className="animate-spin text-amber-500" /> : clientFoundLabel ? <UserCheck size={18} className="text-emerald-500" /> : null}
                  </div>
                </div>
                {clientFoundLabel && <p className="text-[13px] font-bold text-emerald-600 px-2">{clientFoundLabel}</p>}

                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400" />

                {!modoRetiro && (
                  <>
                    <AddressAutocomplete
                      value={direccion}
                      onChange={setDireccion}
                      onSelect={({ direccion: d, lat, lng }) => {
                        setDireccion(d); setGeoLat(lat); setGeoLng(lng);
                        if (lat !== null && lng !== null) {
                          const matched = zonas.find(z => z.polygon?.length && pointInPolygon(lat, lng, z.polygon));
                          if (matched) setZonaId(matched.id);
                        }
                      }}
                      placeholder="Dirección de entrega"
                    />
                    {sugerenciaDireccion && (!direccion || direccion !== sugerenciaDireccion.calle) && (
                      <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 px-3">
                        <MapPin size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-emerald-800">Guardada: <b>{sugerenciaDireccion.calle}</b></p>
                          <button type="button" onClick={() => { setDireccion(sugerenciaDireccion.calle); if (sugerenciaDireccion.referencia) setReferencia(sugerenciaDireccion.referencia); }} className="mt-1 text-xs font-bold text-emerald-700 bg-emerald-100/50 hover:bg-emerald-200 rounded px-2 py-1 transition">Usar esta dirección</button>
                        </div>
                      </div>
                    )}
                    <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Referencia (ej: portón negro)" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400" />
                    <input value={departamento} onChange={(e) => setDepartamento(e.target.value)} placeholder="Departamento (opcional)" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400" />
                  </>
                )}
              </div>

              {/* Zona */}
              {!modoRetiro && zonas.length > 0 && (
                <div className="rounded-[1.5rem] bg-white p-4 space-y-2 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Zona de despacho</p>
                  {zonas.map((zona) => (
                    <button key={zona.id} onClick={() => setZonaId(zona.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${zonaId === zona.id ? "border-orange-400 bg-orange-50" : "border-stone-200 bg-white/70"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{zona.nombre}</span>
                        <span className="font-bold text-stone-900">{formatCurrency(zona.precio, sucursal.simbolo)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pago */}
              <div className="rounded-[1.5rem] bg-white p-4 space-y-2 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Método de pago</p>
                {paymentOptions.map((option) => (
                  <button key={option.id} onClick={() => setPaymentId(option.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${paymentId === option.id ? "border-orange-500 bg-orange-50" : "border-stone-200 bg-white/70"}`}>
                    <p className="font-bold text-stone-900">{option.label}</p>
                    <p className="text-xs text-stone-500">{option.detail}</p>
                  </button>
                ))}
              </div>

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

              <button
                onClick={async () => { await handleSubmit(); if (!error) setShowCheckoutSheet(false); }}
                disabled={submitting || cart.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <span className="text-xl">🔥</span>}
                {submitting ? "Enviando pedido..." : `Confirmar · ${formatCurrency(total, sucursal.simbolo)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
