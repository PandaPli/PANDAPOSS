"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Wifi, WifiOff, QrCode, Users, RefreshCw, Power, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
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
          <p className="text-[11px] text-blue-500 mt-1">Asegúrate de que <code className="bg-blue-100 px-1 rounded">pm2 start index.js</code> esté corriendo</p>
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
      {/* Info banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-5 text-white flex items-start gap-4">
        <Bot size={32} className="shrink-0 mt-0.5 opacity-90" />
        <div>
          <p className="font-bold text-base">¿Cómo funciona?</p>
          <p className="text-brand-100 text-sm mt-1">
            1. Activa el agente para tu sucursal →
            2. Arranca el servicio local: <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs">pm2 start whatsapp-agent/index.js</code> →
            3. Escanea el QR que aparece aquí con WhatsApp
          </p>
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

      {/* Setup guide */}
      <div className="card p-5 space-y-3">
        <p className="font-semibold text-surface-text text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brand-500" />
          Configuración del servicio local
        </p>
        <div className="space-y-2 text-xs text-surface-muted font-mono bg-surface-bg rounded-xl p-4">
          <p><span className="text-emerald-600"># Ir a la carpeta del agente</span></p>
          <p>cd whatsapp-agent</p>
          <p className="mt-2"><span className="text-emerald-600"># Instalar dependencias (primera vez)</span></p>
          <p>npm install</p>
          <p className="mt-2"><span className="text-emerald-600"># Copiar y editar configuración</span></p>
          <p>cp .env.example .env</p>
          <p className="mt-2"><span className="text-emerald-600"># Arrancar con PM2 (persistente)</span></p>
          <p>pm2 start index.js --name pandaposs-wsp</p>
          <p>pm2 save && pm2 startup</p>
        </div>
      </div>
    </div>
  );
}
