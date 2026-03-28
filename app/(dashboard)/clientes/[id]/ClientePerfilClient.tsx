"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, Mail, MapPin, Cake, User,
  ShoppingBag, TrendingUp, CreditCard, Banknote,
  ArrowLeftRight, CheckCircle2, XCircle, Loader2, Hash,
  Gift, Send, Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface Direccion {
  id: number;
  calle: string;
  numero: string | null;
  referencia: string | null;
}

interface DetalleVenta {
  nombre: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
  producto: { nombre: string } | null;
  combo: { nombre: string } | null;
}

interface Venta {
  id: number;
  numero: string;
  total: number;
  descuento: number;
  metodoPago: string;
  estado: string;
  creadoEn: string;
  detalles: DetalleVenta[];
}

interface ClienteDetalle {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  genero: string | null;
  fechaNacimiento: string | null;
  codigoCumple: string | null;
  sucursalId: number | null;
  activo: boolean;
  creadoEn: string;
  direcciones: Direccion[];
  ventas: Venta[];
  stats: {
    totalCompras: number;
    totalGastado: number;
    ticketPromedio: number;
    direccionesCount: number;
  };
}

const SIMBOLO = "$";
const fmt = (n: number) => formatCurrency(n, SIMBOLO);

const METODO_ICON: Record<string, React.ReactNode> = {
  EFECTIVO:      <Banknote size={13} />,
  TARJETA:       <CreditCard size={13} />,
  TRANSFERENCIA: <ArrowLeftRight size={13} />,
};

function generoLabel(g: string | null) {
  if (g === "M") return "Hombre";
  if (g === "F") return "Mujer";
  if (g === "O") return "Otro 🐼";
  return null;
}

