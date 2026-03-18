"use client";

import { useStockAlerta } from "@/hooks/useStockAlerta";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  sucursalId: number | null;
}

export function StockAlertaBanner({ sucursalId }: Props) {
  const { alertas, dismiss } = useStockAlerta(sucursalId);
  if (alertas.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <div className="rounded-xl border border-amber-300 bg-amber-50 shadow-lg p-3 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">Stock agotado tras venta</p>
          <ul className="mt-1 space-y-0.5">
            {alertas.map((a, i) => (
              <li key={i} className="text-xs text-amber-700">
                • {a.nombre} — stock: <span className="font-bold">{a.stock}</span>
              </li>
            ))}
          </ul>
        </div>
        <button onClick={dismiss} className="text-amber-400 hover:text-amber-600 shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
