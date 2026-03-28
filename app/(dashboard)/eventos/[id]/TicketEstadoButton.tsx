"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const ESTADOS = [
  { value: "PENDIENTE_PAGO", label: "Pendiente pago" },
  { value: "PAGADO", label: "Pagado" },
  { value: "VALIDADO", label: "Validado" },
  { value: "EXPIRADO", label: "Expirado" },
];

interface Props {
  token: string;
  currentEstado: string;
}

export function TicketEstadoButton({ token, currentEstado }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(estado: string) {
    if (estado === currentEstado) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos/tickets/${encodeURIComponent(token)}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Error al cambiar estado");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        <select
          disabled={loading}
          value={currentEstado}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs font-semibold text-slate-600 focus:outline-none disabled:opacity-60"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <ChevronDown size={10} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
