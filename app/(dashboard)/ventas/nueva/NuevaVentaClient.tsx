"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { PrecuentaModal } from "@/components/pos/PrecuentaModal";
import { useCartStore } from "@/stores/cartStore";
import type { ProductoCard, CartItem, RondaPedido } from "@/types";
import { ArrowLeft, AlertTriangle, Wallet, CheckCircle2, ShoppingCart, UtensilsCrossed, Printer, Search, User, X, Truck, Loader2, MapPin, Monitor } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { printFrame } from "@/lib/printFrame";

const CANCEL_ROLES = ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "SECRETARY", "WAITER"];

// Qué estaciones puede ver cada rol en el POS (undefined = ve todo)
const ROL_ESTACIONES: Record<string, string[]> = {
  CHEF:   ["COCINA", "CUARTO_CALIENTE"],
  BAR:    ["BARRA"],
};

const ESTACION_LABELS: Record<string, string> = {
  COCINA:          "🍳 Cocina",
  BARRA:           "🍹 Barra",
  CUARTO_CALIENTE: "🔥 Cuarto Caliente",
  MOSTRADOR:       "🧁 Mostrador",
};

interface Props {
  productos: ProductoCard[];
  simbolo: string;
  usuarioId: number;
  userRol?: string;
  cajaId?: number;
  cajaNombre?: string;
  meseroNombre?: string;
  initialOrder?: { id: number; mesaId: number | null; items: CartItem[]; rondas?: RondaPedido[] } | null;
  logoUrl?: string | null;
  mesaNombre?: string; // nombre real de la mesa (ej: "Mesa 3", "Terraza 1")
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  sucursalRut?: string | null;
  sucursalTelefono?: string | null;
  sucursalDireccion?: string | null;
  sucursalGiroComercial?: string | null;
}

