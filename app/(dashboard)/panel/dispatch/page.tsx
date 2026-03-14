import Link from "next/link";
import { Bike, MapPin, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock Data para el mapa logistico MIENTRAS
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZ2FieWciLCJhIjoiY2x0MWlyNWN3MWozbjJpbXVzeXpwcHFwbiJ9.N2S49iS--"; // Dummy o default
const MOCK_RESTAURANT = { lat: -33.4569, lng: -70.6483 };

export default function DispatchCenterPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col overflow-hidden bg-surface-bg/50">
      <header className="flex items-center justify-between border-b border-surface-border bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-surface-text">Centro logístico</h1>
          <p className="text-sm text-surface-muted">Panel maestro de despachos y repartidores en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
            <input placeholder="Buscar pedido o driver..." className="input py-2 pl-9 text-sm w-64" />
          </div>
          <button className="btn-primary py-2 text-sm bg-stone-900 border-none">
            Asignación automática (Activada)
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Kanban Panel Izquierdo */}
        <aside className="w-[420px] shrink-0 overflow-y-auto border-r border-surface-border bg-surface-bg p-4 flex flex-col gap-4">
          
          <div className="rounded-2xl border border-surface-border bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-surface-muted mb-3 flex items-center justify-between">
              Listo para despachar
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">2</span>
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm cursor-pointer hover:border-amber-400 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-amber-900">#1204</span>
                    <p className="text-sm text-amber-800/70 mt-0.5 mt-1">Av. Las Condes 1234, Depto 402</p>
                  </div>
                  <span className="font-bold text-amber-700">$18.900</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-amber-900 text-amber-50 rounded-lg py-1.5 text-xs font-semibold hover:bg-amber-800 transition">Ver ruta</button>
                  <button className="flex-1 bg-white border border-amber-200 text-amber-900 rounded-lg py-1.5 text-xs font-semibold hover:bg-amber-100 transition">Asignar mánual</button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-surface-muted mb-3 flex items-center justify-between">
              En Tránsito
              <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full text-xs">4</span>
            </h3>
            <div className="space-y-3">
               {/* Mock Order transit */}
               <div className="rounded-xl border border-surface-border p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <Bike size={14} className="text-brand-500"/>
                  <span className="font-semibold text-surface-text">Carlos Repartidor</span>
                  <span className="text-surface-muted ml-auto">ETA: 12 min</span>
                </div>
                <div className="bg-surface-bg px-3 py-2 rounded-lg text-sm text-surface-muted">
                  <span className="font-bold text-surface-text mr-2">#1203</span>
                  Providencia 890
                </div>
               </div>
            </div>
          </div>

        </aside>

        {/* Mapa Principal */}
        <main className="relative flex-1 bg-stone-100">
           {/* Fallback mientras no esté MapboxProvider */}
           <div className="absolute inset-0 flex items-center justify-center flex-col text-stone-400">
              <MapPin size={48} className="mb-4 opacity-50" />
              <p className="font-semibold">El mapa interactivo se cargará aquí.</p>
              <p className="text-sm mt-2 opacity-70">Soporte planificado para Mapbox GL JS / Google Maps.</p>
           </div>
        </main>
      </div>
    </div>
  );
}
