import Link from "next/link";
import { Bike, Navigation, MapPin, PackageSearch, Clock, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock Data
const MOCK_PEDIDOS = [
  {
    id: 1202,
    distancia: "1.2 km",
    direccion: "Av. Providencia 456, Depto 902",
    tiempo: "5 min de tu ubicación",
    recompensa: 2500,
    estado: "NUEVO"
  },
  {
    id: 1205,
    distancia: "3.5 km",
    direccion: "Av. Las Condes 1234, Casa 4",
    tiempo: "12 min de cocina",
    recompensa: 4000,
    estado: "LISTO_EN_COCINA"
  }
];

export default function PwaDriverScreen() {
  return (
    <div className="flex bg-stone-100 flex-col min-h-screen">
       <header className="bg-stone-900 px-5 pt-12 pb-5 text-white shadow-xl flex items-center justify-between">
           <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">PandaDriver</p>
              <h1 className="text-xl font-black flex items-center gap-2">
                 <Bike size={24} /> Carlos Repartidor
              </h1>
           </div>
           
           <div className="flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                <span className="font-bold text-sm tracking-widest uppercase">Activo</span>
             </div>
           </div>
       </header>

       <main className="flex-1 px-4 py-6">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5 mb-6 flex justify-between items-center pr-6">
              <div>
                 <p className="text-xs text-stone-500 uppercase font-bold tracking-widest pl-1">Ganancias Hoy</p>
                 <p className="text-3xl font-black tracking-tight mt-1">{formatCurrency(12500)}</p>
              </div>
              <ShieldCheck size={40} className="text-emerald-500/20" />
          </div>

          <h2 className="text-sm uppercase tracking-widest font-black text-stone-400 mb-4 px-2">Pedidos Disponibles ({MOCK_PEDIDOS.length})</h2>

          <div className="flex flex-col gap-4">
             {MOCK_PEDIDOS.map(p => (
                <div key={p.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-200">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <span className="text-xs uppercase font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">{p.estado.replace(/_/g, " ")}</span>
                         <h3 className="font-black text-2xl mt-3 text-stone-900">#{p.id}</h3>
                      </div>
                      <span className="font-black text-xl text-emerald-600">+{formatCurrency(p.recompensa)}</span>
                   </div>

                   <hr className="border-stone-100 my-4" />

                   <div className="space-y-3 text-sm font-medium text-stone-600">
                      <p className="flex items-start gap-3"><MapPin size={18} className="text-stone-400 shrink-0" /> <span className="pt-0.5">{p.direccion}</span></p>
                      <p className="flex items-center gap-3"><Navigation size={18} className="text-stone-400 shrink-0" /> {p.distancia}</p>
                      <p className="flex items-center gap-3"><Clock size={18} className="text-stone-400 shrink-0" /> {p.tiempo}</p>
                   </div>
                   
                   <div className="mt-5 grid grid-cols-2 gap-3">
                     <button className="py-3 rounded-2xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 uppercase tracking-widest text-xs">Ignorar</button>
                     <Link href={`/driver/active/${p.id}`} className="flex justify-center py-3 rounded-2xl bg-amber-400 text-amber-950 font-black hover:bg-amber-500 uppercase tracking-widest text-[13px] shadow-[0_10px_20px_-10px_rgba(251,191,36,0.5)]">
                        Aceptar ✅
                     </Link>
                   </div>
                </div>
             ))}
          </div>

          <div className="mt-12 text-center text-stone-400 text-xs py-4 flex flex-col items-center justify-center">
             <PackageSearch size={24} className="mb-2 opacity-50" />
             <p>Buscando automáticamente nuevos despachos...</p>
             <p>GPS enviando posición cada 5 segundos.</p>
          </div>
       </main>
    </div>
  );
}
