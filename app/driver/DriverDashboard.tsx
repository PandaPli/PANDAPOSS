"use client";

import Link from "next/link";
import { Bike, MapPin, Clock, Phone, TrendingUp, Package, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface Detalle {
  cantidad: number;
  nombre: string;
}

interface PedidoDriver {
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
  zonaDelivery: string | null;
  codigoEntrega: string | null;
  estadoDelivery: string | null;
  sucursalNombre: string | null;
  creadoEn: string;
  detalles: Detalle[];
}

interface Props {
  riderNombre: string;
  pedidos: PedidoDriver[];
  gananciasHoy: number;
  entregasHoy: number;
}

function estadoLabel(e: string) {
  const map: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PROCESO: "En ruta",
    LISTO: "Listo en local",
    ENTREGADO: "Entregado",
  };
  return map[e] ?? e;
}

function estadoColor(e: string) {
  if (e === "LISTO") return "bg-amber-100 text-amber-800";
  if (e === "EN_PROCESO") return "bg-blue-100 text-blue-700";
  return "bg-stone-100 text-stone-600";
}

export function DriverDashboard({ riderNombre, pedidos, gananciasHoy, entregasHoy }: Props) {
  const [expandido, setExpandido] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-900 px-5 pt-12 pb-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">PandaDriver</p>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Bike size={22} /> {riderNombre}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Activo</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5">
        {/* Ganancias hoy */}
        <div className="bg-white rounded-[1.8rem] p-5 shadow-sm border border-black/5 flex justify-between items-center">
          <div>
            <p className="text-[11px] text-stone-500 uppercase font-bold tracking-widest mb-1">Ganancias hoy</p>
            <p className="text-3xl font-black tracking-tight">{formatCurrency(gananciasHoy)}</p>
            <p className="text-xs text-stone-400 mt-1">{entregasHoy} entrega{entregasHoy !== 1 ? "s" : ""} completada{entregasHoy !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <TrendingUp size={36} className="text-emerald-400/30" />
            <Link href="/driver/earnings" className="text-xs font-bold text-amber-600 underline underline-offset-2">
              Ver historial
            </Link>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div>
          <p className="text-[11px] uppercase tracking-widest font-black text-stone-400 mb-3 px-1">
            Pedidos asignados ({pedidos.length})
          </p>

          {pedidos.length === 0 && (
            <div className="bg-white rounded-[1.8rem] p-8 text-center border border-stone-200">
              <Package size={32} className="mx-auto mb-3 text-stone-300" />
              <p className="font-bold text-stone-400 text-sm">Sin pedidos asignados</p>
              <p className="text-xs text-stone-400 mt-1">Cuando te asignen un pedido aparecerá aquí</p>
            </div>
          )}

          <div className="space-y-4">
            {pedidos.map((p) => (
              <div key={p.id} className="bg-white rounded-[1.5rem] border border-stone-200 shadow-sm overflow-hidden">
                {/* Cabecera del pedido */}
                <button
                  className="w-full p-5 text-left"
                  onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${estadoColor(p.estado)}`}>
                        {estadoLabel(p.estado)}
                      </span>
                      <p className="font-black text-2xl mt-2 text-stone-900">#{p.numero}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-emerald-600">+{formatCurrency(p.pagoRider)}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">tu pago</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-stone-600">
                    <p className="font-semibold text-stone-800">{p.clienteNombre}</p>
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="text-stone-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{p.direccionEntrega}</span>
                    </p>
                    {p.referencia && (
                      <p className="text-xs text-stone-500 pl-5">Ref: {p.referencia}</p>
                    )}
                    {p.departamento && (
                      <p className="text-xs text-stone-500 pl-5">Depto: {p.departamento}</p>
                    )}
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-stone-400" />
                      <a href={`tel:${p.telefonoCliente}`} className="text-blue-600 font-medium">
                        {p.telefonoCliente}
                      </a>
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(p.creadoEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      {p.sucursalNombre && ` · ${p.sucursalNombre}`}
                    </p>
                    <ChevronRight size={14} className={`transition-transform ${expandido === p.id ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Expandible: detalles del pedido */}
                {expandido === p.id && (
                  <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-2">Productos</p>
                      <div className="space-y-1.5">
                        {p.detalles.map((d, i) => (
                          <p key={i} className="text-sm text-stone-700">
                            <span className="font-bold">{d.cantidad}x</span> {d.nombre}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between text-stone-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(p.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>Envío (cliente paga)</span>
                        <span>{formatCurrency(p.cargoEnvio)}</span>
                      </div>
                      <div className="flex justify-between font-black text-stone-900 pt-1 border-t border-stone-200">
                        <span>Total cobrar</span>
                        <span>{formatCurrency(p.total)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700 text-xs pt-1">
                        <span>Método de pago</span>
                        <span>{p.metodoPago}</span>
                      </div>
                    </div>

                    {p.zonaDelivery && (
                      <p className="text-xs text-stone-500">Zona: <span className="font-semibold">{p.zonaDelivery}</span></p>
                    )}

                    <Link
                      href={`/driver/active/${p.id}`}
                      className="flex justify-center w-full py-3.5 rounded-2xl bg-amber-400 text-amber-950 font-black uppercase tracking-widest text-sm shadow-[0_8px_20px_-8px_rgba(251,191,36,0.5)] hover:bg-amber-500"
                    >
                      Iniciar entrega →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
