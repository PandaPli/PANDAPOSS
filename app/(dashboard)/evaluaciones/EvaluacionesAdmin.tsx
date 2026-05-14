"use client";

import { useEffect, useState } from "react";
import { Star, User, Phone, Hash, Loader2 } from "lucide-react";

interface EvalAdmin {
  id: number;
  nick: string;
  estrellas: number;
  comentario: string | null;
  creadoEn: string;
  sucursal: string;
  pedidoId: number;
  pedidoNumero: number;
  clienteNombre: string | null;
  clienteTelefono: string | null;
}

interface Data {
  promedio: number;
  total: number;
  evaluaciones: EvalAdmin[];
}

function MiniStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={value >= i ? "fill-yellow-400 text-yellow-500" : "fill-gray-200 text-gray-300"}
        />
      ))}
    </div>
  );
}

export function EvaluacionesAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluacion/admin")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Error al cargar evaluaciones</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Evaluaciones</h1>
        <p className="text-sm text-gray-500">Solo visible para Administrador General</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Promedio general</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-900">{data.promedio}</span>
            <span className="text-lg text-gray-400 font-bold">/5</span>
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={18}
                className={Math.round(data.promedio) >= i ? "fill-yellow-400 text-yellow-500" : "fill-gray-200 text-gray-300"}
              />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Total evaluaciones</p>
          <span className="text-4xl font-black text-gray-900">{data.total}</span>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Detalle de evaluaciones</p>
        </div>

        {data.evaluaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Aún no hay evaluaciones
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.evaluaciones.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-purple-50/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Nick + estrellas */}
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900">{ev.nick}</span>
                      <MiniStars value={ev.estrellas} />
                    </div>

                    {/* Comentario */}
                    {ev.comentario && (
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{ev.comentario}</p>
                    )}

                    {/* Info admin: cliente real + pedido */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Hash size={11} />
                        Pedido #{ev.pedidoId}
                      </span>
                      {ev.clienteNombre && (
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {ev.clienteNombre}
                        </span>
                      )}
                      {ev.clienteTelefono && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {ev.clienteTelefono}
                        </span>
                      )}
                      <span>{ev.sucursal}</span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(ev.creadoEn).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