export function ClientePerfilClient({ clienteId }: { clienteId: number }) {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVenta, setExpandedVenta] = useState<number | null>(null);
  const [enviandoCupon, setEnviandoCupon] = useState(false);
  const [cuponMsg, setCuponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}`)
      .then((r) => r.json())
      .then((d) => setCliente(d))
      .finally(() => setLoading(false));
  }, [clienteId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-stone-300" />
      </div>
    );
  }

  if (!cliente || (cliente as { error?: string }).error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <XCircle size={32} className="text-red-300" />
        <p className="text-sm text-stone-500">Cliente no encontrado</p>
      </div>
    );
  }

  async function enviarCupon() {
    if (!cliente?.codigoCumple || !cliente?.email || !cliente?.sucursalId) return;
    setEnviandoCupon(true);
    setCuponMsg(null);
    try {
      const r = await fetch("/api/public/registro/enviar-cupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cliente?.email, codigoCumple: cliente?.codigoCumple, sucursalId: cliente?.sucursalId }),
      });
      const d = await r.json();
      setCuponMsg(r.ok ? { ok: true, text: "Cupón enviado por email ✓" } : { ok: false, text: d.error ?? "Error al enviar" });
    } catch {
      setCuponMsg({ ok: false, text: "Error de conexión" });
    } finally {
      setEnviandoCupon(false);
    }
  }

  function copiarCodigo() {
    if (!cliente?.codigoCumple) return;
    navigator.clipboard.writeText(cliente.codigoCumple);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const esCumpleHoy = (() => {
    if (!cliente.fechaNacimiento) return false;
    const hoy = new Date();
    const nac = new Date(cliente.fechaNacimiento);
    return hoy.getDate() === nac.getDate() && hoy.getMonth() === nac.getMonth();
  })();

  const edad = cliente.fechaNacimiento
    ? new Date().getFullYear() - new Date(cliente.fechaNacimiento).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <div>
          <h1 className="text-2xl font-black text-stone-800">{cliente.nombre}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {generoLabel(cliente.genero) && (
              <span className="text-xs text-stone-400">{generoLabel(cliente.genero)}</span>
            )}
            {!cliente.activo && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Inactivo</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<ShoppingBag size={18} />} label="Compras" value={String(cliente.stats.totalCompras)} color="blue" />
        <StatCard icon={<TrendingUp size={18} />} label="Total gastado" value={fmt(cliente.stats.totalGastado)} color="emerald" />
        <StatCard icon={<CreditCard size={18} />} label="Ticket promedio" value={fmt(cliente.stats.ticketPromedio)} color="violet" />
        <StatCard icon={<MapPin size={18} />} label="Direcciones" value={String(cliente.stats.direccionesCount)} color="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

        {/* ── LEFT: Historial de compras ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">
            Historial de compras
          </h2>

          {cliente.ventas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white py-12 text-center">
              <ShoppingBag size={28} className="text-stone-300" />
              <p className="text-sm text-stone-400">Sin compras registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cliente.ventas.map((v) => {
                const expanded = expandedVenta === v.id;
                return (
                  <div key={v.id} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    <button
                      onClick={() => setExpandedVenta(expanded ? null : v.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition"
                    >
                      <div className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
                        v.estado === "PAGADA" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      )}>
                        {v.estado === "PAGADA" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-800">{v.numero}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            v.estado === "PAGADA" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                          )}>
                            {v.estado}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400">
                          {new Date(v.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                          {" · "}
                          {v.detalles.length} producto{v.detalles.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                        <span className="text-sm font-black text-stone-800">{fmt(v.total)}</span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-400">
                          {METODO_ICON[v.metodoPago]}
                          {v.metodoPago === "EFECTIVO" ? "Efectivo"
                            : v.metodoPago === "TARJETA" ? "Tarjeta"
                            : v.metodoPago === "TRANSFERENCIA" ? "Transferencia"
                            : v.metodoPago}
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-stone-100 px-4 py-3 bg-stone-50">
                        <div className="space-y-1.5">
                          {v.detalles.map((d, i) => {
                            const nombre = d.producto?.nombre ?? d.combo?.nombre ?? d.nombre ?? "Producto";
                            return (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-stone-600">
                                  <span className="font-bold text-stone-800">{d.cantidad}×</span>{" "}
                                  {nombre}
                                </span>
                                <span className="font-semibold text-stone-700">{fmt(Number(d.subtotal))}</span>
                              </div>
                            );
                          })}
                          {v.descuento > 0 && (
                            <div className="flex justify-between border-t border-dashed border-stone-200 pt-1.5 text-sm text-emerald-600">
                              <span>Descuento</span>
                              <span className="font-semibold">−{fmt(Number(v.descuento))}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-stone-200 pt-1.5 text-sm font-black text-stone-800">
                            <span>Total</span>
                            <span>{fmt(v.total)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Info + Direcciones ── */}
        <div className="space-y-5">
          {/* Datos personales */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
              Datos del cliente
            </h2>
            <div className="space-y-2.5">
              {cliente.telefono && (
                <InfoRow icon={<Phone size={14} />} value={cliente.telefono} />
              )}
              {cliente.email && (
                <InfoRow icon={<Mail size={14} />} value={cliente.email} />
              )}
              {cliente.direccion && (
                <InfoRow icon={<MapPin size={14} />} value={cliente.direccion} />
              )}
              {cliente.fechaNacimiento && (
                <InfoRow
                  icon={<Cake size={14} />}
                  value={`${new Date(cliente.fechaNacimiento).toLocaleDateString("es-CL", { day: "2-digit", month: "long" })}${edad ? ` (${edad} años)` : ""}`}
                />
              )}
              {!cliente.telefono && !cliente.email && !cliente.direccion && !cliente.fechaNacimiento && (
                <p className="text-xs text-stone-400">Sin datos adicionales</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-stone-400 pt-1 border-t border-stone-100 mt-2">
                <Hash size={12} />
                Cliente desde {new Date(cliente.creadoEn).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Descuento cumpleaños */}
          {cliente.codigoCumple && (
            <div className={cn(
              "rounded-2xl border p-4",
              esCumpleHoy ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"
            )}>
              <div className="mb-3 flex items-center gap-2">
                <Gift size={15} className={esCumpleHoy ? "text-amber-500" : "text-stone-400"} />
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Descuento Cumpleaños
                </h2>
                {esCumpleHoy && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-white">
                    ¡HOY!
                  </span>
                )}
              </div>

              {/* Código */}
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2">
                <span className="flex-1 font-mono text-sm font-bold tracking-widest text-stone-800">
                  {cliente.codigoCumple}
                </span>
                <button
                  onClick={copiarCodigo}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-stone-500 hover:bg-stone-200 transition"
                >
                  <Copy size={11} />
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
              </div>

              {/* Enviar por email */}
              {cliente.email ? (
                <button
                  onClick={enviarCupon}
                  disabled={enviandoCupon}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-stone-700 disabled:opacity-50"
                >
                  {enviandoCupon ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {enviandoCupon ? "Enviando..." : `Enviar a ${cliente.email}`}
                </button>
              ) : (
                <p className="text-xs text-stone-400">Sin email registrado para enviar</p>
              )}

              {cuponMsg && (
                <p className={cn(
                  "mt-2 text-xs font-semibold",
                  cuponMsg.ok ? "text-emerald-600" : "text-red-500"
                )}>
                  {cuponMsg.text}
                </p>
              )}
            </div>
          )}

          {/* Direcciones registradas */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
              Direcciones registradas
            </h2>
            {cliente.direcciones.length === 0 ? (
              <p className="text-xs text-stone-400">Sin direcciones guardadas</p>
            ) : (
              <div className="space-y-2">
                {cliente.direcciones.map((dir, i) => (
                  <div key={dir.id} className="rounded-xl bg-stone-50 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="mt-0.5 flex-shrink-0 text-stone-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 leading-snug">
                          {dir.calle}{dir.numero ? ` ${dir.numero}` : ""}
                        </p>
                        {dir.referencia && (
                          <p className="text-xs text-stone-400">{dir.referencia}</p>
                        )}
                        {i === 0 && (
                          <span className="mt-1 inline-block rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">
                            Última usada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue:    "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet:  "bg-violet-50 text-violet-600 border-violet-100",
    amber:   "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className={cn("rounded-2xl border p-4", colors[color])}>
      <div className="mb-1 opacity-60">{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-0.5 text-lg font-black">{value}</p>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-stone-600">
      <span className="flex-shrink-0 text-stone-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
