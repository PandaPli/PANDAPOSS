"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Phone, Navigation2, PackageCheck,
  CheckCircle, ShieldCheck, AlertCircle, Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Detalle {
  cantidad: number;
  nombre: string;
  precio: number;
}

interface PedidoActivo {
  id: number;
  numero: number;
  estado: string;
  clienteNombre: string;
  telefonoCliente: string;
  direccionEntrega: string;
  referencia: string | null;
  departamento: string | null;
  metodoPago: string;
  subtotal: number;
  cargoEnvio: number;
  total: number;
  pagoRider: number;
  codigoEntrega: string | null;
  estadoDelivery: string | null;
  clienteLat: number | null;
  clienteLng: number | null;
  sucursalNombre: string | null;
  sucursalDireccion: string | null;
  detalles: Detalle[];
}

interface Props {
  pedido: PedidoActivo;
}

type Stage = "EN_LOCAL" | "EN_RUTA" | "CONFIRMAR" | "ENTREGADO";

function stageFromEstado(estado: string): Stage {
  if (estado === "ENTREGADO") return "ENTREGADO";
  if (estado === "EN_PROCESO") return "EN_RUTA";
  return "EN_LOCAL";
}

export function ActiveDeliveryClient({ pedido }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(stageFromEstado(pedido.estado));
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  // Enviar GPS al servidor cada 10 segundos mientras está en ruta
  useEffect(() => {
    if (stage !== "EN_RUTA" && stage !== "CONFIRMAR") return;

    function enviarUbicacion() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        void fetch("/api/driver/location", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
      });
    }

    enviarUbicacion();
    locationInterval.current = setInterval(enviarUbicacion, 10_000);
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [stage]);

  async function actualizarEstado(nuevoEstado: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/orders/${pedido.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error al actualizar estado");
        return;
      }
    } catch {
      setError("Error de conexión");
      return;
    } finally {
      setLoading(false);
    }
  }

  async function handleIniciarRuta() {
    await actualizarEstado("EN_PROCESO");
    if (!error) setStage("EN_RUTA");
  }

  async function handleConfirmarEntrega() {
    if (!codigo.trim()) {
      setError("Ingresa el código que te dio el cliente");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/orders/${pedido.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Código incorrecto");
        return;
      }

      setStage("ENTREGADO");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function abrirMapa(destino: string) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white px-4 pt-10 pb-4 border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/driver" className="p-2 rounded-xl hover:bg-stone-100">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Entrega activa</p>
              <h1 className="font-black text-lg text-stone-900">Pedido #{pedido.numero}</h1>
            </div>
          </div>
          <StageChip stage={stage} />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-36 space-y-4">
        {/* Estado ENTREGADO */}
        {stage === "ENTREGADO" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-8 text-center">
            <CheckCircle size={56} className="mx-auto mb-4 text-emerald-500" />
            <h2 className="font-black text-2xl text-emerald-800 mb-2">¡Entregado!</h2>
            <p className="text-emerald-700 text-sm mb-2">Ganancia por esta entrega:</p>
            <p className="text-3xl font-black text-emerald-700">{formatCurrency(pedido.pagoRider)}</p>
            <Link href="/driver" className="mt-6 inline-block py-3 px-8 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest">
              Volver al inicio
            </Link>
          </div>
        )}

        {stage !== "ENTREGADO" && (
          <>
            {/* Info del cliente */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-stone-200 space-y-4">
              <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Cliente</p>
              <p className="font-bold text-stone-900 text-lg">{pedido.clienteNombre}</p>

              <div className="flex items-start gap-3">
                <div className="bg-stone-100 p-2 rounded-xl shrink-0">
                  <MapPin size={18} className="text-stone-500" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm leading-snug">{pedido.direccionEntrega}</p>
                  {pedido.referencia && <p className="text-xs text-stone-500 mt-0.5">Ref: {pedido.referencia}</p>}
                  {pedido.departamento && <p className="text-xs text-stone-500">Depto: {pedido.departamento}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`tel:${pedido.telefonoCliente}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200"
                >
                  <Phone size={16} /> Llamar
                </a>
                <button
                  onClick={() => abrirMapa(pedido.direccionEntrega)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100"
                >
                  <Navigation2 size={16} /> Navegar
                </button>
              </div>
            </div>

            {/* Productos y total */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-stone-200">
              <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-3">Pedido</p>
              <div className="space-y-2 mb-4">
                {pedido.detalles.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm text-stone-700">
                    <span><span className="font-bold">{d.cantidad}x</span> {d.nombre}</span>
                    <span className="text-stone-500">{formatCurrency(d.precio * d.cantidad)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span><span>{formatCurrency(pedido.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Envío</span><span>{formatCurrency(pedido.cargoEnvio)}</span>
                </div>
                <div className="flex justify-between font-black text-stone-900 text-base">
                  <span>Total a cobrar</span><span>{formatCurrency(pedido.total)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-500 text-xs pt-1">
                  <span>Método</span><span>{pedido.metodoPago}</span>
                </div>
              </div>
            </div>

            {/* Tu ganancia */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-[1.5rem] p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500" />
                <p className="font-bold text-emerald-800 text-sm">Tu ganancia por esta entrega</p>
              </div>
              <p className="font-black text-xl text-emerald-700">{formatCurrency(pedido.pagoRider)}</p>
            </div>

            {/* Ingreso de código (solo en stage CONFIRMAR) */}
            {stage === "CONFIRMAR" && (
              <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <PackageCheck size={20} className="text-amber-600" />
                  <p className="font-black text-amber-800">Código de entrega</p>
                </div>
                <p className="text-sm text-amber-700">
                  El cliente tiene un código de 6 caracteres. Pídelo e ingrésalo aquí para confirmar la entrega.
                </p>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="Ej: AB3X7K"
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 text-center text-xl font-black tracking-[0.3em] bg-white focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
          </>
        )}
      </main>

      {/* Botones de acción */}
      {stage !== "ENTREGADO" && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-100 via-stone-100/95 to-transparent">
          {stage === "EN_LOCAL" && (
            <button
              onClick={() => void handleIniciarRuta()}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-widest text-sm shadow-2xl flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation2 size={18} />}
              Retiré el pedido — Iniciar ruta
            </button>
          )}

          {stage === "EN_RUTA" && (
            <button
              onClick={() => { setStage("CONFIRMAR"); setError(null); }}
              className="w-full py-4 rounded-2xl bg-amber-400 text-amber-950 font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_-10px_rgba(251,191,36,0.6)] flex justify-center items-center gap-2"
            >
              <PackageCheck size={18} /> Llegué — Ingresar código
            </button>
          )}

          {stage === "CONFIRMAR" && (
            <div className="space-y-2">
              <button
                onClick={() => void handleConfirmarEntrega()}
                disabled={loading || codigo.length < 4}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Confirmar entrega
              </button>
              <button
                onClick={() => { setStage("EN_RUTA"); setCodigo(""); setError(null); }}
                className="w-full py-2 text-stone-500 font-bold text-sm"
              >
                ← Volver
              </button>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}

function StageChip({ stage }: { stage: Stage }) {
  const map: Record<Stage, { label: string; className: string }> = {
    EN_LOCAL: { label: "En local", className: "bg-stone-100 text-stone-600" },
    EN_RUTA: { label: "En ruta", className: "bg-blue-100 text-blue-700" },
    CONFIRMAR: { label: "Confirmar", className: "bg-amber-100 text-amber-800" },
    ENTREGADO: { label: "Entregado", className: "bg-emerald-100 text-emerald-700" },
  };
  const { label, className } = map[stage];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${className}`}>
      {label}
    </span>
  );
}
