"use client";

import { useState } from "react";
import {
  QrCode,
  Download,
  X,
  ExternalLink,
  Loader2,
  ConciergeBell,
  Car,
  Plus,
  Trash2,
  HandPlatter,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────────────── */

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

interface EstacionamientoItem {
  id: number;
  numero: string;
  sucursalId: number;
  sucursalNombre: string;
}

interface QRModal {
  label: string;
  qr: string;
  url: string;
  tipo: "servir" | "llevar";
}

interface Props {
  salas: SalaGroup[];
  estacionamientos: EstacionamientoItem[];
  sucursales: { id: number; nombre: string }[];
  isAdmin: boolean;
  sucursalId: number | null;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function QRPageClient({ salas, estacionamientos: initialEstacionamientos, sucursales, isAdmin, sucursalId }: Props) {
  const [modal, setModal] = useState<QRModal | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Estacionamiento state
  const [spots, setSpots] = useState(initialEstacionamientos);
  const [newNumero, setNewNumero] = useState("");
  const [newSucursalId, setNewSucursalId] = useState<number>(sucursalId ?? sucursales[0]?.id ?? 0);
  const [adding, setAdding] = useState(false);

  /* ── QR generation ──────────────────────────────────────────────────── */

  async function generarQRMesa(mesa: Mesa) {
    const key = `mesa-${mesa.id}`;
    setLoadingId(key);
    try {
      const res = await fetch(
        `/api/qr/mesa?sucursal=${mesa.sala.sucursalId}&mesa=${mesa.id}&nombre=${encodeURIComponent(mesa.nombre)}`
      );
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al generar el QR"); return; }
      if (data.qr) setModal({ label: mesa.nombre, qr: data.qr, url: data.url, tipo: "servir" });
    } catch { alert("Error de red"); } finally { setLoadingId(null); }
  }

  async function generarQREstacionamiento(spot: EstacionamientoItem) {
    const key = `est-${spot.id}`;
    setLoadingId(key);
    try {
      const res = await fetch(
        `/api/qr/estacionamiento?sucursal=${spot.sucursalId}&estacionamiento=${spot.id}&numero=${encodeURIComponent(spot.numero)}`
      );
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al generar el QR"); return; }
      if (data.qr) setModal({ label: `Estacionamiento N° ${spot.numero}`, qr: data.qr, url: data.url, tipo: "llevar" });
    } catch { alert("Error de red"); } finally { setLoadingId(null); }
  }

  /* ── CRUD Estacionamientos ──────────────────────────────────────────── */

  async function addSpot() {
    if (!newNumero.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/estacionamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: newNumero.trim(), sucursalId: newSucursalId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al crear"); return; }
      setSpots((prev) => [...prev, {
        id: data.id,
        numero: data.numero,
        sucursalId: data.sucursalId,
        sucursalNombre: sucursales.find((s) => s.id === data.sucursalId)?.nombre ?? "",
      }]);
      setNewNumero("");
    } catch { alert("Error de red"); } finally { setAdding(false); }
  }

  async function deleteSpot(id: number) {
    if (!confirm("¿Eliminar este estacionamiento?")) return;
    try {
      const res = await fetch(`/api/estacionamientos?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Error"); return; }
      setSpots((prev) => prev.filter((s) => s.id !== id));
    } catch { alert("Error de red"); }
  }

  /* ── Download ───────────────────────────────────────────────────────── */

  function descargar() {
    if (!modal) return;
    const a = document.createElement("a");
    a.href = modal.qr;
    a.download = `QR-${modal.label.replace(/\s+/g, "-")}.png`;
    a.click();
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          SECCION: SERVIR — Mesa QR (auto-atencion en mesa)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        {/* Header de seccion */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-sm">
            <HandPlatter size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-text">SERVIR</h2>
            <p className="text-xs text-surface-muted">
              Mesa QR — El cliente escanea desde su mesa y pide sin esperar al mesero
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700">
              <ConciergeBell size={12} />
              Auto-atencion
            </span>
          </div>
        </div>

        {/* Grid de mesas por sala */}
        <div className="space-y-6">
          {salas.map((sala) => (
            <div key={sala.nombre}>
              <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                {sala.nombre}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {sala.mesas.map((mesa) => {
                  const key = `mesa-${mesa.id}`;
                  return (
                    <button
                      key={mesa.id}
                      onClick={() => generarQRMesa(mesa)}
                      disabled={loadingId === key}
                      className={cn(
                        "card p-4 flex flex-col items-center gap-3 hover:shadow-md transition-all text-center",
                        "hover:border-purple-200 hover:bg-purple-50/30 group"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        {loadingId === key
                          ? <Loader2 size={20} className="text-purple-500 animate-spin" />
                          : <QrCode size={20} className="text-purple-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-surface-text">{mesa.nombre}</p>
                        <p className="text-xs text-surface-muted">{mesa.capacidad} personas</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {salas.length === 0 && (
            <div className="card p-12 text-center">
              <HandPlatter size={40} className="mx-auto text-surface-muted mb-3" />
              <p className="text-surface-muted">No hay mesas configuradas</p>
            </div>
          )}
        </div>
      </section>

      {/* Separador visual entre secciones */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-border" /></div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECCION: LLEVAR — Estacionamiento (pedido al auto)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        {/* Header de seccion */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-sky-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
            <Car size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-text">LLEVAR</h2>
            <p className="text-xs text-surface-muted">
              Estacionamiento — El cliente escanea el QR del parking y se le lleva el pedido al auto
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">
              <PackageCheck size={12} />
              Entrega al auto
            </span>
          </div>
        </div>

        {/* Agregar nuevo estacionamiento */}
        <div className="card p-4 border-sky-100">
          <h3 className="text-sm font-semibold text-surface-text mb-3">Agregar estacionamiento</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-surface-muted mb-1 block">Numero</label>
              <input
                type="text"
                value={newNumero}
                onChange={(e) => setNewNumero(e.target.value)}
                placeholder="Ej: 1, A-01..."
                className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
                onKeyDown={(e) => e.key === "Enter" && addSpot()}
              />
            </div>
            {isAdmin && sucursales.length > 0 && (
              <div className="min-w-[180px]">
                <label className="text-xs text-surface-muted mb-1 block">Sucursal</label>
                <select
                  value={newSucursalId}
                  onChange={(e) => setNewSucursalId(Number(e.target.value))}
                  className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={addSpot}
              disabled={adding || !newNumero.trim()}
              className="btn-primary gap-2 whitespace-nowrap"
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Agregar
            </button>
          </div>
        </div>

        {/* Grid de estacionamientos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {spots.map((spot) => {
            const key = `est-${spot.id}`;
            return (
              <div
                key={spot.id}
                className="card p-4 flex flex-col items-center gap-3 text-center group relative hover:border-sky-200 hover:bg-sky-50/30 transition-all"
              >
                <button
                  onClick={() => deleteSpot(spot.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-surface-muted hover:text-red-500"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => generarQREstacionamiento(spot)}
                  disabled={loadingId === key}
                  className="flex flex-col items-center gap-3 w-full hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                    {loadingId === key
                      ? <Loader2 size={20} className="text-sky-500 animate-spin" />
                      : <Car size={20} className="text-sky-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-surface-text">N° {spot.numero}</p>
                    {isAdmin && (
                      <p className="text-xs text-surface-muted">{spot.sucursalNombre}</p>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {spots.length === 0 && (
          <div className="card p-12 text-center">
            <Car size={40} className="mx-auto text-surface-muted mb-3" />
            <p className="text-surface-muted">No hay estacionamientos configurados</p>
            <p className="text-xs text-surface-muted mt-1">Agrega uno arriba para generar su QR</p>
          </div>
        )}
      </section>

      {/* ── Modal QR ──────────────────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con icono de tipo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-white",
                  modal.tipo === "servir"
                    ? "bg-gradient-to-br from-purple-500 to-violet-600"
                    : "bg-gradient-to-br from-sky-500 to-blue-600"
                )}>
                  {modal.tipo === "servir" ? <HandPlatter size={16} /> : <Car size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-surface-text">{modal.label}</h3>
                  <p className="text-xs text-surface-muted mt-0.5">
                    {modal.tipo === "servir" ? "Servir en mesa" : "Llevar al auto"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-surface-muted" />
              </button>
            </div>

            {/* Badge de tipo */}
            <div className="flex justify-center">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                modal.tipo === "servir"
                  ? "bg-purple-50 border border-purple-200 text-purple-700"
                  : "bg-sky-50 border border-sky-200 text-sky-700"
              )}>
                {modal.tipo === "servir" ? <ConciergeBell size={11} /> : <PackageCheck size={11} />}
                {modal.tipo === "servir" ? "SERVIR — Auto-atencion" : "LLEVAR — Entrega al auto"}
              </span>
            </div>

            {/* QR Image */}
            <div className={cn(
              "flex justify-center p-3 rounded-xl border",
              modal.tipo === "servir"
                ? "bg-purple-50/50 border-purple-100"
                : "bg-sky-50/50 border-sky-100"
            )}>
              <img src={modal.qr} alt={`QR ${modal.label}`} className="w-56 h-56" />
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
              <button onClick={descargar} className="btn-primary flex-1 justify-center gap-2">
                <Download size={15} />
                Descargar PNG
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary px-4">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
