"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Lock, Phone } from "lucide-react";

interface Status {
  activa: boolean;
  notifAviso: boolean;
  nombre?: string;
}

const DISMISS_KEY = "pp_notif_dismissed_v1";

export function SucursalNotifOverlay() {
  const [status, setStatus] = useState<Status | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // ¿Ya fue cerrado en esta sesión?
    if (typeof sessionStorage !== "undefined") {
      const val = sessionStorage.getItem(DISMISS_KEY);
      if (val === "1") { setDismissed(true); return; }
    }

    fetch("/api/sucursal/status")
      .then((r) => r.json())
      .then((data: Status) => setStatus(data))
      .catch(() => {});
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  // Nada que mostrar
  if (!status) return null;

  // ── Overlay bloqueante — sucursal INACTIVA ────────────────────────────────
  if (!status.activa) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm"
        style={{ touchAction: "none" }}
      >
        {/* Bloquea cualquier interacción con el fondo */}
        <div className="absolute inset-0" onPointerDown={(e) => e.stopPropagation()} />

        <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center max-w-md">
          {/* Ícono */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-600/20 ring-4 ring-red-600/40">
            <Lock size={40} className="text-red-400" />
          </div>

          {/* Mensaje principal */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">
              Tienda no puede<br />acceder a PandaPoss
            </h1>
            {status.nombre && (
              <p className="text-sm font-medium text-white/60">{status.nombre}</p>
            )}
          </div>

          {/* Instrucción */}
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-sm text-white/80 leading-relaxed">
            Para reactivar tu tienda, comunícate con el equipo de{" "}
            <span className="font-bold text-white">Administración PandaPoss</span>.
          </div>

          {/* Contacto */}
          <a
            href="https://wa.me/56931412102"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#1ebe5d] transition-colors"
          >
            <Phone size={16} />
            Contactar soporte
          </a>
        </div>
      </div>
    );
  }

  // ── Overlay de aviso — cuotas vencidas (closeable, una vez por sesión) ────
  if (status.notifAviso && !dismissed) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-16 px-4">
        <div className="relative w-full max-w-md rounded-3xl border border-amber-300 bg-amber-50 shadow-2xl overflow-hidden">
          {/* Banda de color */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />

          {/* Botón cerrar */}
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-200/60 text-amber-700 hover:bg-amber-300 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="px-6 py-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 ring-2 ring-amber-300">
                <AlertTriangle size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Aviso de administración
                </p>
                <p className="text-base font-black text-stone-900 leading-tight">
                  PandaPoss
                </p>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="space-y-2 text-sm text-stone-700 leading-relaxed">
              <p>
                Tienes{" "}
                <span className="font-bold text-red-600">2 o más cuotas vencidas</span>{" "}
                en tu plan de PandaPoss.
              </p>
              <p>
                Para evitar la suspensión del servicio, comunícate con el equipo de{" "}
                <span className="font-semibold text-stone-900">Administración PandaPoss</span>{" "}
                a la brevedad.
              </p>
            </div>

            {/* Acciones */}
            <div className="mt-5 flex gap-3">
              <a
                href="https://wa.me/56931412102"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1ebe5d] transition-colors"
              >
                <Phone size={14} />
                Contactar ahora
              </a>
              <button
                onClick={dismiss}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-amber-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
