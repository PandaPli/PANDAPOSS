"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Wifi, WifiOff, QrCode, Users, RefreshCw, Power, AlertCircle, CheckCircle2, Clock, Loader2, Download, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type EstadoAgente = "DESCONECTADO" | "ESPERANDO_QR" | "CONECTADO" | "ERROR";

interface AgenteWsp {
  id: number;
  sucursalId: number;
  activo: boolean;
  estado: EstadoAgente;
  telefono: string | null;
  qrBase64: string | null;
  qrExpiresAt: string | null;
  ultimaConex: string | null;
  _count: { clientes: number };
}

interface Sucursal {
  id: number;
  nombre: string;
  plan: string;
  agente: AgenteWsp | null;
}

interface Props {
  sucursales: Sucursal[];
}

const ESTADO_CONFIG: Record<EstadoAgente, { label: string; color: string; icon: React.ReactNode }> = {
  DESCONECTADO: { label: "Desconectado", color: "text-surface-muted", icon: <WifiOff size={14} /> },
  ESPERANDO_QR: { label: "Esperando QR", color: "text-amber-600", icon: <QrCode size={14} /> },
  CONECTADO: { label: "Conectado", color: "text-emerald-600", icon: <Wifi size={14} /> },
  ERROR: { label: "Error", color: "text-red-600", icon: <AlertCircle size={14} /> },
};

function AgenteCard({ sucursal, onRefresh }: { sucursal: Sucursal; onRefresh: () => void }) {
  const [agente, setAgente] = useState<AgenteWsp | null>(sucursal.agente);
  const [toggling, setToggling] = useState(false);

  // Poll for QR/status when waiting
  useEffect(() => {
    if (!agente?.activo) return;
    if (agente.estado === "CONECTADO") return;
    const interval = setInterval(async () => {
      try {
        if (!agente?.id) return;
        const res = await fetch(`/api/agente/${agente.id}`);
        if (res.ok) {
          const data = await res.json();
          setAgente(data);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [agente?.id, agente?.activo, agente?.estado]);

  async function toggleAgente() {
    setToggling(true);
    try {
      const res = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId: sucursal.id, activo: !agente?.activo }),
      });
      if (res.ok) {
        const data = await res.json();
        setAgente(prev => prev ? { ...prev, ...data } : data);
        onRefresh();
      }
    } catch {}
    setToggling(false);
  }

  const estado: EstadoAgente = agente?.estado ?? "DESCONECTADO";
  const estadoConf = ESTADO_CONFIG[estado];
  const isActive = agente?.activo ?? false;
  const qrExpired = agente?.qrExpiresAt ? new Date(agente.qrExpiresAt) < new Date() : true;
  const showQR = estado === "ESPERANDO_QR" && agente?.qrBase64 && !qrExpired;

  return (
    <div className={cn(
      "card p-0 overflow-hidden transition-all",
      isActive && estado === "CONECTADO" && "ring-2 ring-emerald-400/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isActive && estado === "CONECTADO" ? "bg-emerald-50" : "bg-surface-bg"
          )}>
            <Bot size={20} className={isActive && estado === "CONECTADO" ? "text-emerald-600" : "text-surface-muted"} />
          </div>
          <div>
            <p className="font-bold text-surface-text text-sm">{sucursal.nombre}</p>
            <div className={cn("flex items-center gap-1 text-xs mt-0.5", estadoConf.color)}>
              {estadoConf.icon}
              {estadoConf.label}
              {estado === "CONECTADO" && agente?.telefono && (
                <span className="text-surface-muted ml-1">· +{agente.telefono}</span>
              )}
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleAgente}
          disabled={toggling}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
            isActive
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
          )}
        >
          {toggling ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
          {isActive ? "Desactivar" : "Activar"}
        </button>
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
            <QrCode size={14} />
            Escanea con WhatsApp → Dispositivos vinculados
          </div>
          <img
            src={agente!.qrBase64!}
            alt="QR WhatsApp"
            className="w-48 h-48 rounded-xl border-4 border-white shadow-md"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <Loader2 size={11} className="animate-spin" />
            Actualizando cada 3 segundos…
          </div>
        </div>
      )}

      {/* Waiting for bot service */}
      {isActive && estado === "DESCONECTADO" && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 text-xs font-medium">
            <Loader2 size={13} className="animate-spin" />
            Esperando que el servicio local se conecte…
          </div>
          <p className="text-[11px] text-blue-500 mt-1">Abre <strong>PandaPoss Bot Smart</strong> en tu PC y presiona <strong>Activar Bot</strong></p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-surface-border">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-surface-muted mb-1">
            <Users size={13} />
            <span className="text-xs">Clientes</span>
          </div>
          <p className="text-xl font-bold text-surface-text">{agente?._count?.clientes ?? 0}</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-surface-muted mb-1">
            <Clock size={13} />
            <span className="text-xs">Última conexión</span>
          </div>
          <p className="text-xs font-medium text-surface-text">
            {agente?.ultimaConex
              ? new Date(agente.ultimaConex).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AgenteClient({ sucursales }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      {/* Download banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-5 text-white">
        <div className="flex items-start gap-4">
          <Bot size={32} className="shrink-0 mt-0.5 opacity-90" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">🐼 PandaPoss Bot Smart</p>
            <p className="text-brand-100 text-sm mt-1">
              Descarga la app, inicia sesión con tu cuenta y activa tu bot de WhatsApp con un click.
              No necesitas instalar nada más.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <a
                href="https://drive.google.com/uc?export=download&id=1Quf4mOsmSg5r5O4oBIwpUJ-m5YcsNvvV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-brand-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors shadow"
              >
                <Download size={16} />
                Descargar para Windows (.exe)
              </a>
              <span className="flex items-center gap-1.5 text-brand-100 text-xs">
                <Monitor size={13} />
                Windows 10 / 11 · 64 bits · ~100 MB
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-3 text-center text-xs text-brand-100">
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-[11px]">1</span>
            Descarga e instala la app
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-[11px]">2</span>
            Inicia sesión con tu cuenta
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-[11px]">3</span>
            Activa el bot y escanea el QR
          </div>
        </div>
      </div>

      {/* Agent cards grid */}
      {sucursales.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-surface-muted">No hay sucursales PRIME disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sucursales.map((s) => (
            <AgenteCard key={s.id} sucursal={s} onRefresh={() => setRefreshKey(k => k + 1)} />
          ))}
        </div>
      )}

      {/* Help note */}
      <div className="card p-4 flex items-start gap-3">
        <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
        <div className="text-xs text-surface-muted space-y-1">
          <p className="font-semibold text-surface-text">¿Problemas para conectar?</p>
          <p>• Asegúrate de que la app esté abierta y el bot activado antes de escanear el QR.</p>
          <p>• El QR se muestra tanto en la app como aquí en el dashboard.</p>
          <p>• Cada local necesita su propia instalación de la app en su PC.</p>
        </div>
      </div>
    </div>
  );
}
