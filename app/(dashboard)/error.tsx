"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-surface-text">Algo salio mal</h2>
      <p className="max-w-md text-sm text-surface-muted">
        Ocurrio un error inesperado. Puedes intentar recargar la seccion o volver al inicio.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        <RotateCcw size={16} />
        Reintentar
      </button>
    </div>
  );
}
