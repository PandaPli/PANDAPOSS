"use client";

import { useState } from "react";
import { QrCode, Download, X, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mesa {
  id: number;
  nombre: string;
  capacidad: number;
  sala: { nombre: string; sucursalId: number };
}

interface SalaGroup {
  nombre: string;
  mesas: Mesa[];
}

interface Props {
  salas: SalaGroup[];
}

interface QRModal {
  mesaNombre: string;
  qr: string;
  url: string;
}

export function CartaQRClient({ salas }: Props) {
  const [modal, setModal] = useState<QRModal | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function generarQR(mesa: Mesa) {
    setLoadingId(mesa.id);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch(
        `/api/qr/mesa?sucursal=${mesa.sala.sucursalId}&mesa=${mesa.id}&nombre=${encodeURIComponent(mesa.nombre)}&baseUrl=${encodeURIComponent(baseUrl)}`
      );
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Error al generar el QR. Verifica tu plan y permisos.");
        return;
      }
      
      if (data.qr) setModal({ mesaNombre: mesa.nombre, qr: data.qr, url: data.url });
    } catch (err) {
      alert("Error de red al intentar generar el QR.");
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  }

  function descargar() {
    if (!modal) return;
    const a = document.createElement("a");
    a.href = modal.qr;
    a.download = `QR-${modal.mesaNombre.replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <>
      {/* Grid de salas */}
      <div className="space-y-8">
        {salas.map((sala) => (
          <div key={sala.nombre}>
            <h2 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
              {sala.nombre}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {sala.mesas.map((mesa) => (
                <button
                  key={mesa.id}
                  onClick={() => generarQR(mesa)}
                  disabled={loadingId === mesa.id}
                  className={cn(
                    "card p-4 flex flex-col items-center gap-3 hover:shadow-md transition-all text-center",
                    "hover:border-purple-200 hover:bg-purple-50/30 group"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    {loadingId === mesa.id
                      ? <Loader2 size={20} className="text-purple-500 animate-spin" />
                      : <QrCode size={20} className="text-purple-500" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-surface-text">{mesa.nombre}</p>
                    <p className="text-xs text-surface-muted">{mesa.capacidad} personas</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {salas.length === 0 && (
          <div className="card p-12 text-center">
            <QrCode size={40} className="mx-auto text-surface-muted mb-3" />
            <p className="text-surface-muted">No hay mesas configuradas</p>
          </div>
        )}
      </div>

      {/* Modal QR */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-surface-text">QR — {modal.mesaNombre}</h3>
                <p className="text-xs text-surface-muted mt-0.5">Escanea para ver la carta</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-surface-muted" />
              </button>
            </div>

            {/* QR Image */}
            <div className="flex justify-center p-3 bg-gray-50 rounded-xl border border-surface-border">
              <img src={modal.qr} alt={`QR ${modal.mesaNombre}`} className="w-56 h-56" />
            </div>

            {/* URL */}
            <div className="flex items-center gap-2 bg-surface-bg border border-surface-border rounded-xl px-3 py-2">
              <p className="text-xs text-surface-muted truncate flex-1 font-mono">{modal.url}</p>
              <a
                href={modal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-brand-500 hover:text-brand-600"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={descargar}
                className="btn-primary flex-1 justify-center gap-2"
              >
                <Download size={15} />
                Descargar PNG
              </button>
              <button
                onClick={() => setModal(null)}
                className="btn-secondary px-4"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
