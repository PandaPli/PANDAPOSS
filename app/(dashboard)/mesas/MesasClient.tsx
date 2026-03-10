"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableMap } from "@/components/pos/TableMap";
import type { MesaConEstado } from "@/types";
import { X, ShoppingCart, Plus, Trash2, Check } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Sala {
  id: number;
  nombre: string;
}

interface Props {
  mesas: MesaConEstado[];
  salas: Sala[];
  esAdmin: boolean;
}

export function MesasClient({ mesas, salas, esAdmin }: Props) {
  const router = useRouter();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConEstado | null>(null);
  const [showCrear, setShowCrear] = useState(false);
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState<string>("");
  const [capacidad, setCapacidad] = useState("4");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [salasState, setSalasState] = useState<Sala[]>(salas);
  const [showNuevaSala, setShowNuevaSala] = useState(false);
  const [nuevaSalaNombre, setNuevaSalaNombre] = useState("");
  const [savingSala, setSavingSala] = useState(false);

  async function cambiarEstado(id: number, estado: string) {
    await fetch("/api/mesas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    router.refresh();
    setMesaSeleccionada(null);
  }

  async function crearMesa() {
    if (!nombre.trim() || !salaId) {
      setError("Nombre y sala son requeridos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/mesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), salaId: Number(salaId), capacidad: Number(capacidad) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear mesa");
        return;
      }
      setShowCrear(false);
      setNombre("");
      setSalaId("");
      setCapacidad("4");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function crearSala() {
    if (!nuevaSalaNombre.trim()) return;
    setSavingSala(true);
    try {
      const res = await fetch("/api/salas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevaSalaNombre.trim() }),
      });
      if (!res.ok) return;
      const sala: Sala = await res.json();
      setSalasState((prev) => [...prev, sala]);
      setSalaId(String(sala.id));
      setNuevaSalaNombre("");
      setShowNuevaSala(false);
    } finally {
      setSavingSala(false);
    }
  }

  async function eliminarMesa(id: number) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/mesas?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error al eliminar mesa");
        return;
      }
      setMesaSeleccionada(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Header con botón Nueva Mesa */}
      {esAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => { setShowCrear(true); setError(""); }}
            className="btn-primary"
          >
            <Plus size={16} />
            Nueva Mesa
          </button>
        </div>
      )}

      <TableMap mesas={mesas} onSelectMesa={setMesaSeleccionada} />

      {/* Modal crear mesa */}
      {showCrear && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-bold text-surface-text text-lg">Nueva Mesa</h2>
              <button
                onClick={() => setShowCrear(false)}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Mesa 10"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-text mb-1">Sala</label>
                <div className="flex gap-2">
                  <select
                    value={salaId}
                    onChange={(e) => setSalaId(e.target.value)}
                    className="flex-1 border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Seleccionar sala...</option>
                    {salasState.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setShowNuevaSala((v) => !v); setNuevaSalaNombre(""); }}
                    className="p-2 rounded-xl border border-surface-border text-surface-muted hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                    title="Nueva sala"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {showNuevaSala && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={nuevaSalaNombre}
                      onChange={(e) => setNuevaSalaNombre(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && crearSala()}
                      placeholder="Nombre de la sala"
                      className="flex-1 border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={crearSala}
                      disabled={savingSala || !nuevaSalaNombre.trim()}
                      className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-text mb-1">Capacidad</label>
                <input
                  type="number"
                  value={capacidad}
                  onChange={(e) => setCapacidad(e.target.value)}
                  min={1}
                  max={20}
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowCrear(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearMesa}
                  disabled={saving}
                  className="btn-primary flex-1 justify-center"
                >
                  {saving ? "Creando..." : "Crear Mesa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle mesa */}
      {mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-bold text-surface-text text-lg">{mesaSeleccionada.nombre}</h2>
                <p className="text-sm text-surface-muted">{mesaSeleccionada.sala.nombre}</p>
              </div>
              <button
                onClick={() => setMesaSeleccionada(null)}
                className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {mesaSeleccionada.pedidoActivo ? (
                <div className="space-y-3">
                  <div className="bg-surface-bg rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Pedido activo:</span>
                      <span className="font-medium">#{mesaSeleccionada.pedidoActivo.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Productos:</span>
                      <span className="font-medium">{mesaSeleccionada.pedidoActivo._count.detalles}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-muted">Desde:</span>
                      <span className="font-medium">{formatDateTime(mesaSeleccionada.pedidoActivo.creadoEn)}</span>
                    </div>
                  </div>

                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}&pedido=${mesaSeleccionada.pedidoActivo.id}`}
                    className="btn-primary w-full justify-center"
                  >
                    <ShoppingCart size={16} />
                    Cobrar Mesa
                  </a>
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="btn-secondary w-full justify-center"
                  >
                    <Plus size={16} />
                    Agregar Productos
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-surface-muted text-sm text-center py-2">Mesa disponible</p>
                  <a
                    href={`/ventas/nueva?mesa=${mesaSeleccionada.id}`}
                    className="btn-primary w-full justify-center"
                  >
                    <Plus size={16} />
                    Nueva Orden
                  </a>
                  <button
                    onClick={() => cambiarEstado(mesaSeleccionada.id, "RESERVADA")}
                    className="btn-secondary w-full justify-center"
                  >
                    Marcar como Reservada
                  </button>
                  {esAdmin && (
                    <button
                      onClick={() => eliminarMesa(mesaSeleccionada.id)}
                      disabled={deleting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {deleting ? "Eliminando..." : "Eliminar Mesa"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
