"use client";

import { Lock, Zap } from "lucide-react";
import Link from "next/link";

interface Props {
  enabled: boolean;
  feature?: string;
  children: React.ReactNode;
}

/**
 * Envuelve contenido que requiere una feature PRO.
 * Si `enabled` es false, muestra un bloqueo con CTA para actualizar.
 */
export function FeatureGate({ enabled, feature, children }: Props) {
  if (enabled) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <Lock size={28} className="text-amber-500" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-surface-text">
          {feature ? `${feature} requiere plan PRO` : "Función exclusiva PRO"}
        </h2>
        <p className="text-surface-muted text-sm max-w-xs">
          Actualiza tu plan para desbloquear esta funcionalidad y muchas más.
        </p>
      </div>

      <Link
        href="/planes"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-sm"
      >
        <Zap size={16} />
        Ver planes PRO
      </Link>
    </div>
  );
}
