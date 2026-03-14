"use client";

import Link from "next/link";
import { Bike, Navigation, MapPin, PackageSearch, Clock, CheckCircle, Navigation2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function ActiveDeliveryScreen() {
  const [stage, setStage] = useState<"ACEPTADO"|"EN_RESTO"|"EN_RUTA"|"ENTREGADO">("ACEPTADO");
  
  return (
    <div className="flex bg-stone-100 flex-col min-h-screen">
       <header className="bg-white px-5 pt-12 pb-5 border-b border-stone-200 flex items-center justify-between shadow-sm sticky top-0 z-10">
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Ruta actual</p>
              <h1 className="text-xl font-black flex items-center gap-2 text-stone-900">
                 Pedido #1205
              </h1>
           </div>
           <span className="bg-amber-100 text-amber-800 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full">{stage.replace("_", " ")}</span>
       </header>

       <main className="flex-1 px-4 py-6 pb-32">
          
          {/* Mapa de navegacion simulado MIENTRAS */}
          <div className="bg-stone-200 rounded-[2rem] h-64 mb-6 flex items-center justify-center flex-col text-stone-400 border-4 border-white shadow-xl relative overflow-hidden">
             <MapPin size={40} className="mb-2" />
             <p className="font-bold text-sm tracking-widest uppercase">Mapa de ruta (VRP)</p>
             <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-xl text-xs font-bold text-emerald-600 flex items-center shadow-lg gap-2">
                <Navigation2 size={16} /> ETA: 12 min
             </div>
          </div>

          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-200 mb-6">
             <h3 className="text-xs uppercase font-black text-stone-400 tracking-widest mb-4">Información de Entrega</h3>
             <div className="space-y-4">
               <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="font-medium text-stone-900 text-lg">Mauricio Garcia</p>
               </div>
               <div className="flex gap-4 items-start">
                  <div className="bg-stone-100 p-2 rounded-xl mt-1">
                     <MapPin size={20} className="text-stone-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Dirección destino</p>
                    <p className="font-medium text-stone-800">Av. Las Condes 1234, Casa 4</p>
                    <p className="text-sm text-stone-500 mt-1">Ref: Portón negro al fondo</p>
                  </div>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-200">
             <h3 className="text-xs uppercase font-black text-stone-400 tracking-widest mb-4">Consumo a cobrar</h3>
             <div className="flex justify-between items-center bg-stone-50 p-4 rounded-xl mb-4">
                <span className="font-bold text-stone-600">Metodo Pago</span>
                <span className="font-black text-emerald-600 tracking-wider">EFECTIVO</span>
             </div>
             <div className="flex justify-between items-center text-xl">
                <span className="font-bold text-stone-900">Total</span>
                <span className="font-black tracking-tighter">{formatCurrency(15900)}</span>
             </div>
          </div>
       </main>

       <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-100 via-stone-100 to-transparent">
          {stage === "ACEPTADO" && (
             <button onClick={() => setStage("EN_RESTO")} className="w-full py-4 rounded-2xl bg-stone-900 text-white font-black hover:bg-stone-800 uppercase tracking-widest text-sm shadow-2xl flex justify-center items-center gap-2">
                <Navigation2 size={18} /> Navegar al restaurante
             </button>
          )}
          {stage === "EN_RESTO" && (
             <button onClick={() => setStage("EN_RUTA")} className="w-full py-4 rounded-2xl bg-amber-400 text-amber-950 font-black hover:bg-amber-500 uppercase tracking-widest text-sm shadow-[0_10px_30px_-10px_rgba(251,191,36,0.6)] flex justify-center items-center gap-2">
                <PackageSearch size={18} /> Confirmar Retiro del local
             </button>
          )}
          {stage === "EN_RUTA" && (
             <button onClick={() => setStage("ENTREGADO")} className="w-full py-4 rounded-2xl bg-stone-900 text-white font-black hover:bg-stone-800 uppercase tracking-widest text-sm shadow-2xl flex justify-center items-center gap-2">
                <Navigation2 size={18} /> Iniciar ruta al cliente
             </button>
          )}
          {stage === "ENTREGADO" && (
             <Link href="/driver" className="w-full py-4 rounded-2xl bg-emerald-500 text-emerald-950 font-black hover:bg-emerald-600 uppercase tracking-widest text-sm shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] flex justify-center items-center gap-2">
                <CheckCircle size={18} /> Marcar como entregado
             </Link>
          )}
       </footer>
    </div>
  );
}
