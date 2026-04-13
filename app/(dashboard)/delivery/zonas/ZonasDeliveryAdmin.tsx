"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, MapPin, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Zona {
  nombre: string;
  costoCliente: number;
  pagoRider: number;
}

interface Props {
  sucursalId: number;
  sucursalNombre: string;
  zonasIniciales: Zona[];
}

const ZONA_VACIA: Zona = { nombre: "", costoCliente: 0, pagoRider: 0 };

export function ZonasDeliveryAdmin({ sucursalId, sucursalNombre, zonasIniciales }: Props) {
  const [zonas, setZonas] = useState<Zona[]>(zonasIniciales);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function agregarZona() {
    setZonas((prev) => [...prev, { ...ZONA_VACIA }]);
    setSaved(false);
  }

  function eliminarZona(i: number) {
    setZonas((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function actualizarZona(i: number, field: keyof Zona, value: string | number) {
    setZonas((prev) =>
      prev.map((z, idx) => (idx === i ? { ...z, [field]: value } : z))
    );
    setSaved(false);
  }

  async function guardar() {
    setError(null);

    // Validar nombres únicos y no vacíos
    for (const z of zonas) {
      if (!z.nombre.trim()) {
        setError("Todas las zonas deben tener un nombre");
        return;
      }
      if (z.costoCliente < 0 || z.pagoRider < 0) {
        setError("Los montos no pueden ser negativos");
        return;
      }
      if (z.pagoRider > z.costoCliente) {
        setError(`En zona "${z.nombre}": el pago al rider no puede superar lo que paga el cliente`);
        return;
      }
    }

    const nombres = zonas.map((z) => z.nombre.trim().toLowerCase());
    if (new Set(nombres).size !== nombres.length) {
      setError("Hay zonas con el mismo nombre");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zonasDelivery: zonas.map((z) => ({
            nombre: z.nombre.trim(),
            costoCliente: Number(z.costoCliente),
            pagoRider: Number(z.pagoRider),
          })),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error al guardar");
        return;
      }

      setSaved(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/delivery" className="p-2 rounded-xl hover:bg-stone-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Configuración delivery</p>
          <h1 className="text-xl font-black text-stone-900">Zonas de despacho</h1>
          <p className="text-xs text-stone-500 mt-0.5">{sucursalNombre}</p>
        </div>
      </div>

      <p className="text-sm text-stone-600 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
        Define las zonas de reparto y sus tarifas. Al asignar un repartidor a un pedido,
        se aplicará automáticamente el pago correspondiente según la zona.
      </p>

      {/* Tabla de zonas */}
      <div className="space-y-3">
        {zonas.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <MapPin size={32} className="mx-auto mb-3 text-stone-300" />
            <p className="text-stone-400 font-medium text-sm">Sin zonas configuradas</p>
            <p className="text-xs text-stone-400 mt-1">Agrega una zona para empezar</p>
          </div>
        )}

        {zonas.map((zona, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-[11px] uppercase font-black text-stone-400 tracking-widest block mb-1.5">
                Nombre de zona
              </label>
              <input
                type="text"
                value={zona.nombre}
                onChange={(e) => actualizarZona(i, "nombre", e.target.value.toUpperCase())}
                placeholder="Ej: CENTRO, NORTE, SUR..."
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-base font-black uppercase tracking-wide text-stone-900 focus:outline-none focus:border-amber-400 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
              />
            </div>

            {/* Tarifas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase font-black text-stone-400 tracking-widest block mb-1.5">
                  Cobro al cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-black text-sm">$</span>
                  <input
                    type="number"
                    value={zona.costoCliente}
                    onChange={(e) => actualizarZona(i, "costoCliente", Number(e.target.value))}
                    min={0}
                    step={50}
                    className="w-full border-2 border-stone-200 rounded-xl pl-7 pr-3 py-3 text-lg font-black text-stone-900 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase font-black text-emerald-500 tracking-widest block mb-1.5">
                  Pago al rider
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">$</span>
                  <input
                    type="number"
                    value={zona.pagoRider}
                    onChange={(e) => actualizarZona(i, "pagoRider", Number(e.target.value))}
                    min={0}
                    step={50}
                    className="w-full border-2 border-emerald-200 rounded-xl pl-7 pr-3 py-3 text-lg font-black text-emerald-800 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Margen */}
            {zona.costoCliente > 0 && (
              <div className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Margen del local</span>
                <span className="text-sm font-black text-stone-700">
                  {formatCurrency(zona.costoCliente - zona.pagoRider)}
                  {zona.costoCliente > 0 && (
                    <span className="ml-1.5 text-xs font-bold text-stone-400">
                      ({Math.round(((zona.costoCliente - zona.pagoRider) / zona.costoCliente) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            )}

            <button
              onClick={() => eliminarZona(i)}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-red-400 hover:text-red-600 transition"
            >
              <Trash2 size={13} /> Eliminar zona
            </button>
          </div>
        ))}
      </div>

      {/* Agregar zona */}
      <button
        onClick={agregarZona}
        className="mt-4 w-full py-3 rounded-2xl border-2 border-dashed border-stone-300 text-stone-500 font-bold text-sm flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-600"
      >
        <Plus size={16} /> Agregar zona
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Guardar */}
      <button
        onClick={() => void guardar()}
        disabled={saving}
        className="mt-5 w-full py-4 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-stone-800"
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Guardando...</>
        ) : saved ? (
          <><CheckCircle size={16} className="text-emerald-400" /> Guardado</>
        ) : (
          <><Save size={16} /> Guardar zonas</>
        )}
      </button>

      {/* Resumen */}
      {zonas.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-3">Resumen de tarifas</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-400 text-xs border-b border-stone-100">
                <th className="pb-2 font-bold">Zona</th>
                <th className="pb-2 font-bold text-right">Cliente paga</th>
                <th className="pb-2 font-bold text-right">Rider recibe</th>
                <th className="pb-2 font-bold text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {zonas.filter((z) => z.nombre.trim()).map((z, i) => (
                <tr key={i} className="border-b border-stone-50 last:border-0">
                  <td className="py-2.5 font-black uppercase tracking-wide text-stone-900">{z.nombre}</td>
                  <td className="py-2.5 text-right font-black text-stone-700">{formatCurrency(z.costoCliente)}</td>
                  <td className="py-2.5 text-right text-emerald-600 font-black">{formatCurrency(z.pagoRider)}</td>
                  <td className="py-2.5 text-right text-stone-400 font-bold">{formatCurrency(z.costoCliente - z.pagoRider)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