export function NuevaVentaClient({
  productos,
  simbolo,
  usuarioId,
  userRol,
  cajaId,
  cajaNombre,
  meseroNombre,
  initialOrder,
  logoUrl,
  mesaNombre,
  sucursalId,
  sucursalNombre,
  sucursalRut,
  sucursalTelefono,
  sucursalDireccion,
  sucursalGiroComercial,
}: Props) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrecuenta, setShowPrecuenta] = useState(false);
  const [ordenLoading, setOrdenLoading] = useState(false);
  const [ordenMsg, setOrdenMsg] = useState("");
  const [mobileTab, setMobileTab] = useState<"menu" | "carrito">("menu");

  /* ── Grupos por mesa ── */
  const [activeGrupo, setActiveGrupo] = useState<string | null>(null);

  const { items, mesaId, pedidoId, setPedido, total, setInitialState, markAsSaved, markAsSavedWithIds, getItemsByGrupo, setMesaFresh, setCliente, descuento, ivaPorc } = useCartStore();

  /* ── Cliente (opcional, por defecto CLIENTE EN MESÓN) ── */
  const [clienteNombreLocal, setClienteNombreLocal] = useState<string | null>(null);
  const [showClienteSearch, setShowClienteSearch]   = useState(false);
  const [clientePhone, setClientePhone]             = useState("");
  const [searchingCliente, setSearchingCliente]     = useState(false);
  const [clienteError, setClienteError]             = useState("");

  /* ── Modo Delivery ── */
  const [showDeliveryModal, setShowDeliveryModal]   = useState(false);
  const [deliveryNombre, setDeliveryNombre]         = useState("");
  const [deliveryPhone, setDeliveryPhone]           = useState("");
  const [deliveryDir, setDeliveryDir]               = useState("");
  const [deliveryRef, setDeliveryRef]               = useState("");
  const [deliveryCosto, setDeliveryCosto]           = useState("0");
  const [deliveryHora, setDeliveryHora]             = useState("");
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [deliveryError, setDeliveryError]           = useState("");

  // Filtrar productos según el rol del usuario
  const productosFiltrados = useMemo(() => {
    const estaciones = ROL_ESTACIONES[userRol ?? ""];
    if (!estaciones) return productos;
    return productos.filter(
      (p) => !p.categoria?.estacion || estaciones.includes(p.categoria.estacion)
    );
  }, [productos, userRol]);

  // Historial de rondas de esta mesa (server-loaded + local)
  const [localRondas, setLocalRondas] = useState<RondaPedido[]>(initialOrder?.rondas ?? []);

  const [checkoutGrupo, setCheckoutGrupo] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{
    pedidoNum: number;
    mesa: string | null;
    items: CartItem[];
  } | null>(null);
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  const GRUPO_NUMS = ["A1", "A2", "A3", "A4", "A5"];
  const gruposUsados = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => { if (i.grupo) s.add(i.grupo); });
    return GRUPO_NUMS.filter((g) => s.has(g));
  }, [items]);
  const siguienteGrupo = GRUPO_NUMS.find((g) => !gruposUsados.includes(g)) ?? null;

  // ── Visor de cliente ─────────────────────────────────────────────────────
  const lastTotalRef = useRef<number>(0);
  const [visorCopied, setVisorCopied] = useState(false);

  // El visor se activa solo cuando hay una caja abierta
  const visorUrl = cajaId ? `/visor/${cajaId}` : null;

  // Guardar último total no-cero para la pantalla de éxito
  useEffect(() => {
    const unsub = useCartStore.subscribe((state) => {
      const t = state.total();
      if (t > 0) lastTotalRef.current = t;
    });
    return unsub;
  }, []);

  // Enviar estado del carrito al visor en cada cambio
  useEffect(() => {
    if (!cajaId) return; // sin caja abierta, no hay visor
    const store = useCartStore.getState();
    const activeItems = items.filter((i) => !i.cancelado && !i.pagado);
    const payload =
      activeItems.length === 0
        ? { cajaId, type: "idle" as const, sucursalNombre: sucursalNombre ?? "" }
        : {
            cajaId,
            type:           "cart" as const,
            items:          activeItems.map((i) => ({
              id:          i.id,
              tipo:        i.tipo,
              nombre:      i.nombre,
              precio:      i.precio,
              cantidad:    i.cantidad,
              observacion: i.observacion ?? null,
            })),
            subtotal:       store.subtotal(),
            descuento,
            totalDescuento: store.totalDescuento(),
            ivaPorc,
            totalIva:       store.totalIva(),
            total:          store.total(),
            simbolo,
            sucursalNombre: sucursalNombre ?? "",
          };

    fetch("/api/visor/push", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }).catch(() => { /* visor no crítico */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, descuento, ivaPorc, simbolo, cajaId, sucursalNombre]);

  function openVisor() {
    if (!visorUrl) return;
    window.open(visorUrl, "_blank", "noopener,noreferrer");
  }

  function copyVisorUrl() {
    if (!visorUrl) return;
    const full = `${window.location.origin}${visorUrl}`;
    navigator.clipboard.writeText(full).then(() => {
      setVisorCopied(true);
      setTimeout(() => setVisorCopied(false), 2000);
    });
  }

  // Ref para saber si ya hicimos la hidratación inicial en este montaje
  const hydrated = useRef(false);

  useEffect(() => {
    if (!initialOrder) return;

    // En el primer montaje siempre cargar desde el servidor (tiene TODOS los pedidos de la mesa)
    if (!hydrated.current) {
      hydrated.current = true;
      setInitialState(initialOrder.items, initialOrder.id, initialOrder.mesaId);
      return;
    }

    // Después del montaje: solo re-hidratar si cambió de mesa
    if (mesaId !== (initialOrder.mesaId ?? null)) {
      setInitialState(initialOrder.items, initialOrder.id, initialOrder.mesaId);
    }
  }, [initialOrder, mesaId, setInitialState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const mesaParam = urlParams.get("mesa");
    if (!mesaParam || isNaN(Number(mesaParam))) return;
    const newMesaId = Number(mesaParam);

    if (!initialOrder) {
      // Sin datos del servidor: solo asignar mesaId en el store
      const store = useCartStore.getState();
      if (store.mesaId !== newMesaId) {
        store.setMesaFresh(newMesaId);
      } else {
        store.setMesa(newMesaId);
      }
    } else if (initialOrder.mesaId !== newMesaId) {
      // Mesa cambió via URL pero initialOrder es de la mesa anterior:
      // hacer hard reload para que el servidor cargue los pedidos de la nueva mesa
      window.location.href = `/ventas/nueva?mesa=${newMesaId}`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOpenPrecuenta() {
    if (mesaId) {
      try {
        await fetch("/api/mesas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: mesaId, estado: "CUENTA" }),
        });
      } catch {
        // Si falla el cambio visual, igual abrimos la precuenta para no bloquear la operacion.
      }
    }

    setShowPrecuenta(true);
  }

  /* ── Buscar cliente por teléfono ── */
  async function buscarCliente() {
    const digits = clientePhone.replace(/\D/g, "");
    if (digits.length < 8) return;
    setSearchingCliente(true);
    setClienteError("");
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(digits)}`);
      const data = await res.json();
      if (data.length > 0 && typeof data[0].id === "number" && data[0].id > 0) {
        setCliente(data[0].id);
        setClienteNombreLocal(data[0].nombre);
        setShowClienteSearch(false);
        // Pre-rellenar delivery si está abierto
        setDeliveryNombre(data[0].nombre);
        setDeliveryPhone(`+569${digits.slice(-8)}`);
        if (data[0].direccion) setDeliveryDir(data[0].direccion);
      } else {
        setClienteError("Cliente no encontrado");
      }
    } catch {
      setClienteError("Error al buscar");
    } finally {
      setSearchingCliente(false);
    }
  }

  function clearCliente() {
    setCliente(null);
    setClienteNombreLocal(null);
    setClientePhone("");
    setClienteError("");
  }

  /* ── Enviar a Delivery desde POS ── */
  async function handleEnviarDelivery() {
    if (!deliveryNombre.trim() || !deliveryDir.trim() || items.length === 0) return;
    // Validar hora de entrega: si se ingresó, debe ser al menos 15 min en el futuro
    if (deliveryHora) {
      const horaEntrega = new Date(deliveryHora);
      const minPermitido = new Date(Date.now() + 15 * 60 * 1000);
      if (horaEntrega < minPermitido) {
        setDeliveryError("La hora de entrega debe ser al menos 15 minutos en el futuro.");
        return;
      }
    }
    setDeliverySubmitting(true);
    setDeliveryError("");
    try {
      const res = await fetch("/api/delivery/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId,
          items: items.map((i) => ({
            productoId: i.tipo === "producto" ? i.id : null,
            cantidad: i.cantidad,
          })),
          cliente: {
            nombre: deliveryNombre.trim(),
            telefono: deliveryPhone.trim() || null,
            direccion: deliveryDir.trim(),
            referencia: deliveryRef.trim() || undefined,
          },
          metodoPago: "EFECTIVO",
          cargoEnvio: Number(deliveryCosto) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear pedido delivery");
      router.push(`/delivery`);
    } catch (e) {
      setDeliveryError((e as Error).message);
    } finally {
      setDeliverySubmitting(false);
    }
  }

  async function handleVolver() {
    const unsaved = items.filter((i) => !i.guardado);
    if (unsaved.length > 0) {
      await handleOrden();
    }
    router.push("/mesas");
  }

  async function handleOrden() {
    const nuevosItems = items.filter((i) => !i.guardado && !i.cancelado);

    if (nuevosItems.length === 0) {
      setOrdenMsg("No hay productos nuevos para enviar");
      setTimeout(() => setOrdenMsg(""), 3000);
      return;
    }

    setOrdenLoading(true);
    setOrdenMsg("");

    try {
      // Siempre crear un NUEVO pedido por cada envío → cola individual en KDS
      const body = {
        mesaId: mesaId || null,
        cajaId: cajaId || null,
        tipo: "COCINA",
        items: nuevosItems.map((i) => ({
          productoId: i.tipo === "producto" ? i.id : null,
          comboId: i.tipo === "combo" ? i.id : null,
          cantidad: i.cantidad,
          observacion: i.observacion || null,
        })),
      };

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error al enviar orden");
      }

      const pedido = await res.json();
      setPedido(pedido.id);
      // Asignar detalleId de cada ítem guardado para que cancel/delete sean precisos por ronda
      const detalleIds: number[] = Array.isArray(pedido.detalles)
        ? pedido.detalles.map((d: { id: number }) => d.id)
        : [];
      if (detalleIds.length > 0) {
        markAsSavedWithIds(detalleIds);
      } else {
        markAsSaved();
      }

      // Agregar la ronda al historial local
      setLocalRondas((prev) => [
        ...prev,
        {
          pedidoId: pedido.id,
          numero: prev.length + 1,
          creadoEn: new Date().toISOString(),
          items: nuevosItems.map((i) => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
            observacion: i.observacion ?? null,
            cancelado: false,
          })),
        },
      ]);

      setOrdenMsg(`Orden #${pedido.id} enviada al KDS`);
      setTimeout(() => setOrdenMsg(""), 4000);

      const newTicket = {
        pedidoNum: pedido.id,
        mesa: mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : null),
        items: nuevosItems,
      };
      // Imprimir automáticamente al enviar — sin requerir click manual
      printKitchenTicket(newTicket);
      // El dialog queda disponible para re-imprimir si se necesita
      setTicketData(newTicket);
    } catch (e) {
      setOrdenMsg((e as Error).message);
    } finally {
      setOrdenLoading(false);
    }
  }

  function handleSuccess() {
    if (cajaId) {
      fetch("/api/visor/push", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cajaId,
          type:           "success",
          total:          lastTotalRef.current,
          simbolo,
          sucursalNombre: sucursalNombre ?? "",
        }),
      }).catch(() => { /* visor no crítico */ });
    }
    router.push(mesaId ? "/mesas" : "/panel");
  }

  function printTicketEstacion(estacion: string, items: CartItem[], pedidoNum: number, mesa: string | null) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const titulo = estacion === "BARRA" ? "ORDEN BARRA"
      : estacion === "CUARTO_CALIENTE" ? "CUARTO CALIENTE"
      : estacion === "MOSTRADOR" ? "MOSTRADOR"
      : "ORDEN COCINA";
    const itemsHtml = items
      .map((item) => `
        <div class="item">
          <span class="qty">${item.cantidad}x</span>
          <div class="item-info">
            <span class="nombre">${item.nombre}</span>
            ${item.observacion ? `<span class="obs">* ${item.observacion}</span>` : ""}
          </div>
        </div>`)
      .join("");
    const legalLines = [
      sucursalNombre ? `<div class="legal-name">${sucursalNombre}</div>` : "",
      sucursalGiroComercial ? `<div class="legal-line">${sucursalGiroComercial}</div>` : "",
      sucursalRut ? `<div class="legal-line">RUT: ${sucursalRut}</div>` : "",
      sucursalDireccion ? `<div class="legal-line">${sucursalDireccion}</div>` : "",
      sucursalTelefono ? `<div class="legal-line">Tel: ${sucursalTelefono}</div>` : "",
    ].filter(Boolean).join("");
    printFrame(`<!DOCTYPE html><html><head><title>${titulo}</title><style>
      @page{size:80mm auto;margin:0;}
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:monospace;font-size:14px;width:80mm;max-width:80mm;padding:8px;}
      .branch{text-align:center;border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:6px;}
      .legal-name{font-size:13px;font-weight:bold;}
      .legal-line{font-size:11px;color:#444;margin-top:2px;}
      .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px;margin-top:6px;}
      .title{font-size:20px;font-weight:bold;letter-spacing:3px;}
      .subtitle{font-size:13px;margin-top:3px;}
      .meta{font-size:12px;margin:6px 0;color:#333;}
      .items{margin:10px 0;border-bottom:1px dashed #000;padding-bottom:10px;}
      .item{display:flex;gap:10px;margin:8px 0;align-items:flex-start;}
      .qty{font-size:20px;font-weight:bold;min-width:30px;}
      .item-info{flex:1;}
      .nombre{font-size:15px;font-weight:bold;display:block;}
      .obs{font-size:12px;color:#555;display:block;font-style:italic;margin-top:2px;}
      .footer{text-align:center;font-size:11px;margin-top:8px;color:#666;}
    </style></head><body>
      ${legalLines ? `<div class="branch">${legalLines}</div>` : ""}
      <div class="header">
        <div class="title">${titulo}</div>
        <div class="subtitle">${mesa ?? "Sin mesa"} &nbsp;|&nbsp; Orden #${pedidoNum}</div>
      </div>
      <div class="meta">${dateStr} &nbsp;&nbsp; <strong>${timeStr}</strong></div>
      <div class="items">${itemsHtml}</div>
      <div class="footer">— PandaPoss —</div>
    </body></html>`);
  }

  function printKitchenTicket(data: { pedidoNum: number; mesa: string | null; items: CartItem[] }) {
    // Mapear item.id → estacion usando el array de productos del POS
    const prodMap = new Map(productos.map((p) => [p.id, p.categoria?.estacion ?? "COCINA"]));

    // Agrupar ítems por estación
    const groups = new Map<string, CartItem[]>();
    for (const item of data.items) {
      const estacion = item.tipo === "producto"
        ? (prodMap.get(item.id) ?? "COCINA")
        : "COCINA"; // combos → cocina por defecto
      if (!groups.has(estacion)) groups.set(estacion, []);
      groups.get(estacion)!.push(item);
    }

    // Imprimir un ticket por cada estación con ítems
    for (const [estacion, items] of groups.entries()) {
      printTicketEstacion(estacion, items, data.pedidoNum, data.mesa);
    }
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-52px)] flex-col gap-0">
      {/* Barra superior */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-surface-border bg-white px-4 py-3">
        {/* Volver — solo si viene de una mesa */}
        {mesaId ? (
          <button onClick={handleVolver} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-95 transition-all">
            <ArrowLeft size={15} />
            <span>Volver a Mesas</span>
          </button>
        ) : (
          <button onClick={() => router.push("/panel")} className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm font-semibold text-surface-text hover:bg-surface-bg active:scale-95 transition-all">
            <ArrowLeft size={15} />
          </button>
        )}

        <h1 className="text-sm font-bold text-surface-text sm:text-base">
          {mesaNombre ?? "Punto de Venta"}
        </h1>

        {ordenMsg && (
          <span className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">{ordenMsg}</span>
            <span className="sm:hidden">Enviado</span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Cliente */}
          {clienteNombreLocal ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 pl-2.5 pr-1.5 py-1 text-xs font-semibold text-brand-700">
              <User size={11} />
              {clienteNombreLocal}
              <button onClick={clearCliente} className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 transition">
                <X size={11} />
              </button>
            </span>
          ) : (
            <button
              onClick={() => setShowClienteSearch((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-surface-muted hover:bg-surface-bg transition"
            >
              <User size={11} />
              <span className="hidden sm:inline">Cliente en Mesón</span>
              <span className="sm:hidden">Cliente</span>
            </button>
          )}

          {/* Caja */}
          {cajaId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
              <Wallet size={13} />
              <span className="hidden sm:inline">{cajaNombre ?? "Caja abierta"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle size={13} />
              <span className="hidden sm:inline">Sin caja</span>
            </span>
          )}

          {/* Botón visor cliente */}
          {visorUrl && (
            <div className="flex items-center gap-1">
              <button
                onClick={openVisor}
                title={`Abrir visor: ${visorUrl}`}
                className="inline-flex items-center gap-1.5 rounded-l-full border border-surface-border bg-white px-2.5 py-1.5 text-xs font-semibold text-surface-muted hover:bg-surface-bg hover:text-surface-text active:scale-95 transition-all"
              >
                <Monitor size={13} />
                <span className="hidden sm:inline">Visor</span>
              </button>
              <button
                onClick={copyVisorUrl}
                title="Copiar enlace del visor"
                className="inline-flex items-center rounded-r-full border border-l-0 border-surface-border bg-white px-2 py-1.5 text-xs font-semibold text-surface-muted hover:bg-surface-bg hover:text-surface-text active:scale-95 transition-all"
              >
                {visorCopied ? (
                  <CheckCircle2 size={13} className="text-emerald-500" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Búsqueda de cliente ── */}
      {showClienteSearch && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-surface-border bg-surface-bg px-4 py-2.5">
          <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm">
            <span className="text-xs font-semibold text-surface-muted">+569</span>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              maxLength={8}
              value={clientePhone}
              onChange={(e) => { setClientePhone(e.target.value.replace(/\D/g, "")); setClienteError(""); }}
              onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
              placeholder="12345678"
              className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-surface-muted/50"
            />
          </div>
          <button
            onClick={buscarCliente}
            disabled={clientePhone.length < 8 || searchingCliente}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface-text px-3 py-2 text-xs font-bold text-white transition hover:bg-surface-text/80 disabled:opacity-40"
          >
            {searchingCliente ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            Buscar
          </button>
          <button onClick={() => { setShowClienteSearch(false); setClienteError(""); }} className="rounded-xl p-2 text-surface-muted hover:bg-surface-border transition">
            <X size={14} />
          </button>
          {clienteError && <span className="text-xs font-semibold text-rose-600">{clienteError}</span>}
        </div>
      )}

      {/* ── Botón Enviar a Delivery (solo si hay ítems y no hay mesa) ── */}
      {!mesaId && items.length > 0 && (
        <div className="flex flex-shrink-0 justify-end border-b border-surface-border bg-white px-4 py-2">
          <button
            onClick={() => { setShowDeliveryModal(true); if (clienteNombreLocal) setDeliveryNombre(clienteNombreLocal); }}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
          >
            <Truck size={13} />
            Enviar a Delivery
          </button>
        </div>
      )}

      {/* ── Grupos por mesa — solo cuando hay mesaId ── */}
      {mesaId && (
        <div className="flex flex-shrink-0 items-center gap-1 overflow-x-auto border-b border-surface-border bg-gradient-to-r from-slate-50 to-brand-50 px-3 py-2 scrollbar-hide">
          {/* Tab: Mesa completa (sin grupo) */}
          <button
            onClick={() => setActiveGrupo(null)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
              !activeGrupo
                ? "bg-surface-text text-white shadow-sm"
                : "border border-surface-border bg-white text-surface-muted hover:bg-surface-bg hover:text-surface-text"
            )}
          >
            Mesa
          </button>

          {/* Separador */}
          <div className="h-5 w-px bg-surface-border mx-0.5 shrink-0" />

          {/* Tabs de grupos existentes */}
          {gruposUsados.map((grupo) => {
            const color = ["#3b82f6","#22c55e","#f97316","#a855f7","#ec4899"][GRUPO_NUMS.indexOf(grupo)] ?? "#6b7280";
            return (
              <button
                key={grupo}
                onClick={() => setActiveGrupo(grupo)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  activeGrupo === grupo
                    ? "text-white shadow-sm"
                    : "border bg-white text-surface-muted hover:text-white"
                )}
                style={activeGrupo === grupo
                  ? { backgroundColor: color, borderColor: color }
                  : { borderColor: color, color }}
              >
                Grupo {grupo}
              </button>
            );
          })}

          {/* Botón "+" — agregar nuevo grupo (máx 5) */}
          {siguienteGrupo && gruposUsados.length < 5 && (
            <button
              onClick={() => setActiveGrupo(siguienteGrupo)}
              className="shrink-0 flex items-center gap-1 rounded-lg border border-dashed border-brand-300 bg-white px-2.5 py-1.5 text-xs font-bold text-brand-500 transition-all hover:border-brand-500 hover:bg-brand-50"
            >
              <span className="text-sm leading-none">+</span>
              {siguienteGrupo}
            </button>
          )}

          {/* Indicador activo */}
          {activeGrupo && (
            <span className="ml-auto shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-700">
              Grupo {activeGrupo}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-shrink-0 border-b border-surface-border bg-white md:hidden">
        <button
          onClick={() => setMobileTab("menu")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors",
            mobileTab === "menu" ? "border-brand-500 text-brand-600" : "border-transparent text-surface-muted"
          )}
        >
          <UtensilsCrossed size={16} />
          Menu
        </button>
        <button
          onClick={() => setMobileTab("carrito")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors",
            mobileTab === "carrito" ? "border-brand-500 text-brand-600" : "border-transparent text-surface-muted"
          )}
        >
          <ShoppingCart size={16} />
          Carrito
          {totalItems > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold leading-none text-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 overflow-hidden p-3 sm:p-4", mobileTab === "carrito" ? "hidden md:block" : "block")}>
          <ProductGrid productos={productosFiltrados} simbolo={simbolo} activeGrupo={activeGrupo} />
        </div>

        <div className={cn("flex-shrink-0 overflow-hidden", "md:block md:w-72 xl:w-80", mobileTab === "carrito" ? "block w-full" : "hidden md:block")}>
          <CartPanel
            simbolo={simbolo}
            onCheckout={() => { setCheckoutGrupo(null); setShowCheckout(true); }}
            onCheckoutGrupo={(grupo) => { setCheckoutGrupo(grupo); setShowCheckout(true); }}
            onOrden={handleOrden}
            onPrecuenta={handleOpenPrecuenta}
            ordenLoading={ordenLoading}
            canCancelItems={userRol ? CANCEL_ROLES.includes(userRol) : false}
            rondas={localRondas}
          />
        </div>
      </div>

      {mobileTab === "menu" && totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <button
            onClick={() => setMobileTab("carrito")}
            className="flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 font-semibold text-white shadow-2xl transition-all active:scale-[0.98] hover:bg-brand-700"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Ver pedido
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-bold">{totalItems}</span>
              <span>{formatCurrency(total(), simbolo)}</span>
            </span>
          </button>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          simbolo={simbolo}
          cajaId={cajaId}
          usuarioId={usuarioId}
          meseroNombre={meseroNombre}
          mesaNombre={mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : undefined)}
          logoUrl={logoUrl}
          onClose={() => { setShowCheckout(false); setCheckoutGrupo(null); }}
          onSuccess={handleSuccess}
          grupoNombre={checkoutGrupo ?? undefined}
          grupoItems={checkoutGrupo ? getItemsByGrupo(checkoutGrupo) : undefined}
          sucursalNombre={sucursalNombre}
          sucursalRut={sucursalRut}
          sucursalTelefono={sucursalTelefono}
          sucursalDireccion={sucursalDireccion}
          sucursalGiroComercial={sucursalGiroComercial}
          sucursalId={sucursalId}
        />
      )}

      {/* ── Modal Delivery desde POS ── */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-violet-600" />
                <p className="font-bold text-surface-text">Enviar a Delivery</p>
              </div>
              <button onClick={() => { setShowDeliveryModal(false); setDeliveryError(""); }} className="rounded-xl p-1.5 text-surface-muted hover:bg-surface-bg transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div>
                <label className="label">Nombre del cliente *</label>
                <input value={deliveryNombre} onChange={(e) => setDeliveryNombre(e.target.value)}
                  placeholder="Nombre" className="input" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm">
                  <span className="text-xs font-semibold text-surface-muted">+569</span>
                  <input type="tel" inputMode="numeric" maxLength={8}
                    value={deliveryPhone.replace(/^\+569/, "")}
                    onChange={(e) => setDeliveryPhone(`+569${e.target.value.replace(/\D/g, "")}`)}
                    placeholder="12345678"
                    className="flex-1 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-surface-muted/50"
                  />
                </div>
              </div>
              <div>
                <label className="label">Dirección de entrega *</label>
                <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm">
                  <MapPin size={14} className="shrink-0 text-surface-muted" />
                  <input value={deliveryDir} onChange={(e) => setDeliveryDir(e.target.value)}
                    placeholder="Calle y número" className="flex-1 bg-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="label">Referencia</label>
                <input value={deliveryRef} onChange={(e) => setDeliveryRef(e.target.value)}
                  placeholder="Depto, portón, color de puerta..." className="input" />
              </div>
              <div>
                <label className="label">Hora de entrega <span className="text-surface-muted font-normal">(opcional)</span></label>
                <input
                  type="datetime-local"
                  value={deliveryHora}
                  min={new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => { setDeliveryHora(e.target.value); setDeliveryError(""); }}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Cargo de envío</label>
                <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm">
                  <span className="text-xs font-semibold text-surface-muted">{simbolo}</span>
                  <input type="text" inputMode="numeric"
                    value={deliveryCosto}
                    onChange={(e) => setDeliveryCosto(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="flex-1 bg-transparent font-semibold tabular-nums outline-none"
                  />
                </div>
              </div>

              {deliveryError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{deliveryError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowDeliveryModal(false); setDeliveryError(""); }}
                  className="btn-secondary flex-1 text-sm">
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarDelivery}
                  disabled={deliverySubmitting || !deliveryNombre.trim() || !deliveryDir.trim() || items.length === 0}
                  className="btn-primary flex-1 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
                >
                  {deliverySubmitting ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrecuenta && (
        <PrecuentaModal
          simbolo={simbolo}
          meseroNombre={meseroNombre}
          mesaNombre={mesaNombre ?? (mesaId ? `Mesa ${mesaId}` : undefined)}
          logoUrl={logoUrl}
          onClose={() => setShowPrecuenta(false)}
          sucursalId={sucursalId}
          sucursalNombre={sucursalNombre}
          sucursalRut={sucursalRut}
          sucursalTelefono={sucursalTelefono}
          sucursalDireccion={sucursalDireccion}
          sucursalGiroComercial={sucursalGiroComercial}
        />
      )}

      {ticketData && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 sm:items-center bg-black/40 animate-fade-in">
          <div className="mx-4 w-full max-w-xs rounded-2xl bg-white shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Printer size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-surface-text">
                  Orden #{ticketData.pedidoNum} enviada
                  {ticketData.mesa ? ` · ${ticketData.mesa}` : ""}
                </p>
                <p className="mt-0.5 text-sm text-surface-muted">
                  Comanda impresa automáticamente. ¿Re-imprimir?
                </p>
              </div>
            </div>

            <div className="text-xs border border-surface-border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
              {(() => {
                const prodMap = new Map(productos.map((p) => [p.id, p.categoria?.estacion ?? "COCINA"]));
                const groups = new Map<string, CartItem[]>();
                for (const item of ticketData.items) {
                  const est = item.tipo === "producto" ? (prodMap.get(item.id) ?? "COCINA") : "COCINA";
                  if (!groups.has(est)) groups.set(est, []);
                  groups.get(est)!.push(item);
                }
                return Array.from(groups.entries()).map(([est, its]) => (
                  <div key={est}>
                    <div className="bg-surface-bg px-3 py-1 font-semibold text-surface-muted text-[10px] uppercase tracking-wider">
                      {ESTACION_LABELS[est] ?? est}
                    </div>
                    {its.map((item, i) => (
                      <div key={i} className="flex gap-2 px-3 py-1.5 text-surface-text">
                        <span className="font-bold w-5 text-right flex-shrink-0">{item.cantidad}x</span>
                        <span>{item.nombre}{item.observacion ? ` — ${item.observacion}` : ""}</span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { printKitchenTicket(ticketData); setTicketData(null); }}
                className="btn-primary flex-1 justify-center py-2.5 text-sm"
              >
                <Printer size={15} />
                Re-imprimir
              </button>
              <button
                onClick={() => setTicketData(null)}
                className="flex-1 rounded-xl border border-surface-border bg-white py-2.5 text-sm font-medium text-surface-muted hover:bg-surface-bg transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
