import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-5">
        <h1 className="text-6xl font-black text-brand-500">404</h1>
        <h2 className="text-2xl font-bold text-surface-text">Página no encontrada</h2>
        <p className="text-surface-muted max-w-md mx-auto">
          La página que intentas buscar no existe o fue movida.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          <Home size={18} />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
